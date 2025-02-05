import http from "..";
import { ResponseGetTag } from "./type";

enum API {
  TAG = "/tag",
}


//查找全部tag
export const getTag = () => http.get<any, ResponseGetTag>(API.TAG, {});
