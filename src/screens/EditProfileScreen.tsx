import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppDispatch, useAppSelector } from '../store';
import { getVerificationCode } from '../api/auth';
import * as ImagePicker from 'expo-image-picker';
import SchoolPicker from '../components/SchoolPicker';
import { getUserDetails, updateUserDetails } from '../api/user';
import { uploadFileInChunks } from '../util/uploadFileInChunks';
import { checkLoginStatus, updateUser } from '../store/slices/authSlice';

interface UserDetails {
  _id: string;
  bio: string;
  class: string;
  className: string;
  createdAt: string;
  email: string;
  avatar: string;
  phone: string;
  role: string;
  school: string;
  studentId: string;
  updatedAt: string;
  username: string;
  wx: string;
}

interface School {
  _id: string;
  name: string;
}

// 添加导航类型定义
type NavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  // 使用正确的导航类型
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [profile, setProfile] = useState({
    school: '',
    className: '',
    studentId: '',
    phone: '',
    wx: '',
    bio: '',
  });

  const { schools } = useAppSelector(state => state.school);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const res = await getUserDetails();

      if (res.code === 0 && res.data) {
        const userData = res.data;
        setUserDetails(userData);

        setUsername(userData.username);
        setEmail(userData.email);
        setAvatar(userData.avatar);
        setProfile({
          school: userData.school || '',
          className: userData.className || '',
          studentId: userData.studentId || '',
          phone: userData.phone || '',
          wx: userData.wx || '',
          bio: userData.bio || '',
        });

        // 根据用户的 schoolId 设置选中的学校
        if (userData.school._id) {
          const userSchool = schools.find(school => school._id === userData.school._id);
          if (userSchool) {
            setSelectedSchool(userSchool);
          }
        }
      } else {
        Alert.alert('错误', '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      Alert.alert('错误', '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    let url
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
      setAvatar(url);
    } else {
      Alert.alert('错误', '图片上传失败');
    }
  }

const handleGetCode = useCallback(async () => {
  if (countdown > 0) return;

  try {
    const res = await getVerificationCode(userDetails?.email || '');
    if (res.code === 0) {
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Alert.alert('错误', res.message || '获取验证码失败');
    }
  } catch (error) {
    Alert.alert('错误', '网络错误');
  }
}, [userDetails?.email, countdown]);

const handleSubmit = async () => {
  if (newPassword && !authCode) {
    Alert.alert('提示', '修改密码需要验证码');
    return;
  }

  if (!selectedSchool) {
    Alert.alert('提示', '请选择学校');
    return;
  }

  try {
    const changedFields: Partial<UserDetails> = {};
    
    if (username !== userDetails?.username) changedFields.username = username;
    if (avatar !== userDetails?.avatar) changedFields.avatar = avatar;
    if (oldPassword) {
      changedFields.oldPassword = oldPassword;
      changedFields.newPassword = newPassword;
    }
    
    Object.entries(profile).forEach(([key, value]) => {
      if (value !== userDetails?.[key]) {
        changedFields[key] = value;
      }
    });

    // 如果没有修改任何内容，直接返回
    if (Object.keys(changedFields).length === 0) {
      navigation.goBack();
      return;
    }

    const res = await updateUserDetails({
      ...changedFields,
      school: selectedSchool.name,
      schoolId: selectedSchool._id,
      wx: profile.wx,
    });

    if (res.code === 0) {
      await dispatch(updateUser());
      Alert.alert('成功', '个人信息更新成功');
      navigation.goBack();
    } else {
      Alert.alert('错误', res.message || '更新失败');
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    Alert.alert('错误', '网络错误');
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
                setSelectedSchool(school);
                setShowSchoolPicker(false);
                setProfile({ ...profile, school: school.name });
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
);

if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>编辑资料</Text>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSubmit}
      >
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.content}>
      {/* 头像部分 */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={handlePickImage}
      >
        <Image
          source={avatar ? { uri: avatar } : require('../../assets/logo.jpg')}
          style={styles.avatar}
        />
        <View style={styles.avatarOverlay}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.avatarText}>更换头像</Text>
        </View>
      </TouchableOpacity>

      {/* 表单部分 */}
      <View style={styles.form}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>用户名</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="请输入用户名"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>邮箱</Text>
            <Text style={styles.emailText}>{userDetails?.email || '--'}</Text>
          </View>
        </View>

        {/* 学校信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学校信息</Text>
          <View style={styles.formSection}>
            <Text style={styles.label}>学校</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowSchoolPicker(true)}
            >
              <View style={styles.inputContent}>
                <Text style={[
                  styles.inputText,
                  !selectedSchool && styles.placeholderText
                ]}>
                  {selectedSchool?.name || '选择学校'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>班级</Text>
            <TextInput
              style={styles.input}
              value={profile.className}
              onChangeText={(text) => setProfile({ ...profile, className: text })}
              placeholder="请输入班级"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>学号</Text>
            <TextInput
              style={styles.input}
              value={profile.studentId}
              onChangeText={(text) => setProfile({ ...profile, studentId: text })}
              placeholder="请输入学号"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* 联系方式 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系方式</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>手机号码</Text>
              <TextInput
                style={styles.input}
                value={profile.phone}
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
                placeholder="请输入手机号码"
                keyboardType="phone-pad"
              />
            </View>
            
        
          </View>
          <View style={styles.inputGroup}>
           
            
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>微信号</Text>
              <TextInput
                style={styles.input}
                value={profile.wx}
                onChangeText={(text) => setProfile(prev => ({ ...prev, wx: text }))}
                placeholder="请输入微信号"
              />
            </View>
          </View>
        </View>

        {/* 个人简介 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个人简介</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={profile.bio}
              onChangeText={(text) => {
                if (text.length <= 100) {
                  setProfile({ ...profile, bio: text });
                }
              }}
              placeholder="请输入个人简介（100字以内）"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.bioCount}>{profile.bio.length}/100</Text>
          </View>
        </View>

        {/* 修改密码部分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>修改密码</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>当前密码</Text>
            <TextInput
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="请输入当前密码"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>新密码</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="请输入新密码"
              secureTextEntry
            />
          </View>

          {newPassword ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>验证码</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={authCode}
                  onChangeText={setAuthCode}
                  placeholder="请输入验证码"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[
                    styles.codeButton,
                    countdown > 0 && styles.codeButtonDisabled,
                  ]}
                  onPress={handleGetCode}
                  disabled={countdown > 0}
                >
                  <Text style={styles.codeButtonText}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>

    {renderSchoolPicker()}
  </KeyboardAvoidingView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 10,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  saveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 32,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
  },
  form: {
    backgroundColor: '#fff',
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  divider: {
    height: 12,
    backgroundColor: '#f5f5f5',
  },
  emailText: {
    fontSize: 16,
    color: '#999',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  codeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  codeButtonDisabled: {
    backgroundColor: '#FFB5B5',
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  bioCount: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'right',
    marginTop: 8,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputItem: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
});

export default EditProfileScreen; 