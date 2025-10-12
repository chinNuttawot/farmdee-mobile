import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import TaskDetailModal from "../../components/Tasks/TaskDetailModal";
import {
  tasksDeleteService,
  tasksSaveService,
  tasksService,
  tasksUpdateService,
  tasksUpdateStatusService,
  tasksDaysService,
} from "@/service/index";
import StatusFilterChips from "@/components/Tasks/StatusFilterChips";
import TaskSearchBar from "@/components/Tasks/TaskSearchBar";
import DayResultText from "@/components/Tasks/DayResultText";
import TaskEmptyCard from "@/components/Tasks/TaskEmptyCard";

export type TaskWithMeta = Task & {
  area?: number;
  trucks?: number;
  paid_amount?: number;
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
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const monthRange = (yearCE: number, month0: number) => {
  const from = new Date(yearCE, month0, 1);
  const to = new Date(yearCE, month0 + 1, 0);
  return { from: fmtDate(from), to: fmtDate(to) };
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskWithMeta | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskWithMeta | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [viewYM, setViewYM] = useState<{ y: number; m0: number }>({
    y: selectedDate.getFullYear(),
    m0: selectedDate.getMonth(),
  });

  const fetchDaysForMonth = useCallback(
    async (yearCE: number, month0: number) => {
      try {
        const { from, to } = monthRange(yearCE, month0);
        const params: Record<string, any> = { from, to, detail: false };
        if (status && status !== "ทั้งหมด") params.status = status;
        if (search.trim()) params.title = search.trim().split(/\s+/).join("|");
        const { data } = await tasksDaysService(params);
        let raw: string[] = data?.days;
        const days = raw.filter(Boolean).map((s) => String(s).split("T")[0]);
        setMarked(new Set(days));
      } catch (err) {
        console.warn("fetchDaysForMonth error:", err);
      }
    },
    [status, search]
  );

  useEffect(() => {
    getData();
  }, [selectedDate, status, search]);

  useEffect(() => {
    fetchDaysForMonth(viewYM.y, viewYM.m0);
  }, [viewYM, status, search, fetchDaysForMonth]);

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
    const len = assignees.length || 1;
    if (assignees.length === 0) return task;
    const mapped = assignees.map((a) => {
      const perRai = Number(a.ratePerRai) || 0;
      const repair = Number(a.repairRate) || 0;
      return {
        ...a,
        useDefault: false,
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
      }
    } catch (err) {
      alert("saveData : เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
      getData();
      fetchDaysForMonth(viewYM.y, viewYM.m0);
    }
  };

  const filtered = useMemo(() => tasks, [tasks]);

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

  const updateStatusTask = async ({
    id,
    status,
    color,
  }: {
    id: string;
    status: string;
    color: string;
  }) => {
    try {
      await tasksUpdateStatusService({ id, status, color });
    } catch {}
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
          onChange={(d) => {
            setSelectedDate(d);
            const y = d.getFullYear();
            const m0 = d.getMonth();
            if (y !== viewYM.y || m0 !== viewYM.m0) {
              setViewYM({ y, m0 });
            }
          }}
          markedDates={marked}
          onMonthChange={(y, m0) => {
            setViewYM({ y, m0 });
            fetchDaysForMonth(y, m0);
          }}
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
              }}
              onEdit={(tk) => openEditMode(tk as TaskWithMeta)}
              onDelete={(tk) => requestDelete(tk as TaskWithMeta)}
              onChangeStatus={(tk, next) => {
                updateStatusTask({
                  id: tk.id,
                  status: next,
                  color: STATUS_COLORS[next],
                });
                setTasks((prev) =>
                  prev.map((x) =>
                    x.id === tk.id
                      ? { ...x, status: next, color: STATUS_COLORS[next] }
                      : x
                  )
                );
              }}
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
