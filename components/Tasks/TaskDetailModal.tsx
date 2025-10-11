// components/Tasks/TaskDetailModal.tsx
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  Divider,
  Chip,
  Badge,
  Card,
} from "react-native-paper";
import { STATUS_COLORS } from "../../lib/constants";
import { formatAPI } from "../../lib/date";
import type { Task } from "../../lib/types";
import { TH_Status } from "./TaskCard";

// ---------- Types ----------
type PayType = "per_rai" | "daily" | "repair" | string;

type Assignee = {
  id?: number | string;
  username?: string;
  name?: string;
  payType?: PayType;
  isDaily?: boolean;
  ratePerRai?: number | null;
  dailyRate?: number | null;
  repairRate?: number | null;
  useDefault?: boolean;
};

export type TaskWithMeta = Task & {
  area?: number | string;
  trucks?: number | string;

  paid_amount?: number | string;
  paidAmount?: number | string;

  totalAmount?: number | string;
  total_amount?: number | string;
  full_amount?: number | string;
  amount_full?: number | string;
  fullAmount?: number | string;
  total?: number | string;
  amount?: number | string;

  assignees?: any;
  assigneeConfigs?: any;
  assigneesText?: string;

  jobType?: string;
  job_type?: string;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;

  note?: string;
  title?: string;
  status?: "Pending" | "InProgress" | "Done" | string;
};

// ---------- UI helpers ----------
const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <View style={{ marginVertical: 6 }}>
    <Text style={{ color: "#6B7280", fontSize: 12 }}>{label}</Text>
    <Text style={{ fontSize: 16, color: "#111827" }}>{value ?? "-"}</Text>
  </View>
);

const pill = (key: React.Key, txt: string) => (
  <Chip
    key={key}
    compact
    style={{ marginRight: 6, backgroundColor: "#F3F4F6" }}
    textStyle={{ color: "#111827" }}
  >
    {txt}
  </Chip>
);

// ---------- Data helpers ----------
const money = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? `฿${n.toFixed(2)}` : "-";

const isAssigneeArray = (x: any): x is Assignee[] =>
  Array.isArray(x) && x.every((it) => it && typeof it === "object");

const pick = <T,>(vals: (T | undefined)[]): T | undefined =>
  vals.find((v) => v !== undefined);

const toNum = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const displayDate = (s?: string) => (s ? formatAPI(new Date(s)) : "-");

// ---- จำนวนเงิน (ยอดเต็ม) ----
const pickFullAmount = (t?: any): number | undefined => {
  if (!t) return undefined;
  const candidates = [
    t.totalAmount,
    t.total_amount,
    t.full_amount,
    t.amount_full,
    t.fullAmount,
    t.total,
    t.amount,
  ];
  for (const v of candidates) {
    const n = toNum(v);
    if (typeof n === "number") return n;
  }
  return undefined;
};

// ---- จำนวนไร่ / จำนวนรถ ----
const pickArea = (t?: any): number | undefined => {
  if (!t) return undefined;
  const candidates = [t.area, t.rai, t.raiQty, t.rai_quantity];
  for (const v of candidates) {
    const n = toNum(v);
    if (typeof n === "number") return n;
  }
  return undefined;
};

const pickTrucks = (t?: any): number | undefined => {
  if (!t) return undefined;
  const candidates = [t.trucks, t.truckCount, t.cars, t.carCount];
  for (const v of candidates) {
    const n = toNum(v);
    if (typeof n === "number") return n;
  }
  return undefined;
};

function normalizeAssignees(task?: TaskWithMeta | null): Assignee[] | null {
  if (!task) return null;
  const a = pick<any>([task.assignees, task.assigneeConfigs]);
  if (!a) return null;

  if (isAssigneeArray(a)) return a as Assignee[];
  if (Array.isArray(a) && a.every((x) => typeof x === "string"))
    return (a as string[]).map((name, idx) => ({ id: idx, username: name }));

  if (Array.isArray(a) && a.every((x) => typeof x === "object")) {
    return (a as any[]).map((x, idx) => ({
      id: x.id ?? idx,
      username: x.username ?? x.name,
      name: x.name,
      payType: x.payType,
      isDaily: x.isDaily,
      ratePerRai: x.ratePerRai,
      dailyRate: x.dailyRate,
      repairRate: x.repairRate,
      useDefault: x.useDefault,
    }));
  }
  return null;
}

function getAssigneeNames(task?: TaskWithMeta | null): string {
  const arr = normalizeAssignees(task);
  if (arr && arr.length) {
    return (
      arr
        .map((x) => x.username || x.name)
        .filter(Boolean)
        .join(", ") || "-"
    );
  }
  if (typeof (task as any)?.assigneesText === "string")
    return (task as any).assigneesText || "-";
  return "-";
}

function inferRateInfo(
  a: Assignee,
  jobType?: string
): { label: string; amount?: number | null } {
  if (jobType === "งานซ่อม" && a.repairRate != null) {
    return { label: "ค่าซ่อม", amount: a.repairRate };
  }
  switch (a.payType) {
    case "per_rai":
      return { label: "ค่าแรง/ไร่", amount: a.ratePerRai ?? null };
    case "daily":
      return { label: "รายวัน", amount: a.dailyRate ?? null };
    case "repair":
      return { label: "ค่าซ่อม", amount: a.repairRate ?? null };
  }
  if (a.isDaily) return { label: "รายวัน", amount: a.dailyRate ?? null };
  if (a.ratePerRai != null)
    return { label: "ค่าแรง/ไร่", amount: a.ratePerRai };
  if (a.dailyRate != null) return { label: "รายวัน", amount: a.dailyRate };
  if (a.repairRate != null) return { label: "ค่าซ่อม", amount: a.repairRate };
  return { label: "อัตรา", amount: null };
}

export default function TaskDetailModal({
  open,
  onClose,
  task,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  task?: TaskWithMeta | null;
  onEdit?: (t: TaskWithMeta) => void;
  onDelete?: (t: TaskWithMeta) => void;
}) {
  const status = task?.status ?? "Pending";
  const statusColor =
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#9CA3AF";

  const jobType = pick<string>([task?.jobType, task?.job_type]);
  const isRepairJob = (jobType || "").trim() === "งานซ่อม";

  const start = pick<string>([task?.startDate, task?.start_date]);
  const end = pick<string>([task?.endDate, task?.end_date]);

  const areaN = pickArea(task);
  const trucksN = pickTrucks(task);
  const metaChips = useMemo(() => {
    const arr: React.ReactNode[] = [];
    if (jobType) arr.push(pill("job_type", jobType));

    // ซ่อน ไร่/คัน เมื่อเป็นงานซ่อม
    if (!isRepairJob && typeof areaN === "number")
      arr.push(pill("area", `${areaN} ไร่`));
    if (!isRepairJob && typeof trucksN === "number")
      arr.push(pill("trucks", `${trucksN} คัน`));

    // ⬇️ ซ่อน "จำนวนเงิน (ยอดเต็ม)" เมื่อเป็นงานซ่อม
    if (!isRepairJob) {
      const fullAmt = pickFullAmount(task);
      if (typeof fullAmt === "number") {
        arr.push(pill("full_amount", `จำนวนเงิน (ยอดเต็ม) ${money(fullAmt)}`));
      }
    }

    return arr;
  }, [task, jobType, isRepairJob, areaN, trucksN]);

  const assignees = useMemo(() => normalizeAssignees(task), [task]);

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={onClose}
        contentContainerStyle={{
          marginHorizontal: 16,
          backgroundColor: "white",
          borderRadius: 16,
          overflow: "hidden",
          maxHeight: "85%",
        }}
      >
        {task ? (
          <>
            {/* Header */}
            <View style={{ padding: 16, backgroundColor: "#F9FAFB" }}>
              <Text
                style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}
              >
                {task.title}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Badge
                  size={10}
                  style={{ backgroundColor: statusColor, marginRight: 6 }}
                />
                <Text style={{ color: "#111827" }}>{TH_Status[status]}</Text>
              </View>
              <View
                style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap" }}
              >
                {metaChips}
              </View>
            </View>

            <Divider />

            {/* Body */}
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Row label="วันที่เริ่ม" value={displayDate(start)} />
              <Row label="วันที่สิ้นสุด" value={displayDate(end)} />
              <Row label="ผู้รับผิดชอบ" value={getAssigneeNames(task)} />
              <Row label="สถานะ" value={TH_Status[status]} />
              <Row label="ประเภทงาน" value={jobType ?? "-"} />

              {/* ✅ ซ่อน 2 แถวนี้เมื่อเป็นงานซ่อม */}
              {!isRepairJob && (
                <>
                  <Row
                    label="จำนวนไร่"
                    value={typeof areaN === "number" ? String(areaN) : "-"}
                  />
                  <Row
                    label="จำนวนรถ"
                    value={typeof trucksN === "number" ? String(trucksN) : "-"}
                  />
                </>
              )}

              <Row label="หมายเหตุ" value={task?.note ?? "-"} />

              {/* อัตราค่าแรง (ต่อคน) */}
              <View style={{ marginTop: 10 }}>
                <Text
                  style={{
                    fontWeight: "700",
                    marginBottom: 6,
                    color: "#111827",
                  }}
                >
                  อัตราค่าแรง (ต่อคน)
                </Text>

                {assignees && assignees.length > 0 ? (
                  <Card mode="outlined">
                    <Card.Content style={{ gap: 12 }}>
                      {assignees.map((a, idx) => {
                        const info = inferRateInfo(a, jobType);
                        const key = String(a.id ?? idx);
                        const name = a.username ?? a.name ?? `คนที่ ${idx + 1}`;
                        return (
                          <View
                            key={key}
                            style={{
                              borderWidth: 1,
                              borderColor: "#E5E7EB",
                              borderRadius: 10,
                              padding: 10,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontWeight: "700",
                                  color: "#111827",
                                  fontSize: 15,
                                }}
                              >
                                {name}
                              </Text>
                              <View style={{ flexDirection: "row" }}>
                                {a.useDefault ? (
                                  <Chip
                                    compact
                                    mode="flat"
                                    style={{ backgroundColor: "#ECFDF5" }}
                                  >
                                    ค่าเริ่มต้น
                                  </Chip>
                                ) : null}
                              </View>
                            </View>

                            <Text style={{ color: "#374151" }}>
                              {info.label}: {money(info.amount)}
                            </Text>
                          </View>
                        );
                      })}
                    </Card.Content>
                  </Card>
                ) : (
                  <Card mode="outlined">
                    <Card.Content style={{ gap: 6 }}>
                      <Text>รายไร่: {money((task as any)?.ratePerRai)}</Text>
                      <Text>
                        รายซ่อม/วัน: {money((task as any)?.repairRate)}
                      </Text>
                      <Text>รายวัน: {money((task as any)?.dailyRate)}</Text>
                    </Card.Content>
                  </Card>
                )}
              </View>
            </ScrollView>
          </>
        ) : (
          <View style={{ padding: 24 }}>
            <Text>ไม่พบข้อมูลงาน</Text>
            <Button onPress={onClose} style={{ marginTop: 8 }}>
              ปิด
            </Button>
          </View>
        )}
      </Modal>
    </Portal>
  );
}
