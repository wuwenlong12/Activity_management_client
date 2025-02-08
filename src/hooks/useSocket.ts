import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { initSocket, getSocket, disconnectSocket } from '../store/slices/socketSlice';
import { useNotification } from './useNotification';

// 定义消息类型
type MessageType = "success" | "info" | "warning" | "error";

interface SocketMessage {
  title: string;
  content: string;
  type: MessageType;
  navigator: { path: string; query?: Record<string, unknown> };
}

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const { isConnected } = useAppSelector(state => state.socket);
  const { showNotificationMessage } = useNotification();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  // 监听登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      // 如果未登录，断开连接
      disconnectSocket();
    } else if (!getSocket()) {
      // 如果已登录但没有连接，则初始化连接
      dispatch(initSocket());
    }
  }, [isAuthenticated, dispatch]);

  // 监听 socket 消息并处理通知
  useEffect(() => {
    if (!getSocket()) return;

    const handleNotification = (msg: SocketMessage) => {
      showNotificationMessage(msg);
    };

    getSocket()?.on("message", handleNotification);
    getSocket()?.on("update_participation_status", handleNotification);
    getSocket()?.on("new_participant", handleNotification);
    getSocket()?.on("new_checkin", handleNotification);

    return () => {
      getSocket()?.off("message", handleNotification);
      getSocket()?.off("update_participation_status", handleNotification);
      getSocket()?.off("new_participant", handleNotification);
      getSocket()?.off("new_checkin", handleNotification);
    };
  }, [getSocket(), showNotificationMessage]);

  return { 
    socket: getSocket(), 
    isConnected 
  };
};
