import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Icon from 'react-native-vector-icons/FontAwesome';
import Spinner from 'react-native-spinkit';

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

export default function NavigationScreen() {
    const mapViewRef = useRef(null);  // Reference to the MapView

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [initialRegion, setInitialRegion] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null); // Track the selected marker
    const [isLoading, setIsLoading] = useState(false); // Track loading state

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
            },
            (error) => {
                console.log(error);
                Alert.alert('Error', 'Unable to get current location');
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
    }, []);

    const handleMapPress = (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        if (!isCoordinateNearMarkers({ latitude, longitude }, markers, 0.001)) { // Adjust the threshold as needed
            console.log('Selected Location:', { latitude, longitude });
            setSelectedLocation({ latitude, longitude });
            fetchNearbyParkingLots(latitude, longitude, 1); // Call API with fixed distance of 1 km
        } else {
            Alert.alert('Too close to a green marker. Select a green marker or choose a different location.');
        }
    };

    const fetchNearbyParkingLots = async (latitude, longitude, distance) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/parking/radius-search/?lat=${latitude}&lon=${longitude}&distance=${distance}`);
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
        setSelectedMarker(marker);
    };

    const extendSearch = async () => {
        setIsLoading(true);
        const initialLatitudeDelta = 0.02;
        const initialLongitudeDelta = 0.02;
        for (let i = 2; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));  // Delay of 1 second
            console.log('increment',i)
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

    return (
        <View style={styles.container}>
            {initialRegion && (
                <MapView
                    ref={mapViewRef}  // Assign the reference to MapView
                    style={styles.map}
                    initialRegion={initialRegion}
                    onPress={handleMapPress}
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
                                    <Text>Parking Lot {marker.id}</Text>
                                    <Text>Price: ${marker.price}</Text>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>
            )}
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
                            Alert.alert('Too close to a green marker. Select a green marker or choose a different location.');
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
            {markers.length === 0 && selectedLocation && !isLoading && (
                <TouchableOpacity style={styles.extendSearchButton} onPress={extendSearch}>
                    <Text style={styles.extendSearchText}>Extend search</Text>
                </TouchableOpacity>
            )}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <Spinner isVisible={true} size={100} type="Circle" color="#FFF" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
        bottom: '5%',
        left: '36%',
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
});
