import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { toggleUserFollow, getUserActivities } from '../api/user';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Activity } from '../api/activity/type';
import { getOrganizedActivities, getJoinedActivities } from '../api/activity';
import dayjs from 'dayjs';
import { getUserDetails } from '../api/user';
import { useAppSelector } from '../store';
import type { RootState } from '../store';
import { addFollow, removeFollow, checkFollow } from '../api/follow';
import Toast from 'react-native-toast-message';
import { getUserCounts } from '../api/info';

type NavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

interface UserProfile {
  id: string;
  name: string;
  avatar: any;
  school?: string;
  bio?: string;
  participatedCount: number;
  publishedCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

interface Activity {
  id: string;
  title: string;
  image: any;
  date: string;
  type: 'participated' | 'published';
  status: 'upcoming' | 'ongoing' | 'ended';
}

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: string };
  const currentUserId = useAppSelector((state: RootState) => state.auth.user?._id);
  
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'joined' | 'organized'>('joined');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus>('all');
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCounts, setUserCounts] = useState({
    publishedCount: 0,
    participatedCount: 0,
    followersCount: 0,
    followingCount: 0
  });

  // 添加动画值
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });

  // 判断是否是查看自己的主页
  const isOwnProfile = currentUserId === userId;
console.log(currentUserId);
console.log(userId);

  // 获取用户信息和关注状态
  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const [userRes, followRes] = await Promise.all([
        getUserDetails({ id: userId }),
        checkFollow(userId)
      ]);
      
      if (userRes.code === 0) {
        setUserInfo(userRes.data);
      }
      
      if (followRes.code === 0) {
        setIsFollowing(followRes.data.isFollowing);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      Toast.show({
        type: 'error',
        text1: '获取用户信息失败',
        text2: '请稍后重试',
        position: 'bottom',
        visibilityTime: 2000,
        bottomOffset: 40,
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取用户统计数据
  const fetchUserCounts = async () => {
    try {
      const res = await getUserCounts(userId);
      if (res.code === 0) {
        setUserCounts(res.data);
      }
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
    }
  };

  // 在获取用户信息的同时获取统计数据
  useEffect(() => {
    fetchUserInfo();
    fetchUserCounts();
  }, [userId]);

  // 添加活动获取逻辑
  useEffect(() => {
    fetchActivities();
  }, [activeTab, statusFilter, userId]);

  const fetchActivities = async () => {
    try {
      const params = {
        userId,
        status: statusFilter === 'all' ? undefined : statusFilter as ActivityStatus
      };
      
      const res = activeTab === 'joined' 
        ? await getJoinedActivities(params)
        : await getOrganizedActivities(params);
      
      if (res.code === 0 && res.data?.list) {
        setActivities(res.data.list);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
      setActivities([]);
    }
  };

  // 关注/取消关注处理
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        const res = await removeFollow(userId);
        if (res.code === 0) {
          setIsFollowing(false);
          fetchUserCounts(); // 重新获取最新的统计数据
          Toast.show({
            type: 'success',
            text1: '已取消关注',
            position: 'bottom',
            visibilityTime: 2000,
            bottomOffset: 40,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: '取消关注失败',
            text2: res.message,
            position: 'bottom',
            visibilityTime: 2000,
            bottomOffset: 40,
          });
        }
      } else {
        const res = await addFollow(userId);
        if (res.code === 0) {
          setIsFollowing(true);
          fetchUserCounts(); // 重新获取最新的统计数据
          Toast.show({
            type: 'success',
            text1: '关注成功',
            position: 'bottom',
            visibilityTime: 2000,
            bottomOffset: 40,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: '关注失败',
            text2: res.message,
            position: 'bottom',
            visibilityTime: 2000,
            bottomOffset: 40,
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '网络错误',
        text2: '请稍后重试',
        position: 'bottom',
        visibilityTime: 2000,
        bottomOffset: 40,
      });
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchActivities();
  }, [fetchActivities]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchActivities();
    }
  }, [loading, hasMore, page, fetchActivities]);

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true);
      setError(null);
      // ... 加载用户信息的API调用
    } catch (error) {
      setError('加载用户信息失败');
    } finally {
      setProfileLoading(false);
    }
  };

  // 渲染活动筛选器
  const renderStatusFilters = () => (
    <View style={styles.statusFiltersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFiltersContent}
      >
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '报名中' },
          { key: 'upcoming', label: '即将开始' },
          { key: 'proceed', label: '进行中' },
          { key: 'cancelled', label: '已取消' },
          { key: 'over', label: '已结束' },
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              statusFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter(filter.key as typeof statusFilter)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOwnProfile ? '我的主页' : '用户主页'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <Animated.ScrollView
        style={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.profileHeader}>
          <Image 
            source={userInfo?.avatar ? { uri: userInfo.avatar } : require('../../assets/logo.jpg')} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{userInfo?.username || '未知用户'}</Text>
            {userInfo?.school?.name && (
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{userInfo.school.name}</Text>
              </View>
            )}
            {userInfo?.bio && (
              <Text style={styles.bio}>{userInfo.bio}</Text>
            )}
          </View>
          
          {/* 只有查看他人主页时才显示关注和私信按钮 */}
          {!isOwnProfile && (
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollow}
              >
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}>
                  {isFollowing ? '已关注' : '关注'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => navigation.navigate('Chat', { 
                  targetId: userId,
                  userName: userInfo?.username,
                  userAvatar: userInfo?.avatar,
                })}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userCounts.participatedCount}</Text>
            <Text style={styles.statLabel}>参与活动</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userCounts.publishedCount}</Text>
            <Text style={styles.statLabel}>发布活动</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              if (isOwnProfile) {
                navigation.navigate('FollowList', { 
                  type: 'followers',
                  title: '关注者'
                });
              }
            }}
          >
            <Text style={styles.statNumber}>{userCounts.followersCount}</Text>
            <Text style={styles.statLabel}>关注者</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              if (isOwnProfile) {
                navigation.navigate('FollowList', { 
                  type: 'following',
                  title: '正在关注'
                });
              }
            }}
          >
            <Text style={styles.statNumber}>{userCounts.followingCount}</Text>
            <Text style={styles.statLabel}>正在关注</Text>
          </TouchableOpacity>
        </View>

        {/* 添加活动类型切换和列表 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
            onPress={() => setActiveTab('joined')}
          >
            <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
              参与的活动
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'organized' && styles.activeTab]}
            onPress={() => setActiveTab('organized')}
          >
            <Text style={[styles.tabText, activeTab === 'organized' && styles.activeTabText]}>
              发布的活动
            </Text>
          </TouchableOpacity>
        </View>

        {renderStatusFilters()}

        <ScrollView 
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchActivities} />
          }
        >
          {activities.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={styles.activityCard}
              onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
            >
              <Image 
                source={item.image ? { uri: item.image } : require('../../assets/logo.jpg')} 
                style={styles.activityImage}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.activityInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {dayjs(item.date).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.location.name}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {item.participants_count}人参与
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.ScrollView>

      {profileLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadUserProfile}
          >
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  profileInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#666',
  },
  messageButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  statusFiltersContainer: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  statusFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    paddingRight: 24,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    height: 28,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  activityCard: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  activityContent: {
    padding: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  activityInfo: {
    gap: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UserProfileScreen; 