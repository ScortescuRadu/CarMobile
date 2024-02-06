import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, Paragraph, Button, FlatList, Title } from 'react-native';
import { Card } from 'react-native-paper'; // You might need to install 'react-native-paper'

// Import other necessary modules for React Native.

const styles = {
    container: {
      backgroundColor: '#84a18d',
      color: '#fff',
      minHeight: '10vh', // React Native doesn't use vh, use flex or height
      flex: 1,
    },
    input: {
      padding: 8,
      fontSize: 16,
      borderRadius: 4,
      borderWidth: 1, // React Native uses borderWidth instead of border
      borderColor: 'black',
      width: '50%',
      color: 'black',
    },
    // Add more styles as needed
  };
  

export default function NewsScreen(){
    const [articles, setArticles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch(`http://127.0.0.1:8000/article/featured/?page=${currentPage}`);
            const data = await response.json();
            setArticles(data.results);
            setTotalPages(data.total);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
    
        fetchData();
    }, [currentPage]);
    
    const handleNextPage = () => {
        if (currentPage < totalPages) {
          setCurrentPage(currentPage + 1);
        }
    };
    
    const handlePreviousPage = () => {
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
    };

    const renderItem = ({ item }) => (
      <Card style={{ margin: 10, padding: 10 }}>
        <Card.Cover source={{ uri: item.cover }} />
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph>{item.description}</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => handleReadMore(item.id)}>Read More</Button>
        </Card.Actions>
      </Card>
    );
  
    return (
      <View>
        <Text>News</Text>
      </View>
      // <SafeAreaView className='flex-1' style={{backgroundColor: '#84a18d'}}>
      //     <FlatList
      //       data={articles}
      //       keyExtractor={(item) => item.id.toString()}
      //       renderItem={renderItem}
      //       onEndReached={handleNextPage}
      //       onEndReachedThreshold={0.1}
      //     />
      // </SafeAreaView>
    );
}