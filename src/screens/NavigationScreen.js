import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity, NativeModules, requireNativeComponent } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapViewDirections from 'react-native-maps-directions';
import Spinner from 'react-native-spinkit';
import NavigationOverlay from '../components/NavigationOverlay.js'
import QrCodeScannerModal from '../components/QrCodeScannerModal.js';
import CompassHeading from 'react-native-compass-heading';
import CameraProcessor from '../components/CameraProcessor.js';

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
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        // Get current location
        Geolocation.getCurrentPosition(
            (position) => {
                const currentLoc = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setInitialRegion({
                    ...currentLoc,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
                setCurrentLocation(currentLoc);
                fetchNearbyParkingLots(currentLoc.latitude, currentLoc.longitude, 1);
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

    useEffect(() => {
        const degree_update_rate = 3; // Number of degrees changed before the callback is triggered
        CompassHeading.start(degree_update_rate, ({ heading, accuracy }) => {
            setHeading(heading); // Update the heading state
            if (confirmPress) {
                updateCameraHeading(heading); // Update the camera heading
            }
        });
    
        return () => {
            CompassHeading.stop();
        };
    }, [confirmPress]);

    const updateCameraHeading = (heading) => {
        if (mapViewRef.current) {
            mapViewRef.current.animateCamera({
                heading: heading,
                pitch: 0,
                zoom: 18,
                center: currentLocation
            }, { duration: 500 });
        }
    };

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
            // const parkingResponse = await fetch(`https://frog-happy-uniformly.ngrok-free-1.app/parking/radius-search/?lat=${latitude}&lon=${longitude}&distance=${distance}`);
            const parkingData = []// await parkingResponse.json();
    
            const scanResponse = await fetch(`https://frog-happy-uniformly.ngrok-free.app/marker/scan/?lat=${latitude}&lon=${longitude}&distance=${distance}`);
            const scanData = await scanResponse.json();
    
            const combinedData = [
                ...parkingData.map((item) => ({
                    id: item.id,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    price: item.price,
                    type: 'parkingLot',
                })),
                ...scanData.map((item) => ({
                    id: item.id,
                    latitude: item.lat,
                    longitude: item.lng,
                    name: item.name,
                    is_reserved: item.is_reserved,
                    is_occupied: item.is_occupied,
                    type: 'scanMarker',
                })),
            ];
    
            if (combinedData.length > 0) {
                setMarkers(combinedData);
                return true;
            } else {
                setMarkers([]); // Clear markers if no data is returned
            }
        } catch (error) {
            console.error('Error fetching nearby parking lots or scanned locations:', error);
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

    const handleConfirmPress = async () => {
        setConfirmPress(true);
        if (selectedMarker && selectedMarker.type !== 'parkingLot') {
            try {
                const response = await fetch(`https://frog-happy-uniformly.ngrok-free.app/marker/reserve-marker/${selectedMarker.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: selectedMarker.id }),
                });
                const data = await response.json();
    
                if (response.ok) {
                    // Alert.alert('Success', 'Marker reserved successfully');
                    setMarkers((prevMarkers) =>
                        prevMarkers.map((m) =>
                            m.id === selectedMarker.id ? { ...m, is_reserved: true } : m
                        )
                    );
                } else {
                    Alert.alert('Error', data.error || 'Failed to reserve marker');
                    return;
                }
            } catch (error) {
                console.error('Error reserving marker:', error);
                Alert.alert('Error', 'Failed to reserve marker');
                return;
            }
        }
        mapViewRef.current.animateToRegion({
            ...currentLocation,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
        }, 1000);
    };

    const handleBackPress = async () => {
        setConfirmPress(false);
        if (selectedMarker && selectedMarker.type !== 'parkingLot') {
            try {
                const response = await fetch(`https://frog-happy-uniformly.ngrok-free.app/marker/cancel-reservation/${selectedMarker.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}),
                });
                const data = await response.json();
    
                if (response.ok) {
                    // Alert.alert('Success', 'Marker reservation canceled successfully');
                    setMarkers((prevMarkers) =>
                        prevMarkers.map((m) =>
                            m.id === selectedMarker.id ? { ...m, is_reserved: false } : m
                        )
                    );
                } else {
                    Alert.alert('Error', data.error || 'Failed to cancel marker reservation');
                    return;
                }
            } catch (error) {
                console.error('Error canceling marker reservation:', error);
                Alert.alert('Error', 'Failed to cancel marker reservation');
                return;
            }
        }
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

    const handleAddMarkerPress = async () => {
        if (!currentLocation) return;
    
        try {
            const response = await fetch('https://frog-happy-uniformly.ngrok-free.app/marker/add-marker/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude,
                    name: 'New Marker',
                }),
            });
            const data = await response.json();
    
            if (response.ok) {
                // Alert.alert('Success', 'Marker added successfully');
                setMarkers((prevMarkers) => [
                    ...prevMarkers,
                    {
                        id: data.id,
                        latitude: data.lat,
                        longitude: data.lng,
                        name: data.name,
                        is_reserved: false,
                        is_occupied: false,
                        type: 'scanMarker',
                    },
                ]);
            } else {
                Alert.alert('Error', data.error || 'Failed to add marker');
            }
        } catch (error) {
            console.error('Error adding marker:', error);
            Alert.alert('Error', 'Failed to add marker');
        }
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
                            title={
                                marker.type === 'parkingLot'
                                    ? `Parking Lot ${marker.id}`
                                    : `Marker ${marker.name}`
                            }
                            pinColor={
                                marker.type === 'parkingLot' ? 'blue' :
                                marker.is_occupied ? 'red' :
                                marker.is_reserved ? 'yellow' :
                                'green'
                            }
                            onPress={() => handleMarkerPress(marker)}
                        >
                            <Callout>
                                <View>
                                    {marker.type === 'parkingLot' ? (
                                        <>
                                            <Text>Price: ${marker.price}</Text>
                                            <TouchableOpacity onPress={() => {
                                                if (!showRoutes) handleStartPress();
                                                }} style={styles.startButton}>
                                                <Text style={styles.startButtonText}>Select</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Text>Reserved: {marker.is_reserved ? 'Yes' : 'No'}</Text>
                                            <Text>Occupied: {marker.is_occupied ? 'Yes' : 'No'}</Text>
                                            {!marker.is_reserved && (
                                                <TouchableOpacity onPress={() => {
                                                    if (!showRoutes) handleStartPress();
                                                    }} style={styles.startButton}>
                                                    <Text style={styles.startButtonText}>Select</Text>
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    )}
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
                        rotateEnabled={true}
                        // showsCompass={true}
                        heading={heading}
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
                                title={
                                    marker.type === 'parkingLot'
                                        ? `Parking Lot ${marker.id}`
                                        : `Marker ${marker.name}`
                                }
                                pinColor={
                                    marker.type === 'parkingLot' ? 'blue' :
                                    marker.is_occupied ? 'red' :
                                    marker.is_reserved ? 'yellow' :
                                    'green'
                                }
                                onPress={() => handleMarkerPress(marker)}
                            >
                                <Callout>
                                    <View>
                                        {marker.type === 'parkingLot' ? (
                                            <>
                                                <Text>Price: ${marker.price}</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text>Reserved: {marker.is_reserved ? 'Yes' : 'No'}</Text>
                                                <Text>Occupied: {marker.is_occupied ? 'Yes' : 'No'}</Text>
                                            </>
                                        )}
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
                    <View style={styles.cameraContainer}>
                        <CameraProcessor />
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <Text style={styles.backButtonText}>Stop Trip</Text>
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

            {confirmPress && (
                <TouchableOpacity style={styles.roundButtonNavigation} onPress={() => setScannerVisible(true)}>
                    <Text style={styles.buttonText}>Scan Entrance</Text>
                </TouchableOpacity>
            )}
            {confirmPress && (
                <TouchableOpacity style={styles.roundButtonQR} onPress={() => setLevelNavigationVisibility(true)}>
                    <Text style={styles.buttonText}>Level Navigation</Text>
                </TouchableOpacity>
            )}
            {confirmPress && (
                <TouchableOpacity 
                    style={styles.addMarkerButton} 
                    onPress={handleAddMarkerPress}
                >
                    <Text>Free Spot</Text>
                </TouchableOpacity>
            )}
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
    cameraContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '30%',
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
    addMarkerButton: {
        position: 'absolute',
        bottom: '6%',
        left: '38%',
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
});
