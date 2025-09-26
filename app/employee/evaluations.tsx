// app/employee/evaluations.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Text,
  Card,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import {
  ListEvaluationsService,
  CreateEvaluationService,
  DeleteEvaluationService, // ✅ เพิ่ม service ลบ
} from "@/service";
import { PROFILE_KEY } from "@/service/profileService/lindex";
import { StorageUtility } from "@/providers/storageUtility";
import moment from "moment";

const GREEN = "#2E7D32";
const BG = "#F1F7F1";

type EvalRow = {
  id: number;
  status: "Draft" | "Submitted" | string;
  work_month?: string;
  round_no?: number;
  total_score?: number;
  percentage?: string;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function EmployeeEvaluations() {
  const router = useRouter();
  const { id, full_name, isView } = useLocalSearchParams<{
    id?: string;
    full_name?: string;
    isView?: string;
  }>();
  const userId = useMemo(() => (id ? Number(id) : NaN), [id]);
  const isViewMode = (isView ?? "").toString().toLowerCase() === "true";

  const [list, setList] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null); // ✅

  const load = useCallback(async () => {
    if (!userId || Number.isNaN(userId)) {
      Alert.alert("Error", "ไม่พบรหัสพนักงาน");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await ListEvaluationsService({ employeeId: userId });
      const items: EvalRow[] = Array.isArray(data?.items) ? data.items : [];
      items.sort((a, b) => {
        const tb = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
        const ta = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
        return tb - ta;
      });
      setList(items);
    } catch (err: any) {
      console.error(err);
      Alert.alert("เกิดข้อผิดพลาด", err?.message ?? "โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const createEvaluation = useCallback(async () => {
    if (isViewMode) return; // โหมดดูอย่างเดียวไม่ให้สร้าง
    if (!userId || Number.isNaN(userId)) return;
    try {
      setCreating(true);
      const profileRaw = await StorageUtility.get(PROFILE_KEY);
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      const { data } = await CreateEvaluationService({
        employeeId: userId,
        evaluatorId: profile?.id,
        workMonth: moment().format("YYYY-MM"),
      });
      const newId = data?.id;
      if (!newId) {
        Alert.alert("ไม่สามารถสร้างแบบประเมิน", "ไม่พบรหัสที่สร้าง");
        return;
      }
      router.push({
        pathname: "/employee/evaluateEmployee",
        params: { evaluationId: String(newId), id: String(userId), full_name },
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert("สร้างไม่สำเร็จ", err?.message ?? "กรุณาลองใหม่");
    } finally {
      setCreating(false);
    }
  }, [router, userId, full_name, isViewMode]);

  const openEvaluation = (row: EvalRow) => {
    router.push({
      pathname: "/employee/evaluateEmployee",
      params: {
        evaluationId: String(row.id),
        id: String(userId),
        full_name,
        isView: String(isViewMode), // ส่งต่อสถานะดูอย่างเดียว
      },
    });
  };

  // ✅ ลบรายการ (เฉพาะ Draft และเมื่อไม่ใช่โหมดดูอย่างเดียว)
  const tryDelete = useCallback(
    (row: EvalRow) => {
      if (isViewMode) return;
      if (row.status !== "Draft") {
        Alert.alert("ลบไม่ได้", "รายการที่ส่งแล้วไม่สามารถลบได้");
        return;
      }
      Alert.alert(
        "ลบรายการประเมิน",
        `ต้องการลบรอบที่ ${row.round_no ?? "-"} ของเดือน ${
          row.work_month ?? "-"
        } ใช่ไหม?`,
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "ลบ",
            style: "destructive",
            onPress: async () => {
              try {
                setDeletingId(row.id);
                await DeleteEvaluationService(row.id);
                setList((prev) => prev.filter((it) => it.id !== row.id));
              } catch (err: any) {
                console.error(err);
                Alert.alert("ลบไม่สำเร็จ", err?.message ?? "กรุณาลองใหม่");
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    },
    [isViewMode]
  );

  const renderItem = ({ item }: { item: EvalRow }) => {
    const statusColor =
      item.status === "Submitted"
        ? "#0E9F6E"
        : item.status === "Draft"
        ? "#F59E0B"
        : "#6B7280";

    const isDeleting = deletingId === item.id;

    return (
      <Card
        style={[sx.card, isDeleting && { opacity: 0.5 }]}
        onPress={() => openEvaluation(item)}
        onLongPress={() => tryDelete(item)} // ✅ กดค้างเพื่อลบ
        delayLongPress={450}
      >
        <Card.Content>
          <View style={sx.rowHeader}>
            <Text style={sx.title}>การประเมินพนักงาน</Text>
            <Chip
              compact
              style={[sx.statusChip, { backgroundColor: statusColor + "22" }]}
              textStyle={{ color: statusColor }}
            >
              {item.status}
            </Chip>
          </View>

          <Text style={sx.sub}>
            เดือนงาน: {item.work_month || "-"} | รอบ: {item.round_no ?? "-"}
          </Text>

          <Divider style={{ marginVertical: 8, opacity: 0.2 }} />

          <Text style={sx.scoreText}>
            คะแนนรวม: {item.total_score ?? 0}{" "}
            <Text style={sx.percent}>({item.percentage ?? "0.00"}%)</Text>
          </Text>

          {item.note ? (
            <Text style={sx.note}>หมายเหตุ: {item.note}</Text>
          ) : null}

          <View style={sx.rowFooter}>
            <Button
              compact
              mode="text"
              onPress={() => openEvaluation(item)}
              icon={
                isViewMode || item.status === "Submitted" ? "eye" : "pencil"
              }
              textColor={GREEN}
            >
              {isViewMode || item.status === "Submitted"
                ? "ดูรายละเอียด"
                : "ทำต่อ"}
            </Button>
            {isDeleting ? (
              <ActivityIndicator />
            ) : (
              <IconButton
                icon="chevron-right"
                onPress={() => openEvaluation(item)}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={sx.header}>
        <Text style={sx.headerTitle}>ประเมิน: {full_name || "พนักงาน"}</Text>
      </View>

      {loading ? (
        <View style={sx.loadingWrap}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>กำลังโหลด...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={list}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: isViewMode ? 16 : 100,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={sx.empty}>
                <Text>ยังไม่มีรายการประเมิน</Text>
              </View>
            }
          />

          {!isViewMode && (
            <View style={sx.bottomBar}>
              <Button
                mode="contained"
                onPress={createEvaluation}
                loading={creating}
                disabled={creating}
                style={sx.createBtn}
                labelStyle={{ fontWeight: "700" }}
              >
                สร้างประเมิน
              </Button>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const sx = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { padding: 24, alignItems: "center" },
  card: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: "700", fontSize: 14, color: "#111827" },
  sub: { marginTop: 4, color: "#6B7280", fontSize: 12 },
  scoreText: { marginTop: 6, fontWeight: "700", color: "#111827" },
  percent: { color: "#065F46", fontWeight: "700" },
  note: { marginTop: 4, color: "#374151" },
  statusChip: { height: 28 },
  rowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  createBtn: { borderRadius: 999, backgroundColor: GREEN },
});
