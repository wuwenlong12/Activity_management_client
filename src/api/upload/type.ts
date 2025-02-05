import { ResponseBase } from "../type";

export interface UploadImageResponse extends ResponseBase {
  data: {
    fileUrl: string;
  };
}
