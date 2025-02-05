import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  joinTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const ParticipantManagementScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { activityId, activityTitle } = route.params as { activityId: string; activityTitle: string };
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    // TODO: 获取参与者列表
  }, []);

  const handleStatusChange = (participantId: string, newStatus: 'approved' | 'rejected') => {
    // TODO: 调用更新状态API
    Alert.alert('成功', '状态已更新');
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{dayjs(item.joinTime).format('YYYY-MM-DD HH:mm')}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleStatusChange(item.id, 'approved')}
            >
              <Text style={styles.actionButtonText}>通过</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusChange(item.id, 'rejected')}
            >
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>拒绝</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status !== 'pending' && (
          <Text style={[
            styles.statusText,
            item.status === 'approved' ? styles.approvedText : styles.rejectedText
          ]}>
            {item.status === 'approved' ? '已通过' : '已拒绝'}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>报名管理</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
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
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#007AFF',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  rejectButtonText: {
    color: '#FF3B30',
  },
  statusText: {
    fontSize: 14,
  },
  approvedText: {
    color: '#4CD964',
  },
  rejectedText: {
    color: '#FF3B30',
  },
});

export default ParticipantManagementScreen; 