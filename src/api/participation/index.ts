import http from "..";
import { ResponseBase } from "../type";
import { ResponseGetParticipation, ResponseGetTag } from "./type";

enum API {
    PARTICIPATION = "/participation",
    PARTICIPATION_CANCEL = "/participation/cancel",
    PARTICIPATION_STATUS = "/participation/status",
}


//报名活动
export const participateInActivity = (activityId: string) => http.post<any, ResponseBase>(API.PARTICIPATION, {activityId});

//取消参与活动
export const cancelParticipation = (activityId: string) => http.patch<any, ResponseBase>(API.PARTICIPATION_CANCEL, {activityId});

// 更新参与活动状态
export const updateParticipationStatus = (participationId: string, status: "pending" | "confirmed" | "rejected") => http.patch<any, ResponseBase>(API.PARTICIPATION_STATUS, {participationId, status});

// 获取参与活动列表 
export const getParticipationList = (activityId: string) => http.get<any, ResponseGetParticipation>(API.PARTICIPATION, {params: {activityId}});

