import http from "..";
import { ResponseBase } from "../type";
import {  PostActivityBody, requestActivity, requestSearchActivity, ResponseGetActivity, ResponseGetActivityById } from "./type";

// 模拟参与者数据
const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: '1',
    name: '张三',
    avatar: require('../../../assets/logo.jpg'),
    joinTime: '2024-03-15 14:30',
    role: 'organizer',
    status: 'approved',
  },
  {
    id: '2',
    name: '李四',
    avatar: require('../../../assets/logo.jpg'),
    joinTime: '2024-03-15 15:20',
    role: 'participant',
    status: 'approved',
  },
  {
    id: '3',
    name: '王五',
    avatar: require('../../../assets/logo.jpg'),
    joinTime: '2024-03-15 16:45',
    role: 'participant',
    status: 'approved',
  },
  {
    id: '4',
    name: '赵六',
    avatar: require('../../../assets/logo.jpg'),
    joinTime: '2024-03-15 17:10',
    role: 'participant',
    status: 'approved',
  },
  // ... 可以添加更多假数据
];

// 模拟获取参与者列表的API
export const getActivityParticipants = async (
  activityId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ResponseBase & { data: { participants: Participant[]; total: number } }> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedParticipants = MOCK_PARTICIPANTS.slice(start, end);

  return {
    code: 0,
    message: 'success',
    data: {
      participants: paginatedParticipants,
      total: MOCK_PARTICIPANTS.length,
    },
  };
};

// 模拟活动报名API
export const signupActivity = async (activityId: string): Promise<ResponseBase> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    code: 0,
    message: '报名成功',
  };
};

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
  ACTIVITY_JOINED = "/activity/Joined",
}


//新增activity
export const postActivity = ({title, time, location, participantLimit, description, notices, image, tags }: PostActivityBody) =>
  http.post<any, ResponseBase>(API.ACTIVITY, { title, time, location, participantLimit, description, notices, image, tags });

//删除activity
export const deleteActivity = (id: string) =>
  http.delete<any, ResponseBase>(API.ACTIVITY, {
    params: {
      id,
    },
  });
//查找activity
export const getActivity = (params: requestSearchActivity) => http.get<any, ResponseGetActivity>(API.ACTIVITY, {params});


//查找activity
export const getActivityById = (activityId: string) => http.get<any, ResponseGetActivityById>(API.ACTIVITY_ITEM, {params: {activityId}});
//修改activity
export const updateActivity = () => http.get<any, ResponseBase>(API.ACTIVITY, {});

// 获取组织的活动
export const getOrganizedActivities = (params: requestActivity) => http.get<any, ResponseGetActivity>(API.ACTIVITY_ORGANIZED, {params});


// 获取参与的活动
export const getJoinedActivities = (params: requestActivity) => http.get<any, ResponseGetActivity>(API.ACTIVITY_JOINED, {params});

