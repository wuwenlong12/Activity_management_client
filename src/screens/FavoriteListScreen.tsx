import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFavoriteList } from '../api/favorite';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Favorite } from '../api/favorite/type';
import { Activity } from '../api/activity/type';

// 配置 dayjs
dayjs.extend(relativeTime);  // 启用相对时间插件
dayjs.locale('zh-cn');      // 使用中文

const PAGE_SIZE = 10;

export const FavoriteListScreen = () => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFavorites = async (pageNum: number, isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingMore(true);
      
      const res = await getFavoriteList({
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (res.code === 0) {
        if (isRefresh) {
          setActivities(res.data.list);
        } else {
          setActivities(prev => [...prev, ...res.data.list]);
        }
        setHasMore(res.data.list.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFavorites(1, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchFavorites(page + 1);
  };

  const renderActivityItem = ({ item }: { item: Favorite }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.activity._id })}
      activeOpacity={0.7}
    >
      <Image
        source={item.activity.image ? { uri: item.activity.image } : require('../../assets/logo.jpg')}
        style={styles.activityImage}
      />
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {item.activity.title}
          </Text>
          <View style={styles.statusTag}>
            <Text style={styles.statusText}>
              {getActivityStatus(item.activity)}
            </Text>
          </View>
        </View>
        
        <View style={styles.activityInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {dayjs(item.activity.startTime).format('MM-DD HH:mm')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.activity.location.name}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.participantsInfo}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {item.activity.participants_count}
              <Text style={styles.limitText}>
                /{item.activity.participantLimit || '不限'}
              </Text>
            </Text>
          </View>
          <Text style={styles.timeAgo}>
            {dayjs(item.createdAt).fromNow()}收藏
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的收藏</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={item => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>暂无收藏的活动</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore && activities.length > 0 ? (
            <View style={styles.footerContainer}>
              <ActivityIndicator size="small" color="#999" />
              <Text style={styles.footerText}>加载更多...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const getActivityStatus = (activity: Activity) => {
  const now = dayjs();
  const start = dayjs(activity.startTime);
  const end = dayjs(activity.endTime);
  
  if (now.isBefore(start)) return '未开始';
  if (now.isAfter(end)) return '已结束';
  return '进行中';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
  },
  listContainer: {
    padding: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  activityInfo: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  limitText: {
    color: '#999',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default FavoriteListScreen; 