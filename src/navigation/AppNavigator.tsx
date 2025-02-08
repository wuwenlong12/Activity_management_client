import React, { useEffect } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { checkLoginStatus } from '../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { ActivityIndicator, View } from 'react-native';
import { RootState } from '../store';
import EditProfileScreen from '../screens/EditProfileScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ParticipantsScreen from '../screens/ParticipantsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import PublishScreen from '../screens/PublishScreen';
import VerifyScreen from '../screens/VerifyScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ParticipantManagementScreen from '../screens/ParticipantManagementScreen';
import MyActivitiesScreen from '../screens/MyActivitiesScreen';
import SearchScreen from '../screens/SearchScreen';
import EditActivityScreen from '../screens/EditActivityScreen';
import CheckInManagementScreen from '../screens/CheckInManagementScreen';
import CheckInScreen from '../screens/CheckInScreen';
import { io } from "socket.io-client";
import { useSocket } from '../hooks/useSocket';
import SettingsScreen from '../screens/SettingsScreen';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { setNavigationRef } from '../components/NotificationManager';
import { NotificationScreen } from '../screens/NotificationScreen';
import FavoriteListScreen from '../screens/FavoriteListScreen';
import FollowListScreen from '../screens/FollowListScreen';

// 定义导航参数类型
export type RootStackParamList = {
  Home: undefined;
  ActivityDetail: { activityId: string };
  UserProfile: {
    userId: string;
  };
  Participants: { activityId: string; activityTitle: string };
  Explore: undefined;
  ParticipantManagement: { 
    activityId: string; 
    activityTitle: string;
  };
  MyActivities: {
    tab?: 'published' | 'joined';
  };
  EditProfile: undefined;
  EditActivity: { activityId: string };
  CheckInManagement: {
    activityId: string;
    activityTitle: string;
  };
  CheckIn: {
    activityId: string;
    range: number;
  };
  Settings: undefined;
  Notification: undefined;
  FavoriteList: undefined;
  FollowList: {
    type: 'followers' | 'following';
    title: string;
  };
  // 其他页面...
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);
    const {status, user} = useAppSelector((state: RootState) => state.auth);
    useSocket();
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
   
    useEffect(() => {
        dispatch(checkLoginStatus());
    }, []);
  

    if (status === 'loading') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: 'horizontal',
            }}
        >
            {!isAuthenticated ? (
                // 未登录状态显示的页面
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            ) : (
                // 已登录状态显示的页面
                <>
                    <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
                    <Stack.Screen 
                        name="EditProfile" 
                        component={EditProfileScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="ActivityDetail" 
                        component={ActivityDetailScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="Participants" 
                        component={ParticipantsScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="UserProfile" 
                        component={UserProfileScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="Chat" 
                        component={ChatScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="Publish" 
                        component={PublishScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="Verify" 
                        component={VerifyScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="Explore" 
                        component={ExploreScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen 
                        name="ParticipantManagement" 
                        component={ParticipantManagementScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="MyActivities" 
                        component={MyActivitiesScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="Search" 
                        component={SearchScreen} 
                        options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                        name="EditActivity" 
                        component={EditActivityScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="CheckInManagement" 
                        component={CheckInManagementScreen} 
                    />
                    <Stack.Screen 
                        name="CheckIn" 
                        component={CheckInScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            title: '设置',
                            headerLeft: () => (
                                <IconButton
                                    icon="arrow-left"
                                    onPress={() => navigation.goBack()}
                                />
                            ),
                        }}
                    />
                    <Stack.Screen 
                        name="Notification" 
                        component={NotificationScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="FavoriteList" 
                        component={FavoriteListScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="FollowList" 
                        component={FollowListScreen}
                        options={({ route }) => ({
                            title: route.params.title,
                        })}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}; 