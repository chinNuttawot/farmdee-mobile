import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const toggleAnnouncementService = async (id: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const url = `/announcements/${id}/toggle`;
    const response = await api.patch<any>(
      url,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("toggleAnnouncementService : " + error.response.data.error);
    }
    throw error;
  }
};
