// app/(tabs)/finance.tsx
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
  Text,
  TextInput,
  Card,
  SegmentedButtons,
  useTheme,
  Avatar,
  Chip,
  FAB,
  Snackbar,
  HelperText,
} from "react-native-paper";
import Header from "../../components/Header";
import { money } from "../../lib/currency";

type Kind = "labor" | "material" | "transport";
type Row = {
  id: string;
  kind: Kind;
  label: string;
  amount: number;
  taskId?: string;
  createdAt: string;
};

export default function Finance() {
  const theme = useTheme();

  // ---- data ----
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- filter ----
  const [filter, setFilter] = useState<"all" | Kind>("all");

  // ---- form ----
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("0");
  const [kind, setKind] = useState<Kind>("labor");
  const [taskId, setTaskId] = useState("");
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const load = async () => {
    setLoading(true);
    // TODO: load จริงจาก API/DB
    // ตัวอย่างเริ่มต้นว่าง
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ---- computed ----
  const list = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.kind === filter)),
    [rows, filter]
  );
  const sum = (k?: Kind) =>
    rows
      .filter((r) => (k ? r.kind === k : true))
      .reduce((s, r) => s + (r.amount || 0), 0);

  const fmt = (n: number) => money(n);
  const toNum = (s: string) => Number((s || "0").replace(/[^\d.]/g, "")) || 0;

  // ---- UI helpers ----
  const KindChip = ({ k }: { k: Kind }) => {
    const map = {
      labor: { text: "ค่าแรง", color: "#1E88E5", icon: "account-hard-hat" },
      material: { text: "ค่าวัสดุ", color: "#6D4C41", icon: "hammer-wrench" },
      transport: { text: "ค่าขนส่ง", color: "#00796B", icon: "truck-outline" },
    } as const;
    return (
      <Chip
        compact
        style={{ backgroundColor: `${map[k].color}15` }}
        textStyle={{ color: map[k].color, fontWeight: "700" }}
        icon={map[k].icon as any}
      >
        {map[k].text}
      </Chip>
    );
  };

  const renderItem = ({ item }: ListRenderItemInfo<Row>) => {
    const icon =
      item.kind === "labor"
        ? "account-hard-hat"
        : item.kind === "material"
        ? "hammer-wrench"
        : "truck-outline";
    const color =
      item.kind === "labor"
        ? "#1E88E5"
        : item.kind === "material"
        ? "#6D4C41"
        : "#00796B";

    return (
      <Card style={styles.card} elevation={2}>
        <Card.Title
          title={item.label}
          subtitle={`วันที่: ${item.createdAt}${
            item.taskId ? ` • Task: ${item.taskId}` : ""
          }`}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={icon}
              color="white"
              style={{ backgroundColor: color }}
            />
          )}
          right={() => (
            <Text style={{ fontWeight: "800", marginRight: 12 }}>
              {fmt(item.amount)}
            </Text>
          )}
        />
        <Card.Content>
          <KindChip k={item.kind} />
        </Card.Content>
      </Card>
    );
  };

  const add = async () => {
    if (!label.trim()) {
      setSnack({ visible: true, msg: "กรุณากรอกรายละเอียด" });
      return;
    }
    const amt = toNum(amount);
    if (amt <= 0) {
      setSnack({ visible: true, msg: "จำนวนเงินต้องมากกว่า 0" });
      return;
    }

    const row: Row = {
      id: String(Date.now()),
      label: label.trim(),
      amount: amt,
      kind,
      taskId: taskId.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setRows((prev) => [row, ...prev]);

    // reset
    setOpen(false);
    setLabel("");
    setAmount("0");
    setTaskId("");
    setKind("labor");
    Keyboard.dismiss();
  };

  return (
    <>
      <Header title="ระบบการเงิน (ค่าแรง/ค่าวัสดุ/ค่าขนส่ง)" />

      {/* Summary Section */}
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={{ padding: 16, gap: 12 }}>
            <Card style={styles.summary} elevation={2}>
              <Card.Content>
                <Text variant="labelLarge" style={{ opacity: 0.7 }}>
                  รวมทั้งหมด
                </Text>
                <Text variant="headlineMedium" style={styles.bold}>
                  {fmt(sum())}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.summary} elevation={2}>
              <Card.Content style={{ gap: 6 }}>
                <Text variant="labelLarge" style={{ opacity: 0.7 }}>
                  แยกตามประเภท
                </Text>
                <View style={styles.rowBetween}>
                  <KindChip k="labor" />
                  <Text style={styles.bold}>{fmt(sum("labor"))}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <KindChip k="material" />
                  <Text style={styles.bold}>{fmt(sum("material"))}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <KindChip k="transport" />
                  <Text style={styles.bold}>{fmt(sum("transport"))}</Text>
                </View>
              </Card.Content>
            </Card>

            {/* Filter buttons */}
            <SegmentedButtons
              value={filter}
              onValueChange={(v: any) => setFilter(v)}
              buttons={[
                { value: "all", label: "ทั้งหมด", icon: "view-grid-outline" },
                { value: "labor", label: "ค่าแรง", icon: "account-hard-hat" },
                { value: "material", label: "ค่าวัสดุ", icon: "hammer-wrench" },
                { value: "transport", label: "ขนส่ง", icon: "truck-outline" },
              ]}
            />
            <Text style={{ opacity: 0.6 }}>
              {loading ? "กำลังโหลด..." : `พบ ${list.length} รายการ`}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🧮</Text>
            <Text style={{ opacity: 0.7, marginBottom: 12 }}>
              ยังไม่มีรายการค่าใช้จ่าย
            </Text>
            <Button mode="contained" onPress={() => setOpen(true)}>
              + เพิ่มค่าใช้จ่ายงาน
            </Button>
          </View>
        }
      />

      {/* FAB */}
      <FAB style={styles.fab} icon="plus" onPress={() => setOpen(true)} />

      {/* Dialog */}
      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ borderRadius: 12 }}
        >
          <Dialog.Title>เพิ่มค่าใช้จ่ายงาน</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <TextInput
              mode="outlined"
              label="Task ID (ถ้ามี)"
              value={taskId}
              onChangeText={(t) => setTaskId(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              left={<TextInput.Icon icon="clipboard-text-outline" />}
            />

            <SegmentedButtons
              value={kind}
              onValueChange={(v: any) => setKind(v)}
              style={{ marginTop: 4 }}
              buttons={[
                { value: "labor", label: "ค่าแรง", icon: "account-hard-hat" },
                { value: "material", label: "ค่าวัสดุ", icon: "hammer-wrench" },
                {
                  value: "transport",
                  label: "ค่าขนส่ง",
                  icon: "truck-outline",
                },
              ]}
            />

            <TextInput
              mode="outlined"
              label="รายละเอียด"
              value={label}
              onChangeText={setLabel}
              left={<TextInput.Icon icon="note-text-outline" />}
            />
            <HelperText type="error" visible={!label.trim()}>
              * กรุณากรอกรายละเอียด
            </HelperText>

            <TextInput
              mode="outlined"
              label="จำนวนเงิน"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>ยกเลิก</Button>
            <Button mode="contained" onPress={add}>
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
  summary: { borderRadius: 16 },
  card: { borderRadius: 16, marginHorizontal: 16 },
  fab: { position: "absolute", right: 16, bottom: 24 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bold: { fontWeight: "800" },
});
