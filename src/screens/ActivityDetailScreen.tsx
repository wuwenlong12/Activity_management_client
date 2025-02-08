import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Toast,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAppSelector } from "../store";
import type { RootState } from "../store";
import dayjs from "dayjs";
import MapView, { Marker } from "react-native-maps";
import { Activity } from "../api/activity/type";
import { getActivityById } from "../api/activity";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  cancelParticipation,
  participateInActivity,
} from "../api/participation";
import { addFavorite, removeFavorite } from '../api/favorite';

// 更新状态颜色映射，添加 notStart 状态
const STATUS_COLORS = {
  notStart: '#9E9E9E',   // 未开始 - 灰色
  pending: '#4CAF50',    // 报名中 - 绿色
  upcoming: '#FF9800',   // 即将开始 - 橙色
  proceed: '#2196F3',    // 进行中 - 蓝色
  cancelled: '#F44336',  // 已取消 - 红色
  over: '#9E9E9E',      // 已结束 - 灰色
} as const;

// 更新状态文本映射
const STATUS_TEXT = {
  notStart: '未开始',
  pending: '报名中',
  upcoming: '即将开始',
  proceed: '进行中',
  cancelled: '已取消',
  over: '已结束',
} as const;

// 添加活动状态类型定义
type ActivityStatus = keyof typeof STATUS_COLORS;

// 时间节点颜色
const TIME_POINT_COLORS = {
  signUpStart: '#4CAF50',  // 报名开始 - 绿色
  signUpEnd: '#F44336',    // 报名结束 - 红色
  activityStart: '#FF9800', // 活动开始 - 橙色
  activityEnd: '#9C27B0'    // 活动结束 - 紫色
} as const;

// 添加参与者类型定义
interface Participant {
  id: string;
  name: string;
  avatar: any;
  joinTime: string;
  role?: string;
  status?: string;
}
type NavigationProp = StackNavigationProp<RootStackParamList, "ActivityDetail">;
export const ActivityDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { activityId } = route.params as { activityId: string };
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [activityStatus, setActivityStatus] = useState<
    "notStart" | "pending" | "upcoming" | "proceed" | "cancelled" | "over"
  >("pending");
  const [participationStatus, setParticipationStatus] = useState<
   "none" | "pending" | "confirmed" | "cancelled" | "rejected"
  >("none");
  const [isCreator, setIsCreator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // 每次页面聚焦时都重新获取数据
      init();
    });

    return unsubscribe;
  }, [navigation, activityId]);

  const init = async () => {
    try {
      const res = await getActivityById(activityId);
      if (res.code === 0 && res.data) {
        setActivity(res.data);
        setActivityStatus(res.data.status);
        setParticipationStatus(res.data.participationStatus);
        setIsCreator(res.data.isCreator);
        setIsFavorite(res.data.isFavorite);
        console.log("活动数据已更新:", res.data);
      } else {
        Alert.alert("错误", "无法获取活动数据");
      }
    } catch (error) {
      console.error("获取活动数据失败:", error);
      Alert.alert("错误", "获取活动数据失败");
    }
  };

  const handleSignUp = () => {
    Alert.alert("确认报名", "是否确认报名参加该活动？", [
      {
        text: "取消",
        style: "cancel",
      },
      {
        text: "确认",
        onPress: async () => {
          // TODO: 调用报名API
          const res = await participateInActivity(activityId);
          if (res.code === 0) {
            init()
            Alert.alert("成功", "报名成功！请耐心等待管理员审核");
          } else {
            Alert.alert("失败", res.message);
          }
        },
      },
    ]);
  };

  const handleToggleFavorite = async () => {
    if (favoriteLoading) return;
    
    try {
      setFavoriteLoading(true);
      const res = await (isFavorite ? removeFavorite(activityId) : addFavorite(activityId));
      
      if (res.code === 0) {
        setIsFavorite(!isFavorite);
        Toast.show({
          type: 'success',
          text1: isFavorite ? '已取消收藏' : '已收藏',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '操作失败',
          text2: res.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '操作失败',
        text2: '网络错误',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const renderParticipant = (participant: Participant) => (
    <TouchableOpacity
      key={participant.id}
      style={styles.participantItem}
      onPress={() =>
        navigation.navigate("UserProfile", { userId: participant.id })
      }
    >
      <Image
        source={participant.avatar ? { uri: participant.avatar  } : require('../../assets/logo.jpg')} 
        style={styles.participantAvatar}
      />
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{participant.name}</Text>
        <Text style={styles.joinTime}>
          {participant.joinTime
            ? dayjs(participant.joinTime).format("YYYY-MM-DD HH:mm:ss")
            : "时间未提供"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooterButton = () => {
    if (!activity) return null;
    if (activityStatus === "notStart") {
      return (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
            <Text style={styles.footerButtonText}>活动未开始</Text>
          </TouchableOpacity> 
        </View>
      );
    }
    
    if (activityStatus === "over") {
      return (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
            <Text style={styles.footerButtonText}>报名已结束</Text>
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
              <Text style={styles.footerButtonText}>编辑</Text>
            </TouchableOpacity>
          )}

          {isCreator && (
            <TouchableOpacity
              style={[styles.footerButton, styles.manageButton]}
              onPress={() =>
                navigation.navigate("ParticipantManagement", {
                  activityId: activity.id,
                  activityTitle: activity.title,
                })
              }
            >
              <Text style={styles.footerButtonText}>管理报名</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (activityStatus === "cancelled") {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelledButton]}
          >
            <Text style={styles.footerButtonText}>活动已取消</Text>
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
              <Text style={styles.footerButtonText}>编辑</Text>
            </TouchableOpacity>
          )}

          {isCreator && (
            <TouchableOpacity
              style={[styles.footerButton, styles.manageButton]}
              onPress={() =>
                navigation.navigate("ParticipantManagement", {
                  activityId: activity.id,
                  activityTitle: activity.title,
                })
              }
            >
              <Text style={styles.footerButtonText}>管理报名</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (activityStatus === "proceed") {
      return (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
            <Text style={styles.footerButtonText}>正在进行中</Text>
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
              <Text style={styles.footerButtonText}>编辑</Text>
            </TouchableOpacity>
          )}

          {isCreator && (
            <TouchableOpacity
              style={[styles.footerButton, styles.manageButton]}
              onPress={() =>
                navigation.navigate("ParticipantManagement", {
                  activityId: activity.id,
                  activityTitle: activity.title,
                })
              }
            >
              <Text style={styles.footerButtonText}>管理报名</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (activityStatus === "upcoming") {
      return (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
            <Text style={styles.footerButtonText}>即将开始</Text>
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity style={[styles.footerButton, styles.overButton]}>
              <Text style={styles.footerButtonText}>编辑</Text>
            </TouchableOpacity>
          )}

          {isCreator && (
            <TouchableOpacity
              style={[styles.footerButton, styles.manageButton]}
              onPress={() =>
                navigation.navigate("ParticipantManagement", {
                  activityId: activity.id,
                  activityTitle: activity.title,
                })
              }
            >
              <Text style={styles.footerButtonText}>管理报名</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (activityStatus === "pending") {
      return (
        <View style={styles.footer}>
          {isCreator ? (
            <TouchableOpacity
              style={[styles.footerButton, styles.signUpButton]}
            >
              <Text style={styles.footerButtonText}>报名中...</Text>
            </TouchableOpacity>
          ) : (
            <>
              {participationStatus === "pending" && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.cancelButton]}
                  onPress={() => {
                    Alert.alert("取消报名", "确定要取消报名吗？", [
                      { text: "取消", style: "cancel" },
                      {
                        text: "确定",
                        onPress: async () => {
                          // TODO: 调用取消报名API
                          const res = await cancelParticipation(activityId);
                          if (res.code === 0) {
                            init()
                            Alert.alert("成功", "已取消报名");
                          } else {
                            Alert.alert("失败", res.message);
                          }
                        },
                      },
                    ]);
                  }}
                >
                  <Text
                    style={[styles.footerButtonText, styles.cancelButtonText]}
                  >
                    取消报名
                  </Text>
                </TouchableOpacity>
              )}
              {participationStatus === "none" && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.signUpButton]}
                  onPress={handleSignUp}
                >
                  <Text style={styles.footerButtonText}>立即报名</Text>
                </TouchableOpacity>
              )}
              {participationStatus === "confirmed" && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.successButton]}
                >
                  <Text style={styles.footerButtonText}>报名成功，请按时参加活动</Text>
                </TouchableOpacity>
              )}
              {participationStatus === "cancelled" && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.overButton]}
                  onPress={handleSignUp}
                >
                  <Text style={styles.footerButtonText}>
                    报名已取消，点击重新报名
                  </Text>
                </TouchableOpacity>
              )}
              {participationStatus === "rejected" && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.overButton]}
                >
                  <Text style={styles.footerButtonText}>
                    下次再来报名吧，已被拒绝
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {isCreator && (
            <TouchableOpacity 
              style={[styles.footerButton, styles.overButton]}
              onPress={() => navigation.navigate('EditActivity', { 
                activityId: activity.id,
                onUpdate: () => {
                  // 编辑完成后重新获取数据
                  init();
                }
              })}
            >
              <Text style={styles.footerButtonText}>编辑</Text>
            </TouchableOpacity>
          )}

          {isCreator && (
            <TouchableOpacity
              style={[styles.footerButton, styles.manageButton]}
              onPress={() =>
                navigation.navigate("ParticipantManagement", {
                  activityId: activity.id,
                  activityTitle: activity.title,
                })
              }
            >
              <Text style={styles.footerButtonText}>管理报名</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // 在渲染活动操作按钮的地方添加管理报名按钮
    {isCreator && (
      <View style={styles.creatorActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.manageButton]}
          onPress={() => navigation.navigate('ParticipantManagement', {
            activityId: activity.id,
            activityTitle: activity.title
          })}
        >
          <Ionicons name="people" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>管理报名</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditActivity', { 
            activityId: activity.id,
            onUpdate: () => {
              init();
            }
          })}
        >
          <Ionicons name="create" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>编辑活动</Text>
        </TouchableOpacity>
      </View>
    )}
  };

  const renderTimeInfo = () => (
    <View style={styles.timeContainer}>
      <View style={styles.timeHeader}>
        <Ionicons name="time" size={20} color="#1E88E5" />
        <Text style={styles.timeTitle}>活动时间</Text>
      </View>
      
      <View style={styles.timeline}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timePoint, { backgroundColor: TIME_POINT_COLORS.signUpStart }]} />
          <View style={styles.timelineLine} />
          <View style={[styles.timePoint, { backgroundColor: TIME_POINT_COLORS.signUpEnd }]} />
          <View style={styles.timelineLine} />
          <View style={[styles.timePoint, { backgroundColor: TIME_POINT_COLORS.activityStart }]} />
          <View style={styles.timelineLine} />
          <View style={[styles.timePoint, { backgroundColor: TIME_POINT_COLORS.activityEnd }]} />
        </View>
        
        <View style={styles.timelineRight}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>报名开始</Text>
            <Text style={styles.timeValue}>
              {dayjs(activity.signUpStartTime).format('MM月DD日 HH:mm')}
            </Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>报名截止</Text>
            <Text style={styles.timeValue}>
              {dayjs(activity.signUpEndTime).format('MM月DD日 HH:mm')}
            </Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>活动开始</Text>
            <Text style={styles.timeValue}>
              {dayjs(activity.startTime).format('MM月DD日 HH:mm')}
            </Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>活动结束</Text>
            <Text style={styles.timeValue}>
              {dayjs(activity.endTime).format('MM月DD日 HH:mm')}
            </Text>
          </View>
        </View>
      </View>
      
      {/* 添加当前状态指示 */}
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[activityStatus] }]} />
        <Text style={styles.statusText}>
          {getStatusText(activityStatus, activity)}
        </Text>
      </View>
    </View>
  );

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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, favoriteLoading && styles.actionButtonDisabled]}
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF2D55" : "#333"}
            />
          </TouchableOpacity>
        </View>
      </View>
      {activity && (
        <ScrollView style={styles.content}>
          {/* 活动封面图 */}
          <Image
          
        source={activity?.image ? { uri: activity?.image } : require('../../assets/logo.jpg')} 

            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* 活动信息 */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>
              {activity.title || "活动标题未提供"}
            </Text>

            <View style={styles.organizerInfo}>
              <Image
              source={activity.organizer.avatar ? { uri:activity.organizer.avatar } : require('../../assets/logo.jpg')} 
                
                style={styles.organizerAvatar}
              />
              <Text style={styles.organizerName}>
                {activity.organizer.name}
              </Text>
              {activity.organizer.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={20} color="#666" />
                <Text style={styles.statText}>
                  {activity.participants_count}人参与
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.statText}>
                  {dayjs(activity.date).format("YYYY-MM-DD HH:mm:ss")}
                </Text>
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
              <Text style={styles.description}>{activity.description}</Text>
            </View>

            {/* 活动须知 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动须知</Text>
              <View style={styles.noticeList}>
                {activity.notices.map((notice, index) => (
                  <View key={index} style={styles.noticeItem}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={20}
                      color="#FF6B6B"
                    />
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
                      navigation.navigate("Participants", {
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

            {/* 在活动信息部分添加时间信息组件 */}
            <View style={styles.contentSection}>
              {renderTimeInfo()}
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: "100%",
    height: 240,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#666",
    marginRight: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: "#666",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  noticeList: {
    gap: 12,
  },
  noticeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeText: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  footerButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  signUpButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  manageButton: {
    backgroundColor: "#007AFF",
  },
  footerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overButton: {
    backgroundColor: "#666",
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  cancelledButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButtonText: {
    color: "#FF3B30",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  participantCount: {
    fontSize: 14,
    color: "#666",
  },
  participantsList: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
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
    color: "#333",
    fontWeight: "500",
    marginBottom: 2,
  },
  joinTime: {
    fontSize: 12,
    color: "#999",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  mapContainer: {
    height: 200,
    marginVertical: 16,
  },
  map: {
    flex: 1,
  },
  creatorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  timeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  timeline: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  timePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 16,
  },
  timeItem: {
    height: 50,
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  contentSection: {
    marginBottom: 20,
  },
});

// 修改 getStatusText 函数
const getStatusText = (status: ActivityStatus, activity: Activity) => {
  const now = dayjs();
  const signUpStart = dayjs(activity.signUpStartTime);
  const signUpEnd = dayjs(activity.signUpEndTime);
  const activityStart = dayjs(activity.startTime);
  const activityEnd = dayjs(activity.endTime);

  if (status === 'cancelled') {
    return '活动已取消';
  }

  if (now.isBefore(signUpStart)) {
    return `报名未开始（还有${signUpStart.diff(now, 'day')}天）`;
  } else if (now.isBefore(signUpEnd)) {
    return `报名进行中（剩余${signUpEnd.diff(now, 'day')}天）`;
  } else if (now.isBefore(activityStart)) {
    return `报名已截止（${activityStart.diff(now, 'day')}天后开始）`;
  } else if (now.isBefore(activityEnd)) {
    return '活动进行中';
  } else {
    return '活动已结束';
  }
};

export default ActivityDetailScreen;
