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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { postActivity } from '../api/activity';
import * as Location from 'expo-location';
import dayjs from 'dayjs';
import { uploadFileInChunks } from '../util/uploadFileInChunks';
import { tag } from '../api/tag/type';
import { getTag } from '../api/tag';
import { useAppSelector } from '../store';
import 'dayjs/locale/zh-cn';

interface User {
  id: string;
  isVerified: boolean;
  verifiedType?: 'personal' | 'organization'; // 个人认证或组织认证
}

interface ActivityForm {
  title: string;
  image: string | undefined;
  startTime: Date | null;
  endTime: Date | null;
  signUpStartTime: Date | null;
  signUpEndTime: Date | null;
  location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  maxParticipants: string;
  description: string;
  notice: string[];
  tags: string[];
}

interface School {
  _id: string;
  name: string;
}

// 定义导航参数类型
type RootStackParamList = {
  Verify: undefined;
  // ... 其他页面的参数类型
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// AMapSdk.init(
//   Platform.select({
//     android: "c52c7169e6df23490e3114330098aaac",
//     ios: "186d3464209b74effa4d8391f441f14d",
//   })
// );

const NumberPicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}> = ({ value, onChange, min = 0, max = 999 }) => {
  const handleChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '') {
      onChange('');
      return;
    }
    const val = Math.min(Math.max(parseInt(num, 10), min), max);
    onChange(val.toString());
  };

  return (
    <View style={styles.numberPickerContainer}>
      <TouchableOpacity
        style={[styles.numberButton, styles.decrementButton]}
        onPress={() => {
          const current = parseInt(value || '0', 10);
          if (current > min) {
            onChange((current - 1).toString());
          }
        }}
      >
        <Ionicons name="remove" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.numberInputContainer}>
        <TextInput
          style={styles.numberInput}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="不限"
          textAlign="center"
          placeholderTextColor="#868E96"
        />
        <Text style={styles.numberUnit}>人</Text>
      </View>

      <TouchableOpacity
        style={[styles.numberButton, styles.incrementButton]}
        onPress={() => {
          const current = parseInt(value || '0', 10);
          if (current < max) {
            onChange((current + 1).toString());
          }
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// 设置 dayjs 使用中文
dayjs.locale('zh-cn');

export const PublishScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { selectedSchool } = useAppSelector(state => state.school);

  const [form, setForm] = useState({
    title: '',
    image: '',
    startTime: null as Date | null,    // 活动开始时间
    endTime: null as Date | null,      // 活动结束时间
    signUpStartTime: null as Date | null,  // 报名开始时间
    signUpEndTime: null as Date | null,    // 报名结束时间
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  // 处理时间选择
  const handleShowDatePicker = (
    field: 'startTime' | 'endTime' | 'signUpStartTime' | 'signUpEndTime'
  ) => {
    setCurrentDateField(field);
    setShowDatePicker(true);
  };

  const getMinDate = () => {
    const now = new Date();
    // 将当前时间向上取整到下一个整分钟
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);

    switch (currentDateField) {
      case 'signUpStartTime':
        // 报名开始时间不能早于当前时间
        return now;
      case 'signUpEndTime':
        // 报名结束时间不能早于报名开始时间或当前时间
        return form.signUpStartTime && form.signUpStartTime > now 
          ? form.signUpStartTime 
          : now;
      case 'startTime':
        // 活动开始时间不能早于报名结束时间或当前时间
        return form.signUpEndTime && form.signUpEndTime > now 
          ? form.signUpEndTime 
          : now;
      case 'endTime':
        // 活动结束时间不能早于活动开始时间或当前时间
        return form.startTime && form.startTime > now 
          ? form.startTime 
          : now;
      default:
        return now;
    }
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // 最多允许选择一年后的时间

    switch (currentDateField) {
      case 'signUpStartTime':
        // 报名开始时间不能晚于报名结束时间（如果已设置）或活动结束时间
        return form.signUpEndTime || form.endTime || maxDate;
      case 'signUpEndTime':
        // 报名结束时间不能晚于活动开始时间（如果已设置）
        return form.startTime || maxDate;
      case 'startTime':
        // 活动开始时间不能晚于活动结束时间（如果已设置）
        return form.endTime || maxDate;
      case 'endTime':
        // 活动结束时间最多可以选择一年后
        return maxDate;
      default:
        return maxDate;
    }
  };

  const handleDateConfirm = (date: Date) => {
    if (!currentDateField) return;

    const now = new Date();
    // 将当前时间向上取整到下一个整分钟
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);

    // 检查是否选择了过去的时间
    if (date < now) {
      Alert.alert('提示', '不能选择过去的时间');
      return;
    }

    // 验证时间逻辑
    if (currentDateField === 'endTime' && form.startTime && date <= form.startTime) {
      Alert.alert('提示', '结束时间必须晚于开始时间');
      return;
    }
    if (currentDateField === 'signUpEndTime') {
      if (form.signUpStartTime && date <= form.signUpStartTime) {
        Alert.alert('提示', '报名结束时间必须晚于报名开始时间');
        return;
      }
      if (form.endTime && date >= form.endTime) {
        Alert.alert('提示', '报名结束时间必须早于活动结束时间');
        return;
      }
    }
    if (currentDateField === 'startTime' && form.signUpEndTime && date <= form.signUpEndTime) {
      Alert.alert('提示', '活动开始时间必须晚于报名结束时间');
      return;
    }
    if (currentDateField === 'signUpStartTime' && form.endTime && date >= form.endTime) {
      Alert.alert('提示', '报名开始时间必须早于活动结束时间');
      return;
    }

    setForm(prev => ({ ...prev, [currentDateField]: date }));
    setShowDatePicker(false);
    setCurrentDateField(null);
  };

  // 表单验证
  const validateForm = () => {
    if (!selectedSchool) {
      Alert.alert('提示', '请选择学校');
      return false;
    }
    if (!form.title.trim()) {
      Alert.alert('提示', '请输入活动标题');
      return false;
    }
    if (!form.image) {
      Alert.alert('提示', '请选择活动封面');
      return false;
    }
    if (!form.startTime || !form.endTime) {
      Alert.alert('提示', '请选择活动时间');
      return false;
    }
    if (!form.signUpStartTime || !form.signUpEndTime) {
      Alert.alert('提示', '请选择报名时间');
      return false;
    }
    if (form.startTime < form.signUpEndTime) {
      Alert.alert('提示', '活动开始时间必须晚于报名结束时间');
      return false;
    }
    if (form.endTime <= form.startTime) {
      Alert.alert('提示', '活动结束时间必须晚于开始时间');
      return false;
    }
    if (form.signUpEndTime <= form.signUpStartTime) {
      Alert.alert('提示', '报名结束时间必须晚于报名开始时间');
      return false;
    }
    if (form.signUpEndTime >= form.endTime) {
      Alert.alert('提示', '报名结束时间必须早于活动结束时间');
      return false;
    }
    if (form.signUpStartTime >= form.endTime) {
      Alert.alert('提示', '报名开始时间必须早于活动结束时间');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const res = await postActivity({
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
        tags: tags,
        schoolId: selectedSchool?._id!,
      });

      if (res.code === 0) {
        Alert.alert('成功', '活动发布成功', [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('错误', res.message || '发布失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    }
  };

  const [showMapModal, setShowMapModal] = useState(false);
  const [user] = useState<User>({
    id: '1',
    isVerified: false
  }); // 这里应该从全局状态获取用户信息

  const [tags, setTags] = useState<string[]>([]); // 新增状态管理标签
  const [predefinedTags, setPredefinedTags] = useState<tag[]>([]);
  const { schools } = useAppSelector(state => state.school);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  useEffect(()=>{
    getTag().then(res=>{
      setPredefinedTags(res.data)
    })
  },[])


  const handleImagePick = async () => {
  
    let url:string | undefined
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = async (e: any) => {
        const files = e.target.files
        if (files) {
          url = await uploadFileInChunks(files[0]); // 上传每个文件
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
        url = await uploadFileInChunks(result.assets[0]); // 上传每个文件
      }
    }
    if (url) {
      setForm(prev => ({ ...prev, image: url }));
    } else {
      Alert.alert('错误', '图片上传失败');
    }

  
   
  };

  const handleLocationSelect = async (location: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = location;

    let [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    console.log(address);
    
    setForm(prev => ({
      ...prev,
      location: {
        name: address?.name || '',
        address: address?.street || '',
        latitude: latitude,
        longitude: longitude,
      },
    }));
  
    setShowMapModal(false); // 选择位置后关闭模态弹窗
  };

  const handleTagSelect = (tag: string) => {
    console.log(tag);
    
    if (tags.includes(tag)) {
      // 如果标签已被选择，则移除它
      setTags(tags.filter(t => t !== tag));
    } else if (tags.length < 2) {
      // 如果标签未被选择且数量小于2，则添加它
      setTags(prev => [...prev, tag]);
    } else {
      Alert.alert('提示', '最多只能添加两个标签');
    }
  };

  const renderSchoolPicker = () => (
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
            {schools.map((school) => (
              <TouchableOpacity
                key={school._id}
                style={styles.schoolItem}
                onPress={() => {
                  setForm(prev => ({ ...prev, location: { name: school.name, address: '', latitude: 0, longitude: 0 } }));
                  setShowSchoolPicker(false);
                }}
              >
                <Text style={styles.schoolItemText}>{school.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // 修改时间选择器的渲染函数
  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
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
                    if (selectedDate) handleDateConfirm(selectedDate);
                  }}
                >
                  <Text style={styles.datePickerConfirmText}>确定</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate || new Date()}
                mode={datePickerMode}
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    const newDate = new Date(selectedDate || new Date());
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
      );
    }

    // Android 保持不变
    return showDatePicker && (
      <DateTimePicker
        value={selectedDate || new Date()}
        mode="datetime"
        is24Hour={true}
        display="default"
        onChange={(event, date) => {
          setShowDatePicker(false);
          if (date && event.type !== 'dismissed') {
            handleDateConfirm(date);
          }
        }}
        minimumDate={getMinDate()}
        maximumDate={getMaxDate()}
      />
    );
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
          <Text style={styles.headerTitle}>发布活动</Text>
          <View style={styles.headerRight}>
            {user.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#1E88E5" />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => navigation.navigate('Verify')}
              >
                <Text style={styles.verifyText}>去认证</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.publishButton,
              ]}
              onPress={handleSubmit}
            >
              <Text style={styles.publishText}>发布</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!user.isVerified && (
          <View style={styles.verifyTip}>
            <Ionicons name="information-circle" size={20} color="#1E88E5" />
            <Text style={styles.verifyTipText}>
              认证用户发布的活动将获得更多曝光机会
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Verify')}>
              <Text style={styles.verifyTipButton}>立即认证</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.content}>
          <View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={handleImagePick}
            >
              {form.image ? (
                <Image
                  source={{ uri: form.image }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                  <Text style={styles.uploadText}>添加活动封面</Text>
                  <Text style={styles.uploadHint}>建议尺寸 1280x720</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.formSection}>
            <Text style={styles.label}>学校信息</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowSchoolPicker(true)}
            >
              <View style={styles.inputContent}>
                <Text style={[
                  styles.inputText,
                  !selectedSchool && styles.placeholderText
                ]}>
                  {selectedSchool?.name || '选择学校 *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.formItem}>
            <Text style={styles.label}>活动标题</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={title => setForm(prev => ({ ...prev, title }))}
              placeholder="请输入活动标题"
              maxLength={50}
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
              style={styles.locationButton}
              onPress={() => setShowMapModal(true)}
            >
              <Text style={styles.locationText}>
                {form.location ? `${form.location.name} (${form.location.address})` : '选择活动地点'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>人数限制</Text>
            <View style={styles.limitContainer}>
              <NumberPicker
                value={form.maxParticipants}
                onChange={(value) => setForm(prev => ({ ...prev, maxParticipants: value }))}
                min={0}
                max={999}
              />
              <Text style={styles.limitHint}>设置为0表示不限人数</Text>
            </View>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动描述</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={description => setForm(prev => ({ ...prev, description }))}
              placeholder="请详细描述活动内容"
              multiline
              numberOfLines={6}
              maxLength={1000}
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>活动须知</Text>
            {form.notice.map((item, index) => (
              <View key={index} style={styles.noticeItem}>
                <Text style={styles.noticeNumber}>{index + 1}.</Text>
                <TextInput
                  style={styles.noticeInput}
                  value={item}
                  onChangeText={text => {
                    const newNotice = [...form.notice];
                    newNotice[index] = text;
                    setForm(prev => ({ ...prev, notice: newNotice }));
                  }}
                  placeholder="请输入活动须知"
                />
                <TouchableOpacity
                  onPress={() => {
                    const newNotice = form.notice.filter((_, i) => i !== index);
                    setForm(prev => ({ ...prev, notice: newNotice }));
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setForm(prev => ({
                  ...prev,
                  notice: [...prev.notice, ''],
                }));
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#666" />
              <Text style={styles.addButtonText}>添加须知</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>选择活动标签</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {predefinedTags.map((tag) => (
                <TouchableOpacity
                  key={tag._id}
                  style={[styles.tag, tags.includes(tag._id) && styles.selectedTag]}
                  onPress={() => handleTagSelect(tag._id)}
                >
                  <Text style={[styles.tagText, tags.includes(tag._id) && styles.selectedTagText]}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 地图模态弹窗 */}
          <Modal
            visible={showMapModal}
            animationType="slide"
            onRequestClose={() => setShowMapModal(false)}
          >
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: 39.91095,
                  longitude: 116.37296,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                onPress={(e) => {
                  const { coordinate } = e.nativeEvent;
                  handleLocationSelect({
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                  });
                }}
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
              <TouchableOpacity style={styles.closeMapButton} onPress={() => setShowMapModal(false)}>
                <Text style={styles.closeMapText}>关闭地图</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </ScrollView>

        {renderDatePicker()}

        {renderSchoolPicker()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 85 : 65,  // 给页面内容添加底部间距，避免被导航栏遮挡
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    marginRight: 4,
  },
  verifyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  verifyText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '500',
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  publishText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  publishButtonUnverified: {
    backgroundColor: '#FF6B6B80', // 半透明
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
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginRight: 8,
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
  numberPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    backgroundColor: '#FF8787',
  },
  incrementButton: {
    backgroundColor: '#69DB7C',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  numberInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    padding: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  numberUnit: {
    fontSize: 16,
    color: '#868E96',
    marginLeft: 4,
    fontWeight: '500',
    width: 20,
  },
  limitHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#868E96',
    textAlign: 'center',
    fontWeight: '500',
  },
  verifyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    gap: 8,
  },
  verifyTipText: {
    flex: 1,
    fontSize: 13,
    color: '#1E88E5',
  },
  verifyTipButton: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  locationButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  closeMapButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 5,
  },
  closeMapText: {
    color: '#fff',
    fontSize: 16,
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
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
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
  datePicker: {
    height: 200,
    backgroundColor: 'white',
  },
  formSection: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
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
  timePickerGroup: {
    marginTop: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
});

export default PublishScreen; 