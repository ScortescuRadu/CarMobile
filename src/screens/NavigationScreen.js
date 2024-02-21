import React, { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, View, Text, requireNativeComponent, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevices, getCameraDevice } from 'react-native-vision-camera'

export default function NavigationScreen(){
    const navigation = useNavigation();
    const camera = useRef(null);
    const device = useCameraDevices('external');
    console.log('Available camera devices:', device);

    const [showCamera, setShowCamera] = useState(true);

    useEffect(()=>{
      async function getPermission(){
        const permission = await Camera.requestCameraPermission()
        console.log(`Camera status: ${permission}`)

        const devices = await getAvailableCameraDevices();
        console.log('Available camera devices:m', devices);
 
        if (permission === 'denied') await Linking.openSettings()
      }
      getPermission();
    }, [])

    // const MapView = requireNativeComponent('MapView');
    const TestView = requireNativeComponent('TestView');

    return (
            // <MapView style={{height: '100%', width: '100%'}}/>
            <View>
              {showCamera ? (
                <Camera
                  ref={camera}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={showCamera}
                />
              ) : (
                <View>
                  <Text>Not ready</Text>
                </View>
              )}
              <TestView style={{height: '100%', width: '100%'}}/>
            </View>
    )
}

const styles = StyleSheet.create({
    page: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      height: 300,
      width: 300,
    },
    map: {
      flex: 1
    }
});