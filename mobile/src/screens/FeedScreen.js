import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeSort, setActiveSort] = useState('hot');
  const navigation = useNavigation();

  const fetchPosts = async (pageNum = 1, isRefresh = false, sort = activeSort) => {
    try {
      const response = await apiClient.get('/posts', {
        params: { page: pageNum, limit: 20, sort },
      });
      const newPosts = response.data?.data || response.data || [];

      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === 20);
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', 'Failed to load posts');
      console.error('Fetch posts error:', error);
    }
  };

  const loadInitialPosts = async () => {
    setLoading(true);
    await fetchPosts(1, true, activeSort);
    setLoading(false);
  };

  const handleSortChange = async (sort) => {
    setActiveSort(sort);
    setLoading(true);
    await fetchPosts(1, true, sort);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1, true, activeSort);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false, activeSort);
    }
  };

  useEffect(() => {
    loadInitialPosts();
  }, []);

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('Post', { postId: item.id })}
    />
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return <Loader />;
  };

  if (loading && posts.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortContainer}>
        {['hot', 'new', 'top'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[
              styles.sortButton,
              activeSort === sort && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange(sort)}
          >
            <Text style={[
              styles.sortButtonText,
              activeSort === sort && styles.sortButtonTextActive,
            ]}>
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#21c45d', // green (primary)
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#21c45d', // green (primary)
    borderColor: '#21c45d',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});