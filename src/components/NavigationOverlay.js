import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { magnetometer, accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';
import Icon from 'react-native-vector-icons/FontAwesome';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

setUpdateIntervalForType(SensorTypes.magnetometer, 100);
setUpdateIntervalForType(SensorTypes.accelerometer, 100);

const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const toDeg = (value) => (value * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360; // Normalize to 0-360
};

const NavigationOverlay = ({ visible, onClose, currentLocation, selectedMarker }) => {
    const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
    const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
    const [magnetometerAvailable, setMagnetometerAvailable] = useState(true);

    useEffect(() => {
        let magnetometerSubscription;
        let accelerometerSubscription;

        try {
            magnetometerSubscription = magnetometer
                .pipe(
                    filter((data) => data !== null),
                    map(({ x, y, z }) => ({ x, y, z }))
                )
                .subscribe(setMagnetometerData, (error) => {
                    console.error('Magnetometer error:', error);
                    setMagnetometerAvailable(false);
                });
        } catch (error) {
            console.error('Magnetometer not available:', error);
            setMagnetometerAvailable(false);
        }

        try {
            accelerometerSubscription = accelerometer
                .pipe(
                    filter((data) => data !== null),
                    map(({ x, y, z }) => ({ x, y, z }))
                )
                .subscribe(setAccelerometerData);
        } catch (error) {
            console.error('Accelerometer is not available:', error);
        }

        return () => {
            if (magnetometerSubscription) magnetometerSubscription.unsubscribe();
            if (accelerometerSubscription) accelerometerSubscription.unsubscribe();
        };
    }, []);

    const calculateElevationAngle = (accel) => {
        const angle = Math.atan2(accel.z, Math.sqrt(accel.x * accel.x + accel.y * accel.y)) * (180 / Math.PI);
        return angle;
    };

    const getArrowRotation = (magnetometer, bearing) => {
        const { x, y } = magnetometer;
        const angle = Math.atan2(y, x) * (180 / Math.PI);
        const heading = (angle + 360) % 360; // Normalize to 0-360
        return (bearing - heading + 360) % 360; // Normalize to 0-360
    };

    if (!currentLocation || !selectedMarker) {
        return null;
    }

    const bearing = calculateBearing(currentLocation.latitude, currentLocation.longitude, selectedMarker.latitude, selectedMarker.longitude);
    const rotation = magnetometerAvailable ? getArrowRotation(magnetometerData, bearing) : 0;
    const elevationAngle = calculateElevationAngle(accelerometerData);

    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotateZ: `${rotation}deg` },
                { rotateX: `${elevationAngle}deg` },
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
                    <Animated.View style={[styles.arrow, arrowStyle]}>
                        <Icon
                            name="arrow-up"
                            size={100}
                            color="red"
                        />
                    </Animated.View>
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
