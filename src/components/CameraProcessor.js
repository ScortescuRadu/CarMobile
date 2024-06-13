import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { RNCamera } from 'react-native-camera';

const { width } = Dimensions.get('window');
const cameraHeight = width * 0.5;

const CameraProcessor = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await RNCamera.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access camera was denied');
            }
        })();
    }, []);

    const onBarCodeRead = async (e) => {
        if (isProcessing) return;

        setIsProcessing(true);
        // Process barcode data...
        setIsProcessing(false);
    };

    return (
        <View style={styles.container}>
            <RNCamera
                style={styles.camera}
                onBarCodeRead={!isProcessing ? onBarCodeRead : undefined}
                captureAudio={false}
            />
            {isProcessing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    camera: {
        flex: 1,
        height: cameraHeight,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CameraProcessor;
