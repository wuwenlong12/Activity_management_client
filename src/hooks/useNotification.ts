import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";
import { Audio } from "expo-av";
import { NotificationSound } from "../types/notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppSelector } from "../store";
import { showNotification } from "../components/NotificationManager";

const NOTIFICATION_ENABLED_KEY = "@notification_enabled";

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 预加载所有音效
const loadSoundFiles = async () => {
  const sounds: { [key: string]: Audio.Sound } = {};
  try {
    console.log("开始加载各个音效...");

    const soundsToLoad = {
      [NotificationSound.IOS]: require("../../assets/sounds/ios.mp3"),
      [NotificationSound.DOG]: require("../../assets/sounds/dog.wav"),
      [NotificationSound.GAME]: require("../../assets/sounds/game.wav"),
      [NotificationSound.JINGAO]: require("../../assets/sounds/jingao.wav"),
      [NotificationSound.KESHOW]: require("../../assets/sounds/keshou.wav"),
    };

    for (const [key, source] of Object.entries(soundsToLoad)) {
      console.log(`加载音效: ${key}`);
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: false,
      });
      sounds[key] = sound;
    }

    console.log("所有音效加载完成");
    return sounds;
  } catch (error) {
    console.error("加载音效失败:", error);
    return null;
  }
};

export const useNotification = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const currentSound = useAppSelector(state => state.settings.notificationSound);

  // 初始化
  useEffect(() => {
    loadNotificationSetting();
    requestNotificationPermission();
    initAudio();
  }, []);

  // 加载通知设置
  const loadNotificationSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      setNotificationsEnabled(enabled !== "false");
    } catch (error) {
      console.error("加载通知设置失败:", error);
    }
  };

  // 初始化音频
  const initAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const loadedSounds = await loadSoundFiles();
      if (loadedSounds) {
        setSounds(loadedSounds);
      }
    } catch (error) {
      console.error("音频初始化失败:", error);
    }
  };

  // 请求通知权限
  const requestNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === "granted") {
      setHasPermission(true);
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    }
  };

  // 播放音效
  const playSound = async (soundType: string = currentSound) => {
    try {
      if (!sounds?.[soundType]) return;

      const sound = sounds[soundType];
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.error("播放音效失败:", error);
    }
  };

  // 切换音效
  const switchSound = async (soundType: string) => {
    if (!sounds?.[soundType]) return;

    try {
      // 停止所有音效
      for (const sound of Object.values(sounds)) {
        try {
          await sound.stopAsync();
          await sound.setPositionAsync(0);
        } catch (error) {
          console.error("停止音效失败:", error);
        }
      }

      // 播放新音效
      await playSound(soundType);
    } catch (error) {
      console.error("切换音效失败:", error);
    }
  };

  // 显示通知
  const showNotificationMessage = async (message: NotificationMessage) => {
    const appState = AppState.currentState;

    if (appState === "active") {
      showNotification(
        message.title, 
        message.content, 
        message.type, 
        message.navigator
      );
      // 播放通知音效
      await playSound();
    } else if (hasPermission && notificationsEnabled) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.content,
            data: message.navigator,
          },
          trigger: null,
        });
      } catch (error) {
        console.error("系统通知发送失败:", error);
      }
    }
  };

  // 清理音效资源
  useEffect(() => {
    return () => {
      if (sounds) {
        Object.values(sounds).forEach(async (sound) => {
          await sound.unloadAsync();
        });
      }
    };
  }, [sounds]);

  return {
    currentSound,
    notificationsEnabled,
    showNotificationMessage,
    playSound,
    switchSound,
  };
}; 