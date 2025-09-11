// components/expenses/AddExpenseDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, View, ScrollView } from "react-native";
import {
  Button,
  Portal,
  Modal, // ✅ ใช้ Modal แทน Dialog
  TextInput,
  Chip,
  Text,
} from "react-native-paper";
import { styles } from "@/styles/ui";
import { Expense, ExpenseType, typeMeta } from "./typeMeta";

type Props = {
  visible: boolean;
  onClose: () => void;
  // โหมดเพิ่มใหม่
  onAdd?: (exp: Omit<Expense, "id">) => void;
  // โหมดแก้ไข
  onSave?: (exp: Expense) => void;
  // ค่าตั้งต้นเมื่อแก้ไข
  initial?: Expense;
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
  const [type, setType] = useState<ExpenseType>("labor");
  const [jobNote, setJobNote] = useState("");
  const [qtyNote, setQtyNote] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [amount, setAmount] = useState("");

  const isEdit = !!initial;

  // prefill เมื่อเปิด modal
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setTitle(initial.title ?? "");
      setType(initial.type ?? "labor");
      setJobNote(initial.jobNote ?? "");
      setQtyNote(initial.qtyNote ?? "");
      setWorkDate(initial.workDate ?? "");
      setAmount(
        typeof initial.amount === "number" ? String(initial.amount) : ""
      );
    } else {
      setTitle("");
      setType("labor");
      setJobNote("");
      setQtyNote("");
      setWorkDate("");
      setAmount("");
    }
  }, [visible, initial]);

  const toNum = (s: string) => {
    const n = Number((s || "0").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const canSubmit = useMemo(
    () => (title.trim() || jobNote.trim()) && toNum(amount) > 0,
    [title, jobNote, amount]
  );

  const submit = () => {
    const amt = toNum(amount);
    if (!canSubmit) return;

    if (isEdit && initial) {
      const updated: Expense = {
        id: initial.id,
        title: title.trim() || typeMeta[type].label,
        amount: amt,
        type,
        jobNote: jobNote.trim() || undefined,
        qtyNote: qtyNote.trim() || undefined,
        workDate: workDate.trim() || undefined,
      };
      onSave?.(updated);
    } else {
      const payload: Omit<Expense, "id"> = {
        title: title.trim() || typeMeta[type].label,
        amount: amt,
        type,
        jobNote: jobNote.trim() || undefined,
        qtyNote: qtyNote.trim() || undefined,
        workDate: workDate.trim() || undefined,
      };
      onAdd?.(payload);
    }
    onClose();
  };

  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={styles.assigneeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text style={styles.dialogTitleV2}>
            {isEdit ? "แก้ไขรายการค่าใช้จ่าย" : "เพิ่มค่าใช้จ่าย"}
          </Text>

          <ScrollView
            style={{ maxHeight: 520 }}
            contentContainerStyle={styles.dialogContentV2}
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
            />

            <Text style={styles.fieldLabelV2}>ประเภท</Text>
            <View style={styles.segmentWrapV2}>
              {(["labor", "fuel", "material", "other"] as ExpenseType[]).map(
                (t) => {
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
                }
              )}
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
            />

            <Text style={styles.fieldLabelV2}>วันที่ทำงาน</Text>
            <TextInput
              mode="outlined"
              value={workDate}
              onChangeText={setWorkDate}
              placeholder="YYYY-MM-DD"
              style={styles.inputOutlined}
              left={<TextInput.Icon icon="calendar" />}
              dense
            />

            <Text style={styles.fieldLabelV2}>จำนวนเงิน</Text>
            <TextInput
              mode="outlined"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              style={styles.inputOutlined}
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
              dense
              onSubmitEditing={submit}
              returnKeyType="done"
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
      </Modal>
    </Portal>
  );
}
