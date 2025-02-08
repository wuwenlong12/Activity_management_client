import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter, TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import { Notification } from './Notification';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  navigator?: { 
    path: string; 
    query?: Record<string, unknown> 
  };
}

export const NotificationManager = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('SafeArea Insets:', insets);
  }, [insets]);

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'SHOW_NOTIFICATION',
      (notification: NotificationData) => {
        setNotifications(prev => [...prev, notification]);
      }
    );

    return () => subscription.remove();
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationPress = (notification: NotificationData) => {
   console.log(notification.navigator);
   
    if (notification.navigator) {
      navigation.navigate(notification.navigator.path, notification.navigator.query);
    }
    removeNotification(notification.id);
  };

  return (
    <View 
      style={[
        styles.container,
      
      ]}
      pointerEvents="box-none"
    >
      {notifications.map(notification => (
        <TouchableOpacity
          key={notification.id}
          onPress={() => handleNotificationPress(notification)}
          style={styles.notification}
          activeOpacity={0.8}
        >
          <Notification
            title={notification.title}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        </TouchableOpacity>
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
    zIndex: 9999,
    elevation: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  notification: {
    width: '100%',
    marginVertical: 5,
  }
});

export const showNotification = (
  title: string,
  message: string,
  type: NotificationData['type'] = 'info',
  navigator?: { path: string; query?: Record<string, unknown> }
) => {
  DeviceEventEmitter.emit('SHOW_NOTIFICATION', {
    id: Math.random().toString(),
    title,
    message,
    type,
    navigator,
  });
}; 