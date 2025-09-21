import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const tasksUpdateService = async (data: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const { id, ...newData } = data;
    const url = `/tasks/${id}`;
    const response = await api.patch<any>(url, newData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("tasksUpdateService : " + error.response.data.message);
    }
    throw error;
  }
};
