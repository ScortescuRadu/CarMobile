/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppNavigator from './src/components/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomScreen'
import SignUpScreen from './src/screens/SignupScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import SInfo from 'react-native-sensitive-info';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { fetchToken } from '../CarMobile/src/utils/Parsers';
import { Text } from 'react-native-svg';
import CreateUserProfileScreen from './src/screens/CreateUserProfileScreen';
import BluetoothConnectionScreen from './src/screens/BluetoothConnectionScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [initialRouteName, setInitialRouteName] = useState<string>('Welcome');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        const token = await SInfo.getItem('authToken', {});
        const isAuthenticatedValue = token != null;

        setInitialRouteName(isAuthenticatedValue ? 'AppNavigator' : 'Welcome');
        setIsAuthenticated(isAuthenticatedValue);

        console.log('Token:', token);
        console.log('IsAuthenticated:', isAuthenticatedValue);
      } catch (error) {
        console.error('Error fetching token:', error);
        setInitialRouteName('Welcome');
        setIsAuthenticated(false);
        setIsLoading(false);
      } finally {
        // Set loading state to false after fetching the token
        setIsLoading(false);
      }
    };

    determineInitialRoute();
  }, []);

  useEffect(() => {
    console.log('Updated Initial Route:', initialRouteName);
  }, [initialRouteName]);

  // Show loading indicator or splash screen until the authentication check is finished
  if (isLoading) {
    return <View><Text>LOADING</Text></View>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="CreateUserProfile" component={CreateUserProfileScreen} />
        <Stack.Screen name="Article" component={ArticleScreen} />
        <Stack.Screen name="AppNavigator" component={AppNavigator} />
        <Stack.Screen name="BluetoothConnection" component={BluetoothConnectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;