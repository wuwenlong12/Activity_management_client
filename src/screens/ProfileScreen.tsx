import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import type { RootState } from '../store';
import { logout as logoutApi } from '../api/auth';
import { logout } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUnreadNotificationCount } from '../api/notification';
import { getUserStats } from '../api/info';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { disconnectSocket } from '../store/slices/socketSlice';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const MenuItem = ({ icon, title, onPress, showBadge = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={22} color="#666" />
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
    <View style={styles.menuRight}>
      {showBadge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </View>
  </TouchableOpacity>
);

// 计算资料完整度
const getProfileCompleteness = (user: any) => {
  const fields = ['school', 'className', 'studentId', 'phone', 'email', 'wx', 'bio'];
  const completedFields = fields.filter(field => user?.[field]);
  return Math.floor((completedFields.length / fields.length) * 100);
};

export const ProfileScreen: React.FC = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    publishedCount: 0,
    participatedCount: 0,
    favoriteCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  
  // 获取未读消息数量
  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res.code === 0) {
        setUnreadCount(res.data.count);
      }
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
    }
  };

  // 获取用户统计数据
  const fetchUserStats = async () => {
    try {
      const res = await getUserStats();
      if (res.code === 0) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchUserStats();
  }, []);

  const handleLogout = async() => {
    try {
      const res = await logoutApi();
      if (res.code === 0) {
        // 先断开 socket 连接
        disconnectSocket();
        // 再清除用户状态
        dispatch(logout());
        Alert.alert('退出登录成功');
      } else {
        Alert.alert('退出登录失败');
      }
    } catch (error) {
      console.error('退出登录失败:', error);
      Alert.alert('退出登录失败');
    }
  };

  const completeness = user ? getProfileCompleteness(user) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <ScrollView>
        {/* 个性化头部 */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { 
              userId: user?._id 
            })}
          >
            <Image
              source={user?.avatar ? { uri: user.avatar } : require('../../assets/logo.jpg')}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{user?.username || '未登录'}</Text>
              {user?.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.bio}>{user?.bio || '在校园相遇，让生活更精彩'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 活动数据卡片 */}
        <View style={styles.statsCard}>
          <TouchableOpacity 
            style={styles.statsItem}
            onPress={() => navigation.navigate('MyActivities', { tab: 'joined' })}
          >
            <View style={styles.statsIcon}>
              <View style={[styles.statsIconInner, { backgroundColor: '#FF9500' }]}>
                <Ionicons name="people" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.statsNumber}>
              {statsLoading ? '-' : stats.participatedCount}
            </Text>
            <Text style={styles.statsLabel}>参与活动</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statsItem}
            onPress={() => navigation.navigate('MyActivities', { tab: 'published' })}
          >
            <View style={styles.statsIcon}>
              <View style={[styles.statsIconInner, { backgroundColor: '#34C759' }]}>
                <Ionicons name="megaphone" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.statsNumber}>
              {statsLoading ? '-' : stats.publishedCount}
            </Text>
            <Text style={styles.statsLabel}>发布活动</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statsItem}
            onPress={() => navigation.navigate('FavoriteList')}
          >
            <View style={styles.statsIcon}>
              <View style={[styles.statsIconInner, { backgroundColor: '#FF2D55' }]}>
                <Ionicons name="heart" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.statsNumber}>
              {statsLoading ? '-' : stats.favoriteCount}
            </Text>
            <Text style={styles.statsLabel}>收藏活动</Text>
          </TouchableOpacity>
        </View>
        {/* 个人信息卡片 */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>个人信息</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="school-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>学校</Text>
              <Text style={styles.infoValue}>{user?.school?.name || '未填写'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="book-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>班级</Text>
              <Text style={styles.infoValue}>{user?.className || '未填写'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>学号</Text>
              <Text style={styles.infoValue}>{user?.studentId || '未填写'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>加入时间</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD') : '未知'}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            {user?.phone && (
              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="call" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
            {user?.email && (
              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="mail" size={20} color="#FF9500" />
              </TouchableOpacity>
            )}
            {user?.wx && (
              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="logo-wechat" size={20} color="#34C759" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 完善信息提示卡片 */}
        {completeness < 100 && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="bulb" size={20} color="#FF9500" />
              </View>
              <Text style={styles.tipTitle}>温馨提示</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${completeness}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{completeness}%</Text>
            </View>

            <Text style={styles.tipText}>
              完善的个人信息可以：
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.benefitText}>提高活动报名通过率</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.benefitText}>获得更好的社交体验</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.benefitText}>接收重要活动通知</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.completeButtonText}>立即完善</Text>
              <Ionicons name="arrow-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* 功能卡片 */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>功能中心</Text>
          <View style={styles.menuGrid}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('MyActivities')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="calendar" size={24} color="#fff" />
              </View>
              <Text style={styles.menuText}>我的活动</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('FavoriteList')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FF2D55' }]}>
                <Ionicons name="heart" size={24} color="#fff" />
              </View>
              <Text style={styles.menuText}>我的收藏</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Notification')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}>
                <Ionicons name="notifications" size={24} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuText}>消息通知</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#8E8E93' }]}>
                <Ionicons name="settings" size={24} color="#fff" />
              </View>
              <Text style={styles.menuText}>设置</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 退出登录按钮 */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 24,
    padding: 16,
    paddingTop: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 8,
    paddingTop: 24,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  statsLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statsIcon: {
    position: 'absolute',
    top: -16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  contactItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    width: 40,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
});

export default ProfileScreen; 