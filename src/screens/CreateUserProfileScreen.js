import { View, Text, TouchableOpacity, Image, TextInput, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native'
import React, { useState } from 'react'
import { themeColors } from '../theme'
import { SafeAreaView } from 'react-native-safe-area-context'
import {ArrowLeftIcon} from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import SInfo from 'react-native-sensitive-info';

// subscribe for more videos like this :)
export default function CreateUserProfileScreen() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [carId, setCarId] = useState('');

    const validateProfile = () => {

        if (!username || !carId) {
          Alert.alert('Incomplete Fields', 'Please fill in all the fields.');
          return false;
        }
      
        return true;
      };

    const handleSignUp = async () => {
        if (!validatePasswords()) {
          return;
        }
    
        try {
          const response = await fetch('http://127.0.0.1:8000/user-profile/create/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username,
              car_id: carId,
            }),
          });
    
          if (!response.ok) {
            Alert.alert('Sign Up Failed', 'Unable to sign up. Please try again.');
            return;
          }
    
          const data = await response.json();
    
          // Assuming the token is returned in the 'token' field of the response
          const token = data.token;
    
          // Store the token securely using react-native-sensitive-info
          await SInfo.setItem('authToken', token, {});
    
          // Navigate to AppNavigator after successful signup
          navigation.navigate('AppNavigator');

        } catch (error) {
          console.error('Sign Up Error:', error);
          Alert.alert('Sign Up Failed', 'An error occurred during sign up. Please try again.');
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1 bg-white" style={{backgroundColor: themeColors.bg}}>
        <SafeAreaView className="flex">
            <View className="flex-row justify-start">
                <TouchableOpacity 
                    onPress={()=> navigation.goBack()}
                    className="bg-yellow-400 p-2 rounded-tr-2xl rounded-bl-2xl ml-4"
                >
                    <ArrowLeftIcon size="20" color="black" />
                </TouchableOpacity>
            </View>
            <View className="flex-row justify-center">
                <Image source={require('../assets/login/signup.png')} 
                    style={{width: 165, height: 110}} />
            </View>
        </SafeAreaView>
        <View className="flex-1 bg-white px-8 pt-8"
            style={{borderTopLeftRadius: 50, borderTopRightRadius: 50}}
        >
            <View className="form space-y-2">
                <Text className="text-gray-700 ml-4">Username</Text>
                <TextInput
                    value={username}
                    onChangeText={(text) => setUsername(text)}
                    className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
                    placeholder='Enter Name'
                />
                <Text className="text-gray-700 ml-4">Car ID</Text>
                <TextInput
                    value={carId}
                    onChangeText={(text) => setCarId(text)}
                    className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
                    placeholder='Enter Name'
                />
                <TouchableOpacity
                    onPress={handleSignUp}
                    className="py-3 bg-yellow-400 rounded-xl"
                >
                    <Text className="font-xl font-bold text-center text-gray-700">
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>
            <View className="flex-row justify-center mt-7">
                <Text className="text-gray-500 font-semibold">Already have an account?</Text>
                <TouchableOpacity onPress={()=> navigation.navigate('Login')}>
                    <Text className="font-semibold text-yellow-500"> Login</Text>
                </TouchableOpacity>
            </View>
        </View>
        </View>
        </TouchableWithoutFeedback>
    )
}