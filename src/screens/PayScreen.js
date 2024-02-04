import { View, Text } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function PayScreen(){
    const navigation = useNavigation();

    return (
        <View className='bg-white h-full w-full'>
            <Text>Pay</Text>
        </View>
    )
}