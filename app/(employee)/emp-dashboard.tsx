// app/(tabs)/dashboard.tsx
import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import Header from "../../components/Header";

import { STATUS_COLORS } from "../../lib/constants";
import { inRange, formatAPI, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";
// ⛔ ไม่ใช้ TaskCard เดิม เพราะต้องการหน้าตาแบบภาพแรกเรียบๆ
// import TaskCard from "../../components/Tasks/TaskCard";

// components ย่อยเดิม (filter/search/empty/result text)
// import StatusFilterChips from "../../components/Tasks/StatusFilterChips";
import TaskSearchBar from "../../components/Tasks/TaskSearchBar";
import TaskEmptyCard from "../../components/Tasks/TaskEmptyCard";
import DayResultText from "../../components/Tasks/DayResultText";

// โมดอลเพิ่มหลายรายการ
import MultiCreateTasksModal from "../../components/Tasks/MultiCreateTasksModal";

// ------ ชนิดขยาย ------
export type TaskWithMeta = Task & {
  area?: string;
  trucks?: number;
  paid_amount?: number;
};

// ------ seed data ------
function buildDayTasksForCurrentMonth(): TaskWithMeta[] {
  const now = new Date();
  const y = now.getFullYear();
  const m0 = now.getMonth();
  const d9 = new Date(y, m0, 9);
  const d10 = new Date(y, m0, 10);

  return [
    {
      id: `d9-todo`,
      title: "เตรียมอุปกรณ์รดน้ำ (โซน A)",
      total_amount: 800,
      startDate: d9,
      endDate: d9,
      jobType: "งานไร่",
      note: "เช็กหัวฉีด/สายยางก่อนเริ่มงาน",
      tags: ["อุปกรณ์", "เช้า"],
      progress: 0.1,
      area: 1.5,
      trucks: 0,
      paid_amount: 0,
    },
    {
      id: `d9-doing`,
      title: "พรวนดินแปลงผักไทย",
      total_amount: 1800,
      startDate: d9,
      endDate: d9,
      jobType: "งานไร่",
      note: "ทำต่อเนื่อง 2 ชม.",
      tags: ["แปลง C1"],
      progress: 0.5,
      area: 2,
      trucks: 1,
      paid_amount: 500,
    },
    {
      id: `d9-done`,
      title: "เก็บผักส่งตลาดยามเช้า",
      total_amount: 2200,
      status: "Done",
      color: STATUS_COLORS["Done"],
      startDate: d9,
      endDate: d9,
      jobType: "งานไร่",
      note: "ส่งของตอนเช้า",
      tags: ["ขนส่ง", "แช่เย็น"],
      progress: 1,
      trucks: 1,
      paid_amount: 2200,
    },
    {
      id: `d10-todo`,
      title: "ตรวจสภาพโรงเรือน/ระบายอากาศ",
      total_amount: 600,
      startDate: d10,
      endDate: d10,
      jobType: "งานซ่อม",
      note: "โฟกัสพัดลมตัวที่ 2",
      tags: ["โรงเรือน"],
      progress: 0.05,
    },
    {
      id: `d10-doing`,
      title: "ให้ปุ๋ยผักสลัดออร์แกนิก",
      total_amount: 1500,
      startDate: d10,
      endDate: d10,
      jobType: "งานไร่",
      note: "อัตรา 1:100 ตามสูตร",
      tags: ["ปุ๋ยน้ำ", "ปลอดสาร"],
      progress: 0.35,
      area: 1,
    },
    {
      id: `d10-done`,
      title: "ซ่อมแซมระบบน้ำหยดโซน B",
      total_amount: 900,
      status: "Done",
      color: STATUS_COLORS["Done"],
      startDate: d10,
      endDate: d10,
      jobType: "งานซ่อม",
      note: "เปลี่ยนหัวน้ำหยด 5 จุด",
      tags: ["ระบบน้ำ"],
      progress: 1,
      paid_amount: 900,
    },
  ];
}

const SEED_TASKS: TaskWithMeta[] = [
  {
    id: "t1",
    title: "เตรียมดินแปลงผักสลัด",
    total_amount: 2500,
    startDate: new Date(2025, 7, 19),
    endDate: new Date(2025, 7, 21),
    jobType: "งานไร่",
    note: "ไม่ล่าช้า 6 ชม.",
    tags: ["ด่วน", "ปลอดสาร"],
    progress: 0.6,
    area: 3,
    trucks: 1,
    paid_amount: 1200,
  },
  {
    id: "t2",
    title: "เปลี่ยนเมล็ดผักกาดหอม",
    total_amount: 1500,
    startDate: new Date(2025, 7, 18),
    endDate: new Date(2025, 7, 21),
    jobType: "งานไร่",
    note: "ต้องเช็คสต็อกก่อน",
    tags: ["เมล็ด", "แปลง B3"],
    progress: 0.2,
    area: 1,
  },
  {
    id: "t3",
    title: "ส่งผักรวมสลัดให้ลูกค้า A",
    total_amount: 3500,
    status: "Done",
    color: "#2E7D32",
    startDate: new Date(2025, 7, 18),
    endDate: new Date(2025, 7, 18),
    jobType: "งานไร่",
    note: "ส่งตรงเวลา",
    tags: ["ขนส่ง", "แช่เย็น"],
    progress: 1,
    trucks: 1,
    paid_amount: 3500,
  },
  ...buildDayTasksForCurrentMonth(),
];

// ---------- การ์ดเรียบแบบภาพแรก ----------
function SimpleTaskCard({ task }: { task: TaskWithMeta }) {
  const done = task.status === "Done";
  return (
    <Card style={ss.card}>
      <Card.Content>
        <Text variant="titleMedium" style={ss.title}>
          {task.title}
        </Text>

        {done && (
          <View style={ss.donePill}>
            <Text style={ss.donePillText}>จบงานแล้ว</Text>
          </View>
        )}

        <Text style={ss.meta}>
          เริ่ม: {formatAPI(task.startDate)} • กำหนดส่ง:{" "}
          {formatAPI(task.endDate)}
        </Text>

        {!!task.note && <Text style={ss.note}>{task.note}</Text>}
      </Card.Content>
    </Card>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<boolean>(true);
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<TaskWithMeta[]>(SEED_TASKS);

  // ✅ เปิดโมดอลเพิ่มหลายงานทุกครั้งที่เข้าเพจ
  const [openMulti, setOpenMulti] = useState(false);
  useEffect(() => {
    setOpenMulti(true);
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const okStatus = status === "ทั้งหมด" ? true : t.status === status;
      const okSearch =
        !text ||
        t.title.toLowerCase().includes(text) ||
        t.tags?.some((x) => x.toLowerCase().includes(text)) ||
        (t.jobType ?? "").toLowerCase().includes(text);
      const okDate = inRange(selectedDate, t.startDate, t.endDate);
      return okStatus && okSearch && okDate;
    });
  }, [search, status, selectedDate, tasks]);

  return (
    <>
      <Header title="งานของฉัน" backgroundColor="#2E7D32" color="white" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        <MiniCalendar
          value={selectedDate}
          onChange={(d) => setSelectedDate(startOfDay(d))}
        />

        {/* <StatusFilterChips value={status} onChange={setStatus} /> */}

        <TaskSearchBar
          value={search}
          onChange={setSearch}
          onSubmit={() => {}}
          onClear={() => setSearch("")}
        />

        <DayResultText
          count={filtered.length}
          dateText={formatAPI(selectedDate)}
        />

        <View style={{ gap: 12 }}>
          {filtered.map((t) => (
            <SimpleTaskCard key={t.id} task={t} />
          ))}
          {filtered.length === 0 && <TaskEmptyCard />}
        </View>
      </ScrollView>

      {/* Modal เพิ่มหลายรายการ เปิดอัตโนมัติ */}
      <MultiCreateTasksModal visible={open} onDismiss={() => {setOpen(false)}} />
    </>
  );
}

// ---------- styles ของการ์ดแบบภาพแรก ----------
const ss = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontWeight: "700" },
  meta: { marginTop: 6, opacity: 0.65 },
  note: { marginTop: 4 },
  donePill: {
    backgroundColor: "#DFF2E2",
    borderRadius: 999,
    paddingVertical: 6,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  donePillText: {
    color: "#2E7D32",
    fontWeight: "700",
  },
});
