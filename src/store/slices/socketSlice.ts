import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

// 全局 socket 实例
let globalSocket: Socket | null = null;

interface SocketState {
  isConnected: boolean;
  error: string | null;
}

const initialState: SocketState = {
  isConnected: false,
  error: null,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setConnected, setError } = socketSlice.actions;

// Socket 初始化函数
export const initSocket = () => (dispatch: any) => {
  if (!globalSocket) {
    globalSocket = io('http://192.168.1.7:3000', {
        transports: ['websocket', 'polling'],  // 允许降级到 polling
        withCredentials: true,    // 必须，用于发送 cookie
        reconnection: true,       // 允许重连
        reconnectionAttempts: 5,  // 重试5次
        reconnectionDelay: 1000,  // 重试间隔
        timeout: 20000,          // 连接超时时间
        autoConnect: true,       // 自动连接
      });

    globalSocket.on('connect', () => {
      console.log('Socket connected:', globalSocket?.id);
      dispatch(setConnected(true));
      dispatch(setError(null));
    });

    globalSocket.on('connect_error', (error) => {
      console.error('Socket connection error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      dispatch(setError(error.message));
    });

    globalSocket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
      dispatch(setError('Connection timeout'));
    });

    globalSocket.on('error', (error) => {
      console.error('Socket error:', error);
      dispatch(setError('Socket error'));
    });

    globalSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      dispatch(setConnected(false));
    });
  }

  return globalSocket;
};

// 获取 socket 实例的函数
export const getSocket = () => globalSocket;

// 断开 socket 连接
export const disconnectSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
};

export default socketSlice.reducer; 