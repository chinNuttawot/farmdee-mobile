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
import { formatAPI } from "../../lib/date";
import { STATUS_COLORS } from "../../lib/constants";

import SingleDatePickerModal from "../Calendar/SingleDatePickerModal";
import AssigneePickerModal from "./AssigneePickerModal";
import { userService } from "@/service";
import moment from "moment";

// ✅ ขยายชนิด task ที่จะส่งออก/รับเข้า modal
export type TaskWithMeta = Task & {
  area?: number;
  trucks?: number;
  paid_amount?: number;
  totalAmount?: number;
};

type CreateTaskForm = {
  title: string;
  jobType: JobType;
  start: string;
  end: string;
  area: string; // เก็บเป็น string สำหรับ input
  trucks: string; // เก็บเป็น string สำหรับ input
  assignees: AssigneeConfig[];
  paid_amount: string; // เก็บเป็น string สำหรับ input
  total: string;
  detail: string;
  progress: string; // 0..1
};

// ===== helpers: แปลงตัวเลขและล้างศูนย์นำหน้า =====
const stripLeadingZeros = (s: string) => s.replace(/^0+(?=\d)/, "");

const sanitizeInt = (s: string) => {
  const onlyDigits = (s || "").replace(/[^\d]/g, "");
  return stripLeadingZeros(onlyDigits);
};

const sanitizeDecimal = (s: string) => {
  // เก็บเฉพาะเลข/จุด, บังคับไม่ให้จุดขึ้นต้น, อนุญาตจุดเดียว
  let out = (s || "").replace(/[^\d.]/g, "");
  out = out.replace(/^\./, "0."); // แก้ ".5" -> "0.5"
  out = out.replace(/(\..*)\./g, "$1"); // ตัดจุดเกินตัวแรก
  out = stripLeadingZeros(out); // ตัด 0 นำหน้าเลข เช่น "00012" -> "12", คง "0.5" ไว้
  return out;
};

export default function CreateTaskModal({
  open,
  onClose,
  defaultDate,
  onSubmit,
  initialTask,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: Date;
  onSubmit: (task: TaskWithMeta) => void;
  initialTask?: TaskWithMeta;
}) {
  const [assignees, setAssignees] = useState<any[]>([]);
  const [selecteds, setSelecteds] = useState<any[]>([]);

  useEffect(() => {
    if (open) void getData();
  }, [open]);

  const getData = async () => {
    const res = await makeDefaultAssignees();
    setAssignees(res);
  };

  const makeDefaultAssignees = async (selectedNames: string[] = []) => {
    const { data } = await userService({ role: "user" });
    const res = data.items ?? [];
    return res.map((v: any) => ({
      name: v.username,
      username: v.username,
      isDaily: v.pay_type === "daily",
      selected: selectedNames.includes(v.username),
      useDefault: true,
      ratePerRai: v.rate_per_rai,
      repairRate: v.repair_rate,
      dailyRate: v.daily_rate,
    }));
  };

  const makeDefaultForm = (date: Date): CreateTaskForm => ({
    title: "",
    jobType: "งานไร่",
    start: formatAPI(date),
    end: formatAPI(date),
    area: "",
    trucks: "",
    assignees: [],
    paid_amount: "",
    total: "",
    detail: "",
    progress: "0",
  });

  const [form, setForm] = useState<CreateTaskForm>(
    makeDefaultForm(defaultDate)
  );
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (!open) return;

    if (initialTask) {
      const data: CreateTaskForm = {
        title: initialTask.title ?? "",
        jobType: (initialTask.jobType as JobType) || "งานไร่",
        start: formatAPI(initialTask.start_date ?? defaultDate),
        end: formatAPI(initialTask.end_date ?? defaultDate),

        // ✅ prefill ค่าเริ่มต้น (0 จะถูกแปลงเป็น "0")
        area:
          initialTask.area != null
            ? sanitizeDecimal(String(initialTask.area))
            : "",
        trucks:
          initialTask.trucks != null
            ? sanitizeInt(String(initialTask.trucks))
            : "",
        assignees: (initialTask as any).assignees || [],
        paid_amount:
          (initialTask as any).paid_amount != null
            ? sanitizeDecimal(String((initialTask as any).paid_amount))
            : "",
        total:
          (initialTask as any).total_amount != null
            ? sanitizeDecimal(String((initialTask as any).total_amount))
            : "",
        detail: initialTask.note ?? "",
        progress:
          typeof (initialTask as any).progress === "number"
            ? String(
                Math.max(0, Math.min(1, Number((initialTask as any).progress)))
              )
            : "0",
      };
      setForm(data);
    } else {
      setForm(makeDefaultForm(defaultDate));
    }
    setAssigneeModalOpen(false);
    setPickerFor(null);
  }, [open, defaultDate, initialTask]);

  const toNumber = (s: string) => {
    const n = Number((s || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const toInt = (s: string) => {
    const n = parseInt((s || "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const save = () => {
    const startD = moment(form.start).format("YYYY-MM-DD");
    const endD = moment(form.end).format("YYYY-MM-DD");
    const total_amount = toNumber(form.total);
    const isEdit = !!initialTask;

    const today = moment().startOf("day");
    const start = moment(startD, "YYYY-MM-DD", true);
    const newStatus = start.isSame(today, "day")
      ? "InProgress"
      : start.isAfter(today, "day")
      ? "Pending"
      : "Done";
    const baseStatus = isEdit ? initialTask!.status : newStatus;
    const baseColor = isEdit ? initialTask!.color : STATUS_COLORS[newStatus];
    const jobType = form.jobType === "งานไร่";
    let newTask: TaskWithMeta = {
      title: form.title || (isEdit ? initialTask!.title : "งานใหม่"),
      totalAmount: jobType ? total_amount : 0,
      status: baseStatus,
      color: baseColor,
      startDate: startD,
      endDate: endD,
      jobType: form.jobType,
      note: form.detail || "",
      assigneeConfigs: form.assignees.length ? form.assignees : [],
      area: jobType ? (form.area ? Number(form.area) : 0) : 0,
      trucks: jobType ? (form.trucks ? toInt(form.trucks) : 0) : 0,
      paidAmount: jobType ? (form.paid_amount ? toNumber(form.paid_amount) : 0) : 0,
    };

    if (isEdit) {
      newTask = { id: initialTask!.id, ...newTask };
    }

    onSubmit(newTask);
    setAssignees([]);
    setSelecteds([]);
    setForm(makeDefaultForm(defaultDate));
    onClose();
  };

  const headerText = initialTask ? "แก้ไขงาน" : "สร้างงานใหม่";

  return (
    <Portal>
      <Modal visible={open} contentContainerStyle={styles.createModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "800", marginBottom: 8 }}
            >
              {headerText}
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
                { value: "งานไร่", label: "งานไร่", disabled: !!initialTask },
                { value: "งานซ่อม", label: "งานซ่อม", disabled: !!initialTask },
              ]}
            />

            <View style={styles.row2}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setPickerFor("start")}
                activeOpacity={0.7}
              >
                <TextInput
                  onPress={() => setPickerFor("start")}
                  mode="outlined"
                  label="วันที่เริ่ม"
                  value={form.start}
                  editable={false}
                  left={<TextInput.Icon icon="calendar" />}
                  style={[styles.input, styles.col]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setPickerFor("end")}
                activeOpacity={0.7}
              >
                <TextInput
                  onPress={() => setPickerFor("end")}
                  mode="outlined"
                  label="วันที่สิ้นสุด"
                  value={form.end}
                  editable={false}
                  left={<TextInput.Icon icon="calendar" />}
                  style={[styles.input, styles.col]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.row2}>
              <TextInput
                mode="outlined"
                label="จำนวนไร่"
                editable={form.jobType === "งานไร่"}
                value={form.area}
                onChangeText={(v) =>
                  setForm({ ...form, area: sanitizeDecimal(v) })
                }
                keyboardType="numeric"
                right={<TextInput.Affix text="ไร่" />}
                style={[
                  styles.input,
                  styles.col,
                  form.jobType !== "งานไร่" && styles.hideStyle,
                ]}
              />
              <TextInput
                mode="outlined"
                label="จำนวนรถ"
                editable={form.jobType === "งานไร่"}
                value={form.trucks}
                onChangeText={(v) =>
                  setForm({ ...form, trucks: sanitizeInt(v) })
                }
                keyboardType="numeric"
                right={<TextInput.Affix text="คัน" />}
                style={[
                  styles.input,
                  styles.col,
                  form.jobType !== "งานไร่" && styles.hideStyle,
                ]}
              />
            </View>

            <Text style={styles.sectionLabel}>รายชื่อผู้รับงานนี้</Text>

            <Card
              onPress={() => setAssigneeModalOpen(true)}
              disabled={!!initialTask}
              mode="outlined"
              style={{ borderRadius: 12, marginBottom: 12 }}
            >
              <Card.Content>
                <Text numberOfLines={2} style={{ color: "#111827" }}>
                  {form.assignees && form.assignees.length > 0
                    ? form.assignees
                        .map((v: any) => v.username ?? v.name)
                        .filter(Boolean)
                        .join(" - ")
                    : "เลือก"}
                </Text>
              </Card.Content>
            </Card>

            <TextInput
              mode="outlined"
              label="จ่ายแล้ว"
              editable={form.jobType === "งานไร่"}
              value={form.paid_amount}
              onChangeText={(v) =>
                setForm({ ...form, paid_amount: sanitizeDecimal(v) })
              }
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
              style={[
                styles.input,
                form.jobType !== "งานไร่" && styles.hideStyle,
              ]}
            />

            <TextInput
              mode="outlined"
              label="จำนวนเงิน (ยอดเต็ม)"
              editable={form.jobType === "งานไร่"}
              value={form.total}
              onChangeText={(v) =>
                setForm({ ...form, total: sanitizeDecimal(v) })
              }
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash-multiple" />}
              right={<TextInput.Affix text="฿" />}
              style={[
                styles.input,
                form.jobType !== "งานไร่" && styles.hideStyle,
              ]}
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
                onPress={() => {
                  setForm(makeDefaultForm(defaultDate));
                  onClose();
                }}
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
                formatAPI(new Date())
            )
          }
          onConfirm={(d) => {
            if (pickerFor === "start") {
              const s = formatAPI(d);
              setForm((f) => ({
                ...f,
                start: s,
                end: new Date(f.end) < d ? s : f.end,
              }));
            } else if (pickerFor === "end") {
              const e = formatAPI(d);
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
        {assignees && (
          <AssigneePickerModal
            open={assigneeModalOpen}
            onClose={() => setAssigneeModalOpen(false)}
            initial={assignees}
            selecteds={selecteds}
            onConfirm={(res) => {
              setSelecteds(res as any);
              const selectedAssignees = (res as any[])
                .filter((x) => x.selected)
                .map((x) => ({
                  username: x.username ?? x.name,
                  useDefault: x.useDefault ?? true,
                  ratePerRai: x.ratePerRai,
                  repairRate: x.repairRate,
                  dailyRate: x.dailyRate,
                  isDaily: x.isDaily,
                }));

              setForm((prev) => ({
                ...prev,
                assignees: selectedAssignees,
              }));
            }}
            onResetInitial={() => {}}
          />
        )}
      </Modal>
    </Portal>
  );
}
