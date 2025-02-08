import http from "..";
import { ResponseBase } from "../type";
import {  PostActivityBody, requestActivity, requestSearchActivity, ResponseGetActivity, ResponseGetActivityById } from "./type";


// // 模拟参与者数据
// const MOCK_PARTICIPANTS: Participant[] = [
//   {
//     id: '1',
//     name: '张三',
//     avatar: require('../../../assets/logo.jpg'),
//     joinTime: '2024-03-15 14:30',
//     role: 'organizer',
//     status: 'approved',
//   },
//   {
//     id: '2',
//     name: '李四',
//     avatar: require('../../../assets/logo.jpg'),
//     joinTime: '2024-03-15 15:20',
//     role: 'participant',
//     status: 'approved',
//   },
//   {
//     id: '3',
//     name: '王五',
//     avatar: require('../../../assets/logo.jpg'),
//     joinTime: '2024-03-15 16:45',
//     role: 'participant',
//     status: 'approved',
//   },
//   {
//     id: '4',
//     name: '赵六',
//     avatar: require('../../../assets/logo.jpg'),
//     joinTime: '2024-03-15 17:10',
//     role: 'participant',
//     status: 'approved',
//   },
//   // ... 可以添加更多假数据
// ];




// 模拟收藏/取消收藏API
export const toggleActivityLike = async (activityId: string): Promise<ResponseBase> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    code: 0,
    message: '操作成功',
  };
}; 




enum API {
  ACTIVITY = "/activity",
  ACTIVITY_ITEM = "/activity/item",
  ACTIVITY_ORGANIZED = "/activity/organized",
  ACTIVITY_JOINED = "/activity/joined",
}


//新增activity
export const postActivity = ({title, location, participantLimit, description, notices, image, tags,schoolId, startTime, endTime, signUpStartTime, signUpEndTime}: PostActivityBody) =>
  http.post<any, ResponseBase>(API.ACTIVITY, { title, location, participantLimit, description, notices, image, tags,schoolId, startTime, endTime, signUpStartTime, signUpEndTime });

//删除activity
export const deleteActivity = (id: string) =>
  http.delete<any, ResponseBase>(API.ACTIVITY, {
    params: {
      id,
    },
  });
//查找activity
export const getActivities = (params: requestSearchActivity) => http.get<any, ResponseGetActivity>(API.ACTIVITY, {params});


//查找activity
export const getActivityById = (activityId: string) => http.get<any, ResponseGetActivityById>(API.ACTIVITY_ITEM, {params: {activityId}});
//修改activity
export const updateActivity = (params: {
  id: string;
  title: string;
  image: string;
  time: Date | null;
  location: any;
  participantLimit: string;
  description: string;
  notices: string[];
  tags: string[];
  schoolId?: string;
  startTime?: string;
  endTime?: string;
  signUpStartTime?: string;
  signUpEndTime?: string;
}) => http.patch<any, ResponseBase>(API.ACTIVITY, params,{
  params: {
    id: params.id,
  },
});

// 获取组织的活动
export const getOrganizedActivities = (params: requestActivity) => http.get<any, ResponseGetActivity>(API.ACTIVITY_ORGANIZED, {params});


// 获取参与的活动
export const getJoinedActivities = (params: requestActivity) => http.get<any, ResponseGetActivity>(API.ACTIVITY_JOINED, {params});


