import http from "..";
import { ResponseGetConversations, ResponseGetMessages } from "./type";
import { ResponseBase } from "../type";

enum API {
  CONVERSATIONS = "/chat/conversations",
  MESSAGES = "/chat/messages",
  DELETE_CONVERSATION = "/chat/conversation",
}

// 获取会话列表
export const getConversations = (params: { page?: number; limit?: number }) =>
  http.get<any, ResponseGetConversations>(API.CONVERSATIONS, {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });

// 获取聊天消息列表
export const getMessages = (params: {
  targetId: string;
  page?: number;
  limit?: number;
}) =>
  http.get<any, ResponseGetMessages>(API.MESSAGES, {
    params: {
      targetId: params.targetId,
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });

// 删除会话
export const deleteConversation = (conversationId: string) =>
  http.delete<any, ResponseBase>(`${API.DELETE_CONVERSATION}/${conversationId}`); 