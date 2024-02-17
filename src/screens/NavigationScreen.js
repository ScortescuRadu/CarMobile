import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, View, Text, requireNativeComponent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NavigationScreen(){
    const navigation = useNavigation();

    const MapView = requireNativeComponent('MapView');
    const TestView = requireNativeComponent('TestView');

    return (
            // <MapView style={{height: '100%', width: '100%'}}/>
            <View>
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