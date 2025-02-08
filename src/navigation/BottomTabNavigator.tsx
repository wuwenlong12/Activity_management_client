import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Platform, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PublishScreen from '../screens/PublishScreen';
import ExploreScreen from '../screens/ExploreScreen';
import FeedScreen from '../screens/FeedScreen';
import ConversationScreen from '../screens/ConversationScreen';

// 定义路由参数类型
type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Publish: undefined;
  Feed: undefined;
  Profile: undefined;
  Conversation: undefined;
};

// 定义 CustomTabButton 的 props 类型
interface CustomTabButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  focused: boolean;
}

// 为 Tab 指定参数类型
const Tab = createBottomTabNavigator<TabParamList>();

const CustomTabButton: React.FC<CustomTabButtonProps> = ({ children, onPress, focused }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: focused ? -10 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: focused ? 1.2 : 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  }, [focused]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.customButton}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View 
        style={[
          styles.buttonContent,
          focused && styles.focusedContent,
          {
            transform: [
              { translateY },
              { scale }
            ],
            opacity
          }
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// 为 CustomTabBar 添加类型
const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <BlurView intensity={100} tint="light" style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName: keyof typeof Ionicons.glyphMap;
        switch (route.name) {
          case 'Home':
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'Explore':
            iconName = isFocused ? 'compass' : 'compass-outline';
            break;
          case 'Publish':
            iconName = 'add-circle';
            break;
          case 'Feed':
            iconName = isFocused ? 'newspaper' : 'newspaper-outline';
            break;
          case 'Profile':
            iconName = isFocused ? 'person' : 'person-outline';
            break;
          case 'Conversation':
            iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        return (
          <CustomTabButton
            key={route.key}
            focused={isFocused}
            onPress={onPress}
          >
            <Animated.View>
              <Ionicons
                name={iconName}
                size={route.name === 'Publish' ? 32 : 24}
                color={isFocused ? '#007AFF' : '#8E8E93'}
                style={route.name === 'Publish' ? styles.publishIcon : null}
              />
            </Animated.View>
          </CustomTabButton>
        );
      })}
    </BlurView>
  );
};

// 为 BottomTabNavigator 添加类型
export const BottomTabNavigator: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            display: 'none',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: '推荐'
          }}
        />
        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarLabel: '找活动'
          }}
        />
        <Tab.Screen
          name="Publish"
          component={PublishScreen}
          options={{
            tabBarLabel: '发布'
          }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{
            tabBarLabel: '动态'
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: '我的'
          }}
        />
        <Tab.Screen
          name="Conversation"
          component={ConversationScreen}
          options={{
            tabBarLabel: '消息'
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    // position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  customButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  focusedContent: {
    backgroundColor: '#f8f9fa',
    shadowOpacity: 0.2,
    elevation: 8,
  },
  publishIcon: {
    marginBottom: -4,
  }
}); 