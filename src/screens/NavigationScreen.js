import React, { useEffect, useState, useRef, useContext  } from 'react';
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
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothContext } from '../components/BluetoothContext'; // Import BluetoothContext
import Icon from 'react-native-vector-icons/FontAwesome';

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
    const [isFinishModalVisible, setIsModalVisible] = useState(false);
    const [savedMarker, setSavedMarker] = useState(null);
    const [reservedMarker, setReservedMarker] = useState(null);
    const { connectedDevice } = useContext(BluetoothContext);
    const [spotInfo, setSpotInfo] = useState(null);

    useEffect(() => {
        let interval;
    
        if (confirmPress && currentLocation) {
            interval = setInterval(async () => {
                console.log('Fetching nearby parking lots during navigation...');
                await fetchNearbyParkingLots(currentLocation.latitude, currentLocation.longitude, 1);
            }, 2000); // Fetch every 5 seconds
        } else {
            console.log('Stopping fetchNearbyParkingLots interval');
            clearInterval(interval);
        }
    
        return () => clearInterval(interval);
    }, [confirmPress, currentLocation]);

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

    useEffect(() => {
        getSavedMarker();
    }, []);

    useEffect(() => {
        if (confirmPress) {
            console.log('Polling started because confirmPress is true');
            const interval = setInterval(async () => {
                if (reservedMarker && reservedMarker.type !== 'parkingLot') {
                    try {
                        console.log(`Polling marker status for marker ID: ${reservedMarker.id}`);
                        const response = await fetch(`https://frog-happy-uniformly.ngrok-free.app/marker/status/${reservedMarker.id}/`);
                        const data = await response.json();
                        console.log('Polled data:', data);
                        if (data.is_occupied) {
                            console.log('reservedMarker', reservedMarker)
                            Alert.alert('Notification', 'Your reserved spot is now occupied. Redirecting to the closest available spot.');
                            const closestResponse = await fetch(`https://frog-happy-uniformly.ngrok-free.app/marker/closest-available/?lat=${reservedMarker.latitude}&lng=${reservedMarker.longitude}`);
                            const closestMarker = await closestResponse.json();
                            console.log('Closest marker data:', closestMarker);
                            if (closestMarker) {
                                setReservedMarker({
                                    id: closestMarker.id,
                                    latitude: closestMarker.lat,
                                    longitude: closestMarker.lng,
                                });
                                setSelectedMarker({
                                    id: closestMarker.id,
                                    latitude: closestMarker.lat,
                                    longitude: closestMarker.lng,
                                    is_reserved: closestMarker.is_reserved,
                                    is_occupied: closestMarker.is_occupied,
                                    name: closestMarker.name,
                                    type: 'scanMarker'
                                });
                            } else {
                                Alert.alert('Notification', 'No available spots nearby.');
                            }
                        }
                    } catch (error) {
                        console.error('Error polling marker status:', error);
                    }
                }
                else if (reservedMarker && reservedMarker.type === 'parkingLot'){
                    const reservedLocation = {
                        latitude: reservedMarker.latitude,
                        longitude: reservedMarker.longitude,
                    };
                    if (currentLocation && selectedLocation) {
                        const distance = getDistanceFromLatLonInMeters(currentLocation, reservedLocation);
                        console.log('Distance from destination:', distance);
                        if (distance < 10) {
                            try {
                                console.log('Attempting to report arrival...');
                                console.log('Reserved Marker Street Address:', reservedMarker.street_address);
                            
                                const response = await fetch(`https://frog-happy-uniformly-1.ngrok-free.app/parking/available-spot/`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        street_address: reservedMarker.street_address,
                                    }),
                                });
                            
                                console.log('Response status:', response.status);
                                console.log('Response status text:', response.statusText);
                            
                                if (response.ok) {
                                    const spotData = await response.json();
                                    console.log('Arrived at the parking lot:', spotData);
                                    setSpotInfo(spotData);
                                    clearInterval(interval); // Stop the polling
                                } else {
                                    const errorData = await response.json();
                                    console.error('Error reporting arrival:', errorData);
                                }
                            } catch (error) {
                                console.error('Error reporting arrival:', error.message);
                                console.error('Error stack:', error.stack);
                            }
                        }
                    }
                }
            }, POLLING_INTERVAL);

            return () => clearInterval(interval);
        } else {
            console.log('Polling not started because confirmPress is false');
        }
    }, [confirmPress, reservedMarker]);    

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
            const parkingResponse = await fetch(`https://frog-happy-uniformly-1.ngrok-free.app/parking/radius-search/?lat=${latitude}&lon=${longitude}&distance=${distance}`);
            const parkingData = await parkingResponse.json();
    
            const scanResponse = await fetch(`https://frog-happy-uniformly.ngrok-free.app/marker/scan/?lat=${latitude}&lon=${longitude}&distance=${distance}`);
            const scanData = await scanResponse.json();
            
            const combinedData = [
                ...parkingData.map((item) => ({
                    id: item.id,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    price: item.price,
                    occupancy: item.current_occupancy,
                    capacity: item.capacity,
                    street_address: item.street_address,
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
        if (confirmPress) {
            setReservedMarker({
                id: marker.id,
                latitude: marker.latitude,
                longitude: marker.longitude,
            });
        }
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
                    setReservedMarker({
                        id: selectedMarker.id,
                        latitude: selectedMarker.latitude,
                        longitude: selectedMarker.longitude,
                    });
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
        if (selectedMarker.type === 'parkingLot') {
            console.log('selected parking lot')
            console.log('Selected Marker:', selectedMarker);
            setReservedMarker({
                id: selectedMarker.id,
                latitude: selectedMarker.latitude,
                longitude: selectedMarker.longitude,
                street_address: selectedMarker.street_address,
                type: selectedMarker.type,
            });
            console.log(confirmPress)
        }
        mapViewRef.current.animateToRegion({
            ...currentLocation,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
        }, 1000);
    };

    const handleBackPress = async () => {
        setConfirmPress(false);
        console.log('Stop Trip button pressed');
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
                    console.log('Marker reservation canceled successfully');
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
        console.log(currentLocation, selectedLocation)
        if (currentLocation && selectedLocation) {
            console.log('calculating distance')
            const distance = getDistanceFromLatLonInMeters(currentLocation, selectedLocation);
            console.log('Distance from destination:', distance);
    
            if (distance > 10) {
                setIsModalVisible(true);
                console.log('Showing modal for parking confirmation');
            } else {
                mapViewRef.current.animateToRegion({
                    ...currentLocation,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }, 1000);
                console.log('No need for modal, moving back to initial region');
            }
        } else {
            console.log('currentLocation or selectedLocation is null:', currentLocation, selectedLocation);
            mapViewRef.current.animateToRegion({
                ...initialRegion,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }
    };

    const getDistanceFromLatLonInMeters = (location1, location2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = deg2rad(location2.latitude - location1.latitude);
        const dLon = deg2rad(location2.longitude - location1.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(location1.latitude)) * Math.cos(deg2rad(location2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c * 1000; // Distance in meters
        return distance;
    };
    
    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const handleModalYes = async () => {
        setIsModalVisible(false);
        try {
            const response = await fetch('https://frog-happy-uniformly.ngrok-free.app/marker/add-marker/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    is_occupied: true,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                await saveMarker(data);
                Alert.alert('Marker added successfully');
            } else {
                Alert.alert('Error', data.error || 'Failed to add marker');
            }
        } catch (error) {
            console.error('Error adding marker:', error);
            Alert.alert('Error', 'Failed to add marker');
        }
    };
    
    const handleModalNo = () => {
        setIsModalVisible(false);
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

    const saveMarker = async (marker) => {
        try {
            await AsyncStorage.setItem('savedMarker', JSON.stringify(marker));
            setSavedMarker(marker);
        } catch (error) {
            console.error('Error saving marker:', error);
        }
    };
    
    const getSavedMarker = async () => {
        try {
            const marker = await AsyncStorage.getItem('savedMarker');
            if (marker !== null) {
                setSavedMarker(JSON.parse(marker));
            }
        } catch (error) {
            console.error('Error retrieving marker:', error);
        }
    };

    const POLLING_INTERVAL = 5000; // 5 seconds

    return (
        <View style={styles.container}>
            {levelNavigationVisibility && (
                <NavigationOverlay
                    visible={levelNavigationVisibility}
                    onClose={() => setLevelNavigationVisibility(false)}
                    currentLocation={currentLocation}
                    destination={selectedMarker}
                />
            )}
            <QrCodeScannerModal
                visible={scannerVisible}
                onClose={() => setScannerVisible(false)}
                onScanSuccess={handleScanSuccess}
            />
            <Modal isVisible={isFinishModalVisible}>
                <View style={styles.modalContent}>
                    <Text>Did you park in a public space?</Text>
                    <TouchableOpacity onPress={handleModalYes} style={styles.modalButton}>
                        <Text style={styles.modalButtonText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleModalNo} style={styles.modalButton}>
                        <Text style={styles.modalButtonText}>No</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
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
                                            <Text>{marker.occupancy}/{marker.capacity}</Text>
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
            {!confirmPress && savedMarker && (
                <TouchableOpacity style={styles.savedMarkerButton} onPress={() => {
                    mapViewRef.current.animateToRegion({
                        latitude: savedMarker.lat,
                        longitude: savedMarker.lng,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 1000);
                }}>
                    <Text style={styles.buttonText}>My Car</Text>
                </TouchableOpacity>
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
                        {connectedDevice && (
                            <Text style={styles.connectedDeviceName}>
                                Connected Device: {connectedDevice.name}
                            </Text>
                        )}
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
            {confirmPress && spotInfo && (
                <View style={styles.spotInfoContainer}>
                    <Text style={styles.spotInfoText}>{`${spotInfo.level}:${spotInfo.sector}${spotInfo.number}`}</Text>
                </View>
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
    savedMarkerButton: {
        position: 'absolute',
        bottom: 30,
        right: 15,
        backgroundColor: '#000',
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButton: {
        backgroundColor: 'black',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    modalButtonText: {
        color: 'white',
    },
    connectedDeviceName: {
        color: 'white',
        fontSize: 16,
        marginTop: 200,
    },
    spotInfoContainer: {
        position: 'absolute',
        bottom: '62%',
        rigth: '75%',
        left: '5%',
        backgroundColor: 'rgba(0, 128, 0, 0.8)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    spotInfoText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
