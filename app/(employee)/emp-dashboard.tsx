// app/(tabs)/dashboard.tsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Portal,
  Modal,
  Button,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import Header from "../../components/Header";

import { formatAPI, startOfDay } from "../../lib/date";
import { Task, StatusType } from "../../lib/types";

import MiniCalendar from "../../components/Calendar/MiniCalendar";
import TaskSearchBar from "../../components/Tasks/TaskSearchBar";
import TaskEmptyCard from "../../components/Tasks/TaskEmptyCard";
import DayResultText from "../../components/Tasks/DayResultText";
import MultiCreateTasksModal from "../../components/Tasks/MultiCreateTasksModal";
import { tasksService } from "@/service/index";

// ✅ services สำหรับประกาศ
import { getAnnouncementsService } from "@/service";

// ------ ชนิดขยาย ------
export type TaskWithMeta = Task & {
  area?: number;
  trucks?: number;
  paid_amount?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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

type BackendAnnouncement = {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<boolean>(false); // โมดอลสร้างหลายงาน
  const [status, setStatus] = useState<StatusType>("ทั้งหมด");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // ✅ loading สำหรับ tasks

  // ====== Announcements modal (เฉพาะ is_active=true) ======
  const [annLoading, setAnnLoading] = useState(false);
  const [annList, setAnnList] = useState<BackendAnnouncement[]>([]);
  const [annOpen, setAnnOpen] = useState(false);
  const [annIndex, setAnnIndex] = useState(0);

  // เปิดโมดอลสร้างหลายงานทุกครั้งที่เข้าเพจ (ตามของเดิม)
  useEffect(() => {
    setOpen(true);
  }, []);

  const normalizeMultiline = (s?: string) =>
    (s ?? "").replace(/\r\n/g, "\n").replace(/\\n/g, "\n").trim();

  // ====== Load only active announcements, newest first ======
  const loadAnnouncements = useCallback(async () => {
    setAnnLoading(true);
    try {
      const res = await getAnnouncementsService(); // { ok, message, data: ... }
      // รองรับทั้ง data เป็น array (เก่า) หรือ data.items (ใหม่)
      const list: BackendAnnouncement[] = Array.isArray(res?.data)
        ? res.data
        : res?.data?.items ?? [];

      const activeOnly = list
        .filter((a) => a.is_active)
        .map((a) => ({ ...a, content: normalizeMultiline(a.content) })) // ✅ แปลง \n
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

      setAnnList(activeOnly);
      setAnnIndex(0);
      setAnnOpen(activeOnly.length > 0);
    } catch {
      // เงียบไว้สำหรับหน้าแดชบอร์ด
    } finally {
      setAnnLoading(false);
    }
  }, []);
  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // ====== Tasks ======
  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, status, search]);

  const getData = async () => {
    setLoading(true); // ✅ เริ่มโหลด
    try {
      const params: { from: string; status?: string; title?: string } = {
        from: formatAPI(selectedDate),
      };
      if (status && status !== "ทั้งหมด") {
        params.status = status;
      }
      const q = (search ?? "").trim();
      if (q) params.title = q.split(/\s+/).join("|");

      const { data } = await tasksService(params);
      const items = Array.isArray(data?.items)
        ? (data.items as TaskWithMeta[])
        : [];
      setTasks(items);
    } catch (err: any) {
      alert(err?.message ?? "getData: เกิดข้อผิดพลาด");
    } finally {
      setLoading(false); // ✅ จบโหลด
    }
  };

  const filtered = useMemo(() => tasks, [tasks]);

  // ====== Handlers ของ announcement modal ======
  const hasAnns = annList.length > 0;
  const currentAnn = hasAnns ? annList[annIndex] : null;

  const nextAnn = () =>
    setAnnIndex((i) => (i + 1 < annList.length ? i + 1 : i));
  const prevAnn = () => setAnnIndex((i) => (i - 1 >= 0 ? i - 1 : i));

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
            // กัน spam เปลี่ยนวันตอนกำลังโหลด
            if (!loading) setSelectedDate(startOfDay(d));
          }}
        />

        <TaskSearchBar
          value={search}
          onChange={(v) => (!loading ? setSearch(v) : undefined)}
          onSubmit={() => {}}
          onClear={() => (!loading ? setSearch("") : undefined)}
        />

        <DayResultText
          count={filtered.length}
          dateText={formatAPI(selectedDate)}
        />

        {/* ====== แสดง Loading ระหว่างดึงรายการงาน ====== */}
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, opacity: 0.7 }}>
              กำลังโหลดรายการงาน…
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((t) => (
              <SimpleTaskCard key={t.id} task={t} />
            ))}
            {filtered.length === 0 && <TaskEmptyCard />}
          </View>
        )}
      </ScrollView>

      {/* ====== Announcements Modal (เฉพาะ role user) ====== */}
      <Portal>
        <Modal
          visible={annOpen}
          onDismiss={() => setAnnOpen(false)}
          contentContainerStyle={ms.container}
        >
          <View style={ms.card}>
            {annLoading ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 8 }}>กำลังโหลดประกาศ…</Text>
              </View>
            ) : !currentAnn ? (
              <View style={{ padding: 20 }}>
                <Text>ไม่มีประกาศ</Text>
              </View>
            ) : (
              <>
                <View style={ms.header}>
                  <Text style={ms.title} numberOfLines={2}>
                    {currentAnn.title}
                  </Text>
                  <IconButton icon="close" onPress={() => setAnnOpen(false)} />
                </View>

                {/* เนื้อหายาว + รองรับขึ้นบรรทัดใหม่ด้วย \n */}
                <ScrollView
                  style={ms.contentScroll}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  showsVerticalScrollIndicator
                >
                  <Text selectable style={ms.contentText}>
                    {currentAnn.content}
                  </Text>
                </ScrollView>

                {annList.length > 1 && (
                  <View style={ms.footer}>
                    <Button
                      mode="contained-tonal"
                      onPress={prevAnn}
                      disabled={annIndex === 0}
                    >
                      ก่อนหน้า
                    </Button>
                    <Text style={ms.pageText}>
                      {annIndex + 1} / {annList.length}
                    </Text>
                    <Button
                      mode="contained"
                      onPress={nextAnn}
                      disabled={annIndex === annList.length - 1}
                    >
                      ถัดไป
                    </Button>
                  </View>
                )}

                <Button
                  style={{ marginTop: 10 }}
                  mode="contained"
                  onPress={() => setAnnOpen(false)}
                >
                  ปิด
                </Button>
              </>
            )}
          </View>
        </Modal>
      </Portal>

      {/* ====== โมดอลสร้างงานหลายรายการ (ของเดิม) ====== */}
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

// ---------- styles ของ Announcement Modal ----------
const ms = StyleSheet.create({
  container: { padding: 24, justifyContent: "center" },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    paddingRight: 8,
    color: "#111827",
  },
  contentScroll: {
    marginTop: 8,
    maxHeight: 360, // กันล้นจอสำหรับข้อความยาวมาก
  },
  contentText: { fontSize: 15, lineHeight: 22, color: "#334155" },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pageText: { opacity: 0.7 },
});

// ---------- styles เพิ่มเติม ----------
const s = StyleSheet.create({
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
