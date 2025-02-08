import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice'
import schoolReducer from './slices/schoolSlice';
import settingsReducer from './slices/settingsSlice';
import socketReducer from './slices/socketSlice';

const store = configureStore({
  reducer: {
    // 这里将添加各个 reducer
    auth: authReducer,
    school: schoolReducer,
    settings: settingsReducer,
    socket: socketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 创建类型化的 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store; 