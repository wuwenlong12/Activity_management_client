import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import { DeviceEventEmitter, StyleSheet, View } from 'react-native';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export const ToastManager = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (toast: ToastMessage) => {
      console.log('Received toast:', toast);
      setToasts(prev => [...prev, toast]);
    });

    return () => subscription.remove();
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <View style={styles.container}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onHide={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 9999,
  },
});

export const toastManager = {
  show: (message: string, title?: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString();
    DeviceEventEmitter.emit('SHOW_TOAST', { id, message, title, type });
  },
}; 