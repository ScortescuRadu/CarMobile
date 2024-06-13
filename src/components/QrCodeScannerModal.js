import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SInfo from 'react-native-sensitive-info';

const { width } = Dimensions.get('window');
const scannerSize = width * 0.7;

const QrCodeScannerModal = ({ visible, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);

    const handleScanSuccess = (data) => {
        setScanResult(data);
    };

    const onBarCodeRead = async (e) => {
        if (isScanning) return;

        setIsScanning(true);
        const scannedData = e.data;
        console.log('Scanned data:', scannedData);

        if (!scannedData) {
            console.log('Address not found in QR code:', scannedData);
            Alert.alert('Error', 'Address not found in QR code.');
            setIsScanning(false);
            return;
        }

        try {
            const userToken = await SInfo.getItem('authToken', {});
            console.log('sending data');
            const response = await fetch('https://frog-happy-uniformly.ngrok-free.app/parking-invoice/create-invoice/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ address: scannedData, token: userToken })
            });
            const data = await response.json();
            console.log('Response data:', data); // Log the response data
            if (response.ok) {
                setIsScanning(false);
                handleScanSuccess(data);
            } else {
                setIsScanning(false); // Only reset isScanning if there was an error
                Alert.alert('Error', data.message || 'An error occurred while processing your request.');
            }
        } catch (error) {
            console.error('Error:', error); // Log the error
            setIsScanning(false); // Only reset isScanning if there was an error
            if (!isScanning) {
                Alert.alert('Error', 'An error occurred. Please try again.');
            }
        }
    };

    const handleResultClose = () => {
        setScanResult(null);
        onClose();
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
                    onBarCodeRead={!isScanning ? onBarCodeRead : undefined} // Disable barcode reading when isScanning is true
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
                {scanResult && (
                    <Modal
                        visible={true}
                        transparent={true}
                        animationType="slide"
                    >
                        <View style={styles.resultContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={handleResultClose}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.resultContent}>
                                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" style={styles.successIcon} />
                                <Text style={styles.resultTitle}>Welcome!</Text>
                                <View style={styles.resultItem}>
                                    <Ionicons name="location-outline" size={24} color="#000" style={styles.resultIcon} />
                                    <Text style={styles.resultLabel}>Spot:</Text>
                                    <Text style={styles.resultValue}>{scanResult.spot_description}</Text>
                                </View>
                                <View style={styles.resultItem}>
                                    <Ionicons name="pricetag-outline" size={24} color="#000" style={styles.resultIcon} />
                                    <Text style={styles.resultLabel}>Price:</Text>
                                    <Text style={styles.resultValue}>{scanResult.hourly_price}</Text>
                                </View>
                                <View style={styles.resultItem}>
                                    <Ionicons name="time-outline" size={24} color="#000" style={styles.resultIcon} />
                                    <Text style={styles.resultLabel}>Start time:</Text>
                                    <Text style={styles.resultValue}>{new Date(scanResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                            </View>
                        </View>
                    </Modal>
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
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'black',
        padding: 10,
        borderRadius: 5,
        zIndex: 1,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    resultContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: width * 0.8,
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
    },
    resultIcon: {
        marginRight: 10,
    },
    resultLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    resultValue: {
        fontSize: 18,
        flex: 1,
    },
});

export default QrCodeScannerModal;
