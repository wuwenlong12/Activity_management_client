import http from "..";
import { ResponseBase } from "../type";
import { RegisterParams, ResponseCheckSystemInit, ResponseLogin } from "./type";

enum API {
  USERS_CHECK = "users/check",
  USERS_REGISTER = "users/register",
  USERS_LOGIN = "users/login",
  USERS_LOGOUT = "users/logout",
  USERS_AUTH = "users/auth",
  USERS_EMAIL = "users/email",
}

export const checkSystemInit = () =>
  http.get<any, ResponseCheckSystemInit>(API.USERS_CHECK, {});

export const register = (params: RegisterParams) =>
  http.post<any, ResponseBase>(API.USERS_REGISTER, params);

export const getVerificationCode = (email: string) =>
  http.get<any, ResponseBase>(API.USERS_EMAIL, {
    params: {
      email,
    },
  });

export const login = (email: string, password: string) =>
  http.post<any, ResponseLogin>(
    API.USERS_LOGIN,
    {
      email,
      password,
    },
    { withCredentials: true }
  );
  export const logout = () =>
    http.delete<any, ResponseBase>(API.USERS_LOGOUT, { withCredentials: true });
  

export const auth = () =>
  http.get<any, ResponseLogin>(API.USERS_AUTH, { withCredentials: true });



