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
  schoolId: string;
  title: string;
  startTime: Date;      // 活动开始时间
  endTime: Date;        // 活动结束时间
  signUpStartTime: Date;  // 报名开始时间
  signUpEndTime: Date;    // 报名结束时间
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
  title: string;
  startTime: string;      // 活动开始时间
  endTime: string;        // 活动结束时间
  signUpStartTime: string;  // 报名开始时间
  signUpEndTime: string;    // 报名结束时间
  signInRange: number;
  date: string;
  location: location;
  participantLimit: string;
  description: string;
  image: string;
  tags: tag[];
  notices: string[];
  participants: Participant[];
  participants_count: number;
  organizer: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  status: "notStart" | "pending" | "upcoming" | "proceed" | "cancelled" | "over";
  isCreator: boolean;
  participationStatus: "none" | "pending" | "confirmed" | "cancelled" | "rejected";
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
  schoolId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  signUpStartDate?: string;
  signUpEndDate?: string;
  tags?: string[];
  page?: string;
  limit?: string;
}

