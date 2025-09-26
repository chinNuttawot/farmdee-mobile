import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const GetEvaluationbyIDService = async (id: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const url = `/evals/${id}`;
    const response = await api.get<any>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("GetEvaluationbyIDService : " + error.response.data.error);
    }
    throw error;
  }
};
