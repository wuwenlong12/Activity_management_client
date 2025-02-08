import { ResponseBase } from "../type";

// 认证类型
export type VerificationType = 'personal' | 'organization';

// 个人认证参数
export interface PersonalVerificationParams {
  type: 'personal';
  realName: string;
  studentId: string;
  studentCardImage: string;  // 学生证图片的 URL 或 base64
}

// 组织认证参数
export interface OrganizationVerificationParams {
  type: 'organization';
  organizationName: string;
  proofImage: string;  // 证明材料图片
  supervisorName: string;
  supervisorId: string;
}
// 合并认证参数类型
export type VerificationParams = PersonalVerificationParams | OrganizationVerificationParams;

export interface ResponseVerification extends ResponseBase {
  data: (
    | PersonalVerificationParams
    | OrganizationVerificationParams
  ) & {
    type: VerificationType;
    status: "pending" | "approved" | "rejected";
  };
}