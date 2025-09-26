// app/employee/evaluateEmployee.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Avatar,
  ActivityIndicator,
  Divider,
  Snackbar,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  CreateEvaluationService,
  ListEvaluationsService,
  GetEvaluationbyIDService,
  SaveScoresService,
  SubmitEvaluationService,
} from "@/service";

const GREEN = "#2E7D32";
const BG_SOFT = "#F2F7F2";
const INPUT_BG = "#EAF7E9";
const CARD_BORDER = "#DDEDDC";
const SUBCARD_BORDER = "#E6F1E6";
const TAG_BG = "#E7F3E7";
const SHADOW = "rgba(0,0,0,0.08)";

type EvalItem = {
  item_id: number | string;
  title: string;
  max_score: number;
};

type EvalSection = {
  section_id: number | string;
  title: string;
  display_order: number;
  items: EvalItem[];
};

type Evaluation = {
  id: number;
  employee_id: number;
  employee_name?: string;
  status: "Draft" | "Submitted" | string;
  work_month?: string; // YYYY-MM
  round_no?: number;
  total_max_score?: number;
  note?: string | null;
  position?: string | null;
  percentage?: string | number;
  sections: EvalSection[];
};

type ScoresMap = Record<string, string>; // key = item_id (string), value = score string

/** ---------- helpers ---------- */
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);
const toKey = (id: string | number) => String(id);

/** ---------- Screen ---------- */
export default function EvaluateEmployee() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string; // employee id
    full_name?: string;
  }>();

  const employeeId = useMemo(
    () => (params.id ? Number(params.id) : NaN),
    [params.id]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [scores, setScores] = useState<ScoresMap>({});
  const [note, setNote] = useState("");
  const [position, setPosition] = useState("");

  /** ---- derived totals ---- */
  const allItems: EvalItem[] = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.sections.flatMap((s) => s.items);
  }, [evaluation]);

  const totalMax = useMemo(
    () =>
      allItems.reduce((sum, it) => sum + (Number(it.max_score) || 0), 0) || 0,
    [allItems]
  );

  const totalScore = useMemo(
    () =>
      allItems.reduce((sum, it) => {
        const v = parseInt(scores[toKey(it.item_id)] || "0", 10);
        if (Number.isFinite(v)) return sum + v;
        return sum;
      }, 0),
    [allItems, scores]
  );

  const percentage = useMemo(() => {
    if (!totalMax) return "0.00";
    return ((totalScore / totalMax) * 100).toFixed(2);
  }, [totalScore, totalMax]);

  /** ---- fetch or create evaluation draft ---- */
  const bootstrap = useCallback(async () => {
    if (!employeeId || Number.isNaN(employeeId)) {
      Alert.alert("Error", "ไม่พบรหัสพนักงาน");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // 1) พยายามหา Draft ล่าสุดของพนักงานคนนี้
      const { data: listRes } = await ListEvaluationsService({
        employeeId,
      });
      const found = Array.isArray(listRes?.items) ? listRes.items[0] : null;

      let evalId: number;

      if (found?.id) {
        evalId = found.id;
      } else {
        // 2) ถ้าไม่มี Draft ให้สร้าง Draft ใหม่
        const { data: createRes } = await CreateEvaluationService({
          userId: employeeId,
          // ใส่ค่าที่ระบบคุณคาดหวัง เช่น work_month / round_no ถ้าจำเป็น
          // work_month: formatAPI(new Date()), round_no: 1,
        });
        evalId = createRes?.id;
      }

      // 3) ดึงรายละเอียด Evaluation (sections/items)
      const { data: evalRes } = await GetEvaluationbyIDService(evalId);
      const ev: Evaluation = evalRes;

      setEvaluation(ev);

      // โหลดค่าเริ่มต้น (ถ้ามี score เดิมจาก server)
      const seedScores: ScoresMap = {};
      ev.sections.forEach((sec) =>
        sec.items.forEach((it) => {
          // สมมติ response ของ item มี field current_score (ถ้ามี)
          const key = toKey(it.item_id);
          // @ts-ignore
          const currentScore =
            typeof it.current_score !== "undefined"
              ? String(it.current_score ?? "")
              : "";
          seedScores[key] = currentScore;
        })
      );

      setScores(seedScores);
      setNote(ev.note ?? "");
      setPosition(ev.position ?? "");
    } catch (err: any) {
      console.error(err);
      Alert.alert("เกิดข้อผิดพลาด", err?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  /** ---- handlers ---- */
  const handleChangeScore = (it: EvalItem, text: string) => {
    // อนุญาตเฉพาะตัวเลข (ค่าว่างให้ได้ด้วย)
    const cleaned = text.replace(/[^\d]/g, "");
    let n = cleaned ? parseInt(cleaned, 10) : NaN;

    // clamp ตาม max_score
    if (!Number.isNaN(n)) {
      n = clamp(n, 0, Number(it.max_score) || 0);
    }

    setScores((prev) => ({
      ...prev,
      [toKey(it.item_id)]: Number.isNaN(n) ? "" : String(n),
    }));
  };

  const handleSave = async () => {
    if (!evaluation?.id) return;
    try {
      setSaving(true);

      // แปลงคะแนนเป็น array สำหรับ API ตามโครงสร้างที่ระบบคุณต้องการ
      // ที่พบบ่อย: [{ item_id, score }]
      const payloadScores = allItems.map((it) => ({
        item_id: it.item_id,
        score: parseInt(scores[toKey(it.item_id)] || "0", 10) || 0,
      }));

      await SaveScoresService({
        evaluationId: evaluation.id,
        position,
        note,
        scores: payloadScores,
      });

      setSnack("บันทึกเรียบร้อย");
    } catch (err: any) {
      console.error(err);
      Alert.alert("บันทึกไม่สำเร็จ", err?.message ?? "กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!evaluation?.id) return;
    try {
      // ยืนยันก่อนส่ง
      Alert.alert("ยืนยันการส่งประเมิน", "เมื่อส่งแล้วจะแก้ไขไม่ได้", [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ส่งเลย",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);

            // ป้องกันการส่งคะแนนว่าง ให้ save อัตโนมัติก่อน
            await handleSave();

            await SubmitEvaluationService({ evaluationId: evaluation.id });
            setSnack("ส่งประเมินเรียบร้อย");
            // กลับหน้าก่อนหน้า
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("ส่งไม่สำเร็จ", err?.message ?? "กรุณาลองอีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  /** ---- UI ---- */
  if (loading) {
    return (
      <View style={[sx.center, { flex: 1, backgroundColor: BG_SOFT }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>กำลังโหลด...</Text>
      </View>
    );
  }

  if (!evaluation) {
    return (
      <View style={[sx.center, { flex: 1, backgroundColor: BG_SOFT }]}>
        <Text>ไม่พบข้อมูลแบบประเมิน</Text>
        <Button mode="contained" style={{ marginTop: 12 }} onPress={bootstrap}>
          ลองใหม่
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG_SOFT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
    >
      <ScrollView
        contentContainerStyle={sx.screenPad}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={bootstrap} />
        }
      >
        <View style={sx.card}>
          {/* Employee block */}
          <View style={sx.employeeRow}>
            <Avatar.Icon size={46} icon="account" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={sx.empName}>
                {params.full_name || evaluation.employee_name || "พนักงาน"}
              </Text>

              {/* ระบุตำแหน่ง (ตัวรถ/ตำแหน่งงาน) */}
              <View style={sx.positionRow}>
                <View style={sx.tag}>
                  <Text style={sx.tagText}>ระบุตัวรถ</Text>
                </View>
                <TextInput
                  placeholder="ระบุตัวรถ"
                  placeholderTextColor={"#000"}
                  mode="flat"
                  value={position}
                  onChangeText={setPosition}
                  style={sx.positionInput}
                  left={<TextInput.Icon icon="car" />}
                  underlineColor="transparent"
                />
              </View>
            </View>
          </View>

          {/* Sections */}
          {evaluation.sections
            .slice()
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((sec) => (
              <View key={sec.section_id} style={sx.subCard}>
                <Text style={sx.sectionTitle}>{sec.title}</Text>
                <Divider style={{ marginBottom: 8, opacity: 0.3 }} />
                {sec.items.map((it) => {
                  const key = toKey(it.item_id);
                  return (
                    <View key={key} style={sx.qItem}>
                      <Text style={sx.qText}>
                        {it.title}{" "}
                        <Text style={{ color: "#6B7280" }}>
                          (เต็ม {it.max_score})
                        </Text>
                      </Text>
                      <TextInput
                        mode="flat"
                        keyboardType="numeric"
                        placeholder="0"
                        value={scores[key] ?? ""}
                        onChangeText={(v) => handleChangeScore(it, v)}
                        style={sx.input}
                        underlineColor="transparent"
                        selectionColor={GREEN}
                        right={<TextInput.Affix text={`/ ${it.max_score}`} />}
                      />
                    </View>
                  );
                })}
              </View>
            ))}

          {/* หมายเหตุ */}
          <Text style={sx.label}>หมายเหตุ</Text>
          <TextInput
            mode="flat"
            placeholder="รายละเอียด"
            value={note}
            onChangeText={setNote}
            style={sx.inputNote}
            multiline
            underlineColor="transparent"
          />

          {/* รวมคะแนน */}
          <Text style={sx.totalTextLeft}>
            รวมคะแนน: {totalScore} / {totalMax} ({percentage}%)
          </Text>

          {/* Buttons */}
          <View style={sx.footer}>
            <Button
              mode="contained"
              style={sx.btnCancel}
              labelStyle={sx.btnCancelLabel}
              onPress={() => router.back()}
              disabled={saving || submitting}
            >
              ย้อนกลับ
            </Button>
            <Button
              mode="contained"
              style={sx.btnSave}
              labelStyle={sx.btnSaveLabel}
              onPress={handleSave}
              loading={saving}
              disabled={submitting}
            >
              บันทึก
            </Button>
            <Button
              mode="contained"
              style={sx.btnSubmit}
              labelStyle={sx.btnSubmitLabel}
              onPress={handleSubmit}
              loading={submitting}
              disabled={saving}
            >
              ส่งประเมิน
            </Button>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2200}
      >
        {snack}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const sx = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  screenPad: { padding: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: SHADOW,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },

  // Employee
  employeeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  empName: { fontSize: 14, fontWeight: "700", marginBottom: 8 },

  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    backgroundColor: TAG_BG,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagText: { fontWeight: "700", color: "#2C5E2C", fontSize: 12 },
  positionInput: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    height: 40,
  },

  // Sections
  subCard: {
    borderWidth: 1,
    borderColor: SUBCARD_BORDER,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1F2937",
  },

  qItem: { marginBottom: 10 },
  qText: { fontSize: 13, marginBottom: 4, color: "#1F2937" },

  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 8,
  },

  label: { fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  inputNote: { backgroundColor: INPUT_BG, borderRadius: 10, minHeight: 60 },

  totalTextLeft: {
    marginTop: 14,
    fontWeight: "700",
    textAlign: "left",
    color: "#0f5132",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    gap: 10,
    flexWrap: "wrap",
  },
  btnCancel: {
    backgroundColor: "#E8EFE7",
    borderRadius: 999,
    paddingHorizontal: 18,
    elevation: 0,
  },
  btnCancelLabel: { color: GREEN, fontWeight: "700" },
  btnSave: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 22,
    elevation: 0,
  },
  btnSaveLabel: { color: "#fff", fontWeight: "700" },
  btnSubmit: {
    backgroundColor: "#1B5E20",
    borderRadius: 999,
    paddingHorizontal: 22,
    elevation: 0,
  },
  btnSubmitLabel: { color: "#fff", fontWeight: "700" },
});
