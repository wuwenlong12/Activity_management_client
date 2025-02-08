import http from "..";
import { ResponseBase } from "../type";
import { ResponseCheckFollow, ResponseGetFollowList, ResponseGetTag } from "./type";

enum API {
  ADD_FOLLOW = "/follow/add",
  REMOVE_FOLLOW = "/follow/remove",
  CHECK_FOLLOW = "/follow/check",
  FOLLOWED = "/follow/followers",
  FOLLOWING = "/follow/following",
}

//关注
export const addFollow = (userId: string) =>
  http.post<any, ResponseBase>(API.ADD_FOLLOW, {userId});

//取消关注
export const removeFollow = (userId: string) =>
  http.post<any, ResponseBase>(API.REMOVE_FOLLOW, {userId});

//检查是否关注
export const checkFollow = (userId: string) =>
  http.get<any, ResponseCheckFollow>(API.CHECK_FOLLOW, {params: {userId}});

//获取粉丝列表
export const getFollowed = (params:{limit: number, page: number}) =>
  http.get<any, ResponseGetFollowList>(API.FOLLOWED, {
    params
  });

//获取关注列表
export const getFollowing = (params:{limit: number, page: number}) =>
  http.get<any, ResponseGetFollowList>(API.FOLLOWING, {
    params
  });
