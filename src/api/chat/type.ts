import { User } from "../auth/type";
import { ResponseBase } from "../type";

// 消息类型
export type MessageType = "text" | "image" | "video" | "audio" | "location";

// 位置信息
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

// 消息发送者/接收者
export interface MessageParticipant extends Pick<User, '_id' | 'username' | 'avatar'> {}

// 聊天消息
export interface Message {
  _id: string;
  sender: MessageParticipant;
  receiver: MessageParticipant;
  type: MessageType;
  content: string;
  duration?: number;  // 音频/视频时长
  location?: Location;
  size?: number;  // 媒体文件大小
  isRead: boolean;
  createdAt: Date;
}

// 获取消息列表响应
export interface ResponseGetMessages extends ResponseBase {
  data: {
    list: Message[];
    total: number;
    page: number;
    limit: number;
  };
}

// 最后一条消息
export interface LastMessage {
  _id: string;
  type: MessageType;
  content: string;
  createdAt: Date;
}

// 会话参与者
export interface Participant extends Pick<User, '_id' | 'username' | 'avatar'> {}

// 会话信息
export interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage: LastMessage;
  unreadCount: number;
  updatedAt: Date;
}

// 会话列表响应
export interface ResponseGetConversations extends ResponseBase {
  data: {
    list: Conversation[];
    total: number;
    page: number;
    limit: number;
  };
} 