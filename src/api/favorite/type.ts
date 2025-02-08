import { Activity } from "../activity/type";
import { ResponseBase } from "../type";

export interface GetFavoriteListParams {
  page?: number;
  limit?: number;
}

export interface ResponseGetFavoriteList extends ResponseBase {
  data: {
    list: Favorite[],
    total: number,
    page: number, 
    limit: number,  
  };
}

export interface Favorite {
  _id: string;
  activity: Activity;
}
