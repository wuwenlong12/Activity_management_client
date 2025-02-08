import Toast, { BaseToast, ErrorToast } from '@expo/react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import AppNavigator from './AppNavigator';

const toastConfig = {
  success: (props) => (
    <BlurView
      intensity={Platform.OS === 'ios' ? 50 : 100}
      tint="light"
      style={{
        width: '90%',
        marginHorizontal: '5%',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 40,
      }}
    >
      <BaseToast
        {...props}
        style={{
          backgroundColor: 'transparent',
          borderLeftWidth: 0,
          height: 'auto',
          minHeight: 50,
          paddingVertical: 12,
        }}
        contentContainerStyle={{ 
          paddingHorizontal: 15,
        }}
        text1Style={{
          fontSize: 15,
          fontWeight: '500',
          color: '#000'
        }}
        text2Style={{
          fontSize: 13,
          color: '#666'
        }}
      />
    </BlurView>
  ),
  error: (props) => (
    <BlurView
      intensity={Platform.OS === 'ios' ? 50 : 100}
      tint="light"
      style={{
        width: '90%',
        marginHorizontal: '5%',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 40,
      }}
    >
      <ErrorToast
        {...props}
        style={{
          backgroundColor: 'transparent',
          borderLeftWidth: 0,
          height: 'auto',
          minHeight: 50,
          paddingVertical: 12,
        }}
        contentContainerStyle={{ 
          paddingHorizontal: 15,
        }}
        text1Style={{
          fontSize: 15,
          fontWeight: '500',
          color: '#000'
        }}
        text2Style={{
          fontSize: 13,
          color: '#666'
        }}
      />
    </BlurView>
  )
};

export default function App() {
  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
} 