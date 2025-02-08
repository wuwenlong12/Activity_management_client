import http from "..";
import { ResponseBase } from "../type";
import {  checkParams, ResponseCheckList, ResponseHasCheckedIn, ResponseQRCode } from "./type";


enum API {
  CHECK_QRCODE = "/check/qrcode",
  CHECK="/check",
  CHECK_HAS_CHECKED_IN="/check/hascheckedin",
  CHECK_LIST="/check/list",
}


// 生成二维码
export const generateQRCode = (activityId:string,signInRange:number) => http.get<any,ResponseQRCode>(API.CHECK_QRCODE, {
  params:{
    activityId,
    signInRange
  }
});

//签到
export const check = (  activityId: string,params:checkParams) => http.post<any,ResponseBase>(API.CHECK, params, {
  params:{
    activityId
  }
});

// 检查是否已签到
export const checkHasCheckedIn = (activityId:string) => http.get<any,ResponseHasCheckedIn>(API.CHECK_HAS_CHECKED_IN, {
  params:{
    activityId
  }
});

// 获取用户列表，包含是否签到
export const getCheckList = (activityId:string) => http.get<any,ResponseCheckList>(API.CHECK_LIST, {
  params:{
    activityId
  }
});