import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";
import { authToken } from "@/providers/keyStorageUtilliy";

export const loginService = async (data: any) => {
  try {
    const response = await api.post("/auth/login", data);
    const { data: dataLogin } = response;
    await StorageUtility.set(authToken, dataLogin.data.token);

    return dataLogin.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      alert("loginService : " + error.response.data.message);
    } else {
      alert("loginService : ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง");
    }

    throw error;
  }
};
