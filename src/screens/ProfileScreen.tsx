import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import type { RootState } from '../store';
import { logout as logoutApi } from '../api/auth';
import { logout } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const MenuItem = ({ icon, title, onPress, showBadge = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={22} color="#666" />
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
    <View style={styles.menuRight}>
      {showBadge && <View style={styles.badge} />}
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </View>
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const handleLogout = async() => {
    // 处理退出登录
  const res =await logoutApi()
  if(res.code === 0){
    dispatch(logout())
    Alert.alert('退出登录成功')
  }else{
    Alert.alert('退出登录失败')
  }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <Image
            source={user?.imgurl ? { uri: user.imgurl } : require('../../assets/logo.jpg')}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{user?.username || '未登录'}</Text>
              {user?.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </View>
            <Text style={styles.userId}>ID: {user?._id || '--'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>编辑资料</Text>
          </TouchableOpacity>
        </View>

        {/* 数据统计 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>0</Text>
            <Text style={styles.statsLabel}>已参与</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>0</Text>
            <Text style={styles.statsLabel}>已发布</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>0</Text>
            <Text style={styles.statsLabel}>收藏</Text>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="calendar-outline"
            title="我的活动"
            onPress={() => {navigation.navigate('MyActivities');}}
          />
          <MenuItem
            icon="heart-outline"
            title="我的收藏"
            onPress={() => {}}
          />
          <MenuItem
            icon="notifications-outline"
            title="消息通知"
            onPress={() => {}}
            showBadge
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="settings-outline"
            title="设置"
            onPress={() => {}}
          />
          <MenuItem
            icon="help-circle-outline"
            title="帮助与反馈"
            onPress={() => {}}
          />
        </View>

        {/* 退出登录按钮 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  userId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginTop: 12,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default ProfileScreen; 