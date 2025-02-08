import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumberPickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

export const NumberPicker: React.FC<NumberPickerProps> = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 999 
}) => {
  const handleChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '') {
      onChange('');
      return;
    }
    const val = Math.min(Math.max(parseInt(num, 10), min), max);
    onChange(val.toString());
  };

  return (
    <View style={styles.numberPickerContainer}>
      <TouchableOpacity
        style={[styles.numberButton, styles.decrementButton]}
        onPress={() => {
          const current = parseInt(value || '0', 10);
          if (current > min) {
            onChange((current - 1).toString());
          }
        }}
      >
        <Ionicons name="remove" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.numberInputContainer}>
        <TextInput
          style={styles.numberInput}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={3}
          placeholder="不限"
          textAlign="center"
          placeholderTextColor="#868E96"
        />
        <Text style={styles.numberUnit}>人</Text>
      </View>

      <TouchableOpacity
        style={[styles.numberButton, styles.incrementButton]}
        onPress={() => {
          const current = parseInt(value || '0', 10);
          if (current < max) {
            onChange((current + 1).toString());
          }
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  numberPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    backgroundColor: '#FF8787',
  },
  incrementButton: {
    backgroundColor: '#69DB7C',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  numberInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    padding: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  numberUnit: {
    fontSize: 16,
    color: '#868E96',
    marginLeft: 4,
    fontWeight: '500',
    width: 20,
  },
}); 