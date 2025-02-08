import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NotificationSound, NotificationSoundNames } from '../types/notification';
import { useNotification } from '../hooks/useNotification';
import { useAppDispatch } from '../store';
import { setNotificationSound } from '../store/slices/settingsSlice';

export const NotificationSoundPicker = () => {
  const dispatch = useAppDispatch();
  const { currentSound, switchSound } = useNotification();

  const handleSelect = async (soundType: NotificationSound) => {
    dispatch(setNotificationSound(soundType));
    await switchSound(soundType);
  };

  return (
    <View style={styles.container}>
      {Object.values(NotificationSound).map((soundType) => (
        <TouchableOpacity
          key={soundType}
          style={[
            styles.option,
            currentSound === soundType && styles.selectedOption
          ]}
          onPress={() => handleSelect(soundType)}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>
              {NotificationSoundNames[soundType]}
            </Text>
            {currentSound === soundType && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  option: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  selectedOption: {
    backgroundColor: '#f8f8f8',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
  },
}); 