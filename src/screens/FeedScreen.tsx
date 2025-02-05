import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const FeedScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>动态页面</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeedScreen; 