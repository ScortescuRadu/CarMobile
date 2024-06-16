// RootApp.js
import React from 'react';
import { BluetoothProvider } from './src/components/BluetoothContext'; // Ensure the path is correct
import App from './App'; // Assuming the App component is in the same directory

const RootApp = () => {
  return (
    <BluetoothProvider>
      <App />
    </BluetoothProvider>
  );
};

export default RootApp;
