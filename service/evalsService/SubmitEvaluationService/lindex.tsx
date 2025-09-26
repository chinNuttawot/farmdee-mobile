// services/evaluations.ts
import { authToken } from "@/providers/keyStorageUtilliy";
import { StorageUtility } from "@/providers/storageUtility";
import api from "@/service/apiCore";

export const SubmitEvaluationService = async (evaluationId: number) => {
  const token = await StorageUtility.get(authToken);
  if (!token) throw new Error("no auth token");

  const url = `/evals/${evaluationId}/submit`;
  const res = await api.post(
    url,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};
