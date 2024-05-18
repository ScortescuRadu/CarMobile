import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {ArrowLeftIcon} from 'react-native-heroicons/solid'
import { Card } from '@rneui/themed';
import CommentSection from '../components/CommentSection';
import SkeletonPlaceholder from "react-native-skeleton-placeholder";

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    navigatorContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    scrollContainer: {
        paddingVertical: 24,
        backgroundColor: 'black',
    },

    // Cover
    coverContainer: {
        backgroundColor: '#84a18d',
        color: '#fff',
        padding: 30,
        borderColor: 'black',
        borderWidth: 3,
      },
    coverCard: {
        alignSelf: 'center',
        position: 'relative',
        borderColor: 'black',
        borderWidth: 3,
      },
    coverImage: {
        width: '100%',
        height: 200,
        marginBottom: 20,
        borderRadius: 8,
      },
    coverContentContainer: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
      },
    coverTitle: {
        marginBottom: 15,
        fontWeight: 'bold',
        fontSize: 20,
      },
    coverTimestamp: {
        marginBottom: 15,
        fontWeight: 'bold',
        fontSize: 12,
      },
    
    // Description
    descriptionContainer: {
        backgroundColor: 'white',
        color: 'black',
        padding: 30,
        borderWidth: 3,
        borderColor: 'black',
    },
    descriptionText: {
        marginBottom: 15,
        color: 'black',
    },

    // Section1
    section1CoverContainer: {
        backgroundColor: 'yellow',
        color: '#fff',
        height: 320,
        borderWidth: 3,
        borderColor: 'black',
      },
    section1CoverCard: {
        width: 150,
        height: 100,
        alignSelf: 'center',
        position: 'relative',
        borderColor: 'black',
        borderWidth: 3,
      },
      section1Subtitle: {
        marginBottom: 15,
        fontWeight: 'bold',
        textAlign: 'center',
      },

      // Description1
      description1Container: {
        backgroundColor: 'snow',
        color: 'black',
        padding: 30,
        borderWidth: 3,
        borderColor: 'black',
      },
      description1Paragraph: {
        maxWidth: 1200,
        marginBottom: 15,
      },

      // Cover2
      section2CoverContainer: {
        backgroundColor: 'purple',
        color: '#fff',
        height: 320,
        borderWidth: 3,
        borderColor: 'black',
      },
      section2CoverCard: {
        backgroundColor: 'purple',
        width: 150,
        height: 100,
        alignSelf: 'center',
        position: 'relative',
        borderColor: 'black',
        borderWidth: 3,
      },
      cover2Title: {
        color: 'black',
        marginBottom: 15,
        fontWeight: 'bold',
      },

      // Description2
      description2Container: {
        backgroundColor: 'white',
        color: 'white',
        padding: 30,
        borderWidth: 3,
        borderColor: 'black',
      },
      description2Text: {
        marginBottom: 15,
      },
  });

const ArticleScreen = () => {
  const navigation = useNavigation();
  const [article, setArticle] = useState(null);
  const route = useRoute();
  const { id } = route.params;

  useEffect(() => {
    const fetchArticleDetails = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/article/read/?id=${id}`);
            const data = await response.json();
            // console.log('Fetched article data:', data);
      
            if (data && data.hasOwnProperty('title') && data.hasOwnProperty('timestamp')) {
              setArticle(data);
            } else {
              console.error('Invalid article data:', data);
            }
          } catch (error) {
            console.error('Error fetching article details:', error);
          }
    };

    fetchArticleDetails();
  }, [id]); 

  if (!article) {
    return (
      <View style={{ marginTop: 80, flex: 1 }}>
        <SafeAreaView  className="flex">
            <View className="flex-row justify-start">
            <TouchableOpacity onPress={()=> navigation.goBack()} 
            className="bg-yellow-400 p-2 rounded-tr-2xl rounded-bl-2xl ml-4">
                <ArrowLeftIcon size="20" color="black" />
            </TouchableOpacity>
            </View>        
        </SafeAreaView>
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item flexDirection="column" alignItems="center" >
            <SkeletonPlaceholder.Item width={300} height={200} borderRadius={10} />
            <SkeletonPlaceholder.Item
              marginTop={6}
              width={120}
              height={20}
              borderRadius={4}
            />
            <SkeletonPlaceholder.Item
              marginTop={6}
              width={240}
              height={20}
              borderRadius={4}
            />
            <SkeletonPlaceholder.Item
              marginTop={20}
              width="90%"
              height={100}
              borderRadius={4}
            />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </View>
    );
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB'); // Format as "day/month/year"
  };

  return (
    <View className="flex-1 bg-white">
        <SafeAreaView  className="flex">
            <View className="flex-row justify-start">
            <TouchableOpacity onPress={()=> navigation.goBack()} 
            className="bg-yellow-400 p-2 rounded-tr-2xl rounded-bl-2xl ml-4">
                <ArrowLeftIcon size="20" color="black" />
            </TouchableOpacity>
            </View>        
        </SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.coverContainer}>
                <Card elevation={10} style={styles.coverCard}>
                    <Image
                        source={{ uri: `http://127.0.0.1:8000${article.cover}` }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                    <View style={styles.coverContentContainer}>
                    <Text style={styles.coverTitle}>{article.title}</Text>
                    <Text style={styles.coverTimestamp}>{formatDate(article.timestamp)}</Text>
                    </View>
                </Card>
            </View>
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText} numberOfLines={2}>
                    {article.description}
                </Text>
            </View>
            {article.cover_section_1 && (
                <View style={styles.section1CoverContainer}>
                    <Card elevation={10} style={styles.section1CoverCard}>
                        <Image
                            source={{ uri: `http://127.0.0.1:8000${article.cover_section_1}` }}
                            style={styles.coverImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.section1Subtitle}>{article.subtitle_1}</Text>
                    </Card>
                </View>
            )}
            {article.description_1 && (
                <View style={styles.description1Container}>
                    {article.description_1 && (
                        <Text style={styles.description1Paragraph}>{article.description_1}</Text>
                    )}
                </View>
            )}
            {article.cover_section_2 && (
                <View style={styles.section2CoverContainer}>
                    <Card elevation={10} style={styles.section2CoverCard}>
                        <Image
                            source={{ uri: `http://127.0.0.1:8000${article.cover_section_2}` }}
                            style={styles.coverImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.section1Subtitle}>{article.subtitle_2}</Text>
                    </Card>
                </View>
            )}
            {article.description_2 && (
                <View style={styles.description2Container}>
                    <Text style={[styles.description2Text, { fontSize: 16 }]}>{article.description_2}</Text>
                </View>
            )}
            <CommentSection articleId={article.id}/>
        </ScrollView>
    </View>
  );
};

export default ArticleScreen;
