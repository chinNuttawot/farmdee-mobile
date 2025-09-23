import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const deletePayrollByIDService = async (id: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const url = `/payrolls/${id}`;
    const response = await api.delete<any>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("deletePayrollByIDService : " + error.response.data.error);
    }
    throw error;
  }
};
