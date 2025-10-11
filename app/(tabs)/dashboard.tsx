// app/(tabs)/dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  FAB,
  ActivityIndicator,
  Portal,
  Modal,
  Text,
  Button,
} from "react-native-paper";
import Header from "../../components/Header";

import { styles } from "../../styles/ui";
import { STATUS_COLORS } from "../../lib/constants";
import { formatAPI, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";
import TaskCard from "../../components/Tasks/TaskCard";
import CreateTaskModal from "../../components/Tasks/CreateTaskModal";
import TaskDetailModal from "../../components/Tasks/TaskDetailModal"; // ✅ ใช้คอมโพเนนต์แยก

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

type Assignee = {
  dailyRate: string;
  isDaily: boolean;
  ratePerRai: string;
  repairRate: string;
  useDefault: boolean;
  username: string;
};

type TaskPayload = {
  id?: number;
  assigneeConfigs?: Assignee[];
  // ...ฟิลด์อื่นๆ ตามจริง
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false); // โหลดรายการ
  const [isSaving, setIsSaving] = useState<boolean>(false); // กำลังบันทึก/แก้ไข/ลบ

  // สำหรับ create/edit
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);

  // ======= ยืนยันการลบ =======
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskWithMeta | null>(null);

  // ======= ดูรายละเอียด (ใช้คอมโพเนนต์แยก) =======
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskWithMeta | null>(null);

  useEffect(() => {
    getData();
  }, [selectedDate, status, search]);

  const getData = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const toMoney = (n: number) => n.toFixed(2);

  const splitRatesPerAssignee = (task: TaskPayload): TaskPayload => {
    const assignees = task.assigneeConfigs ?? [];
    const len = assignees.length || 1; // กันหารศูนย์

    // ถ้าไม่มี assignee ไม่ต้องเปลี่ยน payload
    if (assignees.length === 0) return task;

    const mapped = assignees.map((a) => {
      const perRai = Number(a.ratePerRai) || 0;
      const repair = Number(a.repairRate) || 0;

      return {
        ...a,
        useDefault: false, // บังคับไม่ใช้ default
        ratePerRai: toMoney(perRai / len),
        repairRate: toMoney(repair / len),
      };
    });

    return { ...task, assigneeConfigs: mapped };
  };

  const saveData = async (
    data: TaskPayload,
    model: "New" | "Edit" | "Delete"
  ) => {
    try {
      setIsSaving(true);
      switch (model) {
        case "New": {
          const payload = splitRatesPerAssignee({ ...data });
          await tasksSaveService(payload);
          break;
        }
        case "Edit": {
          const payload = splitRatesPerAssignee({ ...data });
          await tasksUpdateService(payload);
          break;
        }
        case "Delete": {
          if (!data.id) throw new Error("Missing task id for delete");
          await tasksDeleteService(data.id);
          break;
        }
        default:
          throw new Error(`Unknown model: ${model}`);
      }
    } catch (err) {
      alert("saveData : เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
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

  // ======= ฟังก์ชันลบแบบมียืนยัน =======
  const requestDelete = (tk: TaskWithMeta) => {
    setDeletingTask(tk);
    setConfirmOpen(true);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setDeletingTask(null);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    setConfirmOpen(false);
    await saveData(deletingTask, "Delete");
    setDeletingTask(null);
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
                setDetailTask(tk as TaskWithMeta);
                setDetailOpen(true);
                console.log("open detail:", tk.id);
              }}
              onEdit={(tk) => openEditMode(tk as TaskWithMeta)}
              onDelete={(tk) => requestDelete(tk as TaskWithMeta)}
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
          {filtered.length === 0 && !isLoading && <TaskEmptyCard />}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        onPress={openCreateMode}
        style={styles.fab}
        size="medium"
        color="white"
        customSize={56}
        disabled={isLoading || isSaving}
      />

      {/* โมดัลสร้าง/แก้ไข */}
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

      {/* Global Loading Overlay */}
      <Portal>
        <Modal
          visible={isLoading || isSaving}
          onDismiss={() => {}}
          contentContainerStyle={{
            backgroundColor: "rgba(0,0,0,0.4)",
            padding: 0,
            margin: 0,
          }}
          dismissable={false}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <ActivityIndicator animating size="large" />
            <Text style={{ color: "white" }}>
              {isSaving ? "กำลังบันทึก..." : "กำลังโหลด..."}
            </Text>
          </View>
        </Modal>
      </Portal>

      {/* ======= ป๊อปอัปยืนยันการลบ ======= */}
      <Portal>
        <Modal
          visible={confirmOpen}
          onDismiss={cancelDelete}
          contentContainerStyle={{
            marginHorizontal: 24,
            backgroundColor: "white",
            borderRadius: 16,
            paddingVertical: 20,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ alignItems: "center", gap: 10 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 18,
                marginBottom: 2,
                color: "#111827",
              }}
            >
              ยืนยันการลบ
            </Text>

            <Text
              style={{
                textAlign: "center",
                color: "#374151",
                marginBottom: 12,
                lineHeight: 20,
              }}
            >
              {`คุณต้องการลบงาน “${deletingTask?.title ?? ""}” ใช่หรือไม่?`}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                width: "100%",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Button
                mode="outlined"
                onPress={cancelDelete}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  borderColor: "#E5E7EB",
                  backgroundColor: "#F3F4F6",
                }}
                textColor="#111827"
              >
                ยกเลิก
              </Button>
              <Button
                mode="contained"
                onPress={confirmDelete}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  backgroundColor: "#EF4444",
                }}
              >
                ตกลง
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* ======= โมดัลรายละเอียดงาน (ใช้คอมโพเนนต์แยก) ======= */}
      <TaskDetailModal
        open={detailOpen}
        task={detailTask}
        onClose={() => {
          setDetailOpen(false);
          setDetailTask(null);
        }}
        onEdit={(t) => {
          setDetailOpen(false);
          openEditMode(t);
        }}
        onDelete={(t) => {
          setDetailOpen(false);
          requestDelete(t);
        }}
      />
    </>
  );
}
