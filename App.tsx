import React from "react";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import store from "./src/store";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationManager } from "./src/components/NotificationManager";
import Toast from "react-native-toast-message";
import { Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <View style={{ flex: 1 }}>
            <NavigationContainer>
     
              <StatusBar style="auto" />
              <AppNavigator />

              <NotificationManager />
            </NavigationContainer>
          </View>
          <Toast />
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
