// app/employee/evaluations.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Alert,
  SectionList,
  TouchableOpacity,
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
  DeleteEvaluationService,
} from "@/service";
import { PROFILE_KEY } from "@/service/profileService/lindex";
import { StorageUtility } from "@/providers/storageUtility";
import moment from "moment";

const GREEN = "#2E7D32";
const BG = "#F1F7F1";

// ปรับได้ถ้าคะแนนเต็มต่อแบบประเมินไม่ใช่ 400
const DEFAULT_MAX_PER_EVAL = 400;

type EvalRow = {
  id: number;
  status: "Draft" | "Submitted" | string;
  work_month?: string; // YYYY-MM
  round_no?: number;
  total_score?: number;
  percentage?: string; // "91.25" หรือ "0.00"
  note?: string | null;
  created_at?: string;
  updated_at?: string;
};

type EvalSection = {
  // ใช้ monthKey เป็น YYYY-MM เพื่อจัดกลุ่มรายเดือนจริงๆ
  monthKey: string; // YYYY-MM
  title: string; // YYYY-MM (หัวข้อกลุ่ม)
  data: EvalRow[];
  count: number;

  // summary ต่อเดือน
  sumScore: number;
  sumMax: number;
  sumPercent: number; // 0-100
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // เก็บสถานะย่อ/ขยายของแต่ละเดือน (monthKey)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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
      // เรียงล่าสุดไปเก่าตาม updated_at > created_at
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
    if (isViewMode) return;
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
        isView: String(isViewMode),
      },
    });
  };

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

  // --------- Group by "MONTH" (YYYY-MM) + สรุปคะแนนต่อเดือน ----------
  const baseSections: EvalSection[] = useMemo(() => {
    const groups = new Map<string, EvalRow[]>();

    list.forEach((row) => {
      // เอา updated_at > created_at แล้วตัดเป็นคีย์เดือน
      const iso = row.updated_at || row.created_at || "";
      const monthKey = moment(iso).utcOffset(7).format("YYYY-MM");
      if (!groups.has(monthKey)) groups.set(monthKey, []);
      groups.get(monthKey)!.push(row);
    });

    const result: EvalSection[] = Array.from(groups.entries())
      .map(([monthKey, rows]) => {
        // เรียงรายการในเดือนล่าสุด->เก่าสุด
        rows.sort((a, b) => {
          const tb = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
          const ta = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
          return tb - ta;
        });

        // คำนวณสรุปต่อเดือน
        let sumScore = 0;
        let sumMax = 0;
        rows.forEach((r) => {
          const score = Number(r.total_score ?? 0) || 0;
          sumScore += score;

          const pctStr = (r.percentage ?? "").toString().trim();
          const pct = Number(pctStr);
          let maxThis = DEFAULT_MAX_PER_EVAL;

          if (Number.isFinite(pct) && pct > 0) {
            const est = score / (pct / 100); // แปลงกลับเป็นเต็ม
            // ปัดให้ใกล้เคียง และอย่างน้อย 1
            maxThis = Math.max(1, Math.round(est));
          } else if (pct === 0) {
            // ถ้าระบุ 0% (คะแนน 0) เดาย้อนกลับไม่ได้ ใช้ค่า default
            maxThis = DEFAULT_MAX_PER_EVAL;
          }
          sumMax += maxThis;
        });

        const sumPercent = sumMax > 0 ? (sumScore / sumMax) * 100 : 0;

        return {
          monthKey,
          title: monthKey, // หัวข้อเดือนเป็น YYYY-MM
          data: rows,
          count: rows.length,
          sumScore,
          sumMax,
          sumPercent,
        };
      })
      // เรียงเดือนใหม่ก่อน
      .sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));

    return result;
  }, [list]);

  // นำสถานะ collapsed มาปรับ data ให้ว่างเมื่อย่อกลุ่ม
  const sections = useMemo(() => {
    return baseSections.map((s) =>
      collapsed.has(s.monthKey) ? { ...s, data: [] } : s
    );
  }, [baseSections, collapsed]);

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsed(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsed(new Set(baseSections.map((s) => s.monthKey)));
  }, [baseSections]);

  const renderItem = ({ item }: { item: EvalRow }) => {
    const statusColor =
      item.status === "Submitted"
        ? "#0E9F6E"
        : item.status === "Draft"
        ? "#F59E0B"
        : "#6B7280";

    const isDeleting = deletingId === item.id;
    const hasRound =
      typeof item.round_no === "number" && Number.isFinite(item.round_no);

    return (
      <Card
        style={[sx.card, isDeleting && { opacity: 0.5 }]}
        onPress={() => openEvaluation(item)}
        onLongPress={() => tryDelete(item)}
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
            เดือนงาน: {item.work_month || "-"}
            {hasRound ? `  |  รอบ: ${item.round_no}` : ""}
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

  const renderSectionHeader = ({ section }: { section: EvalSection }) => {
    const isCollapsed = collapsed.has(section.monthKey);
    const pctStr =
      section.sumMax > 0 ? ` (${section.sumPercent.toFixed(2)}%)` : "";
    return (
      <TouchableOpacity onPress={() => toggleSection(section.monthKey)}>
        <View style={[sx.sectionHeader, isCollapsed && { opacity: 0.95 }]}>
          <View style={sx.sectionHeaderRow}>
            <Text style={sx.sectionTitle}>{section.title}</Text>
            <View style={sx.sectionRight}>
              <Text style={sx.sectionCount}>
                {section.count} รายการ · รวม: {section.sumScore}/
                {section.sumMax}
                {pctStr}
              </Text>
              <IconButton
                icon={isCollapsed ? "chevron-down" : "chevron-up"}
                size={18}
                onPress={() => toggleSection(section.monthKey)}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
          <SectionList
            sections={sections}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: isViewMode ? 16 : 100,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
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
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  headerControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
  },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { padding: 24, alignItems: "center" },

  sectionHeader: {
    backgroundColor: "#EAF3EA",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#1F2937" },
  sectionRight: { flexDirection: "row", alignItems: "center" },
  sectionCount: { fontSize: 12, fontWeight: "500", color: "#4B5563" },

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
