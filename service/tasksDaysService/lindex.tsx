import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";
import { PROFILE_KEY } from "../profileService/lindex";

export const tasksDaysService = async (params: any): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);
    const raw = await StorageUtility.get(PROFILE_KEY);
    const user = JSON.parse(raw);
    let myParams = { ...params };
    if (user.role !== "boss") {
      myParams.userId = user.id;
    }
    const response = await api.get<any>("/tasks/days", {
      params: { ...myParams },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      alert("tasksDaysService : " + error.response.data.error);
    }
    throw error;
  }
};
