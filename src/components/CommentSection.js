import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    commentBox: {
        borderWidth: 1,
        borderColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    userProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
    },
    commentText: {
        fontSize: 16,
        color: 'white',
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    replyContainer: {
        backgroundColor: 'white',
        padding: 10,
        marginBottom: 10,
    },
    replyInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 10,
    },
    replyButton: {
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    replyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

const CommentSection = ({ article }) => {
    const [comments, setComments] = useState([]);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        // Check if article is defined and has the id property
        if (article && article.id) {
            const fetchComments = async () => {
                try {
                    console.log(article.id)
                    const response = await fetch(`http://127.0.0.1:8000/comment/comments/article/${article.id}/`);
                    const data = await response.json();
                    console.log('Comments:', data);
                    setComments(data); // Assuming data is an array of comments
                } catch (error) {
                    console.error('Error fetching comments:', error);
                }
            };

            fetchComments();
        }
    }, [article]);

    const renderComments = (comments) => {
        return comments.map(comment => (
            <View key={comment.id} style={styles.commentBox}>
                <Image
                    source={{ uri: comment.user.profile_picture }}
                    style={styles.userProfileImage}
                />
                <View>
                    <Text style={styles.username}>{comment.user.username}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>

                    {/* Reply button and input */}
                    <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => handleReply(comment.id)}
                    >
                        <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>

                    {renderChildComments(comment.id)}
                </View>
            </View>
        ));
    };

    const handleReply = (parentCommentId) => {
        // Set up logic to handle the reply here
        // You may open a modal or expand the input field for the specific comment
        console.log('Replying to comment:', parentCommentId);
    };

    const renderChildComments = (parentId) => {
        const childComments = comments.filter(comment => comment.parent_comment === parentId);
        return childComments.length > 0 && renderComments(childComments);
    };

    const addComment = async (content, parentCommentId = null) => {
        try {
            if (article && article.id) {
                const response = await fetch(`http://127.0.0.1:8000/comment/comments/${article.id}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content, parent_comment: parentCommentId }),
                });
                const data = await response.json();
                console.log('Added comment:', data);
                // Assuming data is the newly added comment, you can update the state
                setComments(prevComments => [...prevComments, data]);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleAddComment = () => {
        // Add a new top-level comment
        addComment('This is a new comment!');
    
        // Add a nested comment (reply)
        // Specify the parentCommentId if applicable
        // addComment('Reply to the comment', parentCommentId);
    };

    return (
        <View style={styles.container}>
            {/* Reply input box */}
            <View style={styles.replyContainer}>
                <TextInput
                    style={styles.replyInput}
                    placeholder="Type your reply here..."
                    onChangeText={(text) => setReplyText(text)}
                    value={replyText}
                />
            </View>

            {/* Render comments */}
            {renderComments(comments)}
        </View>
    );
};

export default CommentSection;
