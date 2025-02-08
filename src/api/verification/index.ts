import http from "..";
import { ResponseBase } from "../type";
import { VerificationParams, ResponseVerification } from "./type";

enum API {
  VERIFICATION_SUBMIT = "/verification/submit",
  VERIFICATION_STATUS = "/verification/status",
}

// 提交认证申请
export const verificationSubmit = (params: VerificationParams) =>
  http.post<any, ResponseBase>(API.VERIFICATION_SUBMIT, params);

// 获取认证状态
export const getVerificationStatus = () =>
  http.get<any, ResponseVerification>(API.VERIFICATION_STATUS);


