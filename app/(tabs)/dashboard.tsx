// app/(tabs)/dashboard.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text, Chip, Searchbar, Card, FAB } from "react-native-paper";
import Header from "../../components/Header";

import { styles } from "../../styles/ui";
import { STATUS_COLORS } from "../../lib/constants";
import { inRange, formatLocalYYYYMMDD, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";
import TaskCard from "../../components/Tasks/TaskCard";
import CreateTaskModal from "../../components/Tasks/CreateTaskModal";

// --- seed data (คงไว้ในหน้านี้ก็พอ) ---
function buildDayTasksForCurrentMonth(): Task[] {
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
    },
  ];
}

const SEED_TASKS: Task[] = [
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
  },
  ...buildDayTasksForCurrentMonth(),
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [openCreate, setOpenCreate] = useState(false);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const okStatus = status === "ทั้งหมด" ? true : t.status === status;
      const okSearch =
        !text ||
        t.title.toLowerCase().includes(text) ||
        t.tags?.some((x) => x.toLowerCase().includes(text)) ||
        (t.jobType ?? "").includes(text);
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

        <View style={styles.chipRow}>
          {(["ทั้งหมด", "รอทำ", "กำลังทำ", "เสร็จ"] as StatusType[]).map(
            (s) => {
              const selected = status === s;
              return (
                <Chip
                  key={s}
                  selected={selected}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.filterChip,
                    selected
                      ? { backgroundColor: STATUS_COLORS[s] + "22" }
                      : null,
                  ]}
                  textStyle={
                    selected
                      ? { color: STATUS_COLORS[s], fontWeight: "700" }
                      : undefined
                  }
                  icon={selected ? "check" : undefined}
                >
                  {s}
                </Chip>
              );
            }
          )}
        </View>

        <Searchbar
          placeholder="ค้นหางาน"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <Text style={{ marginBottom: 8, color: "#6B7280" }}>
          {`พบ ${filtered.length} งาน ในวันที่ ${formatLocalYYYYMMDD(
            selectedDate
          )}`}
        </Text>

        <View style={{ gap: 12 }}>
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
          {filtered.length === 0 && (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 4 }}>
                  ยังไม่มีงานในวันนี้
                </Text>
                <Text style={{ color: "#6B7280" }}>
                  ลองเปลี่ยนวันที่/สถานะ หรือสร้างงานใหม่ด้วยปุ่ม “+”
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        onPress={() => setOpenCreate(true)}
        style={styles.fab}
        size="medium"
        color="white"
        customSize={56}
      />
      <CreateTaskModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        defaultDate={selectedDate}
        onSubmit={(task) => setTasks((prev) => [task, ...prev])}
      />
    </>
  );
}
