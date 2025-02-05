import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useAppDispatch } from '../store';
import { setUser, updateUser } from '../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { login } from '../api/auth';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async() => {
    if (username && password) {
      try {
        const res = await login(username, password);
        if(res.code === 0) {
          dispatch(setUser(res.data)); // 保存用户信息到 Redux
          Alert.alert('成功', '登录成功', [
            {
              text: '确定',
              onPress: () => navigation.replace('MainApp'), // 使用 replace 而不是 navigate，防止返回到登录页
            },
          ]);
          await dispatch(updateUser());
        } else {
          Alert.alert('错误', res.message || '登录失败，请重试');
        }
      } catch (error) {
        Alert.alert('错误', '网络错误，请重试');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.jpg')} // 请确保添加你的logo图片
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>欢迎回来</Text>
        <Text style={styles.subText}>登录你的账号</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="用户名/手机号"
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

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>忘记密码？</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, (!username || !password) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={!username || !password}
        >
          <Text style={styles.loginButtonText}>登 录</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>其他登录方式</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-wechat" size={24} color="#07C160" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="call-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>还没有账号？</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerButton}>立即注册</Text>
          </TouchableOpacity>
        </View>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subText: {
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#B8B8B8',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerButton: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default LoginScreen; 