import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getCheckList } from "../api/check";
import dayjs from "dayjs";

type CheckInUser = {
  _id: string;
  username: string;
  avatar?: string;
  school?: {
    _id: string;
    name: string;
  };
  className?: string;
  studentId?: string;

  isCheckedIn: boolean;
  checkInTime?: string;
};

export const CheckInManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId, activityTitle } = route.params as {
    activityId: string;
    activityTitle: string;
  };

  const [users, setUsers] = useState<CheckInUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCheckList = async () => {
    try {
      const res = await getCheckList(activityId);
      if (res.code === 0) {
        setUsers(res.data);
      } else {
        Alert.alert("错误", res.message || "获取签到列表失败");
      }
    } catch (error) {
      Alert.alert("错误", "网络错误");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCheckList();
  }, [activityId]);

  // 渲染统计信息
  const renderStats = () => {
    const totalCount = users.length;
    const checkedInCount = users.filter((user) => user.isCheckedIn).length;
    const checkedInRate =
      totalCount > 0 ? ((checkedInCount / totalCount) * 100).toFixed(1) : 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>总人数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{checkedInCount}</Text>
            <Text style={styles.statLabel}>已签到</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{checkedInRate}%</Text>
            <Text style={styles.statLabel}>签到率</Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染用户列表项
  const renderUserItem = ({ item }: { item: CheckInUser }) => {
    if (!item) return null;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Image
            source={
              item.avatar
                ? { uri: item.avatar }
                : require("../../assets/logo.jpg")
            }
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {item.username || "未知用户"}
            </Text>
            {item.school && (
              <Text style={styles.schoolInfo}>
                {item.school?.name} {item.className || ""}
              </Text>
            )}
            {item.studentId && (
              <Text style={styles.studentId}>学号：{item.studentId}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isCheckedIn ? "#4CAF50" : "#FF9800" },
            ]}
          >
            <Text style={styles.statusText}>
              {item.isCheckedIn ? "已签到" : "未签到"}
            </Text>
            {item.checkInTime && (
              <Text style={styles.checkInTime}>
                {dayjs(item.checkInTime).format("HH:mm")}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>签到管理</Text>
          <View style={styles.placeholder} />
        </View>

        {renderStats()}

        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCheckList();
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无已通过的报名用户</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 32,
  },
  statsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  schoolInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  studentId: {
    fontSize: 13,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  checkInTime: {
    fontSize: 12,
    color: "#fff",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default CheckInManagementScreen;
