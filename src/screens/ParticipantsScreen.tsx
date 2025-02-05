import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getActivityParticipants } from '../api/activity';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Participants'>;

interface Participant {
  id: string;
  name: string;
  avatar: any;
  joinTime: string;
}

export const ParticipantsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId, activityTitle } = route.params as { 
    activityId: string;
    activityTitle: string;
  };

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadParticipants = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const res = await getActivityParticipants(activityId, pageNum);
      if (res.code === 0) {
        if (pageNum === 1) {
          setParticipants(res.data.participants);
        } else {
          setParticipants(prev => [...prev, ...res.data.participants]);
        }
        setHasMore(participants.length < res.data.total);
      } else {
        Alert.alert('错误', res.message || '获取参与者列表失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络错误');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadParticipants(1);
  }, [loadParticipants]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadParticipants(nextPage);
    }
  }, [loading, hasMore, page, loadParticipants]);

  // 首次加载
  useEffect(() => {
    loadParticipants();
  }, []);

  const renderItem = ({ item }: { item: Participant }) => (
    <TouchableOpacity 
      style={styles.participantItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.time}>{item.joinTime}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>参与者</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={participants}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  list: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default ParticipantsScreen; 