import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const tasksDeleteService = async (id: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const url = `/tasks/${id}`;
    const response = await api.delete<any>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("tasksDeleteService : " + error.response.data.error);
    }
    throw error;
  }
};
