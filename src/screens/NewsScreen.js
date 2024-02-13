import React, { useEffect, useState } from 'react';
import { View, Image, Text, TextInput, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SearchBar } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import other necessary modules for React Native.

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: 'black',
  },
  filtersContainer: {
    paddingVertical: 0,
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
  mainCoverContainer: {
    position: 'relative',
    width: 350,
    height: 350,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 10,
  },
  roundedImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
  },
  topContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  searchBarInputContainer: {
    backgroundColor: '#EDEDED',
  },
  topicContainer: {
    position: 'absolute',
    backgroundColor: 'yellow',
    padding: 10,
  },
  topicText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  flatListContainer: {
    marginBottom: 20,
  },
  articleContainer: {
    width: '94%',
    marginRight: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 5,
    marginLeft: 5,
  },
  filterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  articleListContainer: {
    padding: 16,
  },
});

export default function NewsScreen(){
  const navigation = useNavigation();
  const [firstArticles, setFirstArticles] = useState(null);
  const [searchText, setSearchText] = useState('');
  const topics = [
    { name: 'Sports', color: 'red' },
    { name: 'Announcements', color: 'green' },
    { name: 'Emergency', color: 'blue' },
    { name: 'City', color: 'purple' },
  ];
  const [selectedTopics, setSelectedTopics] = useState([]);

  const handleTopicPress = (topic) => {
      setSelectedTopics((prevSelectedTopics) => {
        if (prevSelectedTopics.includes(topic)) {
          // Deselect the topic
          return prevSelectedTopics.filter((selectedTopic) => selectedTopic !== topic);
        } else {
          // Select the topic
          return [...prevSelectedTopics, topic];
        }
      });
  };

  useEffect(() => {
    // Fetch the first article data here (replace with your actual fetch logic)
    const fetchFirstArticle = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/article/latest/');
        const data = await response.json();
        console.log(data)

        // Assuming the response is an array of articles and you want the first one
        setFirstArticles(data);

      } catch (error) {
        console.error('Error fetching first article:', error);
      }
    };

    fetchFirstArticle();
  }, []);

  const renderArticle = ({ item }) => (
    <View style={styles.mainCoverContainer}>
      <Image source={{ uri: `http://127.0.0.1:8000/${item.cover}` }} style={styles.roundedImage} />
      <View style={styles.topicContainer}>
        <Text style={styles.topicText}>{item.topic}</Text>
      </View>
      <Text style={styles.titleText}>{item.title}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedTopics.includes(item.name), { backgroundColor: item.color }]}
      onPress={() => handleTopicPress(item)}
    >
      <Text style={styles.topicText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const ArticleCard = ({ article }) => {
    return (
      <View style={styles.articleCardContainer}>
        <Image source={{ uri: article.cover }} style={styles.articleCoverImage} />
        <View style={styles.articleCardContent}>
          <Text style={styles.articleTitle}>{article.title}</Text>
          <Text style={styles.articleTopic}>{article.topic}</Text>
          <Text style={styles.articleDescription}>{article.description}...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ backgroundColor: 'black' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>News</Text>
        </View>
        {firstArticles &&
          <FlatList
            data={firstArticles}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderArticle}
            contentContainerStyle={styles.flatListContainer}
          />
        }
        <SearchBar
          placeholder="Search..."
          onChangeText={(text) => setSearchText(text)}
          value={searchText}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInputContainer}
        />
        <FlatList
          horizontal
          data={topics}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.filtersContainer}
        />
        <FlatList
          data={firstArticles}
          renderItem={({ item }) => <ArticleCard article={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.articleListContainer}
        />
        </ScrollView>
    </SafeAreaView>
    );
}