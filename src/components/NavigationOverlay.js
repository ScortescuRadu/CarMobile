import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import CompassHeading from 'react-native-compass-heading';
import Icon from 'react-native-vector-icons/FontAwesome';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const NavigationOverlay = ({ visible, onClose }) => {
    const [heading, setHeading] = useState(0);
    const rotationValue = useSharedValue(0);

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

    const arrowStyle = useAnimatedStyle(() => {
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
});

export default NavigationOverlay;
