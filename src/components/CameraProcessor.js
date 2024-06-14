import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevices, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

const PermissionsPage = () => (
  <View style={styles.container}>
    <Text>Waiting for permissions</Text>
  </View>
);

const NoCameraDeviceError = () => (
  <View style={styles.container}>
    <Text>No Camera Device Found</Text>
  </View>
);

const CameraScreen = () => {
    const device = useCameraDevice('back')
    const { hasPermission } = useCameraPermission()
  
    if (!hasPermission) return <PermissionsPage />
    if (device == null) return <NoCameraDeviceError />
    return (
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
    )
};

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
