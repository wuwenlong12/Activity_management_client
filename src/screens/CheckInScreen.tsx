import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from 'expo-location';
import { check, checkHasCheckedIn } from "../api/check";
import { getActivityById } from '../api/activity';
import { getDistance } from 'geolib';
import dayjs from 'dayjs';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Linking from 'expo-linking';

export const CheckInScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId, signInRange } = route.params as {
    activityId: string;
    signInRange: number;
  };

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 获取活动详情
        const res = await getActivityById(activityId);
        if (res.code === 0) {
          setActivity(res.data);
        }
      } catch (error) {
        console.error('获取活动详情失败:', error);
      }
    };

    init();
    requestLocationPermission();
  }, [activityId]);

  // 计算距离
  useEffect(() => {
    if (location && activity?.location) {
      const meters = getDistance(
        { 
          latitude: location.coords.latitude, 
          longitude: location.coords.longitude 
        },
        {
          latitude: activity.location.latitude,
          longitude: activity.location.longitude
        }
      );
      setDistance(meters / 1000); // 转换为公里
    }
  }, [location, activity]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await checkHasCheckedIn(activityId);
        if (res.code === 0 && res.data.checkedIn) {
          setHasChecked(true);
        }
      } catch (error) {
        console.error('检查签到状态失败:', error);
      }
    };

    checkStatus();
  }, [activityId]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要位置权限才能签到');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
  };

  const handleCheckIn = async () => {
    if (!location || !activity) return;
    
    if (distance && distance > activity.signInRange) {
      Alert.alert('提示', `您当前距离活动地点${distance.toFixed(2)}公里，超出签到范围`);
      return;
    }

    try {
      setLoading(true);
      const res = await check(activityId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (res.code === 0) {
        Alert.alert('成功', '签到成功', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('错误', res.message || '签到失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 简化导航函数
  const openNavigation = () => {
    const location = `${activity.location.latitude},${activity.location.longitude}`;
    const label = activity.location.name;
    
    const url = Platform.select({
      ios: `maps:?q=${label}&ll=${location}`,
      android: `geo:${location}?q=${label}`
    });

    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        Alert.alert('提示', '无法打开地图应用');
      }
    });
  };

  if (!activity) return <ActivityIndicator style={styles.loading} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>活动签到</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* 活动信息卡片 */}
        <View style={styles.activityCard}>
          <Image 
            source={activity.image ? { uri: activity.image } : require('../../assets/logo.jpg')}
            style={styles.activityImage}
          />
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            
            {/* 添加创建者信息 */}
            <View style={styles.organizerInfo}>
              <Image 
                source={activity.organizer.avatar ? { uri: activity.organizer.avatar } : require('../../assets/logo.jpg')}
                style={styles.organizerAvatar}
              />
              <Text style={styles.organizerName}>{activity.organizer.name}</Text>
              {activity.organizer.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#2196F3" />
              )}
            </View>

            {/* 添加学校信息 */}
            <View style={styles.schoolInfo}>
              <Ionicons name="school-outline" size={16} color="#666" />
              <Text style={styles.schoolText}>{activity.school?.name || '未知学校'}</Text>
            </View>

            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.timeText}>
                {dayjs(activity.startTime).format('MM-DD HH:mm')} - {dayjs(activity.endTime).format('HH:mm')}
              </Text>
            </View>

            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{activity.location.name}</Text>
            </View>
          </View>
        </View>

        {/* 地图组件 */}
        <View style={styles.mapCard}>
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: activity.location.latitude,
                longitude: activity.location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              scrollEnabled={false}  // 禁用地图滑动
              zoomEnabled={false}    // 禁用缩放
            >
              {/* 活动位置标记 */}
              <Marker
                coordinate={{
                  latitude: activity.location.latitude,
                  longitude: activity.location.longitude,
                }}
                title={activity.location.name}
              >
                <View style={styles.activityMarker}>
                  <Ionicons name="location" size={24} color="#2196F3" />
                </View>
              </Marker>

              {/* 签到范围圈 */}
              <Circle
                center={{
                  latitude: activity.location.latitude,
                  longitude: activity.location.longitude,
                }}
                radius={parseInt(activity.signInRange)* 1000} // 转换为米
                fillColor="rgba(33, 150, 243, 0.1)"
                strokeColor="rgba(33, 150, 243, 0.3)"
                strokeWidth={2}
              />

              {/* 我的位置标记 */}
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="我的位置"
                >
                  <View style={styles.myLocationMarker}>
                    <Ionicons name="person" size={20} color="#4CAF50" />
                  </View>
                </Marker>
              )}
            </MapView>
            
            {/* 将导航按钮改为独立组件 */}
            <TouchableOpacity 
              style={styles.navigationButton}
              onPress={openNavigation}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.navigationText}>导航</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 签到状态卡片 */}
        <View style={styles.checkInCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, hasChecked && styles.checkedBadge]}>
              <Ionicons 
                name={hasChecked ? "checkmark-circle" : "time"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.statusText}>
                {hasChecked ? '已签到' : '待签到'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>签到范围</Text>
              <Text style={styles.infoValue}>{activity.signInRange}公里</Text>
            </View>
            {distance !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>当前距离</Text>
                <Text style={[
                  styles.infoValue,
                  { color: distance > activity.signInRange ? '#F44336' : '#4CAF50' }
                ]}>
                  {distance.toFixed(2)}公里
                </Text>
              </View>
            )}
          </View>

          {!hasChecked && (
            <TouchableOpacity
              style={[
                styles.checkInButton,
                (loading || !location || (distance && distance > activity.signInRange)) && 
                styles.buttonDisabled
              ]}
              onPress={handleCheckIn}
              disabled={loading || !location || (distance && distance > activity.signInRange)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="location" size={20} color="#fff" />
                  <Text style={styles.buttonText}>
                    {!location ? '获取位置中...' : 
                     (distance && distance > activity.signInRange) ? 
                     '超出签到范围' : '点击签到'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  activityImage: {
    width: '100%',
    height: 200,
  },
  activityInfo: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  organizerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  organizerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  checkInCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  checkedBadge: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRows: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  checkInButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    height: 200,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapHint: {
    color: '#fff',
    fontSize: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  activityMarker: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  myLocationMarker: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  navigationButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  navigationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CheckInScreen; 