import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../store';
import type { RootState } from '../store';
import dayjs from 'dayjs';
import MapView, { Marker } from 'react-native-maps';
import { Activity } from '../api/activity/type';
import { getActivityById } from '../api/activity';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// 添加参与者类型定义
interface Participant {
  id: string;
  name: string;
  avatar: any;
  joinTime: string;
  role?: string;
  status?: string;
}
type NavigationProp = StackNavigationProp<RootStackParamList, 'ActivityDetail'>;
export const ActivityDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { activityId } = route.params as { activityId: string };
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLiked, setIsLiked] = useState(false);


  useEffect(() => {

    if (activityId) {
      init();
    }
  }, [activityId]);
  const init = async () => {
    const res = await getActivityById(activityId);
    if (res.code === 0 && res.data) {
      setActivity(res.data);
      console.log('活动数据:', res.data);
    } else {
      // 处理错误情况
      Alert.alert('错误', '无法获取活动数据');
    }
  }

  const handleSignUp = () => {
    Alert.alert(
      '确认报名',
      '是否确认报名参加该活动？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认',
          onPress: () => {
            // TODO: 调用报名API
            Alert.alert('成功', '报名成功！');
          },
        },
      ]
    );
  };

  const renderParticipant = (participant: Participant) => (
    <TouchableOpacity
      key={participant.id}
      style={styles.participantItem}
      onPress={() => navigation.navigate('UserProfile', { userId: participant.id })}
    >
      <Image source={participant.avatar || require('../../assets/logo.jpg')} style={styles.participantAvatar} />
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{participant.name}</Text>
        <Text style={styles.joinTime}>
          {participant.joinTime ? dayjs(participant.joinTime).format('YYYY-MM-DD HH:mm:ss') : '时间未提供'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooterButton = () => {
    if (!activity) return null;

    if (activity.status === 'over') {
      return <View style={styles.footer}>   <TouchableOpacity
        style={[styles.footerButton, styles.overButton]}
    
      >   <Text style={styles.footerButtonText}>活动报名已结束</Text> </TouchableOpacity></View>
    }
    if (activity.status === 'cancelled') {
      return <View style={styles.footer}>   <TouchableOpacity
      style={[styles.footerButton, styles.cancelledButton]}
     
    >   <Text style={styles.footerButtonText}>活动已取消</Text> </TouchableOpacity></View>
    }

    if (activity.isCreator) {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton]}
            onPress={() => {
              Alert.alert(
                '取消活动',
                '确定要取消该活动吗？',
                [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '确定',
                    style: 'destructive',
                    onPress: () => {
                      // TODO: 调用取消活动API
                      Alert.alert('成功', '活动已取消');
                      navigation.goBack();
                    }
                  },
                ]
              );
            }}
          >
            <Text style={[styles.footerButtonText, styles.cancelButtonText]}>取消活动</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.manageButton]}
            onPress={() => navigation.navigate('ParticipantManagement', {
              activityId: activity.id,
              activityTitle: activity.title
            })}
          >
            <Text style={styles.footerButtonText}>管理报名</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activity.isJoined) {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton]}
            onPress={() => {
              Alert.alert(
                '取消报名',
                '确定要取消报名吗？',
                [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '确定',
                    onPress: () => {
                      // TODO: 调用取消报名API
                      Alert.alert('成功', '已取消报名');
                    }
                  },
                ]
              );
            }}
          >
            <Text style={[styles.footerButtonText, styles.cancelButtonText]}>取消报名</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.signUpButton]}
          onPress={handleSignUp}
        >
          <Text style={styles.footerButtonText}>立即报名</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => setIsLiked(!isLiked)}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF6B6B" : "#333"}
          />
        </TouchableOpacity>
      </View>
      {activity && (
        <ScrollView style={styles.content}>
          {/* 活动封面图 */}
          <Image
            source={activity?.image || require('../../assets/logo.jpg')}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* 活动信息 */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{activity.title || '活动标题未提供'}</Text>

            <View style={styles.organizerInfo}>
              <Image
                source={activity.organizer.avatar || require('../../assets/logo.jpg')}
                style={styles.organizerAvatar}
              />
              <Text style={styles.organizerName}>{activity.organizer.name}</Text>
              {activity.organizer.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={20} color="#666" />
                <Text style={styles.statText}>{activity.participants_count}人参与</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.statText}>{dayjs(activity.date).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.statText}>{activity.location.name}</Text>
              </View>
            </View>

            {/* 地图显示活动位置 */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: activity.location.latitude,
                  longitude: activity.location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: activity.location.latitude,
                    longitude: activity.location.longitude,
                  }}
                  title={activity.location.name}
                  description={activity.location.address}
                />
              </MapView>
            </View>

            {/* 活动标签 */}
            <View style={styles.tagsContainer}>
              {activity.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>

            {/* 活动详情 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动详情</Text>
              <Text style={styles.description}>
                {activity.description}
              </Text>
            </View>

            {/* 活动须知 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动须知</Text>
              <View style={styles.noticeList}>
                {activity.notices.map((notice, index) => (
                  <View key={index} style={styles.noticeItem}>
                    <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" />
                    <Text style={styles.noticeText}>{notice}</Text>
                  </View>
                ))}

              </View>
            </View>

            {/* 添加参与者列表部分 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>参与者</Text>
                <Text style={styles.participantCount}>
                  {activity.participants_count}人参与
                </Text>
              </View>

              <View style={styles.participantsList}>
                {activity.participants.map(renderParticipant)}
                {activity.participants.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => {
                      navigation.navigate('Participants', {
                        activityId: activity.id,
                        activityTitle: activity.title,
                      });
                    }}
                  >
                    <Text style={styles.viewMoreText}>
                      查看全部 {activity.participants.length} 位参与者
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

      )}

      {/* 底部按钮 */}
      {renderFooterButton()}
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
  },
  backButton: {
    padding: 4,
  },
  likeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 240,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  organizerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  organizerName: {
    fontSize: 15,
    color: '#666',
    marginRight: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  noticeList: {
    gap: 12,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  signUpButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  manageButton: {
    backgroundColor: '#007AFF',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overButton: {
    backgroundColor: '#666',
  },
  cancelledButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantCount: {
    fontSize: 14,
    color: '#666',
  },
  participantsList: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  joinTime: {
    fontSize: 12,
    color: '#999',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  mapContainer: {
    height: 200,
    marginVertical: 16,
  },
  map: {
    flex: 1,
  },
});

export default ActivityDetailScreen; 