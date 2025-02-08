import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

interface NotificationProps {
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose?: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const icons = {
    success: 'checkmark-circle',
    info: 'information-circle',
    warning: 'warning',
    error: 'alert-circle',
  };

  const colors = {
    success: '#34C759',
    info: '#007AFF',
    warning: '#FF9500',
    error: '#FF3B30',
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      hide();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const NotificationContent = () => (
    <View style={styles.content}>
      <Ionicons 
        name={icons[type] as any} 
        size={24} 
        color={colors[type]} 
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          marginTop: insets.top,
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <NotificationContent />
        </BlurView>
      ) : (
        <View style={[styles.blurContainer, styles.androidContainer]}>
          <NotificationContent />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    zIndex: 999,
    alignItems: 'center',
  },
  blurContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  androidContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 8,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
    opacity: 0.9,
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
}); 