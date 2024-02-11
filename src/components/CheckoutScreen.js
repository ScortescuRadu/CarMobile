import { useStripe } from '@stripe/stripe-react-native';
import React, { useState, useEffect, Component, Fragment } from 'react';
import { Button, Screen, View, Text, StyleSheet, ScrollView, FlatList, StatusBar, RefreshControl, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SInfo from 'react-native-sensitive-info';
import Icon from 'react-native-vector-icons/FontAwesome'; // You can replace 'FontAwesome' with your preferred icon set

export default function CheckoutScreen() {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [headerData, setHeaderData] = useState({});
    const [listData, setListData] = useState({});
    const [isRefreshing, setIsRefreshing] = useState(false);

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

        const token = await SInfo.getItem('authToken', {});

        const data = {
            price: 0.5, // Replace with the variable or value representing the price
        };

        const response = await fetch(`http://127.0.0.1:8000/payment/payment-sheet/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            'Authorization': `Token ${token}`,
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

    const fetchData = async () => {
      try {
        const token = await SInfo.getItem('authToken', {});
        const response = await fetch('http://127.0.0.1:8000/parking-invoice/unpaid/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error fetching data');
        }

        const data = await response.json();
        console.log(data)
        const firstItem = Array.isArray(data) && data.length > 0 ? data[0] : {};
        setHeaderData(firstItem);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    useEffect(() => {
      initializePaymentSheet();
      fetchData();
      fetchPaidData();
    }, []); // Empty dependency array to run the effect only once
  
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

      const createParkingInvoice = async () => {
        try {
          setLoading(true);

          const token = await SInfo.getItem('authToken', {});

          const data = {
            parking_lot_id: 1,
            hourly_price: 1.0,
            spot_description: 'A 12',
          };
    
          const response = await fetch('http://127.0.0.1:8000/parking-invoice/create/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`,
            },
            body: JSON.stringify(data),
          });
    
          if (response.ok) {
            // ParkingInvoice created successfully
            console.log('ParkingInvoice created successfully');
          } else {
            // Handle error cases
            console.error('Error creating ParkingInvoice:', response.statusText);
          }
        } catch (error) {
          console.error('Error creating ParkingInvoice:', error.message);
        } finally {
          setLoading(false);
        }
      };

      const DATA = [
        {
          id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
          title: 'First Item',
        },
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
          title: 'Second Item',
        },
        {
          id: '58694a0f-3da1-471f-bd96-145571e29d72',
          title: 'Third Item',
        },
      ];

      const calculateRecentDays = (option) => {
        console.log('SWITCH:', option)
        switch (option) {
          case 'This Week':
            return 7;
          case 'Last Month':
            return 31;
          case 'Last Year':
            return 356;
          case 'All':
            return -1;  // Indicate to the server that it should fetch all data
          default:
            return 0;
        }
      };

      const fetchPaidData = async (option) => {
        try {
          const token = await SInfo.getItem('authToken', {});
          console.log('OPTION:', selectedOption)
          const recentDays = calculateRecentDays(selectedOption);
          console.log('RECENT', recentDays)
          const response = await fetch('http://127.0.0.1:8000/parking-invoice/paid/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`,
              'Recent': recentDays,  // Convert to string before passing in headers
            },
          });
    
          if (!response.ok) {
            throw new Error('Error fetching data');
          }
    
          const data = await response.json();
          console.log('Paid');
          console.log(data);
          console.log('that was it')
          setListData(data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      
      const Item = ({ data }) => {
        // Convert the timestamp string to a Date object
        const timestampDate = new Date(data.timestamp);
        
        // Format the date as YYYY-MM-DD
        const formattedDate = timestampDate.toISOString().split('T')[0];
      
        return (
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.title}>{data.final_cost} lei</Text>
              <Text style={styles.subtitle}>
                Time Spent: {data.time_spent} hours
                {'\n'}
                Date: {formattedDate}
                {'\n'}
                Spot: {data.spot_description}
              </Text>
            </View>
          </View>
        );
      };

      const options = ['This Week', 'Last Month', 'This Year', 'All'];
      const [selectedOption, setSelectedOption] = useState('This Week');

      const handleOptionPress = (option) => {
        setSelectedOption(option);
        // Perform actions based on the selected option (e.g., filter data)
        console.log(`Selected Option: ${option}`);
      };

      const renderOption = (option) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, option === selectedOption && styles.selectedOption]}
          onPress={() => handleOptionPress(option)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      );

      const handlePayButtonPress = (title) => {
        // Handle the button press (e.g., initiate payment for the corresponding invoice)
        console.log(`Payment initiated for ${title}`);
      };

      const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
        fetchPaidData();
      };

      const renderReloadButton = () => (
        <TouchableOpacity onPress={onRefresh} style={styles.reloadButton}>
          <Icon name="refresh" size={20} color="black" />
        </TouchableOpacity>
      );

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.headerContainer}>
              {renderReloadButton()}
              <Text style={styles.headerTitle}>TO PAY: {headerData.time_spent * headerData.hourly_price} lei</Text>
              <Text style={styles.headerSubtitle}> </Text>
              <Text style={styles.headerSubtitle}>Section: {headerData.spot_description}</Text>
              <Text style={styles.headerTimestamp}>Hourly Rate: {headerData.hourly_price} lei</Text>
              <TouchableOpacity style={styles.bigGreenButton} onPress={() => openPaymentSheet()}>
                <Text style={styles.bigGreenButtonText}>PAY TICKET</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {options.map((option) => renderOption(option))}
            </View>

            <View style={styles.contentContainer}>
            <FlatList
              data={listData}
              renderItem={({ item }) => <Item data={item} />}
              keyExtractor={(item) => item.timestamp.toString()} // Ensure to convert id to string for keyExtractor
            />
            </View>
        </SafeAreaView>
      );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  item: {
    backgroundColor: 'snow',
    borderRadius: 10,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
  },
  payButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'lightgrey',
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  selectedOption: {
    backgroundColor: '', // Customize the background color when an option is selected
  },
  optionText: {
    fontSize: 16,
  },
  headerContainer: {
    padding: 20,
    paddingHorizontal: 20,
    backgroundColor: 'black',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    padding: '20',
    backgroundColor: 'yellow',
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'white',
  },
  headerTimestamp: {
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
  },
  bigGreenButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bigGreenButtonText: {
    color: 'white',
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'orange',
    paddingBottom: 0,
  },
  reloadButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    zIndex: 1,
  },
  reloadButtonText: {
    color: 'black',
  },
});
