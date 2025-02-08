import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity, requestSearchActivity } from '../api/activity/type';
import { getActivities } from '../api/activity'; // 假设您有一个获取活动的API
import { Calendar } from 'react-native-calendars'; // 使用日历组件
import { Picker } from '@react-native-picker/picker'; // 使用选择器组件
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTag } from '../api/tag';  
import { tag } from '../api/tag/type';
import { getSchoolList } from '../api/school';  
import { school } from '../api/school/type';
import { useAppSelector } from '../store';
import dayjs from 'dayjs';
const { width } = Dimensions.get('window');
const PADDING = 16;  // 屏幕两侧的内边距
const SPACING = 12;  // 卡片之间的间距
const CARD_WIDTH = (width - (PADDING * 2 + SPACING)) / 2;  // 考虑内边距和间距的卡片宽度

type NavigationProp = StackNavigationProp<RootStackParamList, 'Explore'>;

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);  // 改为支持多选标签
  const [tags, setTags] = useState<tag[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [dateSelectionMode, setDateSelectionMode] = useState<'start' | 'end'>('start');
  const [showCalendar, setShowCalendar] = useState(false);
  const [page, setPage] = useState('1');
  const [total, setTotal] = useState(0);
  const [limit] = useState('10');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { selectedSchool } = useAppSelector(state => state.school);

  useEffect(() => {
    const fetchTags = async () => {
      const res = await getTag();
      if (res.code === 0) {
        setTags(res.data);
      }
    };
    fetchTags();
    fetchActivities(1, true);
  }, []);

  const fetchActivities = async (pageNum: number, isRefresh = false) => {
    try {
      setLoading(true);
      const params: requestSearchActivity = {
        search: searchText || undefined,
        startDate: selectedStartDate || undefined,
        endDate: selectedEndDate || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page: pageNum.toString(),
        limit,
        schoolId: selectedSchool?._id,
      };

      const res = await getActivities(params);
      
      if (res.code === 0) {
        if (isRefresh) {
          setActivities(res.data.list);
          setFilteredActivities(res.data.list);
        } else {
          setActivities(prev => [...prev, ...res.data.list]);
          setFilteredActivities(prev => [...prev, ...res.data.list]);
        }
        setTotal(res.data.total);
        setPage(pageNum.toString());
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 当筛选条件改变时，重新加载第一页
    fetchActivities(1, true);
  }, [searchText, selectedStartDate, selectedEndDate, selectedTags, selectedSchool]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && total > activities.length) {
      const nextPage = parseInt(page) + 1;
      fetchActivities(nextPage);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索活动"
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const renderActivityCard = ({ item, index }: { item: Activity; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.activityCard,
        { marginLeft: index % 2 === 0 ? 0 : SPACING }  // 只给右边的卡片添加左边距
      ]}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
    >
      <Image 
        source={item.image ? { uri: item.image } : require('../../assets/logo.jpg')} 
        style={styles.activityImage}
        resizeMode="cover"
      />
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.dateLocationContainer}>
          <Ionicons name="calendar-outline" size={12} color="#666" />
          <Text style={styles.dateLocationText} numberOfLines={1}>{item.date}</Text>
        </View>
        <View style={styles.dateLocationContainer}>
          <Ionicons name="location-outline" size={12} color="#666" />
          <Text style={styles.dateLocationText} numberOfLines={1}>{item.location.name}</Text>
        </View>
        <View style={styles.tagContainer}>
          {item.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.participantCountContainer}>
          <Ionicons name="people-outline" size={12} color="#666" />
          <Text style={styles.participantCountText}>{item.participants_count}人参与</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleDayPress = (day: any) => {
    const selectedDate = day.dateString;
    
    if (dateSelectionMode === 'start') {
      setSelectedStartDate(selectedDate);
      setDateSelectionMode('end');
    } else {
      // 确保结束日期不早于开始日期
      if (selectedDate < selectedStartDate) {
        setSelectedStartDate(selectedDate);
        setSelectedEndDate('');
      } else {
        setSelectedEndDate(selectedDate);
        setDateSelectionMode('start');
        setShowCalendar(false); // 选择完成后关闭日历
      }
    }
  };

  const renderCalendarModal = () => (
    <Modal
      visible={showCalendar}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCalendar(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCalendar(false)}
      >
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>
              {dateSelectionMode === 'start' ? '选择开始日期' : '选择结束日期'}
            </Text>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSelectedStartDate('');
                setSelectedEndDate('');
                setDateSelectionMode('start');
              }}
            >
              <Text style={styles.clearButtonText}>清除</Text>
            </TouchableOpacity>
          </View>
          
          <Calendar
            current={dateSelectionMode === 'start' ? selectedStartDate : selectedEndDate}
            minDate={new Date().toISOString().split('T')[0]}
            onDayPress={handleDayPress}
            markedDates={{
              [selectedStartDate]: {
                selected: true,
                startingDay: true,
                color: '#007AFF'
              },
              [selectedEndDate]: {
                selected: true,
                endingDay: true,
                color: '#007AFF'
              },
              ...(selectedStartDate && selectedEndDate
                ? getDatesInRange(selectedStartDate, selectedEndDate).reduce(
                    (acc, date) => ({
                      ...acc,
                      [date]: {
                        selected: true,
                        color: '#007AFF33'
                      }
                    }),
                    {}
                  )
                : {})
            }}
            markingType="period"
            theme={{
              todayTextColor: '#007AFF',
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#fff',
              textDayFontSize: 14,
              textMonthFontSize: 14,
              textDayHeaderFontSize: 14,
              arrowColor: '#007AFF',
            }}
          />

          <View style={styles.dateRangeInfo}>
            <Text style={styles.dateRangeText}>
              {selectedStartDate ? `开始：${selectedStartDate}` : '请选择开始日期'}
            </Text>
            <Text style={styles.dateRangeText}>
              {selectedEndDate ? `结束：${selectedEndDate}` : '请选择结束日期'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates.slice(1, -1); // 不包括开始和结束日期
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../assets/null.png')} 
        style={styles.emptyImage}
      />
      <Text style={styles.emptyText}>暂无活动</Text>
      <Text style={styles.emptySubText}>暂时没有找到符合条件的活动</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderHeader()}
        
        {/* 日期选择器 */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.filterButtonText}>
              {selectedStartDate && selectedEndDate
                ? `${selectedStartDate} 至 ${selectedEndDate}`
                : '选择日期范围'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 标签选择 */}
        <View style={styles.tagSection}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScrollContent}
          >
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.tagButtonActive
                ]}
                onPress={() => {
                  setSelectedTags(prev => 
                    prev.includes(tag._id)
                      ? prev.filter(t => t !== tag._id)
                      : [...prev, tag._id]
                  );

                }}
              >
                <Text style={[
                  styles.tagButtonText,
                  selectedTags.includes(tag._id) && styles.tagButtonTextActive
                ]}>{tag.name}</Text>
              </TouchableOpacity>

            ))}
          </ScrollView>
        </View>

        {/* 活动列表 */}
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            filteredActivities.length === 0 && styles.emptyListContent
          ]}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={EmptyState}
        />

        {renderCalendarModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: '#F0F8FF',
    backgroundColor:'#fff'
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
  },
  segmentButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  tagScrollContent: {
    flexGrow: 1,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    margin: 4,
  },
  tagButtonActive: {
    backgroundColor: '#007AFF',
  },
  tagButtonText: {
    color: '#666',
    fontSize: 14,
  },
  tagButtonTextActive: {
    color: '#fff',
  },
  activityList: {
    flex: 1,
  },
  activityListContent: {
    paddingRight: CARD_WIDTH,
    paddingBottom: SPACING,
  },
  activityCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  activityImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  activityInfo: {
    padding: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    color: '#1E88E5',
  },
  participantCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  participantCountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  dateRangeInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  filterSection: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tagSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  listContent: {
    padding: PADDING,  // 使用统一的内边距
  },
  columnWrapper: {
    marginBottom: SPACING,  // 行间距
    justifyContent: 'flex-start',  // 确保左对齐
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
  },
});

export default ExploreScreen; 