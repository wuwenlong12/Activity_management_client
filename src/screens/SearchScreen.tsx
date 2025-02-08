import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Activity } from '../api/activity/type';
import { getActivities } from '../api/activity';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const searchActivities = async (text: string, pageNum: number, isRefresh = false) => {
    if (!text.trim()) {
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      const res = await getActivities({
        search: text,
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (res.code === 0) {
        if (isRefresh) {
          setActivities(res.data.list);
        } else {
          setActivities(prev => [...prev, ...res.data.list]);
        }
        setTotal(res.data.total);
        setHasMore(res.data.list.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 使用 debounce 防止频繁请求
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      searchActivities(text, 1, true);
    }, 500),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      searchActivities(searchText, page + 1);
    }
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <>
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
      >
        <Image 
          source={{ uri: item.image }} 
          style={styles.activityImage}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.organizerRow}>
            <Image 
              source={item.organizer.avatar ? { uri: item.organizer.avatar } : require('../../assets/logo.jpg')} 
              style={styles.organizerAvatar}
            />
            <Text style={styles.organizerName}>{item.organizer.name}</Text>
            {item.organizer.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#007AFF" />
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>
                报名：{dayjs(item.signUpStartTime).format('MM-DD HH:mm')} ~ {dayjs(item.signUpEndTime).format('MM-DD HH:mm')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>{item.location.name}</Text>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 2).map((tag) => (
                  <View key={tag._id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.participantsInfo}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.participantsText}>{item.participants_count}人参与</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.separator} />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索活动"
            value={searchText}
            onChangeText={handleSearchChange}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => searchActivities(searchText, 1, true)}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setActivities([]);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        key="single-column"
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>
              {searchText ? '未找到相关活动' : '输入关键词开始搜索'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#007AFF" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const STATUS_MAP = {
  pending: { text: '报名中', bgColor: '#4CAF50' },
  upcoming: { text: '即将开始', bgColor: '#FF9800' },
  proceed: { text: '进行中', bgColor: '#2196F3' },
  cancelled: { text: '已取消', bgColor: '#F44336' },
  over: { text: '已结束', bgColor: '#9E9E9E' },
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
  },
  activityImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  organizerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  organizerName: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default SearchScreen; 