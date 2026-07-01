import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import apiClient from '../api/client';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

export default function PostScreen() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const { postId } = route.params;

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      setPost(response.data?.data || response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load post');
      console.error('Fetch post error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <PostCard post={post} showFullContent />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});