import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from 'react-native';
import { List, Divider, Switch, IconButton } from 'react-native-paper';
import { NotificationSoundPicker } from '../components/NotificationSoundPicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_ENABLED_KEY = '@notification_enabled';

const SettingsScreen = () => {
  const [showSoundPicker, setShowSoundPicker] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const navigation = useNavigation();

  // 加载通知设置
  React.useEffect(() => {
    loadNotificationSetting();
  }, []);

  const loadNotificationSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      setNotificationsEnabled(enabled !== 'false');
    } catch (error) {
      console.error('加载通知设置失败:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setNotificationsEnabled(false);
          return;
        }
      }
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, value.toString());
      setNotificationsEnabled(value);
    } catch (error) {
      console.error('保存通知设置失败:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部返回按钮 */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>设置</Text>
        </View>
      </View>

      <ScrollView>
        {/* 通知设置 */}
        <View style={styles.section}>
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>通知设置</List.Subheader>
            <View style={styles.card}>
              <List.Accordion
                title="通知音效"
                description="选择接收通知时的提示音"
                left={props => <List.Icon {...props} icon={props => (
                  <Ionicons name="notifications-outline" size={24} color="#666" />
                )} />}
                expanded={showSoundPicker}
                onPress={() => setShowSoundPicker(!showSoundPicker)}
                style={styles.listItem}
              >
                <NotificationSoundPicker />
              </List.Accordion>
              <Divider />
              <List.Item
                title="接收通知"
                description="开启后可以接收活动相关通知"
                left={props => <List.Icon {...props} icon={props => (
                  <Ionicons name="notifications-circle-outline" size={24} color="#666" />
                )} />}
                right={() => (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                  />
                )}
                style={styles.listItem}
              />
            </View>
          </List.Section>
        </View>

        {/* 账号安全 */}
        <View style={styles.section}>
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>账号安全</List.Subheader>
            <View style={styles.card}>
              <List.Item
                title="修改密码"
                left={props => <List.Icon {...props} icon={props => (
                  <Ionicons name="lock-closed-outline" size={24} color="#666" />
                )} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="隐私设置"
                left={props => <List.Icon {...props} icon={props => (
                  <Ionicons name="eye-off-outline" size={24} color="#666" />
                )} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
            </View>
          </List.Section>
        </View>

        {/* 其他设置 */}
        <View style={styles.section}>
          <List.Section>
            <List.Subheader style={styles.sectionHeader}>其他</List.Subheader>
            <View style={styles.card}>
              <List.Item
                title="清除缓存"
                description="1.2MB"
                left={props => <List.Icon {...props} icon={props => (
                  <Ionicons name="trash-outline" size={24} color="#666" />
                )} />}
                style={styles.listItem}
              />
              <Divider />
              <List.Item
                title="关于我们"
                left={props => <List.Icon {...props} icon={props => (
                  <Ionicons name="information-circle-outline" size={24} color="#666" />
                )} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                style={styles.listItem}
              />
            </View>
          </List.Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginRight: 48, // 为了保持标题居中
  },
  headerText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  listItem: {
    paddingVertical: 12,
  },
});

export default SettingsScreen; 