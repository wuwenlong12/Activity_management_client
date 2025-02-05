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
import DateTimePickerModal from "react-native-modal-datetime-picker";
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

interface User {
  id: string;
  isVerified: boolean;
  verifiedType?: 'personal' | 'organization'; // 个人认证或组织认证
}

interface ActivityForm {
  title: string;
  image: string | undefined;
  date: Date | null;
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


export const PublishScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [form, setForm] = useState<ActivityForm>({
    title: '',
    image: undefined,
    date: null,
    location: null,
    maxParticipants: '',
    description: '',
    notice: ['请准时参加', '遵守活动规则'],
    tags: [],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [user] = useState<User>({
    id: '1',
    isVerified: false
  }); // 这里应该从全局状态获取用户信息

  const [tags, setTags] = useState<string[]>([]); // 新增状态管理标签
  const [predefinedTags, setPredefinedTags] = useState<tag[]>([]);
 

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

  const handleDateConfirm = (date: Date) => {
    setForm(prev => ({ ...prev, date }));
    setShowDatePicker(false);
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

  const handleSubmit = async () => {
    // 表单验证
    if (!form.title.trim()) {
      Alert.alert('提示', '请输入活动标题');
      return;
    }
    if (!form.image) {
      Alert.alert('提示', '请选择活动封面');
      return;
    }
    if (!form.date) {
      Alert.alert('提示', '请选择活动时间');
      return;
    }

    if (!form.maxParticipants) {
      Alert.alert('提示', '请输入人数限制');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('提示', '请输入活动描述');
      return;
    }

    const res = await postActivity({
      title: form.title,
      time: form.date,
      location: form.location,
      participantLimit: form.maxParticipants,
      description: form.description,
      notices: form.notice,
      tags: tags,
    });
    if (res.code === 0) {
      Alert.alert('提示', '发布成功');
      // navigation.goBack();
    } else {
      Alert.alert('提示', '发布失败');
    }
  
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
                !user.isVerified && styles.publishButtonUnverified
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
            <Text style={styles.label}>选择活动时间</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
              <Text style={styles.dateText}>
                {form.date ? dayjs(form.date).format('YYYY-MM-DD HH:mm') : '请选择时间'}
              </Text>
            </TouchableOpacity>
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

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="datetime"
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
          minimumDate={new Date()}
        />
      </KeyboardAvoidingView>
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
  datePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
});

export default PublishScreen; 