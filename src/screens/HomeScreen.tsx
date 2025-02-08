import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Modal,
  Alert,
  ListRenderItem,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import {  getActivities } from '../api/activity';
import dayjs from 'dayjs';
import { Activity } from '../api/activity/type';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { school } from '../api/school/type';
import { getSchoolList } from '../api/school';
import { useAppDispatch, useAppSelector } from '../store';
import { setSelectedSchool, setSchools } from '../store/slices/schoolSlice';


interface QRCodeData {
  type: 'check';
  activityId: string;
  signInRange: number;
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 两列布局，左右各16padding，中间16间距

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// 1. 添加状态映射常量
const STATUS_MAP = {
  notStart:{ text: '未开始', bgColor: '#9E9E9E' },
  pending: { text: '报名中', bgColor: '#4CAF50' },
  upcoming: { text: '即将开始', bgColor: '#FF9800' },
  proceed: { text: '进行中', bgColor: '#2196F3' },
  cancelled: { text: '已取消', bgColor: '#F44336' },
  over: { text: '已结束', bgColor: '#9E9E9E' },
} as const;

// 1. 添加空状态组件
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Image 
      source={require('../../assets/null.png')} 
      style={styles.emptyImage}
    />
    <Text style={styles.emptyText}>暂无活动</Text>
    <Text style={styles.emptySubText}>该学校目前还没有发布任何活动</Text>
  </View>
);

export const HomeScreen: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const dispatch = useAppDispatch();
  const { selectedSchool, schools } = useAppSelector(state => state.school);
  const [searchText, setSearchText] = useState<string>('');
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const {user} = useAppSelector(state => state.auth)
useEffect(()=>{
  dispatch(setSelectedSchool(user?.school|| schools[0]))
},[])
  // 移除原来的权限请求代码，使用新的权限hook
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    
    // 使用分页的fetchActivities进行初始化加载
    fetchActivities(1, true);
    
    const fetchSchools = async () => {
      const res = await getSchoolList()
      if (res.code === 0) {
        dispatch(setSchools(res.data))
      }
    }
    fetchSchools()
  }, [dispatch, selectedSchool]);

  // 获取活动列表
  const fetchActivities = async (pageNum: number, isRefresh = false) => {
    try {
      setLoading(true);
      const response = await getActivities({
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
        schoolId: selectedSchool?._id,
      });
      
      if (response.code === 0) {  // 添加状态码检查
        if (isRefresh) {
          setActivities(response.data.list);
        } else {
          setActivities(prev => [...prev, ...response.data.list]);  // 使用函数式更新
        }
        
        setHasMore(response.data.list.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities(1, true);
  }, [selectedSchool]);

  // 上拉加载更多
  const onEndReached = () => {
    if (!loading && hasMore) {
      console.log('Loading more...', page + 1);  // 添加日志便于调试
      fetchActivities(page + 1);
    }
  };

  // 处理扫码结果
  const handleBarCodeScanned = ({ data }: BarcodeScanningResult): void => {
    setShowScanner(false);
  
    try {
      const qrData: QRCodeData = JSON.parse(data);
      if (qrData.type === 'check') {
        navigation.navigate('CheckIn', {
          activityId: qrData.activityId,
          signInRange: qrData.signInRange
        });
      }
    } catch (error) {
      Alert.alert('错误', '无效的二维码');
    }
  };

  const renderActivityItem: ListRenderItem<Activity> = ({ item, index }) => (
    <TouchableOpacity 
      style={[
        styles.activityCard,
        { marginLeft: index % 2 === 0 ? 0 : 16 }
      ]}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
    >
      <View style={{position:'relative'}}>
      <Image 
         source={item.image ? { uri: item.image } : require('../../assets/logo.jpg')} 
        style={styles.activityImage} 
      />
       <View style={styles.detailRow}>
            <View style={styles.participantsContainer}>
              <Text style={styles.participantsText}>{item.participants_count}人参与</Text>
            </View>
          </View>
      </View>
     
         
      {/* 状态标签 */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: STATUS_MAP[item.status].bgColor }
        ]}>
          <Text style={styles.statusText}>
            {STATUS_MAP[item.status].text}
          </Text>
        </View>
      </View>
      <View style={styles.tagContainer}>
        {item.tags.map((tag, idx) => (
          <View key={tag._id} style={styles.tag}>
            <Text style={styles.tagText}>{tag.name}</Text>
          </View>
        ))}
      </View>
  
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.organizerContainer}>
         
            <Image 
              source={item.organizer.avatar ? { uri:item.organizer.avatar  } : require('../../assets/logo.jpg')} 
              style={styles.organizerAvatar}
            />
         
          <Text style={styles.organizerName} numberOfLines={1}>
            {item.organizer.name}
          </Text>
          {item.organizer.verified && (
            <Ionicons name="checkmark-circle" size={14} color="#007AFF" style={styles.verifiedIcon} />
          )}
        </View>
        <View style={styles.activityDetails}>
         
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#4ECDC4" />
            <Text style={styles.detailText} numberOfLines={1}>{item.location.name}</Text>
          </View>
          <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color="red" />
            <Text style={styles.detailText} numberOfLines={1}>报名截止：{dayjs(item.signUpEndTime).format('MM-DD HH:mm')}</Text>
          </View>
        </View>
      
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.schoolSelector}
          onPress={() => setShowSchoolPicker(true)}
        >
          <Text style={styles.schoolText}>{selectedSchool?.name}</Text>
          <Ionicons name="chevron-down" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>搜索活动</Text>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              setShowScanner(true);
            }}
          >
            <Ionicons name="scan-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSchoolSelect = (school: school) => {
    dispatch(setSelectedSchool(school));
    setShowSchoolPicker(false);
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* 扫码界面 */}
      {showScanner && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showScanner}
          onRequestClose={() => setShowScanner(false)}
        >
          <View style={styles.scannerContainer}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              >
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerHeader}>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowScanner(false)}
                    >
                      <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.scannerTitle}>扫描二维码</Text>
                  </View>
                  <View style={styles.scanFrame} />
                  <Text style={styles.scanTip}>将二维码放入框内，即可自动扫描</Text>
                </View>
              </CameraView>
            ) : (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>需要相机权限来扫描二维码</Text>
                <TouchableOpacity 
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>授权访问</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* 活动列表 */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>推荐活动</Text>
            <Text style={styles.subtitle}>发现精彩校园生活</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreText}>更多</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            activities.length === 0 && styles.emptyListContent  // 当没有数据时调整样式
          ]}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={EmptyState}  // 添加空状态组件
        />
      </View>
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
                      handleSchoolSelect(school);
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 44,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  schoolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  schoolText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 32,
    marginLeft: 12,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 2,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  activityCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  activityImage: {
    width: '100%',
    height: COLUMN_WIDTH * 1.2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  activityInfo: {
    padding: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 22,
  },
  activityDetails: {
    gap: 4,
  },
  detailRow: {
    position: 'absolute',
    bottom:0,
    right:10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#FF6B6B',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  participantsContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  participantsText: {
    fontSize: 12,
    color: '#666',
  },
  scanButton: {
    padding: 4,
    marginLeft: 8,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 44,
  },
  closeButton: {
    padding: 8,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  scanFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
  },
  scanTip: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  organizerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  organizerName: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
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
  statusContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default HomeScreen; 