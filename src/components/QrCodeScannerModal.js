import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { RNCamera } from 'react-native-camera';

const { width } = Dimensions.get('window');
const scannerSize = width * 0.7;

const QrCodeScannerModal = ({ visible, onClose, userToken, onScanSuccess }) => {
    const [isScanning, setIsScanning] = useState(false);

    const onBarCodeRead = async (e) => {
        if (isScanning) return;

        setIsScanning(true);
        const scannedData = e.data;
        try {
            const response = await fetch('http://your-backend-url.com/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ scannedData })
            });
            const data = await response.json();
            setIsScanning(false);
            if (response.ok) {
                onScanSuccess(data);
                onClose();
            } else {
                Alert.alert('Error', data.message || 'An error occurred while processing your request.');
            }
        } catch (error) {
            setIsScanning(false);
            if (!isScanning) {
                Alert.alert('Error', 'An error occurred. Please try again.');
            }
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <RNCamera
                    style={styles.camera}
                    onBarCodeRead={onBarCodeRead}
                    captureAudio={false}
                >
                    <View style={styles.overlay}>
                        <View style={styles.topOverlay} />
                        <View style={styles.centerOverlay}>
                            <View style={styles.sideOverlay} />
                            <View style={styles.scannerFrame}>
                                <Text style={styles.scannerText}>QR-Scanner</Text>
                                <View style={styles.scannerFrameInner} />
                            </View>
                            <View style={styles.sideOverlay} />
                        </View>
                        <View style={styles.bottomOverlay}>
                            <TouchableOpacity style={styles.buttonTouchable} onPress={onClose}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </RNCamera>
                {isScanning && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: '100%',
    },
    centerOverlay: {
        flexDirection: 'row',
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scannerFrame: {
        width: scannerSize,
        height: scannerSize,
        borderWidth: 2,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        position: 'relative',
    },
    scannerFrameInner: {
        width: '90%',
        height: '90%',
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 10,
    },
    scannerText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        position: 'absolute',
        top: -50,
        backgroundColor: 'black',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
    },
    buttonTouchable: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        width: 150,
    },
    buttonText: {
        fontSize: 18,
        color: 'black',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 18,
    },
});

export default QrCodeScannerModal;
