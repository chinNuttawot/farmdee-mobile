import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const ruleService = async (params = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);

    const response = await api.get<any>("/rule", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("ruleService : " + error.response.data.error);
    }
    throw error;
  }
};
