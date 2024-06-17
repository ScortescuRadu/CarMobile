import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  Button,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Modal from 'react-native-modal';
import ImagePicker from 'react-native-image-crop-picker';
import SInfo from 'react-native-sensitive-info';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation


const SECTIONS = [
  {
    header: 'Preferences',
    items: [
      { id: 'darkMode', icon: 'moon', label: 'Dark Mode for News', type: 'toggle' },
    ],
  },
  {
    header: 'Help',
    items: [
      { id: 'bug', icon: 'flag', label: 'Report Bug', type: 'link' },
      { id: 'contact', icon: 'mail', label: 'Contact Us', type: 'link' },
    ],
  },
  {
    header: 'Device',
    items: [
      { id: 'sensor', icon: 'save', label: 'Sensor', type: 'link' },
      { id: 'data', icon: 'save', label: 'Data', type: 'link' },
    ],
  },
];

export default function Example() {
  const [form, setForm] = useState({
    language: 'English',
    darkMode: true,
    wifi: false,
  });

  const [username, setUsername] = useState('');
  const [carId, setCarId] = useState('');
  const navigation = useNavigation();

  const [isModalVisible, setModalVisible] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80'
  );

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleModalPress = (e) => {
    // Check if the press originated from inside the modal content
    if (e.target.id === 'modalContainer') {
      // Press originated from inside the modal content, do nothing
      return;
    }

    // Press originated outside the modal content, close the modal
    toggleModal();
  };

  const takePhotoFromCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({
        compressImageMaxWidth: 300,
        compressImageMaxHeight: 300,
        cropping: true,
        compressImageQuality: 0.7
      });
      console.log(image);
      setProfilePicture(image.path);
      toggleModal();

      await sendImageToServer(image.path);
    } catch (error) {
      console.error('Error taking photo from camera:', error);
      Alert.alert('Error', 'Unable to take photo from camera. Please review your settings.');
    }
  }

  const choosePhotoFromLibrary = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        compressImageQuality: 0.7
      });
      console.log(image);
      setProfilePicture(image.path);
      toggleModal();

      await sendImageToServer(image.path);
    } catch (error) {
      console.error('Error choosing photo from library:', error);
      Alert.alert('Error', 'Unable to choose photo from library. Please try again.');
    }
  }

  const sendImageToServer = async (imagePath) => {
    try {
      const formData = new FormData();
      formData.append('cover', {
        uri: imagePath,
        type: 'image/jpeg', // adjust the type based on the image format
        name: 'profile_picture.jpg',
      });

      const token = await SInfo.getItem('authToken', {});

      const response = await fetch('https://frog-happy-uniformly-1.ngrok-free.app/profile-picture/change/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        console.log('Image uploaded successfully');
      } else {
        console.error('Error uploading image to the server:', response.statusText);
        Alert.alert('Error', 'Unable to upload image to the server. Please try again.');
      }
    } catch (error) {
      console.error('Error sending image to the server:', error);
      Alert.alert('Error', 'Unable to send image to the server. Please try again.');
    }
  }

  const fetchProfilePicture = async () => {
    const token = await SInfo.getItem('authToken', {});
  
    fetch('https://frog-happy-uniformly-1.ngrok-free.app/profile-picture/display/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setProfilePicture(`${data.cover}?${new Date().getTime()}`);
        console.log('cover:', data.cover)
      })
      .catch((error) => {
        console.error('Error fetching profile picture:', error);
      });
  };

  const fetchUserProfile = async () => {
      const token = await SInfo.getItem('authToken', {});

      fetch('https://frog-happy-uniformly-1.ngrok-free.app/user-profile/info/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setUsername(data.username);
          setCarId(data.car_id);
          console.log('User Info:', data)
        })
        .catch((error) => {
          console.error('Error fetching profile picture:', error);
        });
  };

  useEffect(() => {
    fetchProfilePicture();
    fetchUserProfile();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: 'black' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.container}>
            <View style={styles.profile}>
              <TouchableOpacity onPress={toggleModal}>
                <Image
                  alt=""
                  source={{
                    uri: profilePicture
                  }}
                  style={styles.profileAvatar} />
                </TouchableOpacity>
              <Text style={styles.profileName}>radusco</Text>

              <Text style={styles.profileEmail}>TM22SCO</Text>
            </View>

            <Modal
              isVisible={isModalVisible}
              animationType="slide"
              onRequestClose={toggleModal}
              style={{ margin: 0 }}
            >
              <TouchableWithoutFeedback onPress={handleModalPress}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent} collapsable={false} key={'modalContent'}>
                    {/* Your buttons here */}
                    <Button title="Take Photo" onPress={takePhotoFromCamera} />
                    <Button title="Choose Photo" onPress={choosePhotoFromLibrary} />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
        </View>

        {SECTIONS.map(({ header, items }) => (
          <View style={styles.section} key={header}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{header}</Text>
            </View>
            <View style={styles.sectionBody}>
              {items.map(({ id, label, icon, type, value }, index) => {
                return (
                  <View
                    key={id}
                    style={[
                      styles.rowWrapper,
                      index === 0 && { borderTopWidth: 0 },
                    ]}>
                    <TouchableOpacity
                      onPress={() => {
                        if (id === 'sensor') {
                          console.log('Navigating to Bluetooth Connection Screen');
                          navigation.navigate('BluetoothConnection');
                        }
                      }}>
                      <View style={styles.row}>
                        <FeatherIcon
                          color="#616161"
                          name={icon}
                          style={styles.rowIcon}
                          size={22} />

                        <Text style={styles.rowLabel}>{label}</Text>

                        <View style={styles.rowSpacer} />

                        {type === 'select' && (
                          <Text style={styles.rowValue}>{form[id]}</Text>
                        )}

                        {type === 'toggle' && (
                          <Switch
                            onChange={val => setForm({ ...form, [id]: val })}
                            value={form[id]}
                          />
                        )}

                        {(type === 'select' || type === 'link') && (
                          <FeatherIcon
                            color="#ababab"
                            name="chevron-right"
                            size={22} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  header: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
  },
  /** Profile */
  profile: {
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#2d302e',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 9999,
  },
  profileName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  profileEmail: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '400',
    color: 'white',
  },
  profileAction: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 12,
  },
  profileActionText: {
    marginRight: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  /** Section */
  section: {
    paddingTop: 12,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  /** Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 24,
    height: 50,
  },
  rowWrapper: {
    paddingLeft: 24,
    backgroundColor: '#2d302e',
    borderTopWidth: 1,
    borderColor: '#2d302e',
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: 'white',
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  rowValue: {
    fontSize: 17,
    color: 'white',
    marginRight: 4,
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});