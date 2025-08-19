// app/(tabs)/tasks.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  Keyboard,
} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  SegmentedButtons,
  useTheme,
  Chip,
  Text,
  FAB,
  Card,
  Avatar,
  Snackbar,
} from "react-native-paper";
import Header from "../../components/Header";
// import TaskItem from "../../components/TaskItem"; // ถ้ามีของคุณเอง ใช้แทน Card ด้านล่างได้

type Task = {
  id: string;
  title: string;
  price: number;
  status: "todo" | "doing" | "done";
  startDate?: string;
  dueDate?: string;
  notes?: string;
};

export default function Tasks() {
  const theme = useTheme();

  // ---- data state ----
  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- create/edit form ----
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("0");
  const [status, setStatus] = useState<"todo" | "doing" | "done">("todo");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // ---- UI state ----
  const [filter, setFilter] = useState<"all" | "todo" | "doing" | "done">(
    "all"
  );
  const [q, setQ] = useState("");

  // mock loader
  const load = async () => {
    setLoading(true);
    // TODO: load จาก API จริง
    setTimeout(() => {
      setRows([
        {
          id: "1",
          title: "เตรียมดินแปลงผักปลอดสาร",
          price: 2500,
          status: "doing",
          startDate: "2025-08-18",
          dueDate: "2025-08-21",
          notes: "ใช้ปุ๋ยคอก 5 กระสอบ",
        },
        {
          id: "2",
          title: "ตัดหญ้าบริเวณแปลงข้าวโพด",
          price: 1500,
          status: "todo",
        },
        {
          id: "3",
          title: "ส่งผักรวมตลาดนัดอังคาร",
          price: 4200,
          status: "done",
          dueDate: "2025-08-17",
        },
      ]);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(t) ||
          r.notes?.toLowerCase().includes(t)
      );
    }
    return list;
  }, [rows, filter, q]);

  // ---- helpers ----
  const toNum = (s: string) => Number((s || "0").replace(/[^\d.]/g, "")) || 0;
  const fmt = (n: number) => n.toLocaleString();

  const resetForm = () => {
    setTitle("");
    setPrice("0");
    setStatus("todo");
    setStartDate("");
    setDueDate("");
    setNotes("");
  };

  const add = async () => {
    if (!title.trim()) {
      setSnack({ visible: true, msg: "กรุณากรอกชื่องาน" });
      return;
    }
    const priceNum = toNum(price);
    const newTask: Task = {
      id: String(Date.now()),
      title: title.trim(),
      price: priceNum,
      status,
      startDate: startDate.trim() || undefined,
      dueDate: dueDate.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    setRows((prev) => [newTask, ...prev]);
    resetForm();
    setOpen(false);
    Keyboard.dismiss();
  };

  const StatusChip = ({ s }: { s: Task["status"] }) => {
    const map = {
      todo: { text: "รอทำ", color: "#FFA000" },
      doing: { text: "กำลังทำ", color: "#1976D2" },
      done: { text: "เสร็จ", color: "#2E7D32" },
    } as const;
    return (
      <Chip
        compact
        style={{ backgroundColor: `${map[s].color}15` }}
        textStyle={{ color: map[s].color, fontWeight: "700" }}
      >
        {map[s].text}
      </Chip>
    );
  };

  const renderItem = ({ item }: ListRenderItemInfo<Task>) => (
    // ใช้ Card สวย ๆ (ถ้ามี <TaskItem /> ของคุณแล้วอยากใช้แทนก็ได้)
    <Card style={styles.card} elevation={2}>
      <Card.Title
        title={item.title}
        titleNumberOfLines={2}
        titleStyle={{ fontWeight: "700" }}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={
              item.status === "done"
                ? "check-circle-outline"
                : item.status === "doing"
                ? "progress-clock"
                : "clipboard-text-outline"
            }
            color="white"
            style={{
              backgroundColor:
                item.status === "done"
                  ? "#43A047"
                  : item.status === "doing"
                  ? "#1E88E5"
                  : "#FB8C00",
            }}
          />
        )}
        right={() => (
          <Text style={{ fontWeight: "800", marginRight: 12 }}>
            ฿ {fmt(item.price)}
          </Text>
        )}
      />
      <Card.Content style={{ gap: 6 }}>
        <StatusChip s={item.status} />
        {(item.startDate || item.dueDate) && (
          <Text style={{ opacity: 0.7 }}>
            {item.startDate ? `เริ่ม: ${item.startDate}` : ""}{" "}
            {item.dueDate ? `• กำหนดส่ง: ${item.dueDate}` : ""}
          </Text>
        )}
        {!!item.notes && (
          <Text numberOfLines={2} style={{ opacity: 0.8 }}>
            {item.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Header title="งานของฉัน" />

      {/* Filter + Search */}
      <View style={styles.topBar}>
        <SegmentedButtons
          value={filter}
          onValueChange={(v: any) => setFilter(v)}
          buttons={[
            { value: "all", label: "ทั้งหมด", icon: "view-grid-outline" },
            { value: "todo", label: "รอทำ", icon: "clipboard-text-outline" },
            { value: "doing", label: "ทำอยู่", icon: "progress-clock" },
            { value: "done", label: "เสร็จ", icon: "check-circle-outline" },
          ]}
        />
        <TextInput
          mode="outlined"
          value={q}
          onChangeText={setQ}
          placeholder="ค้นหาชื่องาน / รายละเอียด"
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginTop: 12 }}
          returnKeyType="search"
        />
        <Text style={{ marginTop: 8, opacity: 0.6 }}>
          {loading ? "กำลังโหลด..." : `พบ ${filtered.length} งาน`}
        </Text>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🌱</Text>
            <Text style={{ opacity: 0.7, marginBottom: 12 }}>
              ยังไม่มีงานในรายการ
            </Text>
            <Button mode="contained" onPress={() => setOpen(true)}>
              + สร้างงานใหม่
            </Button>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        onPress={() => setOpen(true)}
        style={styles.fab}
        customSize={56}
      />

      {/* Dialog */}
      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ borderRadius: 12 }} // ✅ ปรับตรงนี้
        >
          <Dialog.Title>สร้างงานใหม่</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <TextInput
              mode="outlined"
              label="ชื่องาน"
              value={title}
              onChangeText={setTitle}
              left={<TextInput.Icon icon="clipboard-text-outline" />}
            />
            <TextInput
              mode="outlined"
              label="ราคา (บาท)"
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^\d.]/g, ""))}
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
            />

            <SegmentedButtons
              value={status}
              onValueChange={(v: any) => setStatus(v)}
              buttons={[
                {
                  value: "todo",
                  label: "รอทำ",
                  icon: "clipboard-text-outline",
                },
                { value: "doing", label: "กำลังทำ", icon: "progress-clock" },
                { value: "done", label: "เสร็จ", icon: "check-circle-outline" },
              ]}
              style={{ marginTop: 4 }}
            />

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                style={[styles.col, { marginRight: 6 }]}
                label="วันที่เริ่ม (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
                left={<TextInput.Icon icon="calendar-outline" />}
              />
              <TextInput
                mode="outlined"
                style={[styles.col, { marginLeft: 6 }]}
                label="กำหนดส่ง (YYYY-MM-DD)"
                value={dueDate}
                onChangeText={setDueDate}
                left={<TextInput.Icon icon="calendar-check-outline" />}
              />
            </View>

            <TextInput
              mode="outlined"
              label="รายละเอียด"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="note-text-outline" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>ยกเลิก</Button>
            <Button onPress={add} mode="contained">
              บันทึก
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, msg: "" })}
        duration={2200}
      >
        {snack.msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: { padding: 16, paddingBottom: 0, gap: 4 },
  card: { borderRadius: 16 },
  emptyWrap: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: { position: "absolute", right: 16, bottom: 24 },
  row: { flexDirection: "row", alignItems: "center" },
  col: { flex: 1 },
});
