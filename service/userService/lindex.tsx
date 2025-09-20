import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const userService = async (params = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);

    const response = await api.get<any>("/users", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert(error.response.data.message);
    }
    throw error;
  }
};
