import http from "..";
import { ResponseBase } from "../type";
import { GetFavoriteListParams, ResponseGetFavoriteList } from "./type";

enum API {
  FAVORITE_ADD = "/favorite/add",
  FAVORITE_REMOVE = "/favorite/remove",
  FAVORITE_LIST = "/favorite/list",
}


export const addFavorite = (id: string) =>
  http.post<any, ResponseBase>(API.FAVORITE_ADD, {id});

export const removeFavorite = (id: string) =>
  http.post<any, ResponseBase>(API.FAVORITE_REMOVE, {id});

export const getFavoriteList = (params: GetFavoriteListParams) =>
  http.get<any, ResponseGetFavoriteList>(API.FAVORITE_LIST, {params});
