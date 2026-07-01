import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function CreatePostScreen() {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await apiClient.get('/communities');
      setCommunities(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCommunity || !title.trim()) {
      Alert.alert('Error', 'Please select a community and enter a title');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/posts', {
        community_id: selectedCommunity.id,
        title: title.trim(),
        content: content.trim(),
      });
      Alert.alert('Success', 'Post created successfully');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Community</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.communityList}>
          {communities.map((community) => (
            <TouchableOpacity
              key={community.id}
              style={[
                styles.communityItem,
                selectedCommunity?.id === community.id && styles.communityItemSelected,
              ]}
              onPress={() => setSelectedCommunity(community)}
            >
              <Text style={[
                styles.communityText,
                selectedCommunity?.id === community.id && styles.communityTextSelected,
              ]}>
                c/{community.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Post title"
          value={title}
          onChangeText={setTitle}
          maxLength={300}
        />

        <Text style={styles.label}>Content (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    padding: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  communityList: {
    marginBottom: 20,
  },
  communityItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  communityItemSelected: {
    borderColor: '#21c45d', // green (primary)
    backgroundColor: '#21c45d',
  },
  communityText: {
    fontSize: 14,
    color: '#333',
  },
  communityTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: '#21c45d', // green (primary)
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});