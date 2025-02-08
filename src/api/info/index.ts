import http from "..";
import { ResponseGetUserCounts, ResponseGetUserStats } from "./type";

enum API {
  USER_STATS = "/info/user-stats",
  USER_COUNTS = "/info/user-counts",
}



export const getUserStats = () => http.get<any, ResponseGetUserStats>(API.USER_STATS, {});


export const getUserCounts = (id:string) => http.get<any, ResponseGetUserCounts>(API.USER_COUNTS, {
  params: {
    id
  }
});
