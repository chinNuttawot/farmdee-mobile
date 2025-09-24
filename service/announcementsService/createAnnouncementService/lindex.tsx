import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const createAnnouncementService = async (data = {}): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const response = await api.post<any>("/announcements", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("createAnnouncementService : " + error.response.data.error);
    }
    throw error;
  }
};
