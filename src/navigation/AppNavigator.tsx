import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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

// 定义导航参数类型
export type RootStackParamList = {
  Home: undefined;
  ActivityDetail: { activityId: string };
  UserProfile: { userId?: string };
  Participants: { activityId: string; activityTitle: string };
  Explore: undefined;
  ParticipantManagement: { activityId: string; activityTitle: string };
  MyActivities: undefined;
  EditProfile: undefined;
  // 其他页面...
};

const Stack = createStackNavigator();

export const AppNavigator = () => {
    const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);
    const {status,user} = useAppSelector((state: RootState) => state.auth);
    const dispatch = useAppDispatch();

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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                // 未登录状态显示的页面
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            ) : (
                // 已登录状态显示的页面
                <>
                    <Stack.Screen name="MainApp" component={BottomTabNavigator} />
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
                </>
            )}
        </Stack.Navigator>
    );
}; 