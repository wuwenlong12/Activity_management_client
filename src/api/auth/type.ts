import { ResponseBase } from "../type";
import { tag } from "../tag/type";
import { school } from "../school/type";

export interface ResponseCheckSystemInit extends ResponseBase {
  data: CheckSystemInitData;
}
type CheckSystemInitData = {
  initialized: boolean;
};

export interface ResponseLogin extends ResponseBase {
  data: User;
}

export type User = {
  _id?: string;
  username?: string;
  email?: string;
  school?: school;
  role: {
    _id: string;
    name: "superAdmin" | "webMaster" | "user";
    permissions: string[];
  };
  managedSites: [];
  password?: string;
  avatar?: string;
  oldPassword?: string;
  newPassword?: string;
};

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  auth_code: string;
  schoolId: string;