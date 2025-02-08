import { school } from "../school/type"
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
    wx?: string,
    avatar?: string,
    phone?: string,
    role?: string,
    school?: school,
    schoolId?: string,
    studentId?: string,
    updatedAt?: string,
    username?: string
    oldPassword?: string,
    newPassword?: string,
}

export interface UserProfile {
    // ... 其他字段
    schoolId?: string;
}

export interface UpdateUserProfileParams {
    // ... 其他字段
    schoolId?: string;
}