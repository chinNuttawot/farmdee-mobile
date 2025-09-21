// app/(tabs)/dashboard.tsx
import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import Header from "../../components/Header";

import { STATUS_COLORS } from "../../lib/constants";
import { inRange, formatAPI, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";

import TaskSearchBar from "../../components/Tasks/TaskSearchBar";
import TaskEmptyCard from "../../components/Tasks/TaskEmptyCard";
import DayResultText from "../../components/Tasks/DayResultText";
import MultiCreateTasksModal from "../../components/Tasks/MultiCreateTasksModal";
import { tasksService } from "@/service/index";

// ------ ชนิดขยาย ------
export type TaskWithMeta = Task & {
  area?: number;
  trucks?: number;
  paid_amount?: number;
};

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
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);

  // ✅ เปิดโมดอลเพิ่มหลายงานทุกครั้งที่เข้าเพจ
  const [openMulti, setOpenMulti] = useState<boolean>(false);
  useEffect(() => {
    setOpenMulti(true);
  }, []);

  useEffect(() => {
    getData();
  }, [selectedDate, status, search]);

  const getData = async () => {
    try {
      const params: { from: string; status?: string; title?: string } = {
        from: formatAPI(selectedDate),
      };
      if (status && status !== "ทั้งหมด") {
        params.status = status;
      }
      const q = (search ?? "").trim();
      if (q) {
        params.title = q.split(/\s+/).join("|");
      }
      const { data } = await tasksService(params);
      const items = Array.isArray(data?.items)
        ? (data.items as TaskWithMeta[])
        : [];
      setTasks(items);
    } catch (err: any) {
      alert(err?.message ?? "getData: เกิดข้อผิดพลาด");
    }
  };

  const filtered = useMemo(() => {
    return tasks;
  }, [tasks]);

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

      <MultiCreateTasksModal
        visible={open}
        onDismiss={() => {
          setOpen(false);
        }}
      />
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
