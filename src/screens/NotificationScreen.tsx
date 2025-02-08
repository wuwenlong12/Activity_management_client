import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { getNotificationList, readNotification, readAllNotifications } from '../api/notification';

interface Notification {
  _id: string;
  title: string;
  content: string;
  type: 'system' | 'activity' | 'comment';
  isRead: boolean;
  createdAt: string;
  navigator?: {
    path: string;
    query?: Record<string, unknown>;
  };
}

const PAGE_SIZE = 10;

type TabType = 'all' | 'unread' | 'read';

export const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [contentLoading, setContentLoading] = useState(false);

  const fetchNotifications = async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) {
        setContentLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params: GetNotificationListParams = {
        page: pageNum,
        limit: PAGE_SIZE,
        ...(activeTab !== 'all' ? { status: activeTab } : {}),
      };

      const res = await getNotificationList(params);

      if (res.code === 0) {
        if (isRefresh) {
          setNotifications(res.data.list);
        } else {
          setNotifications(prev => [...prev, ...res.data.list]);
        }
        setHasMore(res.data.list.length === PAGE_SIZE);
        setPage(pageNum);
      } else {
        Alert.alert('错误', res.message || '获取消息失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    } finally {
      setContentLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setNotifications([]);
    setContentLoading(true);
    fetchNotifications(1, true);
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchNotifications(page + 1);
  };

  const handleReadAll = async () => {
    try {
      const res = await readAllNotifications();
      if (res.code === 0) {
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          isRead: true
        })));
        Alert.alert('成功', '已将全部消息标记为已读');
      }
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await readNotification(notification._id);
        setNotifications(prev => prev.map(item => 
          item._id === notification._id ? { ...item, isRead: true } : item
        ));
      }

      if (notification.navigator) {
        navigation.navigate(notification.navigator.path as never, notification.navigator.query as never);
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return 'information-circle';
      case 'activity':
        return 'calendar';
      case 'comment':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#999" />
        <Text style={styles.footerText}>加载更多...</Text>
      </View>
    );
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setContentLoading(true);
    fetchNotifications(1, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息通知</Text>
        <TouchableOpacity
          style={styles.readAllButton}
          onPress={handleReadAll}
        >
          <Text style={styles.readAllText}>全部已读</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          {[
            { key: 'all', label: '全部' },
            { key: 'unread', label: '未读' },
            { key: 'read', label: '已读' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => handleTabChange(tab.key as TabType)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationItem}
            onPress={() => handleNotificationPress(item)}
          >
            <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) }]}>
              <Ionicons name={getNotificationIcon(item.type)} size={20} color="#fff" />
            </View>
            <View style={styles.contentContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
              <Text style={styles.time}>{dayjs(item.createdAt).format('MM-DD HH:mm')}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          contentLoading ? (
            <ActivityIndicator style={styles.loading} color="#666" />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>暂无消息通知</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'system':
      return '#007AFF';
    case 'activity':
      return '#34C759';
    case 'comment':
      return '#FF9500';
    default:
      return '#8E8E93';
  }
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
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  readAllText: {
    fontSize: 15,
    color: '#007AFF',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 2,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  loading: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
}); 