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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store';
import { register, getVerificationCode } from '../api/auth';
import type { StackNavigationProp } from '@react-navigation/stack';
import { setUser } from '../store/slices/authSlice';

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
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
      const res = await register(
        username,
        email,
        password,
        verificationCode,
      );

      if (res.code === 0) {
        dispatch(setUser(res.data));
        Alert.alert('成功', '注册成功', [
          {
            text: '确定',
            onPress: () => navigation.replace('MainApp'),
          },
        ]);
      } else {
        Alert.alert('错误', res.message || '注册失败，请重试');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

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
});

export default RegisterScreen; 