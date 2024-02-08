import React from 'react'
import SInfo from 'react-native-sensitive-info';

// Retrieve the token from storage
const fetchToken = async () => {
  try {
    const token = await SInfo.getItem('authToken', {});
    // Now you have the token, you can use it as needed
    console.log('Authentication Token:', token);
  } catch (error) {
    console.error('Error fetching token:', error);
  }
};

export { fetchToken };