import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { View, Text } from 'react-native';
import React, { useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckoutScreen from '../components/CheckoutScreen';

export default function PaymentScreen() {

  const { handleURLCallback } = useStripe();

  const handleDeepLink = useCallback(
    async (url: string | null) => {
      if (url) {
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          // This was a Stripe URL - you can return or add extra handling here as you see fit
        } else {
          // This was NOT a Stripe URL – handle as you normally would
        }
      }
    },
    [handleURLCallback]
  );

  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const deepLinkListener = Linking.addEventListener(
      'url',
      (event: { url: string }) => {
        handleDeepLink(event.url);
      }
    );

    return () => deepLinkListener.remove();
  }, [handleDeepLink]);

  // https://stripe.com/docs/libraries/react-native

  return (
    <StripeProvider
        publishableKey="pk_test_51OgVJzLevPehYIouZmmqxgYdBsUpSCEAFopmpN4idvlaZzi4665AuXJRlnpX0p1mGKoP6VkDWLOfSt8OvlAc9Tt400bHgGIYUf"
        urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
        merchantIdentifier="merchant.com.{{YOUR_APP_NAME}}" // required for Apple Pay
      >
          <CheckoutScreen/>
      </StripeProvider>
  );
}
