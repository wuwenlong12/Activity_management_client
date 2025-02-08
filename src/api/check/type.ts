import { PartialBlock } from "@blocknote/core";
import { ResponseBase } from "../type";
import { User } from "../auth/type";


export interface ResponseQRCode extends ResponseBase {
  data: QRCode;
}
export type QRCode = {
  qrCode: string;
  checkInCodeObject: CheckInCode;
}
type CheckInCode = {
  type: string;
  activityId: string;
  signInRange: number;
}
export interface ResponseHasCheckedIn extends ResponseBase {
  data: HasCheckedIn;
}
type HasCheckedIn = {
  checkedIn: boolean;
}

export interface ResponseCheckList extends ResponseBase {
  data: User & { isCheckedIn: boolean }; // 在 User 上添加 `hasCheckedIn` 字段
}

export interface checkParams {
  latitude: number;
  longitude: number;
}



