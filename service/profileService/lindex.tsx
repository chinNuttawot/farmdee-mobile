// src/service/apiCore/profileService.ts
import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "../apiCore";

export const PROFILE_KEY = "profile:data";

export const Profile = async (): Promise<any> => {
  try {
    const token = await StorageUtility.get(authToken);

    const { data } = await api.get<any>("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profile = data?.user || {};

    if (profile) {
      // เก็บลง Storage อัตโนมัติ
      await StorageUtility.set(PROFILE_KEY, JSON.stringify(profile));
    }

    return profile;
  } catch (error: any) {
    if (error.response) {
      alert(error.response.data.message);
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
