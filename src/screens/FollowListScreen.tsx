import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getFollowed, getFollowing } from '../api/follow';
import { User } from '../api/auth/type';
import { followData } from '../api/follow/type';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const FollowListScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { type } = route.params as { type: 'followers' | 'following' };
  
  const [users, setUsers] = useState<followData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchUsers = async (pageNum = 1) => {
    try {
      const params = { page: pageNum, limit: 20 };
      const res = type === 'followers' 
        ? await getFollowed(params)
        : await getFollowing(params);
        
      if (res.code === 0) {
        const newUsers = res.data.list || [];
        if (pageNum === 1) {
          setUsers(newUsers);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
        }
        setHasMore(newUsers.length === 20);
      }
    } catch (error) {
      console.error('获取列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [type]);

  const renderItem = ({ item }: { item: followData }) => {
    const user = type === 'following' ? item.following : item.follower;
    if (!user) return null;

    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => navigation.navigate('UserProfile', { userId: user._id })}
      >
        <Image 
          source={user.avatar ? { uri: user.avatar } : require('../../assets/logo.jpg')} 
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user.username}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[
        styles.header, 
        { paddingTop: insets.top }
      ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === 'followers' ? '关注者' : '正在关注'}
          </Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          type === 'followers' 
            ? item.follower?._id || index.toString()
            : item.following?._id || index.toString()
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            setPage(p => p + 1);
            fetchUsers(page + 1);
          }
        }}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {type === 'followers' ? '暂无关注者' : '暂未关注任何人'}
            </Text>
          </View>
        )}
        ListFooterComponent={loading ? (
          <ActivityIndicator style={styles.loading} color="#999" />
        ) : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 44,
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  loading: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});

export default FollowListScreen; 