import http from "..";
import { ResponseBase } from "../type";
import { ResponseUserDetails, User } from "./type";


enum API {
  USERS_DETAILS = "users/details",
  USER_PROFILE = "users/profile",
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



export const getUserDetails = (params: { id: string }) => 
  http.get<any, ResponseUserDetails>(API.USERS_DETAILS, { params });

export const updateUserDetails = (params: User) =>
  http.patch<any, ResponseBase>(
    API.USERS_DETAILS,
   params,
    { withCredentials: true }
  );

export const updateUserProfile = (params: User) =>
  http.put<any, ResponseBase>(API.USER_PROFILE, params);