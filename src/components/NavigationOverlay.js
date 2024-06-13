import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { magnetometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';
import Icon from 'react-native-vector-icons/FontAwesome';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

setUpdateIntervalForType(SensorTypes.magnetometer, 100);

const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const toDeg = (value) => (value * 180) / Math.PI;

    const dLon = toRad(lon2 - lat1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360; // Normalize to 0-360
};

const NavigationOverlay = ({ visible, onClose, currentLocation, selectedMarker }) => {
    const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
    const [magnetometerAvailable, setMagnetometerAvailable] = useState(true);
    const rotationValue = useSharedValue(0);

    useEffect(() => {
        let magnetometerSubscription;

        try {
            magnetometerSubscription = magnetometer
                .pipe(
                    filter((data) => data !== null),
                    map(({ x, y, z }) => ({ x, y, z }))
                )
                .subscribe(
                    data => {
                        console.log('Magnetometer data:', data);
                        setMagnetometerData(data);
                    },
                    (error) => {
                        console.error('Magnetometer error:', error);
                        setMagnetometerAvailable(false);
                    }
                );
        } catch (error) {
            console.error('Magnetometer not available:', error);
            setMagnetometerAvailable(false);
        }

        return () => {
            if (magnetometerSubscription) {
                magnetometerSubscription.unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        if (currentLocation && selectedMarker) {
            const bearing = calculateBearing(currentLocation.latitude, currentLocation.longitude, selectedMarker.latitude, selectedMarker.longitude);
            console.log('Calculated bearing:', bearing);
            const rotation = getArrowRotation(magnetometerData, bearing);
            console.log('Calculated rotation:', rotation);
            rotationValue.value = withSpring(rotation, { stiffness: 300, damping: 20 });
        }
    }, [magnetometerData, currentLocation, selectedMarker]);

    const getArrowRotation = (magnetometer, bearing) => {
        const { x, y } = magnetometer;
        const angle = Math.atan2(y, x) * (180 / Math.PI);
        const heading = (angle + 360) % 360; // Normalize to 0-360
        console.log('Heading:', heading);
        return (bearing - heading + 360) % 360; // Normalize to 0-360
    };

    const arrowStyle = useAnimatedStyle(() => {
        console.log('Updating arrow rotation to:', rotationValue.value);
        return {
            transform: [
                { rotateZ: `${rotationValue.value}deg` },
            ],
        };
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.overlayContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
                <View style={styles.arrowContainer}>
                    <View style={styles.circle}>
                        <Animated.View style={[styles.arrow, arrowStyle]}>
                            <Icon
                                name="arrow-up"
                                size={100}
                                color="red"
                            />
                        </Animated.View>
                    </View>
                    {!magnetometerAvailable && (
                        <Text style={styles.warningText}>Magnetometer is not available on this device.</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#FFF',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    closeButtonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    warningText: {
        marginTop: 20,
        color: 'yellow',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default NavigationOverlay;
