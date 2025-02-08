import { User } from "../auth/type";
import { ResponseBase } from "../type";

export interface ResponseGetFollowList extends ResponseBase {
  data: follow[];
}
export type follow = {
  list: followData[],
  total: number,
  page: number,
  limit: number,
};
export type followData = {
  following: User | null,
  follower: User | null,
};

export interface ResponseCheckFollow extends ResponseBase {
  data: {
    isFollowing: boolean;
  };
}
