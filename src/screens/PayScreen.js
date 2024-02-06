import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StripeProvider } from '@stripe/stripe-react-native';
import PaymentScreen from './PaymentScreen';

export default function PayScreen(){
    const navigation = useNavigation();

    return (
      <StripeProvider
            publishableKey='' //{publishableKey}
            merchantIdentifier="merchant.identifier" // required for Apple Pay
            urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
          >
            <PaymentScreen />
        </StripeProvider>
    )
}