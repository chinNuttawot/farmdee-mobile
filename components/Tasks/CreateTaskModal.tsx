// components/Tasks/CreateTaskModal.tsx
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Portal,
  Modal,
  Text,
  TextInput,
  SegmentedButtons,
  Card,
  Button,
} from "react-native-paper";
import { styles } from "../../styles/ui";
import { Task, JobType, AssigneeConfig } from "../../lib/types";
import { formatLocalYYYYMMDD } from "../../lib/date";
import { ASSIGNEE_OPTIONS, STATUS_COLORS } from "../../lib/constants";

import SingleDatePickerModal from "../Calendar/SingleDatePickerModal";
import AssigneePickerModal from "./AssigneePickerModal";

type CreateTaskForm = {
  title: string;
  jobType: JobType;
  start: string;
  end: string;
  area: string;
  trucks: string;
  assignees: AssigneeConfig[]; // state ภายใน modal รายชื่อ (รีเซ็ต)
  selectedAssignees: string[]; // ชื่อที่เลือกไว้
  paid: string;
  total: string;
  detail: string;
};

export default function CreateTaskModal({
  open,
  onClose,
  defaultDate,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: Date;
  onSubmit: (task: Task) => void;
}) {
  const makeDefaultAssignees = (): AssigneeConfig[] =>
    ASSIGNEE_OPTIONS.map((name) => ({
      name,
      isDaily: name === "นาย B",
      selected: false,
      useDefault: true,
      pricePerUnit: "",
      pricePerHour: "",
      pricePerDay: name === "นาย B" ? "" : "",
    }));

  const makeDefaultForm = (date: Date): CreateTaskForm => ({
    title: "",
    jobType: "งานไร่",
    start: formatLocalYYYYMMDD(date),
    end: formatLocalYYYYMMDD(date),
    area: "",
    trucks: "",
    assignees: makeDefaultAssignees(),
    selectedAssignees: [],
    paid: "",
    total: "",
    detail: "",
  });

  const [form, setForm] = useState<CreateTaskForm>(
    makeDefaultForm(defaultDate)
  );
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<"start" | "end" | null>(null);

  // เปิด modal สร้างงานเมื่อไหร่ → เคลียร์ฟอร์มให้ใหม่เสมอ
  useEffect(() => {
    if (open) {
      setForm(makeDefaultForm(defaultDate));
      setAssigneeModalOpen(false);
      setPickerFor(null);
    }
  }, [open, defaultDate]);

  const resetFormAndClose = () => {
    setForm(makeDefaultForm(defaultDate));
    onClose();
  };

  const save = () => {
    const startD = new Date(form.start);
    const endD = new Date(form.end);
    const amount = Number(form.total || 0);
    const newTask: Task = {
      id: `user-${Date.now()}`,
      title: form.title || "งานใหม่",
      amount,
      status: "รอทำ",
      color: STATUS_COLORS["รอทำ"],
      startDate: startD,
      endDate: endD,
      jobType: form.jobType,
      note: form.detail || undefined,
      tags: form.selectedAssignees.length ? form.selectedAssignees : undefined,
      progress: 0.1,
    };
    onSubmit(newTask);
    resetFormAndClose(); // เคลียร์แล้วปิด
  };

  const assigneeSummary = form.selectedAssignees.length
    ? form.selectedAssignees.join(", ")
    : "แตะเพื่อเลือก";

  return (
    <Portal>
      <Modal
        visible={open}
        // onDismiss={resetFormAndClose}
        contentContainerStyle={styles.createModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "800", marginBottom: 8 }}
            >
              สร้างงานใหม่
            </Text>

            <TextInput
              mode="outlined"
              label="ชื่องาน"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              style={styles.input}
            />

            <Text style={styles.sectionLabel}>ประเภทงาน</Text>
            <SegmentedButtons
              value={form.jobType}
              onValueChange={(v) => setForm({ ...form, jobType: v as JobType })}
              style={{ marginBottom: 12 }}
              buttons={[
                { value: "งานไร่", label: "งานไร่" },
                { value: "งานซ่อม", label: "งานซ่อม" },
              ]}
            />

            <View style={styles.row2}>
              <TextInput
                mode="outlined"
                label="วันที่เริ่ม"
                value={form.start}
                editable={false}
                onPressIn={() => setPickerFor("start")}
                left={<TextInput.Icon icon="calendar" />}
                style={[styles.input, styles.col]}
              />
              <TextInput
                mode="outlined"
                label="วันที่สิ้นสุด"
                value={form.end}
                editable={false}
                onPressIn={() => setPickerFor("end")}
                left={<TextInput.Icon icon="calendar" />}
                style={[styles.input, styles.col]}
              />
            </View>

            <View style={styles.row2}>
              <TextInput
                mode="outlined"
                label="จำนวนไร่"
                value={form.area}
                onChangeText={(v) =>
                  setForm({ ...form, area: v.replace(/[^0-9.]/g, "") })
                }
                keyboardType="numeric"
                right={<TextInput.Affix text="ไร่" />}
                style={[styles.input, styles.col]}
              />
              <TextInput
                mode="outlined"
                label="จำนวนรถ"
                value={form.trucks}
                onChangeText={(v) =>
                  setForm({ ...form, trucks: v.replace(/[^0-9]/g, "") })
                }
                keyboardType="numeric"
                right={<TextInput.Affix text="คัน" />}
                style={[styles.input, styles.col]}
              />
            </View>

            <Text style={styles.sectionLabel}>รายชื่อผู้รับงานนี้</Text>
            <TouchableOpacity onPress={() => setAssigneeModalOpen(true)}>
              <Card
                mode="outlined"
                style={{ borderRadius: 12, marginBottom: 12 }}
              >
                <Card.Content>
                  <Text
                    numberOfLines={2}
                    style={{
                      color:
                        assigneeSummary === "แตะเพื่อเลือก"
                          ? "#9CA3AF"
                          : "#111827",
                    }}
                  >
                    {assigneeSummary}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <TextInput
              mode="outlined"
              label="ค่าแรงแล้ว"
              value={form.paid}
              onChangeText={(v) =>
                setForm({ ...form, paid: v.replace(/[^0-9.]/g, "") })
              }
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="จำนวนเงิน (ยอดเต็ม)"
              value={form.total}
              onChangeText={(v) =>
                setForm({ ...form, total: v.replace(/[^0-9.]/g, "") })
              }
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash-multiple" />}
              right={<TextInput.Affix text="฿" />}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="รายละเอียดงาน"
              value={form.detail}
              onChangeText={(v) => setForm({ ...form, detail: v })}
              style={[styles.input, { height: 120 }]}
              multiline
            />

            <View style={styles.footerRow}>
              <Button
                mode="outlined"
                onPress={resetFormAndClose}
                style={styles.footerBtn}
              >
                ยกเลิก
              </Button>
              <Button
                mode="contained"
                onPress={save}
                style={[styles.footerBtn, { backgroundColor: "#2E7D32" }]}
              >
                บันทึก
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Date pickers */}
        <SingleDatePickerModal
          open={pickerFor !== null}
          onClose={() => setPickerFor(null)}
          initialDate={
            new Date(
              (pickerFor === "end" ? form.end : form.start) ||
                formatLocalYYYYMMDD(new Date())
            )
          }
          onConfirm={(d) => {
            if (pickerFor === "start") {
              const s = formatLocalYYYYMMDD(d);
              setForm((f) => ({
                ...f,
                start: s,
                end: new Date(f.end) < d ? s : f.end,
              }));
            } else if (pickerFor === "end") {
              const e = formatLocalYYYYMMDD(d);
              setForm((f) => ({
                ...f,
                end: e,
                start: new Date(f.start) > d ? e : f.start,
              }));
            }
            setPickerFor(null);
          }}
        />

        {/* Assignees */}
        <AssigneePickerModal
          open={assigneeModalOpen}
          onClose={() => setAssigneeModalOpen(false)}
          initial={form.assignees}
          onConfirm={(cfgs) => {
            const names = cfgs.filter((a) => a.selected).map((a) => a.name);
            setForm((f) => ({ ...f, selectedAssignees: names }));
            setAssigneeModalOpen(false);
          }}
          onResetInitial={() => {
            setForm((f) => ({ ...f, assignees: makeDefaultAssignees() }));
          }}
        />
      </Modal>
    </Portal>
  );
}
