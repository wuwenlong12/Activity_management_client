import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationSound } from '../../types/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_STORAGE_KEY = '@notification_sound';

interface SettingsState {
  notificationSound: NotificationSound;
}

const initialState: SettingsState = {
  notificationSound: NotificationSound.IOS,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNotificationSound: (state, action: PayloadAction<NotificationSound>) => {
      state.notificationSound = action.payload;
      // 保存到本地存储
      AsyncStorage.setItem(SOUND_STORAGE_KEY, action.payload);
    },
  },
});

// 初始化加载设置
export const loadSettings = () => async (dispatch: any) => {
  try {
    const savedSound = await AsyncStorage.getItem(SOUND_STORAGE_KEY);
    if (savedSound) {
      dispatch(setNotificationSound(savedSound as NotificationSound));
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

export const { setNotificationSound } = settingsSlice.actions;
export default settingsSlice.reducer; 