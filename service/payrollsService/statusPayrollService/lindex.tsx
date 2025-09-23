import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const statusPayrollService = async (data: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const { id, ...newData } = data;
    const url = `/payrolls/${id}/pay`;
    const response = await api.patch<any>(url, newData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("statusPayrollService : " + error.response.data.error);
    }
    throw error;
  }
};
