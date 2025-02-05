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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { MapView, Marker } from 'react-native-amap3d';

interface Message {
  id: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'location';
  content: string; // 文本消息时是文字内容，媒体消息时是URI
  senderId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'error';
  duration?: number; // 语音时长
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, userAvatar } = route.params as {
    userId: string;
    userName: string;
    userAvatar: any;
  };

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '你好！',
      senderId: userId,
      timestamp: '14:30',
      status: 'sent',
    },
    {
      id: '2',
      text: '你好，很高兴认识你！',
      senderId: 'me',
      timestamp: '14:31',
      status: 'sent',
    },
  ]);

  const flatListRef = useRef<FlatList>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video';
    uri: string;
  } | null>(null);
  
  const recording = useRef<Audio.Recording>();
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Message['location']>();

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // 模拟发送消息
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 1000);
  };

  const handleMediaPicker = async (mediaType: 'image' | 'video') => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要访问相册权限才能选择媒体文件');
        return;
      }

      // 选择媒体
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType === 'image' ? 
          ImagePicker.MediaTypeOptions.Images : 
          ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: mediaType,
          content: result.assets[0].uri,
          senderId: 'me',
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          status: 'sending',
        };

        setMessages(prev => [...prev, newMessage]);

        // 模拟上传
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
            )
          );
        }, 1500);
      }
    } catch (error) {
      Alert.alert('错误', '选择媒体文件失败');
    }
  };

  // 处理录音
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要麦克风权限才能录音');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;
      setIsRecording(true);
    } catch (error) {
      Alert.alert('错误', '开始录音失败');
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return;

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      setIsRecording(false);

      if (uri) {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'voice',
          content: uri,
          senderId: 'me',
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          status: 'sending',
          duration: 10, // 这里需要计算实际时长
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      Alert.alert('错误', '停止录音失败');
    }
  };

  // 处理位置发送
  const handleLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要位置权限才能发送位置');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'location',
        content: '位置信息',
        senderId: 'me',
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        status: 'sending',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: `${address[0]?.city || ''} ${address[0]?.street || ''}`,
        },
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      Alert.alert('错误', '获取位置失败');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === 'me';

    const renderContent = () => {
      switch (item.type) {
        case 'text':
          return (
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {item.content}
            </Text>
          );
        case 'image':
          return (
            <TouchableOpacity onPress={() => setPreviewMedia({ type: 'image', uri: item.content })}>
              <Image 
                source={{ uri: item.content }} 
                style={styles.mediaContent} 
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        case 'video':
          return (
            <TouchableOpacity onPress={() => setPreviewMedia({ type: 'video', uri: item.content })}>
              <Video
                source={{ uri: item.content }}
                style={styles.mediaContent}
                useNativeControls
                resizeMode="contain"
                isLooping={false}
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={40} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        case 'voice':
          return (
            <TouchableOpacity style={styles.voiceBubble}>
              <Ionicons name="volume-medium" size={20} color={isMine ? '#fff' : '#333'} />
              <View style={styles.voiceDuration}>
                <Text style={[styles.voiceText, isMine && styles.myVoiceText]}>
                  {item.duration}″
                </Text>
              </View>
            </TouchableOpacity>
          );
        case 'location':
          return (
            <TouchableOpacity 
              style={styles.locationBubble}
              onPress={() => {
                setSelectedLocation(item.location);
                setShowMap(true);
              }}
            >
              <View style={styles.locationPreview}>
                <MapView
                  style={styles.locationMap}
                  initialCameraPosition={{
                    target: {
                      latitude: item.location?.latitude || 0,
                      longitude: item.location?.longitude || 0,
                    },
                    zoom: 15,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    position={{
                      latitude: item.location?.latitude || 0,
                      longitude: item.location?.longitude || 0,
                    }}
                  />
                </MapView>
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationText, isMine && styles.myLocationText]}>
                  {item.location?.address}
                </Text>
                <Ionicons name="location" size={16} color={isMine ? '#fff' : '#666'} />
              </View>
            </TouchableOpacity>
          );
      }
    };

    return (
      <View style={[styles.messageRow, isMine && styles.myMessageRow]}>
        {!isMine && (
          <Image source={userAvatar} style={styles.avatar} />
        )}
        <View style={[
          styles.messageBubble, 
          isMine && styles.myMessageBubble,
          (item.type === 'image' || item.type === 'video') && styles.mediaBubble
        ]}>
          {renderContent()}
          <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>
            {item.timestamp}
            {isMine && (
              <Ionicons
                name={item.status === 'sending' ? 'time-outline' : 'checkmark-done'}
                size={12}
                color={item.status === 'sending' ? '#999' : '#4CAF50'}
                style={styles.statusIcon}
              />
            )}
          </Text>
        </View>
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{userName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => setIsVoiceMode(!isVoiceMode)}
          >
            <Ionicons 
              name={isVoiceMode ? 'keyboard-outline' : 'mic-outline'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {isVoiceMode ? (
            <Pressable
              style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Text style={styles.voiceButtonText}>
                {isRecording ? '松开发送' : '按住说话'}
              </Text>
            </Pressable>
          ) : (
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="发送消息..."
              multiline
              maxLength={500}
            />
          )}

          {message.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setShowMore(!showMore)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {showMore && (
          <View style={styles.morePanel}>
            <TouchableOpacity 
              style={styles.moreItem}
              onPress={() => handleMediaPicker('image')}
            >
              <View style={styles.moreItemIcon}>
                <Ionicons name="image-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.moreItemText}>图片</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.moreItem}
              onPress={() => handleMediaPicker('video')}
            >
              <View style={styles.moreItemIcon}>
                <Ionicons name="videocam-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.moreItemText}>视频</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.moreItem}
              onPress={handleLocation}
            >
              <View style={styles.moreItemIcon}>
                <Ionicons name="location-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.moreItemText}>位置</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 媒体预览模态框 */}
      <Modal
        visible={!!previewMedia}
        transparent={true}
        onRequestClose={() => setPreviewMedia(null)}
      >
        <View style={styles.previewModal}>
          <TouchableOpacity 
            style={styles.previewClose}
            onPress={() => setPreviewMedia(null)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {previewMedia?.type === 'image' ? (
            <Image
              source={{ uri: previewMedia.uri }}
              style={styles.previewContent}
              resizeMode="contain"
            />
          ) : (
            <Video
              source={{ uri: previewMedia?.uri }}
              style={styles.previewContent}
              useNativeControls
              resizeMode="contain"
              shouldPlay
              isLooping
            />
          )}
        </View>
      </Modal>

      {/* 地图预览模态框 */}
      <Modal
        visible={showMap}
        transparent={true}
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <TouchableOpacity 
              style={styles.mapClose}
              onPress={() => setShowMap(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>位置信息</Text>
            <View style={styles.placeholder} />
          </View>
          
          <MapView
            style={styles.fullMap}
            initialCameraPosition={{
              target: {
                latitude: selectedLocation?.latitude || 0,
                longitude: selectedLocation?.longitude || 0,
              },
              zoom: 15,
            }}
          >
            <Marker
              position={{
                latitude: selectedLocation?.latitude || 0,
                longitude: selectedLocation?.longitude || 0,
              }}
            />
          </MapView>
          
          <View style={styles.mapFooter}>
            <Text style={styles.mapAddress}>
              {selectedLocation?.address}
            </Text>
            <TouchableOpacity style={styles.navigationButton}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.navigationText}>导航</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  messageList: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageRow: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: '#FF6B6B',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.8)',
  },
  statusIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButton: {
    padding: 8,
  },
  voiceButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#FFE8E8',
  },
  voiceButtonText: {
    fontSize: 15,
    color: '#666',
  },
  moreButton: {
    padding: 8,
  },
  morePanel: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  moreItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  moreItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moreItemText: {
    fontSize: 12,
    color: '#666',
  },
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  voiceDuration: {
    marginLeft: 8,
  },
  voiceText: {
    fontSize: 14,
    color: '#333',
  },
  myVoiceText: {
    color: '#fff',
  },
  locationBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  myLocationText: {
    color: '#fff',
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 44,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  previewContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * 0.75,
  },
  mediaContent: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  mediaBubble: {
    padding: 4,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
  },
  locationPreview: {
    width: 200,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  locationMap: {
    width: '100%',
    height: '100%',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  mapClose: {
    padding: 4,
  },
  mapTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  fullMap: {
    flex: 1,
  },
  mapFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  mapAddress: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 24,
  },
  navigationText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ChatScreen; 