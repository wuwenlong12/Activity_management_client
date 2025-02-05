import { ResponseBase } from "../type"

export interface ResponseUserDetails extends ResponseBase {
    data: User
}


export type User = {
    _id?: string,
    bio?: string,
    class?: string,
    className?: string,
    createdAt?: string,
    email?: string,
    imgurl?: string,
    phone?: string,
    role?: string,
    school?: string,
    studentId?: string,
    updatedAt?: string,
    username?: string
    oldPassword?: string,
    newPassword?: string,
}