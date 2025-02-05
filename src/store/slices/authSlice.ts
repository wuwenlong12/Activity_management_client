import { createSlice } from "@reduxjs/toolkit";
import { auth } from "../../api/auth";
import type { AppDispatch } from "../../store";
import { User } from "../../api/auth/type";

interface AuthState {
  siteIsOpen: boolean;
  isAuthenticated: boolean;
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: AuthState = {
  siteIsOpen: true,
  isAuthenticated: false,
  user: null,
  status: "idle",
};

// 创建 Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.status = "succeeded";
    },
    setLoading: (state) => {
      state.status = "loading";
    },
    setError: (state) => {
      state.status = "failed";
      state.isAuthenticated = false;
      state.user = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
    },
  },
});

// Action Creators
export const {
  setUser,
  setLoading,
  setError,
  logout,
} = authSlice.actions;

// **手动处理异步检查登录状态**
export const checkLoginStatus = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading());
  try {
    const res = await auth();
    console.log(res);

    if (res.code === 0) {
      dispatch(setUser(res.data));
    } else {
      dispatch(setError());
    }
  } catch (error) {
    dispatch(setError());
  }
};

export const updateUser = () => async (dispatch: AppDispatch) => {


  const res = await auth();
  console.log(res);

  if (res.code === 0) {
    dispatch(setUser(res.data));
  } else {
    dispatch(setError());
  }

};
export default authSlice.reducer;
