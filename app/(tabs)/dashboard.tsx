// app/(tabs)/dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { FAB } from "react-native-paper";
import Header from "../../components/Header";

import { styles } from "../../styles/ui";
import { STATUS_COLORS } from "../../lib/constants";
import { inRange, formatAPI, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";
import TaskCard from "../../components/Tasks/TaskCard";
import CreateTaskModal from "../../components/Tasks/CreateTaskModal";

// components ย่อย
import StatusFilterChips from "../../components/Tasks/StatusFilterChips";
import TaskSearchBar from "../../components/Tasks/TaskSearchBar";
import TaskEmptyCard from "../../components/Tasks/TaskEmptyCard";
import DayResultText from "../../components/Tasks/DayResultText";
import {
  tasksDeleteService,
  tasksSaveService,
  tasksService,
  tasksUpdateService,
} from "@/service/index";

// ✅ ขยายชนิด task ฝั่งแอปให้เก็บเมตาได้
export type TaskWithMeta = Task & {
  area?: number; // จำนวนไร่
  trucks?: number; // จำนวนรถ
  paid_amount?: number; // ค่าแรงแล้ว
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);

  // สำหรับ create/edit
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);

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
      setTasks(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      alert(err?.message ?? "getData: เกิดข้อผิดพลาด");
    }
  };

  const saveData = async (data: any, model: string) => {
    try {
      if (model === "New") {
        await tasksSaveService(data);
      } else if (model === "Edit") {
        await tasksUpdateService(data);
      } else if (model === "Delete") {
        await tasksDeleteService(data.id);
      }
    } catch (err) {
      alert("saveData : เกิดข้อมพิดพลาด");
    } finally {
      getData();
    }
  };

  const filtered = useMemo(() => {
    return tasks;
  }, [tasks]);

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
          onChange={(d) => setSelectedDate(d)}
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
          dateText={formatAPI(selectedDate)}
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
              onDelete={(tk) => saveData(tk, "Delete")}
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
          const model = editingTask ? "Edit" : "New";
          saveData(t, model);
          closeModal();
        }}
      />
    </>
  );
}
