import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker } from 'react-native-maps';
import { getActivityById, updateActivity } from '../api/activity';
import { Activity } from '../api/activity/type';
import { uploadFileInChunks } from '../util/uploadFileInChunks';
import { getTag } from '../api/tag';
import { useAppSelector } from '../store';
import { NumberPicker } from '../components/NumberPicker';
import * as Location from 'expo-location';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 设置 dayjs 使用中文
dayjs.locale('zh-cn');

type NavigationProp = StackNavigationProp<RootStackParamList, 'EditActivity'>;

export const EditActivityScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { activityId } = route.params as { activityId: string };
  const { selectedSchool } = useAppSelector(state => state.school);

  const [form, setForm] = useState({
    title: '',
    image: '',
    startTime: null as Date | null,
    endTime: null as Date | null,
    signUpStartTime: null as Date | null,
    signUpEndTime: null as Date | null,
    location: null as {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    } | null,
    maxParticipants: '',
    description: '',
    notice: ['请准时参加', '遵守活动规则'] as string[],
    tags: [] as string[],
  });

  // 时间选择器状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<
    'startTime' | 'endTime' | 'signUpStartTime' | 'signUpEndTime' | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [showMapModal, setShowMapModal] = useState(false);
  const [predefinedTags, setPredefinedTags] = useState([]);

  useEffect(() => {
    const fetchActivityDetails = async () => {
      try {
        const res = await getActivityById(activityId);
        if (res.code === 0 && res.data) {
          const activity = res.data;
          setForm({
            title: activity.title,
            image: activity.image,
            startTime: new Date(activity.startTime),
            endTime: new Date(activity.endTime),
            signUpStartTime: new Date(activity.signUpStartTime),
            signUpEndTime: new Date(activity.signUpEndTime),
            location: activity.location,
            maxParticipants: activity.participantLimit.toString(),
            description: activity.description,
            notice: activity.notices,
            tags: activity.tags.map(tag => tag._id),
          });
        }
      } catch (error) {
        Alert.alert('错误', '获取活动详情失败');
      }
    };

    fetchActivityDetails();
    
    getTag().then(res => {
      if (res.code === 0) {
        setPredefinedTags(res.data);
      }
    });
  }, [activityId]);

  // 复用 PublishScreen 的时间选择相关函数
  const getMinDate = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);

    switch (currentDateField) {
      case 'signUpStartTime':
        return now;
      case 'signUpEndTime':
        return form.signUpStartTime && form.signUpStartTime > now 
          ? form.signUpStartTime 
          : now;
      case 'startTime':
        return form.signUpEndTime && form.signUpEndTime > now 
          ? form.signUpEndTime 
          : now;
      case 'endTime':
        return form.startTime && form.startTime > now 
          ? form.startTime 
          : now;
      default:
        return now;
    }
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    switch (currentDateField) {
      case 'signUpStartTime':
        return form.signUpEndTime || form.endTime || maxDate;
      case 'signUpEndTime':
        return form.startTime || maxDate;
      case 'startTime':
        return form.endTime || maxDate;
      case 'endTime':
        return maxDate;
      default:
        return maxDate;
    }
  };

  const handleImagePick = async () => {
    let url: string | undefined;
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = async (e: any) => {
        const files = e.target.files;
        if (files) {
          url = await uploadFileInChunks(files[0]);
        }
      };
      input.click();
    } else {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('权限', '需要授权才能访问媒体库');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        url = await uploadFileInChunks(result.assets[0]);
      }
    }

    if (url) {
      setForm(prev => ({ ...prev, image: url }));
    }
  };

  const handleLocationSelect = async (location: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = location;
    let [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    
    setForm(prev => ({
      ...prev,
      location: {
        name: address?.name || '',
        address: address?.street || '',
        latitude,
        longitude,
      },
    }));
    
    setShowMapModal(false);
  };

  const handleTagSelect = (tagId: string) => {
    if (form.tags.includes(tagId)) {
      setForm(prev => ({
        ...prev,
        tags: prev.tags.filter(id => id !== tagId)
      }));
    } else if (form.tags.length < 2) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagId]
      }));
    } else {
      Alert.alert('提示', '最多只能选择两个标签');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const res = await updateActivity({
        id: activityId,
        title: form.title,
        image: form.image,
        startTime: form.startTime!,
        endTime: form.endTime!,
        signUpStartTime: form.signUpStartTime!,
        signUpEndTime: form.signUpEndTime!,
        location: form.location!,
        participantLimit: form.maxParticipants,
        description: form.description,
        notices: form.notice,
        tags: form.tags,
        schoolId: selectedSchool?._id,
      });

      if (res.code === 0) {
        Alert.alert('成功', '活动更新成功', [
          {
            text: '确定',
            onPress: () => {
              navigation.goBack();
              if (route.params?.onUpdate) {
                route.params.onUpdate();
              }
            },
          },
        ]);
      } else {
        Alert.alert('错误', res.message || '更新失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      Alert.alert('提示', '请输入活动标题');
      return false;
    }
    if (!form.image) {
      Alert.alert('提示', '请选择活动封面');
      return false;
    }
    if (!form.startTime) {
      Alert.alert('提示', '请选择活动开始时间');
      return false;
    }
    if (!form.endTime) {
      Alert.alert('提示', '请选择活动结束时间');
      return false;
    }
    if (!form.description.trim()) {
      Alert.alert('提示', '请输入活动描述');
      return false;
    }
    return true;
  };

  const handleShowDatePicker = (
    field: 'startTime' | 'endTime' | 'signUpStartTime' | 'signUpEndTime'
  ) => {
    setCurrentDateField(field);
    setSelectedDate(form[field] || new Date());
    setShowDatePicker(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>编辑活动</Text>
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleSubmit}
          >
            <Text style={styles.publishText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.imageContainer}>
            <TouchableOpacity 
              style={styles.imageUpload} 
              onPress={handleImagePick}
            >
              {form.image ? (
                <Image source={{ uri: form.image }} style={styles.coverImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#999" />
                  <Text style={styles.uploadText}>上传活动封面</Text>
                  <Text style={styles.uploadHint}>建议尺寸 1242×699</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动标题</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入活动标题"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动时间</Text>
            <View style={styles.timePickerGroup}>
              <Text style={styles.timePickerLabel}>开始时间</Text>
              <TouchableOpacity 
                style={styles.pickerValue}
                onPress={() => handleShowDatePicker('startTime')}
              >
                <Text style={styles.valueText}>
                  {form.startTime ? dayjs(form.startTime).format('YYYY-MM-DD HH:mm') : '请选择活动开始时间'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.timePickerLabel}>结束时间</Text>
              <TouchableOpacity 
                style={styles.pickerValue}
                onPress={() => handleShowDatePicker('endTime')}
              >
                <Text style={styles.valueText}>
                  {form.endTime ? dayjs(form.endTime).format('YYYY-MM-DD HH:mm') : '请选择活动结束时间'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>报名时间</Text>
            <View style={styles.timePickerGroup}>
              <Text style={styles.timePickerLabel}>开始报名</Text>
              <TouchableOpacity 
                style={styles.pickerValue}
                onPress={() => handleShowDatePicker('signUpStartTime')}
              >
                <Text style={styles.valueText}>
                  {form.signUpStartTime ? dayjs(form.signUpStartTime).format('YYYY-MM-DD HH:mm') : '请选择报名开始时间'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.timePickerLabel}>结束报名</Text>
              <TouchableOpacity 
                style={styles.pickerValue}
                onPress={() => handleShowDatePicker('signUpEndTime')}
              >
                <Text style={styles.valueText}>
                  {form.signUpEndTime ? dayjs(form.signUpEndTime).format('YYYY-MM-DD HH:mm') : '请选择报名结束时间'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动地点</Text>
            <TouchableOpacity 
              style={styles.pickerValue}
              onPress={() => setShowMapModal(true)}
            >
              <Text style={styles.valueText}>
                {form.location ? form.location.name : '请选择活动地点'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>参与人数</Text>
            <View style={styles.limitContainer}>
              <NumberPicker
                value={form.maxParticipants}
                onChange={(value) => setForm({ ...form, maxParticipants: value })}
                min={0}
                max={999}
              />
              <Text style={styles.limitHint}>设置为0表示不限制人数</Text>
            </View>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动描述</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="请输入活动描述"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动须知</Text>
            {form.notice.map((notice, index) => (
              <View key={index} style={styles.noticeItem}>
                <Text style={styles.noticeNumber}>{index + 1}.</Text>
                <TextInput
                  style={styles.noticeInput}
                  value={notice}
                  onChangeText={(text) => {
                    const newNotices = [...form.notice];
                    newNotices[index] = text;
                    setForm({ ...form, notice: newNotices });
                  }}
                />
              </View>
            ))}
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动标签（最多选择2个）</Text>
            <View style={styles.tagsContainer}>
              {predefinedTags.map((tag: any) => (
                <TouchableOpacity
                  key={tag._id}
                  style={[
                    styles.tag,
                    form.tags.includes(tag._id) && styles.selectedTag,
                  ]}
                  onPress={() => handleTagSelect(tag._id)}
                >
                  <Text style={[
                    styles.tagText,
                    form.tags.includes(tag._id) && styles.selectedTagText,
                  ]}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowDatePicker(false);
                  setCurrentDateField(null);
                }}
              >
                <Text style={styles.datePickerCancelText}>取消</Text>
              </TouchableOpacity>
              <View style={styles.datePickerTabs}>
                <TouchableOpacity 
                  style={[styles.datePickerTab, datePickerMode === 'date' && styles.datePickerTabActive]}
                  onPress={() => setDatePickerMode('date')}
                >
                  <Text style={[styles.datePickerTabText, datePickerMode === 'date' && styles.datePickerTabTextActive]}>日期</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.datePickerTab, datePickerMode === 'time' && styles.datePickerTabActive]}
                  onPress={() => setDatePickerMode('time')}
                >
                  <Text style={[styles.datePickerTabText, datePickerMode === 'time' && styles.datePickerTabTextActive]}>时间</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  if (currentDateField) {
                    setForm(prev => ({ ...prev, [currentDateField]: selectedDate }));
                  }
                  setShowDatePicker(false);
                  setCurrentDateField(null);
                }}
              >
                <Text style={styles.datePickerConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode={datePickerMode}
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  const newDate = new Date(selectedDate);
                  if (datePickerMode === 'date') {
                    newDate.setFullYear(date.getFullYear());
                    newDate.setMonth(date.getMonth());
                    newDate.setDate(date.getDate());
                  } else {
                    newDate.setHours(date.getHours());
                    newDate.setMinutes(date.getMinutes());
                  }
                  setSelectedDate(newDate);
                }
              }}
              minimumDate={getMinDate()}
              maximumDate={getMaxDate()}
              locale="zh_CN"
              textColor="black"
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMapModal}
        animationType="slide"
      >
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: form.location?.latitude || 39.9,
              longitude: form.location?.longitude || 116.3,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={(e) => handleLocationSelect(e.nativeEvent.coordinate)}
          >
            {form.location && (
              <Marker
                coordinate={{
                  latitude: form.location.latitude,
                  longitude: form.location.longitude,
                }}
                title={form.location.name}
                description={form.location.address}
              />
            )}
          </MapView>
          <TouchableOpacity
            style={styles.closeMapButton}
            onPress={() => setShowMapModal(false)}
          >
            <Text style={styles.closeMapText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  publishText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageUpload: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  uploadHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  formItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: '#E0E0E0',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 15,
    color: '#333',
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeNumber: {
    width: 24,
    fontSize: 15,
    color: '#666',
  },
  noticeInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
    marginRight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 48,
    width: '100%',
    marginTop: Platform.OS === 'ios' ? -60 : 0,
    marginBottom: Platform.OS === 'ios' ? -60 : 0,
  },
  pickerItem: {
    fontSize: 15,
    color: '#333',
    height: Platform.OS === 'ios' ? 180 : 48,
  },
  limitContainer: {
    marginTop: 12,
  },
  limitHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#868E96',
    textAlign: 'center',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTag: {
    backgroundColor: '#1E88E5',
  },
  tagText: {
    fontSize: 14,
    color: '#1E88E5',
  },
  selectedTagText: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  closeMapButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeMapText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  datePickerCancelText: {
    fontSize: 15,
    color: '#666',
  },
  datePickerConfirmText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  datePickerTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  datePickerTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  datePickerTabActive: {
    backgroundColor: '#fff',
  },
  datePickerTabText: {
    fontSize: 14,
    color: '#666',
  },
  datePickerTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
    backgroundColor: 'white',
  },
  timePickerGroup: {
    marginTop: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default EditActivityScreen; 