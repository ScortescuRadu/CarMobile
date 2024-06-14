import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { createResizePlugin } from 'vision-camera-resize-plugin';
import 'react-native-reanimated';

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
  const [hasPermission, setHasPermission] = useState(false);
  
  const { resize } = createResizePlugin();
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const resized = resize(frame, {
      scale: {
        width: 192,
        height: 192
      },
      pixelFormat: 'rgb',
      dataType: 'uint8'
    });

    // Example usage of resized data
    const firstPixel = {
      r: resized[0],
      g: resized[1],
      b: resized[2]
    };

    // console.log('First pixel:', firstPixel);
  }, []);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      console.log(`Camera permission status: ${status}`);
    })();
  }, []);

  if (!hasPermission) return <PermissionsPage />;
  if (!device) return <NoCameraDeviceError />;

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      frameProcessorFps={1}
    />
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
