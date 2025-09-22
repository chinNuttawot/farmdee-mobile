import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const expensesSaveService = async (data = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const response = await api.post<any>("/expenses", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("expensesSaveService : " + error.response.data.error);
    }
    throw error;
  }
};
