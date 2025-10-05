// components/SalarySlipFormModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import {
  Button,
  Card,
  Modal,
  Portal,
  Text,
  TextInput,
  Divider,
  Chip,
} from "react-native-paper";

export type SalarySlipInput = {
  employeeName: string;
  month: string;
  days: number;
  pieces: number;
  details: string;
  total_amount: number;
  deduct: number;
  remain: number;
};

export type PreviewSummary = {
  userId: number;
  month: string;
  raiQty: number;
  raiAmount: number;
  repairDays: number;
  repairAmount: number;
  dailyAmount: number;
  grossAmount: number;
};

export type PreviewDetail = {
  date: string;
  endDate?: string | null;
  taskId: number;
  title: string;
  jobType: string;
  workerPayType: string;
  area?: string | number | null;
  ratePerRai?: string | number | null;
  repairRate?: string | number | null;
  dailyRate?: string | number | null;
  display?: string;
};

export type SavePayrollPayload = {
  userId: number;
  month: string;
  deduction: number;
  note: string;
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (payload: SavePayrollPayload) => void;
  defaultEmployeeName?: string;
  defaultMonth?: string;
  initialValues?: Partial<SalarySlipInput> & { note?: string };
  previewSummary?: PreviewSummary;
  previewDetails?: PreviewDetail[];
};

const PRIMARY = "#2E7D32";
const PRIMARY_TEXT = "#1B5E20";
const BLUE = "#4F86FF";
const LAVENDER = "#F4F6FF";
const READ_BG = "#F3F4F6";
const READ_BORDER = "#E5E7EB";
const EDIT_BG = "#E8F5E9";
const EDIT_BORDER = "#2E7D32";

const { height: H } = Dimensions.get("window");

export default function SalarySlipFormModal({
  visible,
  onDismiss,
  onSave,
  defaultEmployeeName = "",
  defaultMonth = "",
  initialValues,
  previewSummary,
  previewDetails,
}: Props) {
  const [employeeName, setEmployeeName] = useState(defaultEmployeeName);
  const [month, setMonth] = useState(defaultMonth);
  const [days, setDays] = useState<string>("0");
  const [pieces, setPieces] = useState<string>("0");
  const [details, setDetails] = useState<string>("");
  const [total_amount, setTotalAmount] = useState<number>(0);
  const [deduct, setDeduct] = useState<string>("0");
  const [remain, setRemain] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (!visible) return;

    if (!initialValues) {
      setEmployeeName(defaultEmployeeName);
      setMonth(defaultMonth);
      setDays("0");
      setPieces("0");
      setDetails("");
      setTotalAmount(0);
      setDeduct("0");
      setRemain(0);
      setNote("");
      return;
    }

    setEmployeeName(String(initialValues.employeeName ?? defaultEmployeeName));
    setMonth(String(initialValues.month ?? defaultMonth));
    setDays(String(initialValues.days ?? 0));
    setPieces(String(initialValues.pieces ?? 0));
    setDetails(String(initialValues.details ?? ""));
    const gross = Number(initialValues.total_amount ?? 0);
    setTotalAmount(gross);
    const dd = Number(initialValues.deduct ?? 0);
    setDeduct(String(dd));
    setRemain(gross - dd);
    setNote(String((initialValues as any)?.note ?? ""));
  }, [visible, initialValues, defaultEmployeeName, defaultMonth]);

  useEffect(() => {
    const dd = Number(deduct) || 0;
    setRemain((total_amount || 0) - dd);
  }, [deduct, total_amount]);

  const handleSave = () => {
    const userId = Number(previewSummary?.userId ?? 0);
    const payload: SavePayrollPayload = {
      userId,
      month,
      deduction: Number(deduct) || 0,
      note: note?.trim() ?? "",
    };
    onSave(payload);
  };

  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const animatedStyle = useMemo(
    () => ({
      opacity: slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0],
          }),
        },
      ],
    }),
    [slideAnim]
  );

  const fmt = (n: number) =>
    "฿" +
    (isNaN(n) ? 0 : n).toLocaleString("th-TH", { minimumFractionDigits: 0 });

  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={sx.modalWrap}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <Animated.View style={animatedStyle}>
            <Card style={sx.modalCard}>
              <Animated.ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                contentContainerStyle={sx.scrollInner}
              >
                <Text style={sx.title}>สร้างใบจ่ายเงินเดือน</Text>
                {previewSummary && (
                  <View style={sx.summaryCard}>
                    <Text style={sx.summaryTitle}>
                      สรุปพรีวิว {previewSummary.month}
                    </Text>
                    <View style={sx.summaryRow}>
                      <Chip style={sx.summaryChip} icon="sprout">
                        งานไร่: {previewSummary.raiQty} ไร่ (
                        {fmt(previewSummary.raiAmount)})
                      </Chip>
                      <Chip style={sx.summaryChip} icon="wrench">
                        งานซ่อม: {previewSummary.repairDays} วัน (
                        {fmt(previewSummary.repairAmount)})
                      </Chip>
                    </View>
                    <View style={sx.summaryRow}>
                      <Chip style={sx.summaryChip} icon="account-hard-hat">
                        รายวัน: {fmt(previewSummary.dailyAmount)}
                      </Chip>
                      <Chip style={sx.summaryChip} icon="cash-multiple">
                        รวมก่อนหัก: {fmt(previewSummary.grossAmount)}
                      </Chip>
                    </View>
                    <Divider style={{ marginTop: 8 }} />
                  </View>
                )}
                <Text style={sx.label}>ชื่อ</Text>
                <TextInput
                  mode="outlined"
                  value={employeeName}
                  editable={false}
                  style={[sx.input, sx.inputRead]}
                />
                <Text style={sx.label}>เดือนที่จ่ายเงิน</Text>
                <TextInput
                  mode="outlined"
                  value={month}
                  editable={false}
                  style={[sx.input, sx.inputRead]}
                  left={<TextInput.Icon icon="calendar" />}
                />
                <View style={sx.inline}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={sx.label}>จำนวนวันซ่อม</Text>
                    <TextInput
                      mode="outlined"
                      value={String(days)}
                      editable={false}
                      style={[sx.input, sx.inputRead]}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={sx.label}>จำนวนไร่</Text>
                    <TextInput
                      mode="outlined"
                      value={String(pieces)}
                      editable={false}
                      style={[sx.input, sx.inputRead]}
                    />
                  </View>
                </View>
                <Text style={sx.label}>รายละเอียด</Text>
                {Array.isArray(previewDetails) && previewDetails.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    {previewDetails.map((d, i) => (
                      <Text key={`${d.taskId}-${i}`} style={sx.detailLine}>
                        • {d.display || `${d.date} ${d.title}`.trim()}
                      </Text>
                    ))}
                    <Divider style={{ marginTop: 8 }} />
                  </View>
                )}
                <Text style={sx.label}>จำนวนเงิน</Text>
                <TextInput
                  mode="outlined"
                  value={String(fmt(total_amount))}
                  editable={false}
                  style={[sx.input, sx.inputRead]}
                />
                <Text style={sx.label}>
                  หักเบิก <Text style={sx.editTag}>กรอกได้</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={deduct}
                  placeholder="0"
                  onChangeText={setDeduct}
                  right={<TextInput.Affix text="฿" />}
                  style={[sx.input, sx.inputEdit]}
                />
                <Text style={sx.label}>
                  หมายเหตุ <Text style={sx.editTag}>กรอกได้</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  value={note}
                  onChangeText={setNote}
                  placeholder="เช่น จ่ายเงินเดือน...."
                  style={[
                    sx.input,
                    sx.inputEdit,
                    { paddingTop: 8, maxHeight: 100 },
                  ]}
                  multiline
                />
                <Text style={sx.label}>คงเหลือ</Text>
                <TextInput
                  mode="outlined"
                  value={String(fmt(remain))}
                  editable={false}
                  style={[sx.input, sx.inputRead]}
                />
                <View style={sx.footerWrap}>
                  <View style={{ flex: 1 }} />
                  <View style={sx.footerBtns}>
                    <Button
                      mode="contained-tonal"
                      onPress={onDismiss}
                      style={sx.btnCancel}
                      labelStyle={sx.btnCancelLabel}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSave}
                      style={sx.btnSave}
                      labelStyle={sx.btnSaveLabel}
                    >
                      บันทึก
                    </Button>
                  </View>
                </View>
              </Animated.ScrollView>
            </Card>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const sx = StyleSheet.create({
  modalWrap: {
    padding: 12,
    alignSelf: "center",
    width: "92%",
    maxWidth: 520,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: LAVENDER,
    borderWidth: 2,
    borderColor: BLUE,
    overflow: "hidden",
    maxHeight: Math.min(H * 0.86, 720),
  },
  scrollInner: {
    padding: 14,
    paddingBottom: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1F2937",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  summaryChip: {
    backgroundColor: "#F0FDF4",
  },
  detailLine: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 4,
  },
  label: { fontSize: 12, color: "#374151", marginBottom: 6, marginTop: 8 },
  readOnlyTag: {
    fontSize: 11,
    color: "#6B7280",
  },
  editTag: {
    fontSize: 11,
    color: PRIMARY_TEXT,
    fontWeight: "700",
  },

  input: { borderRadius: 12 },
  inputRead: {
    backgroundColor: READ_BG,
    borderColor: READ_BORDER,
  },
  inputEdit: {
    backgroundColor: EDIT_BG,
    borderColor: EDIT_BORDER,
  },
  textarea: { height: 120 },
  inline: { flexDirection: "row", alignItems: "flex-start" },
  footerWrap: { marginTop: 16, marginBottom: 4 },
  footerBtns: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  btnCancel: {
    borderRadius: 999,
    paddingHorizontal: 18,
  },
  btnCancelLabel: {
    color: PRIMARY_TEXT,
    fontWeight: "700",
  },
  btnSave: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 22,
    elevation: 0,
  },
  btnSaveLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
