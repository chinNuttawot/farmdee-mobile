// app/(tabs)/dashboard.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { FAB } from "react-native-paper";
import Header from "../../components/Header";

import { styles } from "../../styles/ui";
import { STATUS_COLORS } from "../../lib/constants";
import { inRange, formatLocalYYYYMMDD, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";
import TaskCard from "../../components/Tasks/TaskCard";
import CreateTaskModal from "../../components/Tasks/CreateTaskModal";

// components ย่อย
import StatusFilterChips from "../../components/Tasks/StatusFilterChips";
import TaskSearchBar from "../../components/Tasks/TaskSearchBar";
import TaskEmptyCard from "../../components/Tasks/TaskEmptyCard";
import DayResultText from "../../components/Tasks/DayResultText";

// ✅ ขยายชนิด task ฝั่งแอปให้เก็บเมตาได้
export type TaskWithMeta = Task & {
  area?: number; // จำนวนไร่
  trucks?: number; // จำนวนรถ
  paid?: number; // ค่าแรงแล้ว
};

// --- seed data ---
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
      amount: 800,
      status: "รอทำ",
      color: STATUS_COLORS["รอทำ"],
      startDate: d9,
      endDate: d9,
      jobType: "งานไร่",
      note: "เช็กหัวฉีด/สายยางก่อนเริ่มงาน",
      tags: ["อุปกรณ์", "เช้า"],
      progress: 0.1,
      // ตัวอย่าง meta:
      area: 1.5,
      trucks: 0,
      paid: 0,
    },
    {
      id: `d9-doing`,
      title: "พรวนดินแปลงผักไทย",
      amount: 1800,
      status: "กำลังทำ",
      color: STATUS_COLORS["กำลังทำ"],
      startDate: d9,
      endDate: d9,
      jobType: "งานไร่",
      note: "ทำต่อเนื่อง 2 ชม.",
      tags: ["แปลง C1"],
      progress: 0.5,
      area: 2,
      trucks: 1,
      paid: 500,
    },
    {
      id: `d9-done`,
      title: "เก็บผักส่งตลาดยามเช้า",
      amount: 2200,
      status: "เสร็จ",
      color: STATUS_COLORS["เสร็จ"],
      startDate: d9,
      endDate: d9,
      jobType: "งานไร่",
      note: "ส่งตรงเวลา",
      tags: ["ขนส่ง", "แช่เย็น"],
      progress: 1,
      trucks: 1,
      paid: 2200,
    },
    {
      id: `d10-todo`,
      title: "ตรวจสภาพโรงเรือน/ระบายอากาศ",
      amount: 600,
      status: "รอทำ",
      color: STATUS_COLORS["รอทำ"],
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
      amount: 1500,
      status: "กำลังทำ",
      color: STATUS_COLORS["กำลังทำ"],
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
      amount: 900,
      status: "เสร็จ",
      color: STATUS_COLORS["เสร็จ"],
      startDate: d10,
      endDate: d10,
      jobType: "งานซ่อม",
      note: "เปลี่ยนหัวน้ำหยด 5 จุด",
      tags: ["ระบบน้ำ"],
      progress: 1,
      paid: 900,
    },
  ];
}

const SEED_TASKS: TaskWithMeta[] = [
  {
    id: "t1",
    title: "เตรียมดินแปลงผักสลัด",
    amount: 2500,
    status: "กำลังทำ",
    color: "#2962FF",
    startDate: new Date(2025, 7, 19),
    endDate: new Date(2025, 7, 21),
    jobType: "งานไร่",
    note: "ไม่ล่าช้า 6 ชม.",
    tags: ["ด่วน", "ปลอดสาร"],
    progress: 0.6,
    area: 3,
    trucks: 1,
    paid: 1200,
  },
  {
    id: "t2",
    title: "เปลี่ยนเมล็ดผักกาดหอม",
    amount: 1500,
    status: "รอทำ",
    color: "#FF8F00",
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
    amount: 3500,
    status: "เสร็จ",
    color: "#2E7D32",
    startDate: new Date(2025, 7, 18),
    endDate: new Date(2025, 7, 18),
    jobType: "งานไร่",
    note: "ส่งตรงเวลา",
    tags: ["ขนส่ง", "แช่เย็น"],
    progress: 1,
    trucks: 1,
    paid: 3500,
  },
  ...buildDayTasksForCurrentMonth(),
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<TaskWithMeta[]>(SEED_TASKS);

  // สำหรับ create/edit
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);

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

  const openCreateMode = () => {
    setEditingTask(null);
    setOpenCreate(true);
  };

  const openEditMode = (tk: TaskWithMeta) => {
    setEditingTask(tk);
    setOpenCreate(true);
  };

  const closeModal = () => {
    setOpenCreate(false);
    setEditingTask(null);
  };

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

        <StatusFilterChips value={status} onChange={setStatus} />

        <TaskSearchBar
          value={search}
          onChange={setSearch}
          onSubmit={() => {}}
          onClear={() => setSearch("")}
        />

        <DayResultText
          count={filtered.length}
          dateText={formatLocalYYYYMMDD(selectedDate)}
        />

        <View style={{ gap: 12 }}>
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onPress={(tk) => {
                console.log("open detail:", tk.id);
              }}
              onEdit={(tk) => openEditMode(tk as TaskWithMeta)}
              onDelete={(tk) =>
                setTasks((prev) => prev.filter((x) => x.id !== tk.id))
              }
              onChangeStatus={(tk, next) =>
                setTasks((prev) =>
                  prev.map((x) =>
                    x.id === tk.id
                      ? { ...x, status: next, color: STATUS_COLORS[next] }
                      : x
                  )
                )
              }
            />
          ))}
          {filtered.length === 0 && <TaskEmptyCard />}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        onPress={openCreateMode}
        style={styles.fab}
        size="medium"
        color="white"
        customSize={56}
      />

      {/* ใส่ key เพื่อ remount เมื่อเปลี่ยนโหมด/งาน */}
      <CreateTaskModal
        key={editingTask?.id || "new"}
        open={openCreate}
        onClose={closeModal}
        defaultDate={selectedDate}
        initialTask={editingTask ?? undefined}
        onSubmit={(task) => {
          const t = task as TaskWithMeta;
          if (editingTask) {
            // edit -> update by id
            setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
          } else {
            // create -> prepend
            setTasks((prev) => [t, ...prev]);
          }
          closeModal();
        }}
      />
    </>
  );
}
