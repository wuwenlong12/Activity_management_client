import { Activity } from "../activity/type";
import { User } from "../auth/type";
import { ResponseBase } from "../type";

export interface ResponseGetParticipation extends ResponseBase {
    data: Participation[];
}

export interface Participation {
  _id: string; // 报名唯一ID
  activity: Activity; // 关联活动
  user: User; // 关联用户
  status: "pending" | "confirmed" | "cancelled" | 'rejected' ; // 报名状态
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}