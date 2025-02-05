import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface School {
  id: string;
  name: string;
}

interface SchoolPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (school: School) => void;
  selectedSchool?: string;
}

// 示例数据，实际应该从API获取
const SCHOOLS: School[] = [
  { id: '1', name: '浙江大学' },
  { id: '2', name: '复旦大学' },
  { id: '3', name: '上海交通大学' },
  { id: '4', name: '南京大学' },
  { id: '5', name: '武汉大学' },
  // ... 更多学校
];

export const SchoolPicker: React.FC<SchoolPickerProps> = ({
  visible,
  onClose,
  onSelect,
  selectedSchool,
}) => {
  const renderItem = ({ item }: { item: School }) => (
    <TouchableOpacity
      style={[
        styles.schoolItem,
        item.name === selectedSchool && styles.selectedItem,
      ]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <Text
        style={[
          styles.schoolName,
          item.name === selectedSchool && styles.selectedText,
        ]}
      >
        {item.name}
      </Text>
      {item.name === selectedSchool && (
        <Ionicons name="checkmark" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.pickerContainer}>
          <SafeAreaView style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>选择学校</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SCHOOLS}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    flex: 1,
    marginTop: 100,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: '#f0f9ff',
  },
  schoolName: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SchoolPicker; 