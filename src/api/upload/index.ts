import http from "..";
import { UploadImageResponse } from "./type";

enum API {
  UPLOAD_URL = "/upload",
}

const headers = {
  "Content-Type": "multipart/form-data",
};

// 获取上传文件
export const upload = (FormData: FormData) => {
  return http.post<FormData, UploadImageResponse>(API.UPLOAD_URL, FormData, {
    headers,
  });
};
