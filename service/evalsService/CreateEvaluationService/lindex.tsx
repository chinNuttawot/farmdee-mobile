import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const CreateEvaluationService = async (data = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);

    const response = await api.post<any>("/evals", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("CreateEvaluationService : " + error.response.data.error);
    }
    throw error;
  }
};
