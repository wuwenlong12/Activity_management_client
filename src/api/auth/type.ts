import { ResponseBase } from "../type";
import { tag } from "../tag/type";

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
  id?: string;
  username?: string;
  email?: string;
  role: {
    _id: string;
    name: "superAdmin" | "webMaster" | "user";
    permissions: string[];
  };
  managedSites: [];
  password?: string;
  imgurl?: string;
  oldPassword?: string;
  newPassword?: string;
};
