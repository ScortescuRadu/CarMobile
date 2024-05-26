import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';

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
            Alert.alert('Error', 'An error occurred. Please try again.');
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
                    <View style={styles.topContent}>
                        <Text style={styles.centerText}>
                            Scan the QR code at the entrance.
                        </Text>
                    </View>
                    <View style={styles.bottomContent}>
                        <TouchableOpacity style={styles.buttonTouchable} onPress={onClose}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContent: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    centerText: {
        fontSize: 18,
        padding: 32,
        color: '#FFF',
        textAlign: 'center',
    },
    buttonTouchable: {
        padding: 16,
        backgroundColor: '#000',
        borderRadius: 25,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 21,
        color: 'rgb(0,122,255)',
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
