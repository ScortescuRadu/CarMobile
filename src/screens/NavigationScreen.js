import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity, NativeModules, requireNativeComponent } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapViewDirections from 'react-native-maps-directions';
import Spinner from 'react-native-spinkit';
import NavigationOverlay from '../components/NavigationOverlay.js'
import QrCodeScannerModal from '../components/QrCodeScannerModal.js';

const isCoordinateNearMarkers = (coordinate, markers, threshold) => {
    for (let marker of markers) {
        const distance = Math.sqrt(
            Math.pow(coordinate.latitude - marker.latitude, 2) +
            Math.pow(coordinate.longitude - marker.longitude, 2)
        );
        if (distance < threshold) {
            return true;
        }
    }
    return false;
};

// const TestView = requireNativeComponent('TestView');

export default function NavigationScreen() {
    const mapViewRef = useRef(null);  // Reference to the MapView

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [initialRegion, setInitialRegion] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null); // Track the selected marker
    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const [routeLoading, setRouteLoading] = useState(false); // Track route loading state
    const [routeCoordinates, setRouteCoordinates] = useState([]); // Store the route coordinates
    const [drivingRouteLoading, setDrivingRouteLoading] = useState(false);
    const [walkingRouteLoading, setWalkingRouteLoading] = useState(false);
    const [showRoutes, setShowRoutes] = useState(false);
    const [estimatedTime, setEstimatedTime] = useState(null);
    const [confirmPress, setConfirmPress] = useState(false);
    const [levelNavigationVisibility, setLevelNavigationVisibility] = useState(false);
    const [scannerVisible, setScannerVisible] = useState(false);

    useEffect(() => {
        // Get current location
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLoc = {
                    latitude: 45.7316656, // position.coords.latitude,
                    longitude: 21.2489799, // position.coords.longitude,
                };
                setInitialRegion({
                    ...currentLoc,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
                setCurrentLocation(currentLoc);
            },
            (error) => {
                console.log(error);
                Alert.alert('Error', 'Unable to get current location');
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
    }, []);

    useEffect(() => {
        if (confirmPress && currentLocation) {
            mapViewRef.current.animateToRegion({
                ...currentLocation,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
            }, 1000);
        } else if (!confirmPress && initialRegion) {
            mapViewRef.current.animateToRegion(initialRegion, 1000);
        }
    }, [confirmPress, currentLocation, initialRegion]);

    const handleMapPress = (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        if (!isCoordinateNearMarkers({ latitude, longitude }, markers, 0.001)) { // Adjust the threshold as needed
            console.log('Selected Location:', { latitude, longitude });
            setSelectedLocation({ latitude, longitude });
            if (!showRoutes) {
              fetchNearbyParkingLots(latitude, longitude, 1); // Call API with fixed distance of 1 km
            }
        } else {
            // Alert.alert('Too close to a green marker. Select a green marker or choose a different location.');
        }
    };

    const fetchNearbyParkingLots = async (latitude, longitude, distance) => {
        try {
            const response = await fetch(`https://frog-happy-uniformly.ngrok-free.app/parking/radius-search/?lat=${latitude}&lon=${longitude}&distance=${distance}`);
            const data = await response.json();
            if (data.length > 0) {
                setMarkers(data);
                return true;
            } else {
                setMarkers([]); // Clear markers if no data is returned
            }
        } catch (error) {
            console.error('Error fetching nearby parking lots:', error);
        }
        return false;
    };

    const handleMarkerPress = (marker) => {
      if (!showRoutes) {
        setSelectedMarker(marker);
      }
    };

    const extendSearch = async () => {
        setIsLoading(true);
        setMarkers([]); // Clear previous markers before starting new search
        const initialLatitudeDelta = 0.01; // Start with a smaller delta
        const initialLongitudeDelta = 0.01; // Start with a smaller delta

        for (let i = 1; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));  // Delay of 1 second
            console.log('increment', i)
            mapViewRef.current.animateToRegion({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: initialLatitudeDelta * i,
                longitudeDelta: initialLongitudeDelta * i,
            }, 1000); // Zoom out
            const success = await fetchNearbyParkingLots(selectedLocation.latitude, selectedLocation.longitude, i);
            if (success) {
                setIsLoading(false);
                return;
            }
        }
        setIsLoading(false);
        Alert.alert('Sorry, no available spots.');
    };

    const handleStartPress = async () => {
        if (!selectedMarker || !selectedLocation || !currentLocation) return;
        setRouteLoading(true);
        setRouteCoordinates([]);
        setDrivingRouteLoading(true);
        setWalkingRouteLoading(true);
        setShowRoutes(true);
        setMarkers((prevMarkers) => {
          if (!prevMarkers.some(marker => marker.id === selectedMarker.id)) {
              return [...prevMarkers, selectedMarker];
          }
          return prevMarkers;
        });
    };

    const handleConfirmPress = () => {
        setConfirmPress(true);
        mapViewRef.current.animateToRegion({
            ...currentLocation,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
        }, 1000);
    };

    const handleBackPress = () => {
        setConfirmPress(false);
        mapViewRef.current.animateToRegion({
            ...currentLocation,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        }, 1000);
    };

    const handleScanSuccess = (data) => {
        const { spot_description, hourly_price } = data;
        Alert.alert('Welcome!', `Spot: ${spot_description}\nPrice: ${hourly_price}`);
    };

    const fitMapToMarkers = (markers) => {
      mapViewRef.current.fitToCoordinates(markers, {
          edgePadding: {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
          },
          animated: true,
      });
    };

    return (
        <View style={styles.container}>
            {levelNavigationVisibility && (
                <NavigationOverlay
                    visible={levelNavigationVisibility}
                    onClose={() => setLevelNavigationVisibility(false)}
                    currentLocation={currentLocation}
                    selectedMarker={selectedMarker}
                />
            )}
            <QrCodeScannerModal
                visible={scannerVisible}
                onClose={() => setScannerVisible(false)}
                onScanSuccess={handleScanSuccess}
            />
            {!confirmPress && initialRegion && (
                <MapView
                    ref={mapViewRef}
                    style={styles.map}
                    initialRegion={initialRegion}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                >
                    {selectedLocation && (
                        <Marker coordinate={selectedLocation} pinColor="red">
                            <Callout>
                                <View>
                                    <Text>Selected Destination</Text>
                                </View>
                            </Callout>
                        </Marker>
                    )}
                    {markers.map((marker, index) => (
                        <Marker
                            key={index}
                            coordinate={{
                                latitude: marker.latitude,
                                longitude: marker.longitude,
                            }}
                            title={`Parking Lot ${marker.id}`}
                            pinColor='green'
                            onPress={() => handleMarkerPress(marker)}
                        >
                            <Callout>
                                <View>
                                    <Text>Price: ${marker.price}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (!showRoutes) handleStartPress();
                                    }} style={styles.startButton}>
                                        <Text style={styles.startButtonText}>Select</Text>
                                    </TouchableOpacity>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                    {routeLoading && (
                        <>
                            <MapViewDirections
                                origin={currentLocation}
                                destination={selectedMarker}
                                apikey="AIzaSyDmT_iiMaICWSkmTykVj-mGdZpEPdIljwg"
                                strokeWidth={4}
                                strokeColor="blue"
                                mode="DRIVING"
                                onReady={(result) => {
                                    setRouteCoordinates(result.coordinates);
                                    setEstimatedTime(result.duration);
                                    setDrivingRouteLoading(false);
                                    fitMapToMarkers([currentLocation, selectedMarker, selectedLocation]);
                                    // console.log('Driving route result:', result.coordinates);
                                }}
                                onError={(errorMessage) => {
                                    console.log('Error fetching driving route:', errorMessage);
                                    setDrivingRouteLoading(false);
                                }}
                            />
                            <MapViewDirections
                                origin={selectedMarker}
                                destination={selectedLocation}
                                apikey="AIzaSyDmT_iiMaICWSkmTykVj-mGdZpEPdIljwg"
                                strokeWidth={2}
                                strokeColor="green"
                                mode="WALKING"
                                lineDashPattern={[1, 5]}
                                onReady={(result) => {
                                    setRouteCoordinates((prev) => [...prev, ...result.coordinates]);
                                    // console.log('Walking route result:', result.coordinates);
                                    setWalkingRouteLoading(false);
                                }}
                                onError={(errorMessage) => {
                                    console.log('Error fetching walking route:', errorMessage);
                                    setWalkingRouteLoading(false);
                                }}
                            />
                        </>
                    )}
                </MapView>
            )}
            {confirmPress && (
                <>
                    <MapView
                        ref={mapViewRef}
                        style={styles.mapReduced}
                        showsUserLocation={true}
                        initialRegion={initialRegion}
                        region={{
                            ...currentLocation,
                            latitudeDelta: 0.001,
                            longitudeDelta: 0.001,
                        }}
                    >
                        {selectedLocation && (
                            <Marker coordinate={selectedLocation} pinColor="red">
                                <Callout>
                                    <View>
                                        <Text>Selected Destination</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        )}
                        {markers.map((marker, index) => (
                            <Marker
                                key={index}
                                coordinate={{
                                    latitude: marker.latitude,
                                    longitude: marker.longitude,
                                }}
                                title={`Parking Lot ${marker.id}`}
                                pinColor='green'
                                onPress={() => handleMarkerPress(marker)}
                            >
                                <Callout>
                                    <View>
                                        <Text>Price: ${marker.price}</Text>
                                        <TouchableOpacity onPress={() => {
                                            if (!showRoutes) handleStartPress();
                                        }} style={styles.startButton}>
                                            <Text style={styles.startButtonText}>Select</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}
                        {confirmPress && (
                            <>
                                <MapViewDirections
                                    origin={currentLocation}
                                    destination={selectedMarker}
                                    apikey="AIzaSyDmT_iiMaICWSkmTykVj-mGdZpEPdIljwg"
                                    strokeWidth={4}
                                    strokeColor="blue"
                                    mode="DRIVING"
                                    onReady={(result) => {
                                        setRouteCoordinates(result.coordinates);
                                        setEstimatedTime(result.duration);
                                        setDrivingRouteLoading(false);
                                        // fitMapToMarkers([currentLocation, selectedMarker, selectedLocation]);
                                    }}
                                    onError={(errorMessage) => {
                                        console.log('Error fetching driving route:', errorMessage);
                                        setDrivingRouteLoading(false);
                                    }}
                                />
                                <MapViewDirections
                                    origin={selectedMarker}
                                    destination={selectedLocation}
                                    apikey="AIzaSyDmT_iiMaICWSkmTykVj-mGdZpEPdIljwg"
                                    strokeWidth={2}
                                    strokeColor="green"
                                    mode="WALKING"
                                    lineDashPattern={[1, 5]}
                                    onReady={(result) => {
                                        setRouteCoordinates((prev) => [...prev, ...result.coordinates]);
                                        setWalkingRouteLoading(false);
                                    }}
                                    onError={(errorMessage) => {
                                        console.log('Error fetching walking route:', errorMessage);
                                        setWalkingRouteLoading(false);
                                    }}
                                />
                            </>
                        )}
                    </MapView>
                    <View style={styles.redArea}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            {!confirmPress && (
            <View style={styles.searchContainer}>
                <GooglePlacesAutocomplete
                    placeholder='Search'
                    onPress={(data, details = null) => {
                        const location = details.geometry.location;
                        const selectedLoc = {
                            latitude: location.lat,
                            longitude: location.lng,
                        };
                        if (!isCoordinateNearMarkers(selectedLoc, markers, 0.001)) { // Adjust the threshold as needed
                            setSelectedLocation(selectedLoc);
                            mapViewRef.current.animateToRegion({
                                ...selectedLoc,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }, 1000); // Pan and zoom to the selected location
                            fetchNearbyParkingLots(location.lat, location.lng, 1); // Call API with fixed distance of 1 km
                        } else {
                            // Alert.alert('Too close to a green marker. Select a green marker or choose a different location.');
                        }
                    }}
                    query={{
                        key: 'AIzaSyDmT_iiMaICWSkmTykVj-mGdZpEPdIljwg',
                        language: 'en',
                    }}
                    styles={{
                        container: {
                            flex: 1,
                        },
                        textInputContainer: {
                            flexDirection: 'row',
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderTopWidth: 0,
                            borderBottomWidth: 0,
                        },
                        textInput: {
                            backgroundColor: '#FFFFFF',
                            height: 44,
                            borderRadius: 5,
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            fontSize: 18,
                            flex: 1,
                        },
                        listView: {
                            backgroundColor: 'white',
                        },
                    }}
                    fetchDetails={true}
                />
            </View>
            )}
            {markers.length === 0 && selectedLocation && !isLoading && !showRoutes && (
                <TouchableOpacity style={styles.extendSearchButton} onPress={extendSearch}>
                    <Text style={styles.extendSearchText}>Extend search</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.roundButtonNavigation} onPress={() => setScannerVisible(true)}>
                <Text style={styles.buttonText}>Scan Entrance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundButtonQR} onPress={() => setLevelNavigationVisibility(true)}>
                <Text style={styles.buttonText}>Level Navigation</Text>
            </TouchableOpacity>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <Spinner isVisible={true} size={100} type="Circle" color="#FFF" />
                </View>
            )}
            {(drivingRouteLoading || walkingRouteLoading) && (
                <View style={styles.loadingOverlay}>
                    <Spinner isVisible={true} size={100} type="ChasingDots" color="#FFF" />
                    <Text style={styles.loadingText}>Calculating route...</Text>
                </View>
            )}
            {!confirmPress && showRoutes && (
                <TouchableOpacity style={styles.stopButton} onPress={() => {
                    setShowRoutes(false);
                    setRouteCoordinates([]);
                    setRouteLoading(false);
                    setDrivingRouteLoading(false);
                    setWalkingRouteLoading(false);
                }}>
                    <Text style={styles.stopButtonText}>X</Text>
                </TouchableOpacity>
            )}
            {!confirmPress && showRoutes && (
                <View style={styles.confirmBox}>
                    <Text style={styles.confirmBoxTitle}>Estimated Time: {Math.round(estimatedTime)} mins</Text>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPress}>
                        <Text style={styles.confirmButtonText}>Start</Text>
                    </TouchableOpacity>
                </View>
            )}
            {/* {confirmPress && (
                <TestView
                    style={{height: '100%', width: '100%'}}
                    startLat={currentLocation.latitude}
                    startLng={currentLocation.longitude}
                    destLat={selectedMarker.latitude}
                    destLng={selectedMarker.longitude}
                />
            )} */}
        </View>
    );
}

const styles = StyleSheet.create({
    roundButtonNavigation: {
        position: 'absolute',
        bottom: 20,
        left: 5,
        backgroundColor: '#000',
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        margin: 10,
    },
    roundButtonQR: {
        position: 'absolute',
        bottom: 20,
        right: 5,
        backgroundColor: '#000',
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        margin: 10,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },    
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    searchContainer: {
        position: 'absolute',
        top: 60,
        width: '100%',
        paddingHorizontal: 10,
        zIndex: 1,
    },
    extendSearchButton: {
        position: 'absolute',
        bottom: '7%',
        left: '35%',
        // transform: [{ translateX: -50% }],
        flexDirection: 'row',
        backgroundColor: '#000',
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    extendSearchText: {
        color: '#fff',
        marginLeft: 5,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    startButton: {
      marginTop: 10,
      backgroundColor: 'blue',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    stopButton: {
      position: 'absolute',
      top: '15%',
      right: 20,
      backgroundColor: '#FFF',
      borderRadius: 50,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3,
    },
    stopButtonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
    },
    confirmBox: {
      position: 'absolute',
      bottom: '5%',
      left: '5%',
      right: '5%',
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
      zIndex: 2,
      alignItems: 'center',
  },
  confirmBoxTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 10,
  },
  confirmBoxSubtitle: {
      fontSize: 16,
      marginBottom: 20,
  },
  confirmButton: {
      backgroundColor: 'black',
      paddingVertical: 10,
      paddingHorizontal: 50,
      borderRadius: 5,
  },
  confirmButtonText: {
      color: '#fff',
      fontSize: 16,
  },
    mapReduced: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        bottom: 0,
    },
    redArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '30%',
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 80,
        left: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
    },
    backButtonText: {
        color: 'black',
    },
});
