import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Activity } from '../api/activity/type';
import { getOrganizedActivities, getJoinedActivities } from '../api/activity';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

type NavigationProp = StackNavigationProp<RootStackParamList, 'MyActivities'>;

// 更新状态类型定义
type ActivityStatus = 'pending' | 'upcoming' | 'proceed' | 'cancelled' | 'over';

const PAGE_SIZE = 10;

type TabType = 'published' | 'joined';

export const MyActivitiesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const initialTab = (route.params as any)?.tab || 'published';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setPage(1);
    setActivities([]);
    setLoading(true);
    fetchActivities(1, true);
  }, [activeTab]);

  const fetchActivities = async (pageNum: number, isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingMore(true);
      
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
      };

      const api = activeTab === 'published' ? getOrganizedActivities : getJoinedActivities;
      const res = await api(params);

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
      console.error('获取活动列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchActivities(page + 1);
  };

  // 获取状态显示文本
  const getStatusText = (status: ActivityStatus) => {
    switch (status) {
      case 'pending':
        return '报名中';
      case 'upcoming':
        return '即将开始';
      case 'proceed':
        return '进行中';
      case 'cancelled':
        return '已取消';
      case 'over':
        return '已结束';
      default:
        return '未知状态';
    }
  };

  // 获取状态标签样式
  const getStatusTagStyle = (status: ActivityStatus) => {
    switch (status) {
      case 'pending':
        return styles.statusTagPending;
      case 'upcoming':
        return styles.statusTagUpcoming;
      case 'proceed':
        return styles.statusTagProceed;
      case 'cancelled':
        return styles.statusTagCancelled;
      case 'over':
        return styles.statusTagOver;
      default:
        return {};
    }
  };

  const getFilteredActivities = () => {
    if (!activities) return [];
    
    return activities.filter(activity => {
      if (statusFilter === 'all') return true;
      return activity.status === statusFilter;
    });
  };

  const renderActivityCard = ({ item }: { item: Activity }) => (
    <TouchableOpacity 
      style={styles.activityCard}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
    >
      <Image 
        source={item.image ? { uri: item.image } : require('../../assets/logo.jpg')} 
        style={styles.activityImage}
      />
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[
            styles.statusTag,
            getStatusTagStyle(item.status as ActivityStatus)
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(item.status as ActivityStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{dayjs(item.date).format('YYYY-MM-DD HH:mm')}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>{item.location.name}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.participantsInfo}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.participantsText}>{item.participants_count}人参与</Text>
          </View>
          {activeTab === 'published' && (
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => navigation.navigate('ParticipantManagement', {
                activityId: item.id,
                activityTitle: item.title,
              })}
            >
              <Text style={styles.manageButtonText}>管理报名</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilters = () => (
    <View style={styles.statusFiltersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFiltersContent}
      >
        {[
          { key: 'all', label: '全部' },
          { key: 'notStart', label: '未开始报名' },
          { key: 'pending', label: '报名中' },
          { key: 'upcoming', label: '活动即将开始' },
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的活动</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'published' && styles.activeTab]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.activeTabText]}>
            已发布
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            已参与
          </Text>
        </TouchableOpacity>
      </View>

      {renderStatusFilters()}

      <FlatList
        data={getFilteredActivities()}
        renderItem={renderActivityCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'published' ? 'megaphone-outline' : 'people-outline'} 
                size={48} 
                color="#999" 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'published' ? '暂无发布的活动' : '暂无参与的活动'}
              </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    padding: CARD_MARGIN,
  },
  activityCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusTagPending: {
    backgroundColor: '#FF9800', // 橙色 - 报名中
  },
  statusTagUpcoming: {
    backgroundColor: '#4CAF50', // 绿色 - 即将开始
  },
  statusTagProceed: {
    backgroundColor: '#2196F3', // 蓝色 - 进行中
  },
  statusTagCancelled: {
    backgroundColor: '#FF5252', // 红色 - 已取消
  },
  statusTagOver: {
    backgroundColor: '#9E9E9E', // 灰色 - 已结束
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  manageButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
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
    paddingRight: 24, // 添加右侧padding，避免最后一个按钮太靠右
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    marginRight: 8, // 改用marginRight替代marginHorizontal
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

export default MyActivitiesScreen; 