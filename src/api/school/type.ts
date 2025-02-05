import { ResponseBase } from "../type";

export interface ResponseGetSchoolList extends ResponseBase {
  data: school[];
}
export type school = {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};
