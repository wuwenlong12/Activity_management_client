import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { MapView, Marker } from 'react-native-amap3d';
import { useAppSelector, useAppDispatch } from '../store';
import { getMessages } from '../api/chat';
import { Message, MessageType } from '../api/chat/type';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '../hooks/useSocket';
import dayjs from 'dayjs';

interface ChatMessage extends Message {
  sending?: boolean;
  failed?: boolean;
  localId?: string; // 本地消息ID
}

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { targetId, userName, userAvatar } = route.params as {
    targetId: string;
    userName: string;
    userAvatar: string;
  };

  const { socket, isConnected } = useSocket();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording'>('idle');
  const [showMore, setShowMore] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const PAGE_SIZE = 20;

  // 获取历史消息
  const fetchMessages = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getMessages({
        targetId,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (res.code === 0) {
        const newMessages = res.data.list;
        if (isRefresh) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }
        setHasMore(newMessages.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取消息记录失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages(1, true);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchMessages(page + 1);
  };

  // 修改 keyExtractor 函数
  const keyExtractor = (item: ChatMessage) => {
    // 优先使用 localId，如果没有则使用 _id
    return item.localId || item._id;
  };

  // 修改发送消息的函数
  const handleSend = () => {
    if (!inputText.trim() || !socket || !currentUser) return;
    
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageContent = inputText.trim();
    setInputText('');

    const tempMessage = {
      _id: localId,
      localId,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      type: 'text',
      content: messageContent,
      createdAt: new Date(),
      isRead: false,
      sending: true,
    };

    setMessages(prev => [tempMessage, ...prev]);

    socket.emit('send_message', {
      receiverId: targetId,
      type: 'text',
      content: messageContent,
    });
  };

  // 重试发送消息
  const handleRetry = (message: ChatMessage) => {
    if (!socket) return;

    setMessages(prev => prev.map(msg => 
      msg.localId === message.localId 
        ? { ...msg, sending: true, failed: false }
        : msg
    ));

    socket.emit('send_message', {
      receiverId: targetId,
      type: message.type,
      content: message.content,
    });
  };

  // 监听消息相关事件
  useEffect(() => {
    if (!socket) return;

    // 接收新消息
    socket.on('receive_message', (data) => {
      console.log('Received message:', data);
      if (data.message.sender._id === targetId) {
        setMessages(prev => [data.message, ...prev]);
      }
    });

    // 消息发送成功
    socket.on('message_sent', ({ messageId, conversationId }) => {
      console.log('Message sent successfully:', messageId, conversationId);
      setMessages(prev => prev.map(msg => 
        msg.sending // 找到正在发送的消息
          ? { ...msg, _id: messageId, sending: false }
          : msg
      ));
    });

    // 消息发送失败
    socket.on('message_error', ({ message, error }) => {
      console.error('Message send error:', error);
      Alert.alert('发送失败', message);
      setMessages(prev => prev.map(msg => 
        msg.sending // 找到正在发送的消息
          ? { ...msg, sending: false, failed: true }
          : msg
      ));
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_sent');
      socket.off('message_error');
    };
  }, [socket, targetId]);

  // 初始加载消息
  useEffect(() => {
    fetchMessages(1, true);
  }, [targetId]);

  // 发送图片消息
  const handleSendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && socket) {
        setUploading(true);
        const imageUrl = await uploadFileInChunks(result.assets[0]);
        
        if (imageUrl) {
          socket.emit('send_message', {
            receiverId: targetId,
            type: 'image',
            content: imageUrl,
            size: result.assets[0].fileSize,
          });
        }
      }
    } catch (error) {
      Alert.alert('错误', '发送图片失败');
    } finally {
      setUploading(false);
      setShowImagePicker(false);
    }
  };

  // 发送视频消息
  const handleSendVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0] && socket) {
        setUploading(true);
        const videoUrl = await uploadFileInChunks(result.assets[0]);
        
        if (videoUrl) {
          socket.emit('send_message', {
            receiverId: targetId,
            type: 'video',
            content: videoUrl,
            duration: result.assets[0].duration,
            size: result.assets[0].fileSize,
          });
        }
      }
    } catch (error) {
      Alert.alert('错误', '发送视频失败');
    } finally {
      setUploading(false);
      setShowMore(false);
    }
  };

  // 发送位置消息
  const handleSendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限', '需要位置权限才能发送位置');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0] && socket) {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: `${address[0].city || ''} ${address[0].street || ''} ${address[0].name || ''}`.trim(),
        };

        socket.emit('send_message', {
          receiverId: targetId,
          type: 'location',
          content: JSON.stringify(locationData),
          location: locationData,
        });
      }
    } catch (error) {
      Alert.alert('错误', '获取位置信息失败');
    } finally {
      setShowMore(false);
    }
  };

  // 发送语音消息
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限', '需要麦克风权限才能录音');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setRecordingStatus('recording');
    } catch (error) {
      console.error('开始录音失败:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri && socket) {
        const audioUrl = await uploadFileInChunks({ uri });
        if (audioUrl) {
          socket.emit('send_message', {
            receiverId: targetId,
            type: 'audio',
            content: audioUrl,
          });
        }
      }
    } catch (error) {
      console.error('停止录音失败:', error);
    } finally {
      setRecording(null);
      setRecordingStatus('idle');
    }
  };

  // 渲染消息气泡
  const renderMessageBubble = (message: ChatMessage) => {
    const isSelf = message.sender._id === currentUser?._id;

    switch (message.type) {
      case 'image':
        return (
          <Image 
            source={{ uri: message.content }}
            style={styles.imageMessage}
            resizeMode="cover"
          />
        );
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: message.content }}
              style={styles.videoMessage}
              useNativeControls
              resizeMode="cover"
            />
            <View style={styles.videoDuration}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.durationText}>
                {Math.floor(message.duration || 0)}秒
              </Text>
            </View>
          </View>
        );
      case 'location':
        try {
          const locationData = JSON.parse(message.content);
          return (
            <View style={styles.locationContainer}>
              <MapView
                style={styles.locationMap}
                center={{
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                }}
                zoom={15}
              >
                <Marker
                  position={{
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                  }}
                />
              </MapView>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {locationData.address}
              </Text>
            </View>
          );
        } catch {
          return <Text style={styles.errorText}>位置信息解析失败</Text>;
        }
      case 'audio':
        return (
          <TouchableOpacity style={styles.audioMessage}>
            <Ionicons name="volume-medium" size={20} color="#fff" />
            <Text style={styles.audioText}>语音消息</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            isSelf ? styles.selfText : styles.otherText
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  const renderMorePanel = () => (
    <View style={styles.morePanel}>
      <View style={styles.moreRow}>
        <TouchableOpacity style={styles.moreItem} onPress={handleSendImage}>
          <View style={styles.moreIconWrap}>
            <Ionicons name="image" size={24} color="#666" />
          </View>
          <Text style={styles.moreText}>图片</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreItem} onPress={handleSendVideo}>
          <View style={styles.moreIconWrap}>
            <Ionicons name="videocam" size={24} color="#666" />
          </View>
          <Text style={styles.moreText}>视频</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreItem} onPress={handleSendLocation}>
          <View style={styles.moreIconWrap}>
            <Ionicons name="location" size={24} color="#666" />
          </View>
          <Text style={styles.moreText}>位置</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{userName}</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            item.sender._id === currentUser?._id ? styles.selfMessage : styles.otherMessage
          ]}>
            {item.sender._id !== currentUser?._id && (
              <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
            )}
            <View style={[
              styles.messageBubble,
              item.sender._id === currentUser?._id ? styles.selfBubble : styles.otherBubble
            ]}>
              {renderMessageBubble(item)}
              {item.sending && (
                <ActivityIndicator 
                  size="small" 
                  color={item.sender._id === currentUser?._id ? "#fff" : "#999"} 
                  style={styles.sendingIndicator} 
                />
              )}
              {item.failed && (
                <TouchableOpacity 
                  onPress={() => handleRetry(item)}
                  style={styles.retryButton}
                >
                  <Ionicons name="refresh" size={16} color="#FF3B30" />
                  <Text style={styles.retryText}>重试</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        inverted
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator color="#999" />
            <Text style={styles.loadingText}>加载更多...</Text>
          </View>
        ) : null}
        contentContainerStyle={styles.messageList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.bottom + 44}
      >
        <View style={styles.toolbar}>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => setIsVoiceMode(!isVoiceMode)}
          >
            <Ionicons 
              name={isVoiceMode ? "keyboard" : "mic"} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {isVoiceMode ? (
            <TouchableOpacity 
              style={styles.voiceButton}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Text style={styles.voiceButtonText}>
                按住说话
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入消息..."
              multiline
              maxHeight={100}
            />
          )}

          {inputText.trim() ? (
            <TouchableOpacity 
              style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!isConnected}
            >
              <Text style={styles.sendText}>
                {isConnected ? '发送' : '连接中...'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={() => setShowMore(!showMore)}
            >
              <Ionicons name="add-circle" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {showMore && renderMorePanel()}
      </KeyboardAvoidingView>
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
    height: 44,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 44,
  },
  messageList: {
    paddingHorizontal: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  toolButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
  },
  voiceButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  voiceButtonText: {
    fontSize: 15,
    color: '#666',
  },
  sendButton: {
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  morePanel: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  moreRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  moreItem: {
    alignItems: 'center',
    marginRight: 32,
  },
  moreIconWrap: {
    width: 56,
    height: 56,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moreText: {
    fontSize: 12,
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    padding: 8,
    marginVertical: 4,
  },
  selfMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  selfBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  selfText: {
    color: '#fff',
  },
  otherText: {
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#007AFF',
  },
  audioText: {
    color: '#fff',
    marginLeft: 8,
  },
  sendingIndicator: {
    marginLeft: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  retryText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoMessage: {
    width: '100%',
    height: '100%',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  locationContainer: {
    width: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  locationMap: {
    width: '100%',
    height: 120,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    padding: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen; 