import React, { useEffect, useState } from 'react';
import { View, Image, Text, TextInput, StyleSheet, ScrollView, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
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

  // Most read section
  topArticleSection: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 12,
    marginTop: 24,
    backgroundColor: '#273552',
  },
  topArticlesTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    margin: 6,
  },
  popularCard: {
    borderRadius: 8,
    overflow: 'hidden',
    margin: 10,
    elevation: 5,
  },
  popularImage: {
    height: 200,
    width: '120%',
  },
  popularOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 10,
  },
  popularTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleNumberContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'white',
    padding: 12,
    borderBottomRightRadius: 5,
    zIndex: 1,
  },
  articleNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
    fontWeight: 'bold',
  },

  // General news
  topicCard: {
    flexDirection: 'row',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 5, // for Android shadow
  },
  topicImage: {
    width: 150,
    height: 100,
  },
  topicContent: {
    flex: 1,
    padding: 16,
  },
  topicTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mainTitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },

  // Green Article
  greenArticleTitle: {
    color: 'black',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: 'yellow'
  },
  greenTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Statistics
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
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

  const availableSpots = 50;
  const partnerParking = 20;
  const numberOfUsers = 100;

  const [loading, setLoading] = useState(true);

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
        setLoading(true); // Set loading to true when fetching starts
    
        const response = await fetch('http://127.0.0.1:8000/article/latest/');
        const data = await response.json();
        console.log(data);
    
        setFirstArticles(data);
      } catch (error) {
        console.error('Error fetching first article:', error);
      } finally {
        setLoading(false); // Set loading to false when fetching is complete
      }
    };

    fetchFirstArticle();
  }, []);

  const handlePress = (id) => {
    const params = {
      // Add any parameters you want to pass to the Welcome screen
      id: id
    };

    navigation.navigate('Article', params);
  };

  const renderArticle = ({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item.id)}>
      <View style={styles.mainCoverContainer}>
        <Image source={{ uri: `http://127.0.0.1:8000/${item.cover}` }} style={styles.roundedImage} />
        <View style={styles.topicContainer}>
          <Text style={styles.topicText}>{item.topic}</Text>
        </View>
        <Text style={styles.titleText}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedTopics.includes(item.name), { backgroundColor: item.color }]}
      onPress={() => handleTopicPress(item)}
    >
      <Text style={styles.topicText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const ArticleCard = ({ article, index }) => {
    return (
      <TouchableOpacity onPress={() => handlePress(article.id)}>
        <View style={styles.popularCard}>
            <View style={styles.articleNumberContainer}>
                <Text style={styles.articleNumberText}>{index + 1}</Text>
            </View>
            <Image source={{ uri: `http://127.0.0.1:8000/${article.cover}` }} style={styles.popularImage} />
            <View style={styles.popularOverlay}>
                <Text style={styles.popularTitle}>{article.title}</Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  const TopicCard = ({ article }) => {
    return (
      <TouchableOpacity onPress={() => handlePress(article.id)}>
        <View style={styles.topicCard}>
            <Image source={{ uri: `http://127.0.0.1:8000/${article.cover}` }} style={styles.topicImage} />
            <View style={styles.topicContent}>
                <Text style={styles.mainTitle}>{article.topic}</Text>
                <Text style={styles.topicTitle}>{article.title}</Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  const StatisticsSection = ({ availableSpots, partnerParking, numberOfUsers }) => {
    return (
      <View style={styles.statisticsContainer}>
        <StatItem label="Available Spots" value={availableSpots} />
        <StatItem label="Parking Lots" value={partnerParking} />
        <StatItem label="Users" value={numberOfUsers} />
      </View>
    );
  };
  
  const StatItem = ({ label, value }) => {
    return (
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    );
  };

  const SkeletonComponent = () => {
  return (
    <View style={styles.skeletonContainer}>
      {/* Placeholder for each skeleton item */}
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
      {/* Add more skeleton items as needed */}
    </View>
  );
};

  return (
    <SafeAreaView style={{ backgroundColor: 'black' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>News</Text>
        </View>
        {loading ? (
        /* Skeleton or Loading Indicator */
        <SkeletonComponent />
        ) : (
          <>
          <FlatList
            data={firstArticles}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderArticle}
            contentContainerStyle={styles.flatListContainer}
          />
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

        <View style={styles.topArticleSection}>
          <Text style={styles.topArticlesTitle}>Top Articles of the Week</Text>
          <FlatList
            data={firstArticles} //.slice(0, 3)
            renderItem={({ item, index }) => <ArticleCard article={item} index={index} />}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.articleListContainer}
          />
        </View>
        <FlatList
          data={firstArticles}
          renderItem={({ item }) => <TopicCard article={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.articleListContainer}
        />
        <ImageBackground
          source={{ uri: 'https://img.freepik.com/premium-photo/watercolor-painting-green-tropical-leaves-seamless-pattern-background_218148-178.jpg' }}
          style={styles.topArticleSection}
        >
          <View style={styles.greenTextContainer}>
            <Text style={styles.greenArticleTitle}>Green News</Text>
          </View>
          <View style={styles.popularCard}>
          <TouchableOpacity onPress={() => handlePress(firstArticles[0].id)}>
              <Image source={{ uri: `http://127.0.0.1:8000/${firstArticles[0].cover}` }} style={styles.popularImage} />
              <View style={styles.popularOverlay}>
                <Text style={styles.popularTitle}>{firstArticles[0].title}</Text>
            </View>
          </TouchableOpacity>
      </View>
        </ImageBackground>
        <FlatList
          data={firstArticles}
          renderItem={({ item }) => <TopicCard article={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.articleListContainer}
        />
        <View>
          {/* Other components */}
          <StatisticsSection
            availableSpots={availableSpots}
            partnerParking={partnerParking}
            numberOfUsers={numberOfUsers}
          />
        </View>
        </>)}
        </ScrollView>
    </SafeAreaView>
    );
}