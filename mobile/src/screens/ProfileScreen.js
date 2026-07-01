import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';

const tabOptions = ['Posts', 'Comments', 'Saved'];
const displayOptions = [
  { key: 'system', label: 'System default' },
  { key: 'bright', label: 'Bright' },
  { key: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, colors, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Posts');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    await Promise.all([fetchUserPosts(), fetchUserComments(), fetchSavedPosts()]);
  };

  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await apiClient.get(`/posts/author/${user.id}`, {
        params: { page: 1, limit: 20 },
      });
      setPosts(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Fetch user posts error:', error);
      Alert.alert('Error', 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchUserComments = async () => {
    setLoadingComments(true);
    try {
      const response = await apiClient.get(`/comments/user/${user.id}/comments`, {
        params: { page: 1, limit: 20 },
      });
      setComments(response.data?.data || response.data?.comments || []);
    } catch (error) {
      console.error('Fetch user comments error:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchSavedPosts = async () => {
    setLoadingSaved(true);
    try {
      const response = await apiClient.get('/auth/saved-posts');
      setSavedPosts(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Fetch saved posts error:', error);
      setSavedPosts([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const renderCountLabel = (label, count) => (
    <View style={[styles.summaryItem, { backgroundColor: colors.background }]}> 
      <Text style={[styles.summaryCount, { color: colors.foreground }]}>{count}</Text>
      <Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );

  const activeData = activeTab === 'Posts' ? posts : activeTab === 'Comments' ? comments : savedPosts;
  const isLoadingActive = activeTab === 'Posts' ? loadingPosts : activeTab === 'Comments' ? loadingComments : loadingSaved;

  const renderCommentItem = ({ item }) => (
    <View style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <Text style={[styles.commentText, { color: colors.foreground }]}>{item.content}</Text>
      {item.post_title ? <Text style={[styles.commentMeta, { color: colors.muted }]}>in {item.post_title}</Text> : null}
    </View>
  );

  const renderListItem = ({ item }) => {
    if (activeTab === 'Comments') {
      return renderCommentItem({ item });
    }
    if (activeTab === 'Saved') {
      return <PostCard post={item} />;
    }
    return <PostCard post={item} />;
  };

  if (!user) {
    return <Loader />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}> 
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: colors.foreground }]}>{user?.username}</Text>
            <Text style={[styles.email, { color: colors.muted }]}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.destructive }]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryRow, { backgroundColor: colors.background }]}> 
        {renderCountLabel('Posts', posts.length)}
        {renderCountLabel('Comments', comments.length)}
        {renderCountLabel('Saved', savedPosts.length)}
      </View>

      <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        {tabOptions.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && { color: '#ffffff' },
                activeTab !== tab && { color: colors.foreground },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Display</Text>
        <Text style={[styles.sectionDescription, { color: colors.muted }]}>Choose a display mode for the app.</Text>
        <View style={styles.displayOptionsRow}>
          {displayOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.displayOption,
                theme === option.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setTheme(option.key)}
            >
              <Text
                style={[
                  styles.displayOptionText,
                  theme === option.key && { color: '#ffffff' },
                  theme !== option.key && { color: colors.foreground },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingActive && !refreshing ? (
        <Loader />
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderListItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={activeData.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No {activeTab.toLowerCase()} yet.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#21c45d', // green (primary) - will be overridden by colors.primary
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  summaryItem: {
    flex: 1,
    padding: 14,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  displayOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  displayOption: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  displayOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  commentText: {
    fontSize: 15,
    marginBottom: 8,
  },
  commentMeta: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
  },
});