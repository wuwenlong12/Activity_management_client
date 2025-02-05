import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PublishScreen from '../screens/PublishScreen';
import ExploreScreen from '../screens/ExploreScreen';
import FeedScreen from '../screens/FeedScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAppSelector } from '../store';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.publishButton}
    onPress={onPress}
  >
    <View style={styles.publishButtonInner}>
      {children}
    </View>
  </TouchableOpacity>
);

export const BottomTabNavigator = () => {


  return (
    <>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: '推荐',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="heart-outline" size={size} color={color} />
              ),
            }}
          />
          
          <Tab.Screen
            name="Explore"
            component={ExploreScreen}
            options={{
              tabBarLabel: '找活动',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="compass-outline" size={size} color={color} />
              ),
            }}
          />
          
          <Tab.Screen
            name="Publish"
            component={PublishScreen}
            options={{
              tabBarLabel: '',
              tabBarIcon: ({ size }) => (
                <Ionicons name="add-circle" size={size * 1.5} color="#007AFF" />
              ),
              tabBarButton: (props) => <CustomTabBarButton {...props} />,
            }}
          />
          
          <Tab.Screen
            name="Feed"
            component={FeedScreen}
            options={{
              tabBarLabel: '动态',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="newspaper-outline" size={size} color={color} />
              ),
            }}
          />
          
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarLabel: '我的',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 60,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  publishButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 