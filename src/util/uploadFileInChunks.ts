import { md5, Message } from "js-md5";
import { upload } from "../api/upload";
import { Alert, Platform } from "react-native";
import * as FileSystem from 'expo-file-system'; // Expo的文件系统库

const readFile = async (file: any) => {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  } else {
    try {
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return fileContent;
    } catch (error) {
      console.error('读取文件失败:', error);
      throw error;
    }
  }
};
export const uploadFileInChunks = async (file: any,chunkSize?:number) => {
  const fileSize = Platform.OS === 'web' ? file.size : file.fileSize

  // 没有分片大小，使用默认上传(适配服务器无大文件上传功能)
  if (!chunkSize) {
   const url = await uploadSmallFile(file);
    return url
  }
  const thisTotalChunks = Math.ceil(fileSize / chunkSize);
  // 区分大小文件，采用不同上传方式
  if (thisTotalChunks === 1) {
    const url = await uploadSmallFile(file);
    return url;
  }
  if (thisTotalChunks > 1 && chunkSize) {
    const url = await uploadBigFile(file, thisTotalChunks,chunkSize);
    return url;
  }
}

const uploadSmallFile = async (file: any) => {
  const fileSize = Platform.OS === 'web' ? file.size : file.fileSize
  const fileName = Platform.OS === 'web' ? file.name : file.fileName
  const fileInfo = Platform.OS === 'web' ? file : {
    uri: file.uri, // 使用文件的 URI
    name: file.fileName || 'upload.jpg', // 使用文件的名称
    type: file.type || 'image/jpeg', // 确保有一个默认类型
  }
  const fileContent = await readFile(file)
  const fileHash = md5(fileContent as Message); // 计算文件哈希值
  const formData = new FormData();
  formData.append('file', fileInfo);
  formData.append('name', fileName);
  formData.append('size', fileSize);
  formData.append('type', file.type);
  formData.append('offset', '0'); // 小文件的偏移量为0
  formData.append('hash', fileHash); // 文件哈希值

  try {
    console.log(`正在上传整个文件${fileName}`);
    const res = await upload(formData);
    if (res.code = 1) {
      return res.data.fileUrl
    }
  } catch (error: any) {
    Alert.alert('上传失败', error.message);
  }
};


const uploadBigFile = async (file: any, thisTotalChunks: number,chunkSize:number) => {
  if (!chunkSize) return

  const fileContent = await readFile(file);
  const fileHash = md5(fileContent as Message); // 计算文件哈希值

  const fileSize = Platform.OS === 'web' ? file.size : file.fileSize
  const fileName = Platform.OS === 'web' ? file.name : file.fileName



  for (let offset = 0; offset < thisTotalChunks; offset++) {
    const chunk =
      Platform.OS === 'web'
        ? file.slice(offset * chunkSize, (offset + 1) * chunkSize) // Web 使用 File API 的 slice
        : await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
          position: offset * chunkSize,
          length: chunkSize,
        })
    const fileInfo = Platform.OS === 'web' ? chunk : {
      uri: `data:image/jpeg;base64,${chunk}`, // 使用文件的 URI
      name: file.fileName || 'upload.jpg', // 使用文件的名称
      type: file.type || 'image/jpeg', // 确保有一个默认类型
    }
    const formData = new FormData();
    formData.append('file', fileInfo);
    formData.append('name', fileName);
    formData.append('size', fileSize);
    formData.append('type', file.type);
    formData.append('offset', offset.toString()); // 小文件的偏移量为0
    formData.append('hash', fileHash); // 文件哈希值

    try {
      const res = await upload(formData)

      if (res.code == 1) {
        return res.data.fileUrl
   
      } else {
        console.log("上传失败");
      }
    } catch (error: any) {
      Alert.alert('上传失败', error.message);
    }

  }
}
