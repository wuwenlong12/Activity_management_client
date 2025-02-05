import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { getActivity } from '../api/activity';
import dayjs from 'dayjs';
import { Activity } from '../api/activity/type';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { school } from '../api/school/type';
import { getSchoolList } from '../api/school';


interface QRCodeData {
  type: 'activity';
  name: string;
  id: string;
  action: 'checkin' | 'checkout';
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 两列布局，左右各16padding，中间16间距

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [schools, setSchools] = useState<school[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<school | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation<NavigationProp>();

  // const activities: Activity[] = [
  //   {
  //     id: '1',
  //     title: '篮球友谊赛',
  //     image: require('../../assets/logo.jpg'),
  //     date: '3月20日 周三',
  //     location: '体育馆',
  //     participants: 24,
  //     tags: ['体育', '交友'],
  //     organizer: {
  //       name: '浙大篮球协会',
  //       avatar: require('../../assets/logo.jpg'),
  //       verified: true,
  //     },
  //   },
  //   {
  //     id: '2',
  //     title: '校园歌手大赛',
  //     image: require('../../assets/logo.jpg'),
  //     date: '3月25日 周一',
  //     location: '大礼堂',
  //     participants: 56,
  //     tags: ['音乐', '比赛'],
  //     organizer: {
  //       name: '校园歌手大赛组织者',
  //       avatar: require('../../assets/logo.jpg'),
  //       verified: false,
  //     },
  //   },
  //   {
  //     id: '3',
  //     title: '校园歌手大赛',
  //     image: require('../../assets/logo.jpg'),
  //     date: '3月25日 周一',
  //     location: '大礼堂',
  //     participants: 56,
  //     tags: ['音乐', '比赛'],
  //     organizer: {
  //       name: '校园歌手大赛组织者',
  //       avatar: require('../../assets/logo.jpg'),
  //       verified: false,
  //     },
  //   },
  //   {
  //     id: '4',
  //     title: '校园歌手大赛',
  //     image: require('../../assets/logo.jpg'),
  //     date: '3月25日 周一',
  //     location: '大礼堂',
  //     participants: 56,
  //     tags: ['音乐', '比赛'],
  //     organizer: {
  //       name: '校园歌手大赛组织者',
  //       avatar: require('../../assets/logo.jpg'),
  //       verified: false,
  //     },
  //   },
  //   {
  //     id: '5',
  //     title: '校园歌手大赛',
  //     image: require('../../assets/logo.jpg'),
  //     date: '3月25日 周一',
  //     location: '大礼堂',
  //     participants: 56,
  //     tags: ['音乐', '比赛'],
  //     organizer: {
  //       name: '校园歌手大赛组织者',
  //       avatar: require('../../assets/logo.jpg'),
  //       verified: false,
  //     },
  //   },
  //   {
  //     id: '6',
  //     title: '校园歌手大赛',
  //     image: require('../../assets/logo.jpg'),
  //     date: '3月25日 周一',
  //     location: '大礼堂',
  //     participants: 56,
  //     tags: ['音乐', '比赛'],
  //     organizer: {
  //       name: '校园歌手大赛组织者',
  //       avatar: require('../../assets/logo.jpg'),
  //       verified: false,
  //     },
  //   },
  //   // 添加更多活动数据...
  // ];

  // 移除原来的权限请求代码，使用新的权限hook
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    const fetchActivities = async () => {
      const res = await getActivity()
      if (res.code === 0) {
        setActivities(res.data.list)
      }
    }
    const fetchSchools = async () => {
      const res = await getSchoolList()
      if (res.code === 0) {
        setSchools(res.data)
        setSelectedSchool(res.data[0])
      }
    }
    fetchActivities()
    fetchSchools()

  }, []);

  // 处理扫码结果


  const handleBarCodeScanned = ({ data }: BarcodeScanningResult): void => {
    setShowScanner(false);
    try {
      const qrData: QRCodeData = JSON.parse(data);
      if (qrData.type === 'activity') {
        Alert.alert('签到成功', `活动：${qrData.name}`);
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
      <Image 
        source={   item.image || require('../../assets/logo.jpg') } 
        style={styles.activityImage} 
      />
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
              source={item.organizer.avatar || require('../../assets/logo.jpg')} 
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
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={14} color="#FF6B6B" />
              <Text style={[styles.detailText, styles.dateText]}>{dayjs(item.date).format('YYYY-MM-DD')}</Text>
            </View>
            <View style={styles.participantsContainer}>
              <Text style={styles.participantsText}>{item.participants_count}人参与</Text>
        
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#4ECDC4" />
            <Text style={styles.detailText} numberOfLines={1}>{item.location.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 顶部搜索栏 */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.schoolSelector}   onPress={() => setShowSchoolPicker(true)}>
            <Text style={styles.schoolText}>{selectedSchool?.name}</Text>

            <Ionicons name="chevron-down" size={20} color="#333" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索活动"
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
            >
              <Ionicons name="scan-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
          contentContainerStyle={styles.listContent}
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
});

export default HomeScreen; 