import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PaperProvider, Snackbar, Dialog, Portal } from 'react-native-paper';

const CommentsSection = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const accessToken = await AsyncStorage.getItem('access_token');
      if (accessToken) {
        setIsLoggedIn(true);
      }
    };

    const fetchComments = async () => {
      try {
        const payload = {
          access_token: await AsyncStorage.getItem('access_token'),
        };
        const response = await fetch(`http://127.0.0.1:8000/comment/article/${articleId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          const commentsWithReplies = data.reduce((acc, comment) => {
            if (comment.parent_comment) {
              const parentIndex = acc.findIndex(c => c.id === comment.parent_comment);
              if (parentIndex !== -1) {
                acc[parentIndex].replies = acc[parentIndex].replies || [];
                acc[parentIndex].replies.push({
                  ...comment,
                  liked: comment.is_liked,
                  disliked: comment.is_disliked,
                });
              }
            } else {
              acc.push({
                ...comment,
                liked: comment.is_liked,
                disliked: comment.is_disliked,
                replies: [],
              });
            }
            return acc;
          }, []);
          setComments(commentsWithReplies);
        } else {
          setComments([]);
        }
      } catch (error) {
        setComments([]);
      }
    };

    checkLoginStatus();
    fetchComments();
  }, [route.params?.id, articleId]);

  const handleSnackbarClose = () => {
    setSnackbarVisible(false);
  };

  const LoginPromptModal = ({ visible, onClose, onSignIn }) => (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        <Dialog.Title>You need to be logged in</Dialog.Title>
        <Dialog.Content>
          <Text>You must sign in to perform this action. Would you like to go to the sign-in page?</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button title="Cancel" onPress={onClose} />
          <Button title="Sign In" onPress={onSignIn} />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const toggleLike = async (commentId, isLiked, isReply, parentId) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const url = `http://127.0.0.1:8000/comment/${commentId}/like/`;
    const method = isLiked ? 'DELETE' : 'POST';
    const payload = {
      access_token: await AsyncStorage.getItem('access_token'),
    };
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === (isReply ? parentId : commentId)) {
            if (isReply && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply.id === commentId) {
                    return {
                      ...reply,
                      liked: method === 'POST',
                      dislikes: method === 'POST' && reply.disliked ? reply.dislikes - 1 : reply.dislikes,
                      likes: method === 'POST' ? reply.likes + 1 : reply.likes - 1,
                      disliked: method === 'POST' ? false : reply.disliked,
                    };
                  }
                  return reply;
                }),
              };
            }
            return {
              ...comment,
              liked: method === 'POST',
              dislikes: method === 'POST' && comment.disliked ? comment.dislikes - 1 : comment.dislikes,
              likes: method === 'POST' ? comment.likes + 1 : comment.likes - 1,
              disliked: method === 'POST' ? false : comment.disliked,
            };
          }
          return comment;
        }),
      );
    } catch (error) {
      setSnackbarMessage(`Failed to post like: ${error.message}`);
      setSnackbarVisible(true);
    }
  };

  const toggleDislike = async (commentId, isDisliked, isReply, parentId) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const url = `http://127.0.0.1:8000/comment/${commentId}/dislike/`;
    const method = isDisliked ? 'DELETE' : 'POST';
    const payload = {
      access_token: await AsyncStorage.getItem('access_token'),
    };
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle dislike');
      }

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === (isReply ? parentId : commentId)) {
            if (isReply && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply.id === commentId) {
                    return {
                      ...reply,
                      disliked: method === 'POST',
                      likes: method === 'POST' && reply.liked ? reply.likes - 1 : reply.likes,
                      dislikes: method === 'POST' ? reply.dislikes + 1 : reply.dislikes - 1,
                      liked: method === 'POST' ? false : reply.liked,
                    };
                  }
                  return reply;
                }),
              };
            }
            return {
              ...comment,
              disliked: method === 'POST',
              likes: method === 'POST' && comment.liked ? comment.likes - 1 : comment.likes,
              dislikes: method === 'POST' ? comment.dislikes + 1 : comment.dislikes - 1,
              liked: method === 'POST' ? false : comment.liked,
            };
          }
          return comment;
        }),
      );
    } catch (error) {
      setSnackbarMessage(`Failed to post dislike: ${error.message}`);
      setSnackbarVisible(true);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) {
      setSnackbarMessage('Cannot post empty comment.');
      setSnackbarVisible(true);
      return;
    }

    const commentData = {
      content: newComment,
      article: articleId,
      user: 'CurrentUser',
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
    };

    setComments(prevComments => [...prevComments, commentData]); // Optimistic update
    setNewComment('');
    try {
      const response = await fetch('http://127.0.0.1:8000/comment/publish/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      setSnackbarMessage('Failed to post comment.');
      setSnackbarVisible(true);
      setComments(prevComments => prevComments.slice(0, -1)); // Revert optimistic update on failure
    }
  };

  const toggleReplyInput = index => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const updatedComments = comments.map((comment, idx) =>
      idx === index ? { ...comment, showReply: !comment.showReply } : comment,
    );
    setComments(updatedComments);
  };

  const handleReplyChange = (text, index) => {
    const updatedComments = comments.map((comment, idx) =>
      idx === index ? { ...comment, replyText: text } : comment,
    );
    setComments(updatedComments);
  };

  const postReply = async (parentIndex, index) => {
    const replyText = comments[parentIndex].replyText;

    if (!replyText.trim()) {
      setSnackbarMessage('Reply cannot be empty.');
      setSnackbarVisible(true);
      return;
    }

    const newReply = {
      access_token: await AsyncStorage.getItem('access_token'),
      article_id: articleId,
      content: replyText,
      parent_comment: comments[parentIndex].id,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
    };

    const updatedComments = comments.map((comment, idx) => {
      if (idx === parentIndex) {
        return {
          ...comment,
          replies: [...comment.replies, newReply],
          replyText: '',
        };
      }
      return comment;
    });
    setComments(updatedComments);

    try {
      const response = await fetch('http://127.0.0.1:8000/comment/publish/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReply),
      });
      if (!response.ok) {
        throw new Error('Failed to post reply');
      }
    } catch (error) {
      setSnackbarMessage(`Failed to post reply: ${error.message}`);
      setSnackbarVisible(true);
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Comments</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Write a comment"
          value={newComment}
          onChangeText={setNewComment}
        />
        <View style={styles.postButtonContainer}>
            <TouchableOpacity style={styles.postButton} onPress={postComment}>
            <Text style={styles.postButtonText}>Post Comment</Text>
            </TouchableOpacity>
        </View>
        <FlatList
          data={comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.comment}>
              <Text style={styles.commentUser}>{item.user} - {new Date(item.timestamp).toLocaleString()}</Text>
              <Text style={styles.commentContent}>{item.content}</Text>
              <View style={styles.commentActions}>
                <TouchableOpacity onPress={() => toggleLike(item.id, item.liked, false)}>
                  <Icon
                    name="thumb-up" size={20} color={item.liked ? 'blue' : 'gray'} style={styles.iconSpacing}/>
                </TouchableOpacity>
                <Text style={styles.iconSpacing}>{item.likes}</Text>
                <TouchableOpacity onPress={() => toggleDislike(item.id, item.disliked, false)}>
                  <Icon name="thumb-down" size={20} color={item.disliked ? 'red' : 'gray'} style={styles.iconSpacing}/>
                </TouchableOpacity>
                <Text style={styles.iconSpacing}>{item.dislikes}</Text>
                <TouchableOpacity onPress={() => toggleReplyInput(index)}>
                  <Icon name="reply" size={20} color="gray" style={styles.iconSpacing}/>
                </TouchableOpacity>
              </View>
              {item.showReply && (
                <>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write a reply"
                    value={item.replyText}
                    onChangeText={text => handleReplyChange(text, index)}
                  />
                  <Button title="Post Reply" onPress={() => postReply(index)} />
                </>
              )}
              {item.replies.map((reply, replyIdx) => (
                <View key={replyIdx} style={styles.reply}>
                  <Text>{reply.user} - {new Date(reply.timestamp).toLocaleString()}</Text>
                  <Text>{reply.content}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity onPress={() => toggleLike(reply.id, reply.liked, true, item.id)}>
                      <Icon name="thumb-up" size={20} color={reply.liked ? 'blue' : 'gray'} />
                    </TouchableOpacity>
                    <Text style={styles.iconSpacing}>{reply.likes}</Text>
                    <TouchableOpacity onPress={() => toggleDislike(reply.id, reply.disliked, true, item.id)}>
                      <Icon name="thumb-down" size={20} color={reply.disliked ? 'red' : 'gray'} />
                    </TouchableOpacity>
                    <Text style={styles.iconSpacing}>{reply.dislikes}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        />
        <Snackbar
          visible={snackbarVisible}
          onDismiss={handleSnackbarClose}
          duration={6000}
          action={{
            label: 'Dismiss',
            onPress: handleSnackbarClose,
          }}>
          {snackbarMessage}
        </Snackbar>
        <LoginPromptModal
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          onSignIn={() => {
            setShowLoginPrompt(false);
            navigation.navigate('SignIn');
          }}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: 'white'
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'white',
    color: 'white',
    padding: 10,
    marginBottom: 20,
  },
  comment: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 10,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentContent: {
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 10,
  },
  reply: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 5,
    marginLeft: 20,
  },
  iconSpacing: {
    marginRight: 10,
  },
  postButtonContainer: {
    alignItems: 'center',
    marginVertical: 1,
  },
  postButton: {
    backgroundColor: '#fad337',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 70,
    alignItems: 'center',
    marginVertical: 5,
    shadowColor: 'white',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CommentsSection;
