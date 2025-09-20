import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";
import { authToken } from "@/providers/keyStorageUtilliy";

export const loginService = async (data: any) => {
  try {
    const response = await api.post("/auth/login", data);
    const { data: dataLogin } = response;
    await StorageUtility.set(authToken, dataLogin.token);

    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert(error.response.data.message);
    }
    throw error;
  }
};
