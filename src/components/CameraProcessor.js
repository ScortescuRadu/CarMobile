import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { createResizePlugin } from 'vision-camera-resize-plugin';
import { useTensorflowModel } from 'react-native-fast-tflite';
import 'react-native-reanimated';
import { Worklets } from 'react-native-worklets-core';

const PermissionsPage = () => (
  <View style={styles.container}>
    <Text></Text>
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
  const [detections, setDetections] = useState([]);
  const objectDetection = useTensorflowModel(require('../assets/model/best_float32.tflite'));
  const model = objectDetection.state === "loaded" ? objectDetection.model : undefined;

  const { resize } = createResizePlugin();

  const processDetections = (boxes, classes, scores, numDetections) => {
    const detections = [];
    for (let i = 0; i < numDetections[0]; i++) {
      if (scores[i] > 0.7) {
        detections.push({
          box: {
            left: boxes[i * 4],
            top: boxes[i * 4 + 1],
            right: boxes[i * 4 + 2],
            bottom: boxes[i * 4 + 3],
          },
          class: classes[i],
          score: scores[i],
        });
      }
    }
    // console.log(detections)
    setDetections(detections);
  };

  const myFunctionJS = Worklets.createRunInJsFn(processDetections);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (model == null) return;

    const resized = resize(frame, {
      scale: {
        width: 640,  // 300
        height: 640 // 300
      },
      pixelFormat: 'rgb',
      dataType: 'float32'  // uint8
    });

    const outputs = model.runSync([resized]);

    const detection_boxes = outputs[0];
    const detection_classes = outputs[1];
    const detection_scores = outputs[2];
    const num_detections = outputs[3];

    myFunctionJS(detection_boxes, detection_classes, detection_scores, num_detections);
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
    <>
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={1}
      />
      <View style={styles.detectionsContainer}>
         {detections.map((detection, index) => (
          <Text key={index} style={styles.detectionText}>
            Detected object at [{detection.box.left.toFixed(2)}, {detection.box.top.toFixed(2)}, {detection.box.right.toFixed(2)}, {detection.box.bottom.toFixed(2)}] with confidence {detection.score.toFixed(2)}
          </Text>
        ))}
      </View>
      </>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  detectionsContainer: {
    position: 'absolute',
    top: 80,
    right: 10,
    backgroundColor: '#29f033',
    padding: 10,
    borderRadius: 5,
  },
  detectionText: {
    color: 'black',
    fontSize: 14,
    marginVertical: 2,
  },
});
