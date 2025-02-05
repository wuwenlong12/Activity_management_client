import http from "..";
import { ResponseBase } from "../type";
import { ResponseUserDetails, User } from "./type";


enum API {
  USERS_DETAILS = "users/details",
}
// 关注/取消关注用户

export const toggleUserFollow = async (userId: string): Promise<ResponseBase> => {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    code: 0,
    message: '操作成功',
  };
};

// 获取用户活动列表
export const getUserActivities = async (
  userId: string,
  type: 'participated' | 'published',
  page: number = 1
): Promise<ResponseBase> => {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    code: 0,
    message: 'success',
    data: {
      activities: [
        // ... 活动数据
      ],
      total: 10,
    },
  };
};


export const getUserDetails = async (id?: string): Promise<ResponseBase> => 
  http.get<any, ResponseUserDetails>(API.USERS_DETAILS, {params:id});

export const updateUserDetails = (params: User) =>
  http.patch<any, ResponseBase>(
    API.USERS_DETAILS,
   params,
    { withCredentials: true }
  );