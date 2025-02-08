import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getParticipationList, updateParticipationStatus } from '../api/participation';
import dayjs from 'dayjs';
import { generateQRCode } from '../api/check';
import MapView, { Circle } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { QRCode } from '../api/check/type';
import { Participation } from '../api/participation/type';



// 修改筛选状态类型
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

const STATUS_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'confirmed' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已取消', value: 'cancelled' },
];

// 添加常量
const QR_CODE_STORAGE_KEY = 'activity_qrcode_';

export const ParticipantManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId, activityTitle } = route.params as { 
    activityId: string;
    activityTitle: string;
  };

  const [participants, setParticipants] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInRange, setCheckInRange] = useState('1');
  const [location, setLocation] = useState({
    latitude: 39.9042,
    longitude: 116.4074,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [qrCodeData, setQrCodeData] = useState<QRCode | null>(null);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();


  const fetchParticipants = async () => {
    try {
      const res = await getParticipationList(activityId);
      if (res.code === 0) {
        setParticipants(res.data);
      } else {
        Alert.alert('错误', res.message || '获取报名列表失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [activityId]);

  // 在组件中添加 useEffect 来获取存储的二维码数据
  useEffect(() => {
    const loadStoredQRCode = async () => {
      try {
        const storedData = await AsyncStorage.getItem(QR_CODE_STORAGE_KEY + activityId);
        if (storedData) {
          const data = JSON.parse(storedData);
          setQrCodeData(data.qrCode);
          setCheckInRange(data.range.toString());
          setLocation(data.location);
        }
      } catch (error) {
        console.error('加载二维码数据失败:', error);
      }
    };
    
    loadStoredQRCode();
  }, [activityId]);

  const handleStatusUpdate = async (participantId: string, status: 'confirmed' | 'rejected' | 'cancelled') => {
    try {

      
      const res = await updateParticipationStatus(participantId, status);
      console.log(res);
      if (res.code === 0) {
        // 更新本地状态
        setParticipants(prev => 
          prev.map(p => 
            p._id === participantId ? { ...p, status } : p
          )
        );
        Alert.alert('成功', '状态更新成功');
      } else {
        Alert.alert('错误', res.message || '更新失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    }
  };

  // 根据筛选状态过滤参与者列表
  const filteredParticipants = participants.filter(p => 
    filterStatus === 'all' ? true : p.status === filterStatus
  );

  // 修改统计栏的渲染
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={[styles.statItem, filterStatus === 'all' && styles.statItemActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.statNumber, filterStatus === 'all' && styles.statNumberActive]}>
            {participants.length}
          </Text>
          <Text style={[styles.statLabel, filterStatus === 'all' && styles.statLabelActive]}>
            全部
          </Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
          style={[styles.statItem, filterStatus === 'confirmed' && styles.statItemActive]}
          onPress={() => setFilterStatus(filterStatus === 'confirmed' ? 'all' : 'confirmed')}
        >
          <Text style={[styles.statNumber, filterStatus === 'confirmed' && styles.statNumberActive]}>
            {participants.filter(p => p.status === 'confirmed').length}
          </Text>
          <Text style={[styles.statLabel, filterStatus === 'confirmed' && styles.statLabelActive]}>
            已通过
          </Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
          style={[styles.statItem, filterStatus === 'pending' && styles.statItemActive]}
          onPress={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
        >
          <Text style={[styles.statNumber, filterStatus === 'pending' && styles.statNumberActive]}>
            {participants.filter(p => p.status === 'pending').length}
          </Text>
          <Text style={[styles.statLabel, filterStatus === 'pending' && styles.statLabelActive]}>
            待审核
          </Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
          style={[styles.statItem, filterStatus === 'rejected' && styles.statItemActive]}
          onPress={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')}
        >
          <Text style={[styles.statNumber, filterStatus === 'rejected' && styles.statNumberActive]}>
            {participants.filter(p => p.status === 'rejected').length}
          </Text>
          <Text style={[styles.statLabel, filterStatus === 'rejected' && styles.statLabelActive]}>
            已拒绝
          </Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
          style={[styles.statItem, filterStatus === 'cancelled' && styles.statItemActive]}
          onPress={() => setFilterStatus(filterStatus === 'cancelled' ? 'all' : 'cancelled')}
        >
          <Text style={[styles.statNumber, filterStatus === 'cancelled' && styles.statNumberActive]}>
            {participants.filter(p => p.status === 'cancelled').length}
          </Text>
          <Text style={[styles.statLabel, filterStatus === 'cancelled' && styles.statLabelActive]}>
            已取消
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 修改渲染参与者卡片，显示所有状态的操作按钮
  const renderParticipant = ({ item }: { item: Participation }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <Image 
          source={item.user.avatar ? { uri: item.user.avatar } : require('../../assets/logo.jpg')}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.joinTime}>
            报名时间：{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{STATUS_TEXT[item.status]}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        {item.user.school && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>学校：</Text>
            <Text style={styles.infoValue}>{item.user.school.name}</Text>
          </View>
        )}
        {item.user.className && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>班级：</Text>
            <Text style={styles.infoValue}>{item.user.className}</Text>
          </View>
        )}
        {item.user.studentId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>学号：</Text>
            <Text style={styles.infoValue}>{item.user.studentId}</Text>
          </View>
        )}
        {item.user.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>邮箱：</Text>
            <Text style={styles.infoValue}>{item.user.email}</Text>
          </View>
        )}
        {item.user.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>手机：</Text>
            <Text style={styles.infoValue}>{item.user.phone}</Text>
          </View>
        )}
        {item.user.wx && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>微信：</Text>
            <Text style={styles.infoValue}>{item.user.wx}</Text>
          </View>
        )}
        {item.user.bio && (
          <View style={styles.bioRow}>
            <Text style={styles.infoLabel}>简介：</Text>
            <Text style={styles.bioText}>{item.user.bio}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {item.status !== 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleStatusUpdate(item._id, 'confirmed')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>通过</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'rejected' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleStatusUpdate(item._id, 'rejected')}
          >
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>拒绝</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // 修改签到按钮点击处理
  const handleCheckInPress = () => {
    if (qrCodeData) {
      setShowQRCodeModal(true);
    } else {
      setShowCheckInModal(true);
    }
  };

  // 修改签到按钮渲染
  const renderCheckInButton = () => (
    <TouchableOpacity 
      style={styles.floatingButton}
      onPress={handleCheckInPress}
    >
      <Ionicons name="qr-code" size={24} color="#fff" />
    </TouchableOpacity>
  );

  // 修改签到设置模态框
  const renderCheckInModal = () => (
    <Modal
      visible={showCheckInModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCheckInModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>设置签到范围</Text>
              <TouchableOpacity 
                onPress={() => setShowCheckInModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={location}
                onRegionChangeComplete={setLocation}
              >
                <Circle
                  center={location}
                  radius={parseInt(checkInRange) * 1000}
                  fillColor="rgba(33, 150, 243, 0.2)"
                  strokeColor="rgba(33, 150, 243, 0.5)"
                  strokeWidth={2}
                />
              </MapView>
            </View>

            <View style={styles.rangeInputContainer}>
              <Text style={styles.rangeLabel}>签到范围（公里）：</Text>
              <TextInput
                style={styles.rangeInput}
                value={checkInRange}
                onChangeText={setCheckInRange}
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerateQRCode}
            >
              <Text style={styles.generateButtonText}>生成签到二维码</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  // 修改处理生成二维码的函数
  const handleGenerateQRCode = async () => {
    try {
      const range = parseInt(checkInRange);
      if (isNaN(range) || range <= 0 || range > 99) {
        Alert.alert('错误', '请输入1-99之间的有效范围');
        return;
      }

      const res = await generateQRCode(activityId, range);
      if (res.code === 0) {
        const qrCodeData = res.data;
        setQrCodeData(qrCodeData);
        setShowQRCodeModal(true);
        setShowCheckInModal(false);

        // 保存数据到 AsyncStorage
        const dataToStore = {
          qrCode: qrCodeData,
          range: range,
          location: location,
          timestamp: new Date().getTime(),
        };
        await AsyncStorage.setItem(
          QR_CODE_STORAGE_KEY + activityId,
          JSON.stringify(dataToStore)
        );
      } else {
        Alert.alert('错误', res.message || '生成二维码失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    }
  };

  // 修改保存到相册的函数
  const saveToGallery = async () => {
    try {
      // 请求权限
      if (!permissionResponse?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert('提示', '需要相册权限才能保存图片');
          return;
        }
      }

      // 创建临时文件路径
      const filename = FileSystem.documentDirectory + "qrcode.png";
      
      // 将 base64 数据写入文件
      await FileSystem.writeAsStringAsync(
        filename,
        qrCodeData!.qrCode.split('base64,')[1],
        { encoding: FileSystem.EncodingType.Base64 }
      );
      
      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(filename);
      await MediaLibrary.createAlbumAsync('活动签到码', asset, false);
      
      // 删除临时文件
      await FileSystem.deleteAsync(filename);
      
      Alert.alert('成功', '二维码已保存到相册');
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  // 修改二维码模态框的按钮布局
  const renderQRCodeModal = () => (
    <Modal
      visible={showQRCodeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowQRCodeModal(false)}
    >
      <View style={styles.qrModalContainer}>
        <View style={styles.qrModalContent}>
          <View style={styles.qrModalHeader}>
            <Text style={styles.qrModalTitle}>签到二维码</Text>
            <TouchableOpacity 
              onPress={() => setShowQRCodeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {qrCodeData && (
            <View style={styles.qrCodeContainer}>
              <Image
                source={{ uri: qrCodeData.qrCode }}
                style={styles.qrCode}
                resizeMode="contain"
              />
              <View style={styles.qrCodeInfo}>
                <Text style={styles.checkInCode}>
                  活动Id:
                </Text>
                <Text style={styles.checkInCode}>
                  {qrCodeData.checkInCodeObject?.activityId}
                </Text>
                <Text style={styles.rangeText}>
                  签到范围：{checkInRange}公里
                </Text>
              </View>
            </View>
          )}

          <View style={styles.qrModalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveToGallery}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>保存到相册</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.checkInButton]}
              onPress={() => {
                setShowQRCodeModal(false);
                navigation.navigate('CheckInManagement', {
                  activityId,
                  activityTitle,
                });
              }}
            >
              <Ionicons name="people-outline" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>签到管理</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modifyButton]}
              onPress={() => {
                setShowQRCodeModal(false);
                setShowCheckInModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>修改范围</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>报名管理</Text>
          <View style={styles.placeholder} />
        </View>

        {renderStats()}

        <FlatList
          data={filteredParticipants}
          renderItem={renderParticipant}
          keyExtractor={item => item._id}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchParticipants();
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filterStatus === 'all' 
                  ? '暂无报名记录' 
                  : `暂无${STATUS_TEXT[filterStatus]}的报名`}
              </Text>
            </View>
          }
        />

        {renderCheckInButton()}
        {renderCheckInModal()}
        {renderQRCodeModal()}
      </View>
    </SafeAreaView>
  );
};

const STATUS_COLORS = {
  pending: '#FFA000',
  confirmed: '#4CAF50',
  rejected: '#F44336',
  cancelled: '#9E9E9E',
};

const STATUS_TEXT = {
  pending: '待审核',
  confirmed: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
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
  statsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  statItemActive: {
    backgroundColor: '#E3F2FD',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statNumberActive: {
    color: '#1E88E5',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statLabelActive: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  participantCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  infoSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    width: 60,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  bioRow: {
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  joinTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 999,
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
    paddingBottom: 20,
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
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  rangeLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  rangeInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  qrCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  qrCodeInfo: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  checkInCode: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  rangeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  qrModalActions: {
    flexDirection: 'column',
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  checkInButton: {
    backgroundColor: '#2196F3',
  },
  modifyButton: {
    backgroundColor: '#FF9800',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ParticipantManagementScreen; 