import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, View, Text } from 'react-native';

export default function NavigationScreen(){
    const navigation = useNavigation();

    return (
        <View className='bg-white h-full w-full'>
            <Text>MapBox</Text>
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