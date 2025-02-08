import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { register, getVerificationCode } from '../api/auth';
import type { StackNavigationProp } from '@react-navigation/stack';
import { setUser } from '../store/slices/authSlice';
import { setSchools } from '../store/slices/schoolSlice';
import { getSchoolList } from '../api/school';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const { schools } = useAppSelector(state => state.school);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedSchool, setSelectedSchool] = useState<school | null>(null);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoadingSchools(true);
        const res = await getSchoolList();
   
        if (res.code === 0) {
          console.log(res);
          dispatch(setSchools(res.data));
        } else {
          Alert.alert('错误', '获取学校列表失败');
        }
      } catch (error) {
        console.error('获取学校列表失败:', error);
        Alert.alert('错误', '网络错误');
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [dispatch]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 邮箱正则表达式
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 处理邮箱验证的函数
const validateEmail = (email:string) => {
  if (!email || !emailRegex.test(email)) {
    Alert.alert('提示', '请输入有效的邮箱地址');
    return false;
  }
  return true;
}

  const handleSendCode = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    try {
      const res = await getVerificationCode(email);
      if (res.code === 0) {
        setCountdown(60);
        Alert.alert('提示', '验证码已发送，请查收邮件');
      } else {
        Alert.alert('错误', res.message || '发送失败，请重试');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误，请重试');
    }
  };

  const handleRegister = async () => {
    if (!selectedSchool) {
      Alert.alert('提示', '请选择学校');
      return;
    }

    if (!email || !username || !password || !confirmPassword || !verificationCode) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        email,
        password,
        username,
        auth_code: verificationCode,
        schoolId: selectedSchool._id,
      });

      if (res.code === 0) {
        Alert.alert('成功', '注册成功');
        navigation.goBack()
      } else {
        Alert.alert('错误', res.message || '注册失败，请重试');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误，请重试');
    } finally {
      setLoading(false);
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
          {loadingSchools ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <ScrollView>
              {schools.map((school) => (
                <TouchableOpacity
                  key={school._id}
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
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>创建账号</Text>
        <Text style={styles.subtitle}>请填写以下信息完成注册</Text>
      </View>

      <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
          <Ionicons name="school-outline" size={20} color="#666" style={styles.inputIcon} />
          <TouchableOpacity
            style={styles.schoolSelector}
            onPress={() => setShowSchoolPicker(true)}
          >
            <Text style={[
              styles.schoolText,
              !selectedSchool && { color: '#999' }
            ]}>
              {selectedSchool?.name || '选择学校'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="用户名"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

     

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="确认密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        </View>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="邮箱地址"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[styles.codeButton, countdown > 0 && styles.codeButtonDisabled]}
            onPress={handleSendCode}
            disabled={countdown > 0}
          >
            <Text style={styles.codeButtonText}>
              {countdown > 0 ? `${countdown}s` : '发送验证码'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
          <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="验证码"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
     
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>注 册</Text>
          )}
        </TouchableOpacity>
   
      </View>
      {renderSchoolPicker()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 16,
    zIndex: 1,
  },
  headerContainer: {
    marginTop: 100,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  codeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeButtonDisabled: {
    backgroundColor: '#B8B8B8',
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#B8B8B8',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  formItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  schoolSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  schoolText: {
    fontSize: 16,
    color: '#333',
  },
});

export default RegisterScreen; 