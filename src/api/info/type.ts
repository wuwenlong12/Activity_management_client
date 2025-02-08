import { PartialBlock } from "@blocknote/core";
import { ResponseBase } from "../type";

export interface ResponseGetUserStats extends ResponseBase {
  data: {
    publishedCount: number,   // 发布数量
    participatedCount: number, // 参与数量
    favoriteCount: number     // 收藏数量
  };
}

export interface ResponseGetUserCounts extends ResponseBase {
  data: {
    publishedCount: number,   // 发布数量
    participatedCount: number, // 参与数量
    followersCount: number,    // 粉丝数量
    followingCount: number     // 关注数量
  };
}