import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const listPayrollsService = async (params = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);

    const response = await api.get<any>("/payrolls", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("listPayrollsService : " + error.response.data.error);
    }
    throw error;
  }
};
