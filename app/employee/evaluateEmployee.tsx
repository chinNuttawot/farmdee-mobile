// app/employee/evaluateEmployee.tsx (เดิม EvaluateEmployee)
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
  Chip,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  CreateEvaluationService,
  GetEvaluationbyIDService,
  SaveScoresService,
  SubmitEvaluationService,
} from "@/service";

const GREEN = "#2E7D32";
const BG_SOFT = "#F2F7F2";
const INPUT_BG = "#EAF7E9";
const CARD_BORDER = "#DDEDDC";
const SUBCARD_BORDER = "#E6F1E6";
const SHADOW = "rgba(0,0,0,0.08)";

type EvalItem = {
  item_id: number | string;
  title: string;
  max_score: number;
  score?: number | null;
  note?: string | null;
  display_order?: number;
};
type EvalSection = {
  section_id: number | string;
  title: string;
  display_order: number;
  items: EvalItem[];
};
type Evaluation = {
  id: number;
  template_id: number;
  employee_id: number;
  evaluator_id: number;
  work_month: string;
  round_no: number;
  status: "Draft" | "Submitted" | string;
  total_score: number;
  total_max_score: number;
  percentage: string;
  note?: string | null;
  template_name?: string;
  sections: EvalSection[];
  employee_name?: string;
};

type ScoresMap = Record<string, string>;
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);
const toKey = (id: string | number) => String(id);

export default function EvaluateEmployee() {
  const router = useRouter();
  const { id, full_name, evaluationId, isView } = useLocalSearchParams<{
    id?: string;
    full_name?: string;
    evaluationId?: string;
    isView?: string;
  }>();

  const employeeId = useMemo(() => (id ? Number(id) : NaN), [id]);
  const givenEvalId = useMemo(
    () => (evaluationId ? Number(evaluationId) : NaN),
    [evaluationId]
  );
  const isViewMode = (isView ?? "").toString().toLowerCase() === "true";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [scores, setScores] = useState<ScoresMap>({});
  const [note, setNote] = useState("");

  const isSubmitted = evaluation?.status === "Submitted";
  const isReadonly = isSubmitted || isViewMode;

  const allItems: EvalItem[] = useMemo(
    () => evaluation?.sections.flatMap((s) => s.items) ?? [],
    [evaluation]
  );
  const apiTotalMax = evaluation?.total_max_score ?? 0;
  const calcTotalScore = useMemo(
    () =>
      allItems.reduce(
        (sum, it) =>
          sum + (parseInt(scores[toKey(it.item_id)] || "0", 10) || 0),
        0
      ),
    [allItems, scores]
  );
  const calcPercentage = useMemo(() => {
    const max =
      apiTotalMax || allItems.reduce((s, it) => s + (it.max_score || 0), 0);
    return max ? ((calcTotalScore / max) * 100).toFixed(2) : "0.00";
  }, [calcTotalScore, apiTotalMax, allItems]);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      let evalIdToUse: number | null = null;

      if (!Number.isNaN(givenEvalId)) {
        evalIdToUse = givenEvalId;
      } else {
        // โหมดดูอย่างเดียวห้ามสร้างใหม่
        if (isViewMode) {
          throw new Error("ไม่พบรหัสแบบประเมิน");
        }
        if (!employeeId || Number.isNaN(employeeId)) {
          Alert.alert("Error", "ไม่พบรหัสพนักงาน");
          setLoading(false);
          return;
        }
        const { data: created } = await CreateEvaluationService({ employeeId });
        evalIdToUse = created?.id ?? null;
      }

      if (!evalIdToUse) throw new Error("ไม่พบรหัสแบบประเมิน");

      const { data: evalRes } = await GetEvaluationbyIDService(evalIdToUse);
      const ev: Evaluation = evalRes;

      setEvaluation(ev);

      const seed: ScoresMap = {};
      ev.sections.forEach((sec) =>
        sec.items.forEach((it) => {
          seed[toKey(it.item_id)] =
            typeof it.score === "number" && Number.isFinite(it.score)
              ? String(it.score)
              : "";
        })
      );
      setScores(seed);
      setNote(ev.note ?? "");
    } catch (err: any) {
      console.error(err);
      Alert.alert("โหลดข้อมูลไม่สำเร็จ", err?.message ?? "กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [employeeId, givenEvalId, isViewMode]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const handleChangeScore = (it: EvalItem, text: string) => {
    if (isReadonly) return; // กันแก้ไขในโหมดดูอย่างเดียว
    const cleaned = text.replace(/[^\d]/g, "");
    let n = cleaned ? parseInt(cleaned, 10) : NaN;
    if (!Number.isNaN(n)) n = clamp(n, 0, Number(it.max_score) || 0);
    setScores((prev) => ({
      ...prev,
      [toKey(it.item_id)]: Number.isNaN(n) ? "" : String(n),
    }));
  };

  const handleSave = async () => {
    if (isReadonly || !evaluation?.id) return;
    try {
      setSaving(true);
      const items = allItems.map((it) => ({
        itemId: Number(it.item_id),
        score: parseInt(scores[toKey(it.item_id)] || "0", 10) || 0,
      }));
      await SaveScoresService({ id: evaluation.id, items, note });
      setSnack("บันทึกเรียบร้อย");
    } catch (err: any) {
      console.error(err);
      Alert.alert("บันทึกไม่สำเร็จ", err?.message ?? "กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (isReadonly || !evaluation?.id) return;
    Alert.alert("ยืนยันการส่งประเมิน", "เมื่อส่งแล้วจะแก้ไขไม่ได้", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ส่งเลย",
        style: "destructive",
        onPress: async () => {
          try {
            setSubmitting(true);
            await handleSave();
            await SubmitEvaluationService(evaluation.id);
            router.back();
          } catch (err: any) {
            Alert.alert("ส่งไม่สำเร็จ", err?.message ?? "กรุณาลองอีกครั้ง");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

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
        {!isViewMode && (
          <Button
            mode="contained"
            style={{ marginTop: 12 }}
            onPress={bootstrap}
          >
            ลองใหม่
          </Button>
        )}
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
          <View style={sx.headerRow}>
            <Text style={sx.formTitle}>
              {evaluation.template_name || "การประเมินพนักงาน"}
            </Text>
            <Chip compact style={{ backgroundColor: "#EEF7EE" }}>
              {isReadonly ? "View" : evaluation.status}
            </Chip>
          </View>
          <Text style={sx.metaText}>
            เดือนงาน: {evaluation.work_month} | รอบ: {evaluation.round_no}
          </Text>
          <Text style={[sx.metaText, { marginBottom: 8 }]}>
            จากระบบ: {evaluation.total_score} / {evaluation.total_max_score} (
            {evaluation.percentage}%)
          </Text>
          <Divider style={{ opacity: 0.15, marginBottom: 8 }} />

          <View style={sx.employeeRow}>
            <Avatar.Icon size={46} icon="account" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={sx.empName}>
                {full_name || evaluation.employee_name || "พนักงาน"}
              </Text>
            </View>
          </View>

          {evaluation.sections
            .slice()
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((sec) => (
              <View key={sec.section_id} style={sx.subCard}>
                <Text style={sx.sectionTitle}>{sec.title}</Text>
                <Divider style={{ marginBottom: 8, opacity: 0.3 }} />
                {sec.items
                  .slice()
                  .sort(
                    (a, b) => (a.display_order || 0) - (b.display_order || 0)
                  )
                  .map((it) => {
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
                          disabled={isReadonly}
                        />
                      </View>
                    );
                  })}
              </View>
            ))}

          <Text style={sx.label}>หมายเหตุ</Text>
          <TextInput
            mode="flat"
            placeholder="รายละเอียด"
            value={note}
            onChangeText={setNote}
            style={sx.inputNote}
            multiline
            underlineColor="transparent"
            disabled={isReadonly}
          />

          <Text style={sx.totalTextLeft}>
            รวมคะแนน (คำนวณ): {calcTotalScore} / {apiTotalMax} ({calcPercentage}
            %)
          </Text>

          {!isReadonly && (
            <View style={sx.footer}>
              <Button
                mode="contained"
                style={sx.btnSave}
                labelStyle={sx.btnSaveLabel}
                onPress={handleSave}
                loading={saving}
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
          )}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  statusChipMeta: { backgroundColor: "#EEF7EE" },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  empName: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  metaText: { color: "#6B7280", fontSize: 12 },
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
