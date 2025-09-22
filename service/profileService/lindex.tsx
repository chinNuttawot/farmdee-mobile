// src/service/apiCore/profileService.ts
import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const PROFILE_KEY = "profile:data";

export const Profile = async (): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);

    const response = await api.get<any>("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data: dataLogin } = response;
    const profile = dataLogin.data?.user || {};

    if (profile) {
      // เก็บลง Storage อัตโนมัติ
      await StorageUtility.set(PROFILE_KEY, JSON.stringify(profile));
    }

    return dataLogin.data;
  } catch (error: any) {
    if (error.response) {
      alert("Profile : " + error.response.data.error);
    }
    throw error;
  }
};

// ✅ ดึงจาก cache
export const getProfile = async (): Promise<any | null> => {
  const str = await StorageUtility.get(PROFILE_KEY);
  if (!str) return null;
  try {
    return JSON.parse(str) as any;
  } catch {
    return null;
  }
};

export const delProfile = async () => {
  await StorageUtility.remove(PROFILE_KEY);
};
