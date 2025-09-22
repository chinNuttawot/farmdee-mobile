import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const userConfigSalaryService = async (data: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const { id, ...newData } = data;
    const url = `/users/${Number(id)}/pay`;
    const response = await api.put<any>(url, newData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("userConfigSalaryService : " + error.response.data.error);
    }
    throw error;
  }
};
