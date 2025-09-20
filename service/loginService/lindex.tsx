import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";
import { authToken } from "@/providers/keyStorageUtilliy";

export const loginService = async (data: any) => {
  try {
    console.log(data);
    
    const response = await api.post("/auth/login", data);
    const { data: dataLogin } = response;
    console.log(dataLogin);
    
    await StorageUtility.set(authToken, dataLogin.data.token);

    return dataLogin.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง");
    }

    throw error;
  }
};
