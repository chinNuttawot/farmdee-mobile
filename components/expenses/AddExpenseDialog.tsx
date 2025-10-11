// components/expenses/AddExpenseDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  StatusBar,
} from "react-native";
import {
  Button,
  Portal,
  Modal,
  TextInput,
  Chip,
  Text,
  Card,
  Icon,
} from "react-native-paper";
import { styles } from "@/styles/ui";
import { Expense, ExpenseType, typeMeta } from "./typeMeta";
import SingleDatePickerModal from "../Calendar/SingleDatePickerModal";
import { formatAPI } from "@/lib/date";

/** ================= Keyboard helpers (เหมือน CreateTaskModal) ================= */
function useKeyboardSpace() {
  const [space, setSpace] = useState(0);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => setSpace(e?.endCoordinates?.height ?? 0);
    const onHide = () => setSpace(0);

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  return space;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd?: (exp: Omit<Expense, "id">) => void; // โหมดเพิ่มใหม่
  onSave?: (exp: Expense) => void; // โหมดแก้ไข
  initial?: Expense; // ค่าตั้งต้นเมื่อแก้ไข
};

export default function AddExpenseDialog({
  visible,
  onClose,
  onAdd,
  onSave,
  initial,
}: Props) {
  // form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ExpenseType>("fuel");
  const [jobNote, setJobNote] = useState("");
  const [qtyNote, setQtyNote] = useState("");
  const [workDate, setWorkDate] = useState(""); // YYYY-MM-DD
  const [total_amount, setAmount] = useState("");

  // date picker state
  const [dateOpen, setDateOpen] = useState(false);

  const isEdit = !!initial;

  // ===== keyboard spacing & offset (กันบังอินพุตตอนพิมพ์) =====
  const keyboardSpace = useKeyboardSpace();
  const keyboardVerticalOffset =
    Platform.OS === "ios" ? (StatusBar.currentHeight ?? 0) + 12 : 0;

  // prefill เมื่อเปิด modal
  useEffect(() => {
    if (!visible) return;

    if (initial) {
      setTitle(initial.title ?? "");
      setType(initial.type ?? "fuel");
      // รองรับทั้ง snake/camel (ตามโค้ดเดิม)
      setJobNote((initial as any).job_note ?? (initial as any).jobNote ?? "");
      setQtyNote((initial as any).qty_note ?? (initial as any).qtyNote ?? "");

      // รองรับทั้ง ISO และ YYYY-MM-DD
      const rawDate =
        (initial as any).work_date ?? (initial as any).workDate ?? "";
      const normalized =
        typeof rawDate === "string"
          ? rawDate.includes("T")
            ? rawDate.slice(0, 10)
            : rawDate
          : "";
      setWorkDate(normalized);

      setAmount(
        typeof (initial as any).amount === "number"
          ? String((initial as any).amount)
          : (initial as any).total_amount
          ? String((initial as any).total_amount)
          : ""
      );
    } else {
      setTitle("");
      setType("fuel");
      setJobNote("");
      setQtyNote("");
      setWorkDate(""); // ให้ผู้ใช้เลือกจากปฏิทิน
      setAmount("");
    }

    setDateOpen(false);
  }, [visible, initial]);

  const toNum = (s: string) => {
    const n = Number((s || "0").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const canSubmit = useMemo(
    () => (title.trim() || jobNote.trim()) && toNum(total_amount) > 0,
    [title, jobNote, total_amount]
  );

  const submit = () => {
    const amt = toNum(total_amount);
    if (!canSubmit) return;

    if (isEdit && initial) {
      const updated: Expense = {
        id: initial.id,
        title: title.trim() || typeMeta[type].label,
        amount: amt,
        type,
        jobNote: jobNote.trim() || undefined,
        qtyNote: qtyNote.trim() || undefined,
        workDate: workDate.trim() || undefined, // YYYY-MM-DD
      };
      onSave?.(updated);
    } else {
      const payload: Omit<Expense, "id"> = {
        title: title.trim() || typeMeta[type].label,
        amount: amt,
        type,
        jobNote: jobNote.trim() || undefined,
        qtyNote: qtyNote.trim() || undefined,
        workDate: workDate.trim() || undefined, // YYYY-MM-DD
      };
      onAdd?.(payload);
    }
    onClose();
  };

  // สร้างค่า initial date สำหรับปฏิทิน
  const initialDateForPicker = () => {
    try {
      if (workDate) {
        // สร้าง Date จาก YYYY-MM-DD แบบปลอดภัย (หลีกเลี่ยง timezone เพี้ยน)
        const [y, m, d] = workDate.split("-").map((x) => Number(x));
        if (y && m && d) return new Date(y, m - 1, d);
      }
    } catch {}
    return new Date(); // ไม่มีก็วันนี้
  };

  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={styles.assigneeModal}>
        {/* ✅ ป้องกันคีย์บอร์ดบัง: ใช้ทั้ง KeyboardAvoidingView + bottom spacer */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <Text style={styles.dialogTitleV2}>
            {isEdit ? "แก้ไขรายการค่าใช้จ่าย" : "เพิ่มค่าใช้จ่าย"}
          </Text>

          <ScrollView
            style={{ maxHeight: 520 }}
            contentContainerStyle={[
              styles.dialogContentV2,
              { paddingBottom: 24 + keyboardSpace },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabelV2}>ชื่องาน (ถ้ามี)</Text>
            <TextInput
              mode="outlined"
              value={title}
              onChangeText={setTitle}
              placeholder="เช่น ค่าแรงเกี่ยวข้าว"
              style={styles.inputOutlined}
              left={<TextInput.Icon icon="clipboard-text-outline" />}
              dense
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <Text style={styles.fieldLabelV2}>ประเภท</Text>
            <View style={styles.segmentWrapV2}>
              {/* {(["labor", "fuel", "material"] as ExpenseType[]).map((t) => { */}
              {(["fuel", "material"] as ExpenseType[]).map((t) => {
                const selected = type === t;
                return (
                  <Chip
                    key={t}
                    compact
                    selected={selected}
                    onPress={() => setType(t)}
                    style={[
                      styles.segmentChipV2,
                      selected && {
                        backgroundColor: typeMeta[t].color + "1A",
                        borderColor: typeMeta[t].color + "55",
                      },
                    ]}
                    textStyle={[
                      styles.segmentTextV2,
                      selected && {
                        color: typeMeta[t].color,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {typeMeta[t].label}
                  </Chip>
                );
              })}
            </View>

            <Text style={styles.fieldLabelV2}>รายละเอียด</Text>
            <TextInput
              mode="outlined"
              value={jobNote}
              onChangeText={setJobNote}
              placeholder="รายละเอียดงาน/หมายเหตุ"
              style={styles.inputOutlined}
              left={<TextInput.Icon icon="note-text-outline" />}
              dense
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <Text style={styles.fieldLabelV2}>จำนวน/หน่วย</Text>
            <TextInput
              mode="outlined"
              value={qtyNote}
              onChangeText={setQtyNote}
              placeholder="เช่น 5 กระสอบ หรือ 8 ชม. × ฿150"
              style={styles.inputOutlined}
              left={<TextInput.Icon icon="format-list-numbered" />}
              dense
              returnKeyType="next"
              blurOnSubmit={false}
            />

            <Text style={styles.fieldLabelV2}>วันที่ทำงาน</Text>
            <Card
              onPress={() => setDateOpen(true)}
              mode="outlined"
              style={{ borderRadius: 12, marginBottom: 12 }}
            >
              <Card.Content
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  gap: 8,
                }}
              >
                <Icon source="calendar" size={18} />
                <Text
                  numberOfLines={1}
                  style={{
                    color: workDate?.trim() ? "#111827" : "#9CA3AF",
                    fontSize: 16,
                    fontWeight: workDate?.trim() ? "600" : "400",
                  }}
                >
                  {workDate?.trim() ? workDate : "YYYY-MM-DD"}
                </Text>
              </Card.Content>
            </Card>

            <Text style={styles.fieldLabelV2}>จำนวนเงิน</Text>
            <TextInput
              mode="outlined"
              value={total_amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              style={styles.inputOutlined}
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
              dense
              // 🔻 ตัด auto-submit ตอนกด Done/Enter ออก
              // onSubmitEditing={submit}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </ScrollView>

          <View style={styles.dialogActionsV2}>
            <Button mode="outlined" onPress={onClose} style={styles.btnV2}>
              ยกเลิก
            </Button>
            <Button
              mode="contained"
              onPress={submit}
              style={[styles.btnV2, styles.btnPrimaryV2]}
              disabled={!canSubmit}
            >
              {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
            </Button>
          </View>
        </KeyboardAvoidingView>

        {/* ✅ Date Picker */}
        <SingleDatePickerModal
          open={dateOpen}
          onClose={() => setDateOpen(false)}
          initialDate={initialDateForPicker()}
          onConfirm={(d) => {
            setWorkDate(formatAPI(d)); // -> YYYY-MM-DD
            setDateOpen(false);
          }}
        />
      </Modal>
    </Portal>
  );
}
