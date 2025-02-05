import { tag } from "../tag/type";
import { ResponseBase } from "../type";

export interface ResponseGetActivity extends ResponseBase {
  data: ActivityResponse;
}

export interface ResponseGetActivityById extends ResponseBase {
  data: Activity;
}

export type PostActivityBody = {
  id?: string;
  title: string;
  time: Date;
  location: location;
  participantLimit: string;
  description: string;
  image: string;
  tags: string[];
  notices: string[];
  participants?: string[];

};

export interface Activity {
  id: string;
  status:  "pending" |'upcoming' | "proceed"| "cancelled" |  'over'   ; // 报名状态 报名中/即将开始/进行中/取消/结束
  title: string;
  image: string;
  description: string;
  notices: string[];
  date: string;
  location: location;
  participants: Participant[];  //参与者
  participants_count: number;
  isCreator: boolean;
  isJoined: boolean;
  tags: tag[];
  organizer: Organizer;
}


export interface Participant {
  id: string;
  name: string;
  avatar: string;
}

interface Organizer {
  name: string;

  avatar: string;
  verified: boolean;
}

// 分页数据
interface ActivityResponse {
  list: Activity[];
  total: number;
  page: number;
  limit: number;
}
type location = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type requestActivity = {
  userId?: string;
  status?: "pending" |'upcoming' | "proceed"| "cancelled" |  'over'   ; // 报名状态 报名中/即将开始/进行中/取消/结束
  page?: string;
  limit?: string;
}

export type requestSearchActivity = {
  search?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  page?: string;
  limit?: string;
}

