import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const tasksSaveService = async (data = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const response = await api.post<any>("/tasks", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.log("error.response ===>", error.response.data);

    if (error.response) {
      alert("tasksSaveService : " + error.response.data.error);
    }
    throw error;
  }
};
