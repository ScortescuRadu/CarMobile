import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import Icon from 'react-native-vector-icons/FontAwesome';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const getDistance = (currentLocation, destination) => {
    console.log('diff',currentLocation, destination)
    const toRadian = angle => (Math.PI / 180) * angle;
    const distance = (a, b) => Math.sqrt(a * a + b * b);
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;

    const R = 6371e3; // meters
    const φ1 = toRadian(lat1);
    const φ2 = toRadian(lat2);
    const Δφ = toRadian(lat2 - lat1);
    const Δλ = toRadian(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d; // in meters
};

const NavigationOverlay = ({ visible, onClose, currentLocation, destination }) => {
    const [heading, setHeading] = useState(0);
    const rotationValue = useSharedValue(0);
    const [distance, setDistance] = useState(0);

    useEffect(() => {
        const degree_update_rate = 3; // Number of degrees changed before the callback is triggered
        CompassHeading.start(degree_update_rate, (headingData) => {
            const newHeading = headingData.heading;
            console.log('Heading:', newHeading);
            setHeading(newHeading); // Directly set the heading value
        });

        return () => {
            CompassHeading.stop();
        };
    }, []);

    useEffect(() => {
        if (!isNaN(heading)) {
            const newRotation = heading % 360; // Normalize heading to 0-360 range
            console.log('Updated heading:', heading, 'New rotation:', newRotation);
            rotationValue.value = withTiming(newRotation, { duration: 500 });
        }
    }, [heading]);

    useEffect(() => {
        console.log('coordinates:', currentLocation, destination)
        if (currentLocation && destination) {
            console.log('calculating')
            const dist = getDistance(currentLocation, destination);
            setDistance(dist);
        }
    }, [currentLocation, destination]);

    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotateZ: `${rotationValue.value}deg` },
            ],
        };
    });

    const getBackgroundColor = () => {
        if (distance < 50) return '#2e6e15';
        if (distance < 200) return '#f08811';
        return '#e04655';
    };

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
                <View style={[styles.rectangle, { backgroundColor: getBackgroundColor() }]}>
                    <Text style={styles.title}>{distance.toFixed(2)} meters</Text>
                    <View style={styles.circle}>
                        <Animated.View style={[styles.arrow, arrowStyle]}>
                            <Icon
                                name="arrow-up"
                                size={100}
                                color="black"
                            />
                        </Animated.View>
                    </View>
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
    rectangle: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 250,
        height: 300,
        borderRadius: 20,
        padding: 20,
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    circle: {
        width: 120,
        height: 120,
        borderRadius:10,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NavigationOverlay;
