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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../api/activity/type';
import { getActivity } from '../api/activity'; // 假设您有一个获取活动的API
import { Calendar } from 'react-native-calendars'; // 使用日历组件
import { Picker } from '@react-native-picker/picker'; // 使用选择器组件
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTag } from '../api/tag';  
import { tag } from '../api/tag/type';
import { getSchoolList } from '../api/school';  
import { school } from '../api/school/type';
const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;



type NavigationProp = StackNavigationProp<RootStackParamList, 'Explore'>;

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);  // 改为支持多选标签
  const [tags, setTags] = useState<tag[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<school | null>(null);
  const [schools, setSchools] = useState<school[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);



  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [dateSelectionMode, setDateSelectionMode] = useState<'start' | 'end'>('start');
  const [showCalendar, setShowCalendar] = useState(false);
  const [page, setPage] = useState('1');
  const [total, setTotal] = useState(0);
  const [limit] = useState('10');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    const fetchActivities = async () => {
      const res = await getActivity(); // 获取活动数据
      if (res.code === 0) {
        setActivities(res.data.list);
        setFilteredActivities(res.data.list);
      }
    };
    const fetchTags = async () => {
      const res = await getTag(); // 获取活动数据
      if (res.code === 0) {
        setTags(res.data);
      }
    };
    const fetchSchools = async () => {
      const res = await getSchoolList(); // 获取活动数据
      if (res.code === 0) {
        setSchools(res.data);
        setSelectedSchool(res.data[0]);
      }
    };

    fetchActivities();
    fetchTags();
    fetchSchools();
  }, []);


  const fetchActivities = async (isRefresh = false) => {
    try {
      setLoading(true);
      const params: requestSearchActivity = {
        search: searchText || undefined,
        startDate: selectedStartDate || undefined,
        endDate: selectedEndDate || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page: isRefresh ? '1' : page,
        limit
      };

      const res = await getActivity(params);
      
      if (res.code === 0) {
        if (isRefresh) {
          setActivities(res.data.list);
          setFilteredActivities(res.data.list);
          setPage('1');
          setTotal(res.data.total);
        } else {
          setActivities(prev => [...prev, ...res.data.list]);
          setFilteredActivities(prev => [...prev, ...res.data.list]);
        }

      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, [selectedStartDate, selectedEndDate, selectedTags, searchText]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(true);
  };

  const handleLoadMore = () => {
    if (!loading && total > activities.length) {
      setPage(prev => (parseInt(prev) + 1).toString());
      fetchActivities();
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 学校选择器 */}
      <TouchableOpacity
        style={styles.schoolSelector}
        onPress={() => setShowSchoolPicker(true)}
      >
        <Text style={styles.schoolText}>{selectedSchool?.name}</Text>

        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

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

  const renderActivityCard = ({ item }: { item: Activity }) => (
    <TouchableOpacity 
      style={styles.activityCard}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
    >
      <Image 
        source={item.image ? { uri: item.image } : require('../../assets/logo.jpg')} 
        style={styles.activityImage}
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
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.activityListContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#999" />
              <Text style={styles.emptyText}>暂无相关活动</Text>
            </View>
          }
          ListFooterComponent={
            loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#007AFF" />
              </View>
            ) : null
          }
        />

        {/* 学校选择器模态框 */}
        <Modal
          visible={showSchoolPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSchoolPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>选择学校</Text>
                <TouchableOpacity
                  onPress={() => setShowSchoolPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {schools.map((school, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.schoolItem}
                    onPress={() => {
                      setSelectedSchool(school);
                      setShowSchoolPicker(false);
                    }}
                  >
                    <Text style={styles.schoolItemText}>{school.name}</Text>
                    {selectedSchool?._id === school._id && (
                      <Ionicons name="checkmark" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {renderCalendarModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F8FF',
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
    backgroundColor: '#E3F2FD',
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
    marginTop: 4,
    flexWrap: 'wrap',
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
    padding: CARD_MARGIN,
  },
  activityCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: CARD_MARGIN,
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
    height: CARD_WIDTH * 0.8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  activityInfo: {
    padding: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
    marginRight: 4,
    marginTop: 2,
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
    marginLeft: 4,
    color: '#666',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  schoolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  schoolItemText: {
    fontSize: 16,
    color: '#333',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  tagScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    marginRight: 8,
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
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
});

export default ExploreScreen; 