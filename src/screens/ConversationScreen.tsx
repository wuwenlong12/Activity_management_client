import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getConversations, deleteConversation } from '../api/chat';
import { Conversation } from '../api/chat/type';
import { useSocket } from '../hooks/useSocket';
import dayjs from 'dayjs';
import { useAppSelector } from '../store';
import { showNotification } from '../components/NotificationManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ConversationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();
  const currentUser = useAppSelector(state => state.auth.user);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  const fetchConversations = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getConversations({
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (res.code === 0) {
        const newList = res.data.list;
        if (isRefresh) {
          setConversations(newList);
        } else {
          setConversations(prev => [...prev, ...newList]);
        }
        setHasMore(newList.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchConversations(page + 1);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await deleteConversation(conversationId);
      if (res.code === 0) {
        setConversations(prev => prev.filter(c => c._id !== conversationId));
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 监听新消息
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (data) => {
      // 更新会话列表
      setConversations(prev => {
        // 先找找是否存在这个会话
        const index = prev.findIndex(c => 
          c._id === data.conversationId || // 优先匹配会话ID
          c.participants.some(p => p._id === data.message.sender._id)
        );

        if (index > -1) {
          // 更新现有会话
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lastMessage: {
              _id: data.message._id,
              type: data.message.type,
              content: data.message.content,
              createdAt: data.message.createdAt
            },
            unreadCount: data.message.sender._id !== currentUser?._id 
              ? updated[index].unreadCount + 1 
              : updated[index].unreadCount,
            updatedAt: new Date()
          };
          // 将更新的会话移到顶部
          const [updatedConversation] = updated.splice(index, 1);
          return [updatedConversation, ...updated];
        }

        // 创建新会话
        const newConversation = {
          _id: data.conversationId,
          participants: [
            data.message.sender,
            {
              _id: currentUser?._id || '',
              username: currentUser?.username || '',
              avatar: currentUser?.avatar || ''
            }
          ],
          lastMessage: {
            _id: data.message._id,
            type: data.message.type,
            content: data.message.content,
            createdAt: data.message.createdAt
          },
          unreadCount: data.message.sender._id !== currentUser?._id ? 1 : 0,
          updatedAt: new Date()
        };

        // 添加新会话到顶部
        return [newConversation, ...prev];
      });

      // 显示通知
      if (data.message.sender._id !== currentUser?._id) {
        showNotification(
          data.message.sender.username,
          getMessagePreview(data.message.type, data.message.content),
          'info',
          {
            path: 'Chat',
            query: {
              targetId: data.message.sender._id,
              userName: data.message.sender.username,
              userAvatar: data.message.sender.avatar
            }
          }
        );
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, currentUser]);

  const getMessagePreview = (type: string, content: string) => {
    switch (type) {
      case 'image':
        return '[图片]';
      case 'audio':
        return '[语音]';
      case 'video':
        return '[视频]';
      case 'location':
        return '[位置]';
      default:
        return content;
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherParticipant = item.participants.find(p => p._id !== currentUser?._id);
    if (!otherParticipant) return null;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', {
          targetId: otherParticipant._id,
          userName: otherParticipant.username,
          userAvatar: otherParticipant.avatar
        })}
      >
        <Image 
          source={{ uri: otherParticipant.avatar }}
          style={styles.avatar}
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text style={styles.username}>{otherParticipant.username}</Text>
            {item.lastMessage?.createdAt && (
              <Text style={styles.time}>
                {dayjs(item.lastMessage.createdAt).format('HH:mm')}
              </Text>
            )}
          </View>
          
          <View style={styles.bottomRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage 
                ? getMessagePreview(item.lastMessage.type, item.lastMessage.content)
                : '暂无消息'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>消息</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color="#999" />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>暂无消息</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color="#999" />
              <Text style={styles.footerText}>加载更多...</Text>
            </View>
          ) : null
        }
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
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    marginTop: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ConversationScreen; 