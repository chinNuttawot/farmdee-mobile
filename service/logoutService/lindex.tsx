import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";
import { authToken } from "@/providers/keyStorageUtilliy";

export const logoutService = async (data: any) => {
  try {
    const token = await StorageUtility.get(authToken);
    const response = await api.post("/auth/logout", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error: any) {
    if (error.response) {
      alert("logoutService : " + error.response.data.error);
    }
    throw error;
  }
};
