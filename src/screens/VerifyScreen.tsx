import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

type VerifyType = 'personal' | 'organization';

interface VerifyForm {
  type: VerifyType;
  name: string;
  studentId?: string; // 学号
  idCard?: string; // 学生证照片
  orgName?: string; // 组织名称
  proofImage?: string; // 证明材料图片
  phone: string;
  email: string;
  responsibleId?: string; // 负责学生学号/老师工号
}

export const VerifyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState<VerifyForm>({
    type: 'personal',
    name: '',
    phone: '',
    email: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleImagePick = async (field: keyof VerifyForm) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要访问相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setForm(prev => ({ ...prev, [field]: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  const handleSubmit = () => {
    // 表单验证
    if (form.type === 'personal') {
      if (!form.name || !form.studentId || !form.phone || !form.email || !form.idCard) {
        Alert.alert('提示', '请填写完整个人认证信息');
        return;
      }
    } else {
      if (!form.orgName || !form.proofImage || !form.phone || !form.email || !form.responsibleId) {
        Alert.alert('提示', '请填写完整组织认证信息');
        return;
      }
    }

    // 提交认证
    setIsSubmitted(true);
    Alert.alert('提示', '认证申请已提交，请耐心等待审核结果（24小时内）');
    // TODO: 提交认证逻辑
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>认证</Text>
        <View style={styles.placeholder} />
      </View>

      {isSubmitted ? (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>您的认证申请已提交，审核结果将在24小时内通知您。</Text>
          {/* <TouchableOpacity 
            style={styles.withdrawButton}
            onPress={() => {
              // TODO: 撤回认证逻辑
              Alert.alert('提示', '撤回认证申请功能尚未实现');
            }}
          >
            <Text style={styles.withdrawText}>撤回申请</Text>
          </TouchableOpacity> */}
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                form.type === 'personal' && styles.typeButtonActive
              ]}
              onPress={() => setForm(prev => ({ ...prev, type: 'personal' }))}
            >
              <Ionicons 
                name="person" 
                size={24} 
                color={form.type === 'personal' ? '#1E88E5' : '#666'} 
              />
              <Text style={[
                styles.typeText,
                form.type === 'personal' && styles.typeTextActive
              ]}>个人认证</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                form.type === 'organization' && styles.typeButtonActive
              ]}
              onPress={() => setForm(prev => ({ ...prev, type: 'organization' }))}
            >
              <Ionicons 
                name="business" 
                size={24} 
                color={form.type === 'organization' ? '#1E88E5' : '#666'} 
              />
              <Text style={[
                styles.typeText,
                form.type === 'organization' && styles.typeTextActive
              ]}>组织认证</Text>
            </TouchableOpacity>
          </View>

          {form.type === 'personal' ? (
            <>
              <View style={styles.formItem}>
                <Text style={styles.label}>真实姓名</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={name => setForm(prev => ({ ...prev, name }))}
                  placeholder="请输入真实姓名"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.label}>学号</Text>
                <TextInput
                  style={styles.input}
                  value={form.studentId}
                  onChangeText={studentId => setForm(prev => ({ ...prev, studentId }))}
                  placeholder="请输入学号"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.label}>学生证照片</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePick('idCard')}
                >
                  {form.idCard ? (
                    <Image 
                      source={{ uri: form.idCard }} 
                      style={styles.uploadedImage} 
                    />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#999" />
                      <Text style={styles.uploadText}>上传学生证照片</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.formItem}>
                <Text style={styles.label}>组织名称</Text>
                <TextInput
                  style={styles.input}
                  value={form.orgName}
                  onChangeText={orgName => setForm(prev => ({ ...prev, orgName }))}
                  placeholder="请输入组织名称"
                />
              </View>

              <View style={styles.formItem}>
                <Text style={styles.label}>证明材料照片</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleImagePick('proofImage')}
                >
                  {form.proofImage ? (
                    <Image 
                      source={{ uri: form.proofImage }} 
                      style={styles.uploadedImage} 
                    />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#999" />
                      <Text style={styles.uploadText}>上传证明材料照片</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formItem}>
                <Text style={styles.label}>负责学生学号/老师工号</Text>
                <TextInput
                  style={styles.input}
                  value={form.responsibleId}
                  onChangeText={responsibleId => setForm(prev => ({ ...prev, responsibleId }))}
                  placeholder="请输入负责学生学号/老师工号"
                />
              </View>
            </>
          )}

          <View style={styles.formItem}>
            <Text style={styles.label}>联系电话</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={phone => setForm(prev => ({ ...prev, phone }))}
              placeholder="请输入联系电话"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formItem}>
            <Text style={styles.label}>电子邮箱</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={email => setForm(prev => ({ ...prev, email }))}
              placeholder="请输入电子邮箱"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>认证说明：</Text>
            <Text style={styles.noticeText}>1. 认证信息仅用于身份验证</Text>
            <Text style={styles.noticeText}>2. 认证通过后将获得认证标识</Text>
            <Text style={styles.noticeText}>3. 认证用户发布的活动将获得更多曝光</Text>
            <Text style={styles.noticeText}>4. 请确保提供的信息真实有效</Text>
          </View>
        </ScrollView>
      )}

    {isSubmitted? <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>撤回申请</Text>
        </TouchableOpacity>
      </View>: <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>提交认证</Text>
        </TouchableOpacity>
      </View> } 
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#1E88E5',
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
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  uploadButton: {
    aspectRatio: 4/3,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  notice: {
    padding: 16,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  waitingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
  },
  withdrawText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default VerifyScreen; 