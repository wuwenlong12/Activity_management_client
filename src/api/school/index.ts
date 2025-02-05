import http from "..";
import { ResponseGetSchoolList } from "./type";

enum API {
  SCHOOL = "/school",
}


//查找全部学校
export const getSchoolList = () => http.get<any, ResponseGetSchoolList>(API.SCHOOL, {});
