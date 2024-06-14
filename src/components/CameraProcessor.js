import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { createResizePlugin } from 'vision-camera-resize-plugin';
import { useTensorflowModel } from 'react-native-fast-tflite';
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
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const objectDetection = useTensorflowModel(require('../assets/model/1.tflite'));
  const model = objectDetection.state === "loaded" ? objectDetection.model : undefined;

  const { resize } = createResizePlugin();

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model == null) return;

    // Resize the frame to 300x300 to match the model's expected input size
    const resized = resize(frame, {
      scale: {
        width: 300,
        height: 300
      },
      pixelFormat: 'rgb',
      dataType: 'uint8'
    });

    // Run the model with the resized input buffer
    const outputs = model.runSync([resized]);

    // Interpret outputs accordingly
    const detection_boxes = outputs[0];
    const detection_classes = outputs[1];
    const detection_scores = outputs[2];
    const num_detections = outputs[3];
    console.log(`Detected ${num_detections[0]} objects!`);

    for (let i = 0; i < detection_boxes.length; i += 4) {
      const confidence = detection_scores[i / 4];
      if (confidence > 0.7) {
        // Log the detected object details
        const left = detection_boxes[i];
        const top = detection_boxes[i + 1];
        const right = detection_boxes[i + 2];
        const bottom = detection_boxes[i + 3];
        console.log(`Detected object at [${left}, ${top}, ${right}, ${bottom}] with confidence ${confidence}`);
      }
    }
  }, [model]);

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
