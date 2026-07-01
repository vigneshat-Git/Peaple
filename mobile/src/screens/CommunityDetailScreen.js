import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../api/client';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

export default function CommunityScreen() {
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { communityName } = route.params || {};

  useEffect(() => {
    if (communityName) {
      fetchCommunityData();
    }
  }, [communityName]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      // Fetch community info
      const communitiesResponse = await apiClient.get('/communities');
      const communities = communitiesResponse.data?.data || [];
      const foundCommunity = communities.find(c => c.name === communityName);

      if (!foundCommunity) {
        Alert.alert('Error', 'Community not found');
        navigation.goBack();
        return;
      }

      setCommunity(foundCommunity);

      // Fetch posts
      const postsResponse = await apiClient.get(`/communities/${foundCommunity.id}/posts`);
      setPosts(postsResponse.data?.data || []);

      // Check if joined (assuming user communities endpoint)
      try {
        const userCommunitiesResponse = await apiClient.get('/user/communities');
        const userCommunities = userCommunitiesResponse.data?.data || [];
        setIsJoined(userCommunities.some(c => c.id === foundCommunity.id));
      } catch {
        setIsJoined(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load community');
      console.error('Fetch community error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCommunityData();
    setRefreshing(false);
  };

  const handleJoinCommunity = async () => {
    if (!community) return;
    try {
      setJoining(true);
      if (isJoined) {
        await apiClient.delete(`/communities/${community.id}/join`);
        setIsJoined(false);
        Alert.alert('Left community', `Left c/${community.name}`);
      } else {
        await apiClient.post(`/communities/${community.id}/join`);
        setIsJoined(true);
        Alert.alert('Joined community', `Joined c/${community.name}`);
      }
      // Update member count
      setCommunity(prev => prev ? {
        ...prev,
        member_count: isJoined ? prev.member_count - 1 : prev.member_count + 1
      } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to join/leave community');
      console.error('Join/leave error:', error);
    } finally {
      setJoining(false);
    }
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('Post', { postId: item.id })}
    />
  );

  if (loading) {
    return <Loader />;
  }

  if (!community) {
    return (
      <View style={styles.center}>
        <Text>Community not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>c/{community.name}</Text>
          <Text style={styles.communityDescription}>{community.description}</Text>
          <Text style={styles.communityStats}>
            {community.member_count} members • Created {new Date(community.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.joinButton, isJoined && styles.joinedButton]}
          onPress={handleJoinCommunity}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.joinButtonText}>
              {isJoined ? 'Joined' : 'Join'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
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
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  communityStats: {
    fontSize: 12,
    color: '#999',
  },
  joinButton: {
    backgroundColor: '#21c45d', // green (primary)
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinedButton: {
    backgroundColor: '#666',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});