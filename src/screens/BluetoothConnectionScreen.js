import React, { useState, useEffect, useContext } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, FlatList, Alert, NativeEventEmitter, NativeModules } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import BleManager from 'react-native-ble-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothContext } from '../components/BluetoothContext';
import { Buffer } from 'buffer';

const BluetoothConnectionScreen = () => {
  const navigation = useNavigation();
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const { connectedDevice, setConnectedDevice } = useContext(BluetoothContext);

  useEffect(() => {
    console.log('Initializing BleManager...');
    BleManager.start({ showAlert: false })
      .then(() => {
        console.log('BleManager initialized successfully.');
      })
      .catch((error) => {
        console.error('Error initializing BleManager:', error);
      });

    const handleDiscoverPeripheral = (peripheral) => {
      console.log('Discovered peripheral:', peripheral);
      setDevices((prevDevices) => {
        if (!prevDevices.find(device => device.id === peripheral.id)) {
          return [...prevDevices, peripheral];
        }
        return prevDevices;
      });
    };

    const handleStopScan = () => {
      console.log('Scan stopped.');
      setScanning(false);
    };

    const handleDisconnectedPeripheral = (data) => {
      console.log('Disconnected from', data.peripheral);
      Alert.alert('Disconnected', `Disconnected from ${data.peripheral}`);
      setConnectedDevice(null);
      setDevices((prevDevices) => prevDevices.filter(device => device.id !== data.peripheral));
    };

    const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral);

    return () => {
      console.log('Removing listeners...');
      bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan);
      bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral);
    };
  }, [setConnectedDevice]);

  const startScan = () => {
    if (!scanning) {
      setDevices([]);
      setScanning(true);
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Scanning started...');
        })
        .catch((error) => {
          console.error('Error starting scan:', error);
          Alert.alert('Error', 'Failed to start scan.');
        });
    }
  };

  const connectToDevice = (device) => {
    BleManager.connect(device.id)
      .then(() => {
        console.log('Connected to', device.id);
        setConnectedDevice(device);
        return AsyncStorage.setItem('connectedDevice', JSON.stringify(device));
      })
      .then(() => {
        Alert.alert('Connected', `Connected to ${device.name || 'Unnamed Device'}`);
        // Discover services and characteristics
        return BleManager.retrieveServices(device.id);
      })
      .then((peripheralInfo) => {
        console.log('Peripheral info:', peripheralInfo);
        const serviceUUID = peripheralInfo.services[0].uuid;
        const characteristicUUID = peripheralInfo.characteristics[0].uuid;
        return BleManager.startNotification(device.id, serviceUUID, characteristicUUID);
      })
      .then(() => {
        console.log('Notification started');
      })
      .catch((error) => {
        console.error('Error connecting to device:', error);
        Alert.alert('Error', 'Failed to connect to device.');
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeftIcon size="20" color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.scanButton} onPress={startScan} disabled={scanning}>
          <Text style={styles.scanButtonText}>Scan Bluetooth Devices</Text>
        </TouchableOpacity>
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => connectToDevice(item)}>
              <View style={styles.deviceContainer}>
                <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 16,
  },
  backButton: {
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
  scanButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    color: 'black',
    fontSize: 16,
  },
  deviceContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceName: {
    color: 'white',
    fontSize: 16,
  },
  deviceId: {
    color: 'white',
    fontSize: 12,
  },
});

export default BluetoothConnectionScreen;
