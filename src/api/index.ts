import axios from "axios";
import { Alert } from "react-native";


console.log(process.env.EXPO_PUBLIC_API_URL);


// 创建 axios 实例
const http = axios.create({
  baseURL: 'http://192.168.1.3:3000/api', // 使用 Expo 的环境变量
  timeout: 3000,
  headers: { "Content-Type": "application/json" },
});

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data?.message || "请求失败";

      switch (status) {
        case 400:
          Alert.alert("错误", `请求错误：${errorMessage}`);
          break;
        case 401:
          Alert.alert("提示", "未授权，请登录");
          break;
        case 403:
          Alert.alert("提示", "没有权限访问");
          break;
        case 404:
          if (data?.code === 2) {
            Alert.alert("错误", data.message);
          } else {
            Alert.alert("错误", "请求资源未找到");
          }
          break;
        case 500:
          Alert.alert("错误", "服务器内部错误");
          break;
        default:
          Alert.alert("错误", `请求失败，状态码：${status}`);
          break;
      }
    } else if (error.request) {
      Alert.alert("提示", "请求超时，请检查网络");
    } else {
      Alert.alert("错误", `请求配置错误：${error.message}`);
    }
    console.log(error);

    return Promise.resolve(error.response?.data);
  }
);

export default http;
