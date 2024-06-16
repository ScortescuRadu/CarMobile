// BluetoothContext.js
import React, { createContext, useState, useEffect } from 'react';
import BleManager from 'react-native-ble-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Buffer } from 'buffer';

export const BluetoothContext = createContext();

export const BluetoothProvider = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(null);

  useEffect(() => {
    const loadConnectedDevice = async () => {
      const savedDevice = await AsyncStorage.getItem('connectedDevice');
      if (savedDevice) {
        setConnectedDevice(JSON.parse(savedDevice));
        // Here you can initiate the connection to the saved device if needed
      }
    };
    loadConnectedDevice();
  }, []);

  useEffect(() => {
    const handleUpdateValueForCharacteristic = ({ value }) => {
      const data = Buffer.from(value).toString('utf-8');
      console.log(`Received data: ${data}`);
      setDeviceData(data); // Update device data
    };

    const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic);

    return () => {
      bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic);
    };
  }, []);

  return (
    <BluetoothContext.Provider value={{ connectedDevice, setConnectedDevice, deviceData, setDeviceData }}>
      {children}
    </BluetoothContext.Provider>
  );
};
