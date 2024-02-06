import { useStripe } from '@stripe/stripe-react-native';
import React, { useState, useEffect } from 'react';
import { Button, Screen, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckoutScreen() {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const fetchCSRFToken = async () => {
        try {
          const csrfResponse = await fetch('http://127.0.0.1:8000/payment/get-csrf-token/');
          const csrfData = await csrfResponse.json();
          const csrfToken = csrfData.csrf_token;
          return csrfToken;
        } catch (error) {
          console.error('Error fetching CSRF token:', error);
          return null;
        }
    };
  
    const fetchPaymentSheetParams = async () => {
        const csrfToken = await fetchCSRFToken();
        console.log(csrfToken)

        if (!csrfToken) {
          console.error('CSRF token not available.');
          return null;
        }

        const data = {
            price: 0.5, // Replace with the variable or value representing the price
        };
    
        const response = await fetch(`http://127.0.0.1:8000/payment/payment-sheet/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(data),
        });
        const { paymentIntent, ephemeralKey, customer} = await response.json();
    
        return {
            paymentIntent,
            ephemeralKey,
            customer,
        };
    };
  
    const initializePaymentSheet = async () => {
      const {
        paymentIntent,
        ephemeralKey,
        customer,
        publishableKey,
      } = await fetchPaymentSheetParams();
  
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Example, Inc.",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
        //methods that complete payment after a delay, like SEPA Debit and Sofort.
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Jane Doe',
        },
        returnURL: 'your-app://stripe-redirect',
      });
      if (!error) {
        setLoading(true);
      }
    };
  
    useEffect(() => {
      initializePaymentSheet();
    }, []);
  
    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();
    
        if (error) {
          Alert.alert(`Error code: ${error.code}`, error.message);
        } else {
          Alert.alert('Success', 'Your order is confirmed!');
        }
      };

      const handleRefresh = () => {
        setLoading(false); // Reset loading state
        initializePaymentSheet(); // Fetch new payment sheet params
      };

      return (
 
        <SafeAreaView>
            <Button
                variant="primary"
                disabled={!loading}
                title="Checkout"
                onPress={openPaymentSheet}
            />
            <Text>Pay</Text>
            <Button
                title="Refresh"
                onPress={handleRefresh}
            />
        </SafeAreaView>
      );
}
