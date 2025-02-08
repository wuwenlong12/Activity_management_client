import http from "..";
import { ResponseBase } from "../type";
import { GetNotificationListParams, ResponseGetNotificationList, ResponseGetTag, ResponseGetUnreadNotificationCount } from "./type";

enum API {
  NOTIFICATION_LIST = "/notification/list",
  NOTIFICATION_READ = "/notification/read",
  NOTIFICATION_READ_ALL = "/notification/read-all",
  NOTIFICATION_UNREAD_COUNT = "/notification/unread-count",
}

// 查找通知列表
export const getNotificationList = (params: GetNotificationListParams) =>
  http.get<any, ResponseGetNotificationList>(API.NOTIFICATION_LIST, {
    params,
  });

// 阅读通知
export const readNotification = (id: string) =>
  http.post<any, ResponseBase>(API.NOTIFICATION_READ, { id });

// 阅读全部通知
export const readAllNotifications = () =>
  http.post<any, ResponseBase>(API.NOTIFICATION_READ_ALL, {});

// 获取未读通知数量
export const getUnreadNotificationCount = () =>
  http.get<any, ResponseGetUnreadNotificationCount>(
    API.NOTIFICATION_UNREAD_COUNT,
    {}
  );
