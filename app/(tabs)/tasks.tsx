// app/(tabs)/tasks.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  Keyboard,
  Platform,
} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  useTheme,
  Chip,
  Text,
  FAB,
  Card,
  Avatar,
  Snackbar,
  IconButton,
  Divider,
} from "react-native-paper";
import Header from "../../components/Header";

type ExpenseType = "labor" | "material" | "fuel" | "other";

type Expense = {
  id: string;
  title: string;
  amount: number;
  type: ExpenseType;
  jobNote?: string;
  qtyNote?: string;
  workDate?: string;
};

export default function Tasks() {
  const theme = useTheme();

  // ---- data state ----
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- create/edit form ----
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ExpenseType>("labor");
  const [jobNote, setJobNote] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [amount, setAmount] = useState("0");

  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // ---- UI state ----
  const [filter, setFilter] = useState<"all" | ExpenseType>("all");
  const [q, setQ] = useState("");

  // mock loader
  const load = async () => {
    setLoading(true);
    setTimeout(() => {
      setRows([
        {
          id: "1",
          title: "ปุ๋ย 15-15-15",
          amount: 1880,
          type: "material",
          jobNote: "งาน: ใส่ปุ๋ย แปลง A",
          qtyNote: "จำนวน: 5 กระสอบ",
          workDate: "2025-08-26",
        },
        {
          id: "2",
          title: "ค่าแรงคันเดียว",
          amount: 1200,
          type: "labor",
          jobNote: "งาน: ตัดหญ้า",
          qtyNote: "ชั่วโมง: 8 ชม. × ฿150",
          workDate: "2025-08-29",
        },
        {
          id: "3",
          title: "ค่าน้ำมันขนส่งผลผลิต",
          amount: 900,
          type: "fuel",
          jobNote: "งาน: ขนส่งผลผลิต",
          qtyNote: "จำนวน: 2 ถัง",
          workDate: "2025-08-28",
        },
      ]);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    load();
  }, []);

  // ---- derived values ----
  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.type === filter);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(t) ||
          r.jobNote?.toLowerCase().includes(t) ||
          r.qtyNote?.toLowerCase().includes(t) ||
          r.workDate?.toLowerCase().includes(t)
      );
    }
    return list;
  }, [rows, filter, q]);

  const totalAll = useMemo(
    () => rows.reduce((s, r) => s + r.amount, 0),
    [rows]
  );
  const totalBy = (t: ExpenseType) =>
    rows.filter((r) => r.type === t).reduce((s, r) => s + r.amount, 0);

  // ---- helpers ----
  const toNum = (s: string) => Number((s || "0").replace(/[^\d.]/g, "")) || 0;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const resetForm = () => {
    setTitle("");
    setType("labor");
    setJobNote("");
    setWorkDate("");
    setAmount("0");
  };

  const add = async () => {
    if (!title.trim() && !jobNote.trim()) {
      setSnack({
        visible: true,
        msg: "กรุณากรอกชื่องานหรือรายละเอียดอย่างใดอย่างหนึ่ง",
      });
      return;
    }
    const amt = toNum(amount);
    const newRow: Expense = {
      id: String(Date.now()),
      title: title.trim() || typeMeta[type].label,
      amount: amt,
      type,
      jobNote: jobNote.trim() || undefined,
      workDate: workDate.trim() || undefined,
    };
    setRows((prev) => [newRow, ...prev]);
    resetForm();
    setOpen(false);
    Keyboard.dismiss();
  };

  // ---- UI mappers ----
  const typeMeta: Record<
    ExpenseType,
    { label: string; color: string; icon: string }
  > = {
    labor: {
      label: "ค่าแรง",
      color: "#2E7D32",
      icon: "account-hard-hat-outline",
    },
    material: {
      label: "ค่าวัสดุ",
      color: "#F57C00",
      icon: "seed-outline",
    },
    fuel: {
      label: "ค่าน้ำมัน",
      color: "#1976D2",
      icon: "gas-station-outline",
    },
    other: {
      label: "ค่าอื่นๆ",
      color: "#6D4C41",
      icon: "tools",
    },
  };

  const TypeChip = ({ t }: { t: ExpenseType }) => (
    <Chip
      compact
      style={{ backgroundColor: `${typeMeta[t].color}15` }}
      textStyle={{ color: typeMeta[t].color, fontWeight: "700" }}
    >
      {typeMeta[t].label}
    </Chip>
  );

  const renderItem = ({ item }: ListRenderItemInfo<Expense>) => (
    <Card style={styles.card} elevation={1}>
      <Card.Title
        title={item.title}
        titleNumberOfLines={2}
        titleStyle={{ fontWeight: "700" }}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={typeMeta[item.type].icon}
            color="white"
            style={{ backgroundColor: typeMeta[item.type].color }}
          />
        )}
        right={() => (
          <View style={{ alignItems: "flex-end", marginRight: 6 }}>
            <Text style={{ fontWeight: "800" }}>฿{fmt(item.amount)}</Text>
            <TypeChip t={item.type} />
          </View>
        )}
      />
      <Card.Content style={{ gap: 6 }}>
        {(item.jobNote || item.workDate) && (
          <Text style={{ opacity: 0.7 }} numberOfLines={2}>
            {item.jobNote ? `งาน: ${item.jobNote}` : ""}
            {item.jobNote && item.workDate ? " • " : ""}
            {item.workDate ? `วันที่: ${item.workDate}` : ""}
          </Text>
        )}
        {item.qtyNote && (
          <Text style={{ opacity: 0.7 }} numberOfLines={1}>
            {item.qtyNote}
          </Text>
        )}

        {/* ปุ่มย่อย: แก้ไข / ลบ แบบแคปซูลพาสเทลมีเงา */}
        <View style={styles.actionRow}>
          <IconButton
            icon="pencil"
            size={18}
            onPress={() => {}}
            containerColor="#FFEDE0"
            iconColor="#F57C00"
            style={styles.actionBtn}
          />
          <IconButton
            icon="trash-can"
            size={18}
            onPress={() => {}}
            containerColor="#FFE6E6"
            iconColor="#D32F2F"
            style={styles.actionBtn}
          />
        </View>
      </Card.Content>
    </Card>
  );

  // ---- header summary card ----
  const Summary = () => (
    <Card style={styles.summaryCard} elevation={0}>
      <Card.Content style={{ paddingVertical: 12 }}>
        <View style={styles.summaryHeader}>
          <Text style={{ fontWeight: "800", opacity: 0.8 }}>รวมทั้งหมด</Text>
          <View style={styles.amountPill}>
            <Text style={{ fontWeight: "900" }}>฿ {fmt(totalAll)}</Text>
          </View>
        </View>

        <View style={{ height: 8 }} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryLine}>
            <Avatar.Icon
              size={26}
              icon={typeMeta.labor.icon}
              style={{ backgroundColor: "#E8F5E9" }}
              color={typeMeta.labor.color}
            />
            <Text style={styles.summaryLabel}>ค่าแรง</Text>
          </View>
          <Text style={styles.summaryValue}>{fmt(totalBy("labor"))}</Text>
        </View>
        <Divider />
        <View style={styles.summaryRow}>
          <View style={styles.summaryLine}>
            <Avatar.Icon
              size={26}
              icon={typeMeta.material.icon}
              style={{ backgroundColor: "#FFF3E0" }}
              color={typeMeta.material.color}
            />
            <Text style={styles.summaryLabel}>ค่าวัสดุ</Text>
          </View>
          <Text style={styles.summaryValue}>{fmt(totalBy("material"))}</Text>
        </View>
        <Divider />
        <View style={styles.summaryRow}>
          <View style={styles.summaryLine}>
            <Avatar.Icon
              size={26}
              icon={typeMeta.fuel.icon}
              style={{ backgroundColor: "#E3F2FD" }}
              color={typeMeta.fuel.color}
            />
            <Text style={styles.summaryLabel}>ค่าน้ำมัน</Text>
          </View>
          <Text style={styles.summaryValue}>{fmt(totalBy("fuel"))}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      {/* แถบหัวสีเขียว */}
      <View style={{ backgroundColor: "#2E7D32" }}>
        <Header title="ค่าใช้จ่าย" />
      </View>

      {/* Summary + Search + Filter */}
      <View style={styles.topBar}>
        <Summary />

        <TextInput
          mode="outlined"
          value={q}
          onChangeText={setQ}
          placeholder="ค้นหาประเภท / วันที่ทำงาน"
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginTop: 10 }}
          returnKeyType="search"
        />

        {/* ชิปกรองรายการ */}
        <View style={styles.chipsRow}>
          <Chip
            selected={filter === "all"}
            onPress={() => setFilter("all")}
            icon="filter-variant"
          >
            ทั้งหมด
          </Chip>
          <Chip
            selected={filter === "labor"}
            onPress={() => setFilter("labor")}
            avatar={
              <Avatar.Icon
                size={18}
                icon={typeMeta.labor.icon}
                style={{ backgroundColor: "transparent" }}
                color={typeMeta.labor.color}
              />
            }
          >
            ค่าแรง
          </Chip>
          <Chip
            selected={filter === "material"}
            onPress={() => setFilter("material")}
            avatar={
              <Avatar.Icon
                size={18}
                icon={typeMeta.material.icon}
                style={{ backgroundColor: "transparent" }}
                color={typeMeta.material.color}
              />
            }
          >
            ค่าวัสดุ
          </Chip>
          <Chip
            selected={filter === "fuel"}
            onPress={() => setFilter("fuel")}
            avatar={
              <Avatar.Icon
                size={18}
                icon={typeMeta.fuel.icon}
                style={{ backgroundColor: "transparent" }}
                color={typeMeta.fuel.color}
              />
            }
          >
            ค่าน้ำมัน
          </Chip>
        </View>

        <Text style={{ marginTop: 6, opacity: 0.6 }}>
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
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🧾</Text>
            <Text style={{ opacity: 0.7, marginBottom: 12 }}>
              ยังไม่มีรายการค่าใช้จ่าย
            </Text>
            <Button mode="contained" onPress={() => setOpen(true)}>
              + เพิ่มรายการ
            </Button>
          </View>
        }
      />

      {/* ปุ่ม + แบบกล่องขาวมีเงา ครอบ FAB สีม่วง */}
      <View style={styles.fabWrap}>
        <FAB
          icon="plus"
          onPress={() => setOpen(true)}
          customSize={44}
          style={styles.fabInside}
          color="#FFFFFF"
        />
      </View>

      {/* ===== Modal เพิ่มค่าใช้จ่าย (ดีไซน์ตามภาพ) ===== */}
      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            เพิ่มค่าใช้จ่าย
          </Dialog.Title>

          <Dialog.Content style={styles.dialogContent}>
            {/* ชื่องาน (ถ้ามี) */}
            <Text style={styles.fieldLabel}>ชื่องาน (ถ้ามี)</Text>
            <TextInput
              mode="flat"
              value={title}
              onChangeText={setTitle}
              placeholder="เช่น ค่าแรงเกี่ยวข้าว"
              style={styles.inputSoft}
              left={<TextInput.Icon icon="clipboard-text-outline" />}
            />

            {/* ประเภท (ทำ segmented look ด้วย Chip สามปุ่ม) */}
            <Text style={styles.fieldLabel}>ประเภท</Text>
            <View style={styles.segmentWrap}>
              {(["labor", "fuel", "material"] as ExpenseType[]).map((t) => {
                const selected = type === t;
                return (
                  <Chip
                    key={t}
                    selected={selected}
                    onPress={() => setType(t)}
                    style={[
                      styles.segmentChip,
                      selected && styles.segmentChipSelected,
                    ]}
                    textStyle={[
                      styles.segmentText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {t === "labor"
                      ? "ค่าแรง"
                      : t === "fuel"
                      ? "ค่าน้ำมัน"
                      : "ค่าวัสดุ"}
                  </Chip>
                );
              })}
            </View>

            {/* รายละเอียด */}
            <Text style={styles.fieldLabel}>รายละเอียด</Text>
            <TextInput
              mode="flat"
              value={jobNote}
              onChangeText={setJobNote}
              placeholder="รายละเอียด"
              style={styles.inputSoft}
              left={<TextInput.Icon icon="note-text-outline" />}
            />

            {/* วันที่ทำงาน */}
            <Text style={styles.fieldLabel}>วันที่ทำงาน</Text>
            <TextInput
              mode="flat"
              value={workDate}
              onChangeText={setWorkDate}
              placeholder="YYYY-MM-DD"
              style={styles.inputSoft}
              left={<TextInput.Icon icon="calendar-outline" />}
            />

            {/* จำนวนเงิน */}
            <Text style={styles.fieldLabel}>จำนวนเงิน</Text>
            <TextInput
              mode="flat"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              style={styles.inputSoft}
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
            />
          </Dialog.Content>

          {/* ปุ่มยกเลิก / บันทึก */}
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={() => setOpen(false)}
              mode="outlined"
              textColor="#444"
              style={styles.btnCancel}
            >
              ยกเลิก
            </Button>
            <Button onPress={add} mode="contained" style={styles.btnSave}>
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

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  topBar: { padding: 16, paddingBottom: 0, gap: 6 },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: "white",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
  },
  summaryRow: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryLabel: { fontWeight: "700", opacity: 0.8 },
  summaryValue: { fontWeight: "800", opacity: 0.9 },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  card: { borderRadius: 16 },
  emptyWrap: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 12,
    marginHorizontal: 2,
    ...(shadow as any),
  },

  // FAB แบบในภาพ
  fabWrap: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    ...(Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.16,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }) as any),
  },
  fabInside: {
    backgroundColor: "#7C4DFF",
    borderRadius: 28,
  },

  // ===== Modal styles (ให้เหมือน UI ตัวอย่าง) =====
  dialog: {
    borderRadius: 20,
    backgroundColor: "#F9F7FF", // ม่วงอ่อน
  },
  dialogTitle: {
    fontWeight: "800",
  },
  dialogContent: {
    gap: 14,
  },
  fieldLabel: {
    fontWeight: "600",
    marginBottom: -6,
  },
  inputSoft: {
    backgroundColor: "#F0F7EB", // เขียวอ่อน
    borderRadius: 12,
  },

  // segmented look ด้วย Chip
  segmentWrap: {
    flexDirection: "row",
    backgroundColor: "#ECE8FF",
    padding: 4,
    borderRadius: 12,
    gap: 6,
  },
  segmentChip: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  segmentChipSelected: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: { textAlign: "center", color: "#6B6B6B", fontWeight: "700" },
  segmentTextSelected: { color: "#7C4DFF" },

  dialogActions: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  btnCancel: {
    flex: 1,
    marginRight: 6,
    borderRadius: 12,
    borderColor: "#CFCFCF",
  },
  btnSave: {
    flex: 1,
    marginLeft: 6,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
  },
});
