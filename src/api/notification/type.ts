import { ResponseBase } from "../type";

export interface GetNotificationListParams {
  page?: number;
  limit?: number;
  status?: "unread" | "read";
}

export interface ResponseGetNotificationList extends ResponseBase {
  data: {
    list: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  };
}
export type Notification = {
  _id: string;
  type: NotificationType; // 通知类型
  title: string; // 通知标题
  content: string; // 通知内容
  isRead: boolean; // 是否已读
  createdAt: Date;
  updatedAt: Date;
  navigator: NotificationNavigator; // 导航
};

export type NotificationType = "success" | "info" | "warning" | "error";

export type NotificationNavigator = {
  path: string; // 导航路径
  query?: object; // 导航数据
};

export interface ResponseGetUnreadNotificationCount extends ResponseBase {
  data: {
    unreadCount: number;
  };
}
