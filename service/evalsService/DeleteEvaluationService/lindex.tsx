import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const DeleteEvaluationService = async (id: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const url = `/evals/${id}`;
    const response = await api.delete<any>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("DeleteEvaluationService : " + error.response.data.error);
    }
    throw error;
  }
};
