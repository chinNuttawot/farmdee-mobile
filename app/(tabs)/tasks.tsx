// app/(tabs)/tasks.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList } from "react-native";
import { FAB, Text, TextInput, useTheme } from "react-native-paper";
import Header from "../../components/Header";
import { styles } from "@/styles/ui";

import { Expense, ExpenseType } from "@/components/expenses/typeMeta";
import SummaryCard from "@/components/expenses/SummaryCard";
import FilterChips from "@/components/expenses/FilterChips";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import EmptyState from "@/components/expenses/EmptyState";
import AddExpenseDialog from "@/components/expenses/AddExpenseDialog";

export default function Tasks() {
  const theme = useTheme();

  // ---- data state ----
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- UI state ----
  const [filter, setFilter] = useState<"all" | ExpenseType>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  // ✅ state สำหรับแก้ไข
  const [editing, setEditing] = useState<Expense | null>(null);

  // mock loader
  const load = async () => {
    setLoading(true);
    setTimeout(() => {
      setRows([
        {
          id: "1",
          title: "ปุ๋ย 15-15-15",
          total_amount: 1880,
          type: "material",
          jobNote: "งาน: ใส่ปุ๋ย แปลง A",
          qtyNote: "จำนวน: 5 กระสอบ",
          workDate: "2025-08-26",
        },
        {
          id: "2",
          title: "ค่าแรงคันเดียว",
          total_amount: 1200,
          type: "labor",
          jobNote: "งาน: ตัดหญ้า",
          qtyNote: "ชั่วโมง: 8 ชม. × ฿150",
          workDate: "2025-08-29",
        },
        {
          id: "3",
          title: "ค่าน้ำมันขนส่งผลผลิต",
          total_amount: 900,
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
    () => rows.reduce((s, r) => s + r.total_amount, 0),
    [rows]
  );
  const totalBy = (t: ExpenseType) =>
    rows.filter((r) => r.type === t).reduce((s, r) => s + r.total_amount, 0);

  // ---- helpers ----
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  // ---- actions ----
  const handleAdd = (exp: Omit<Expense, "id">) => {
    setRows((prev) => [{ ...exp, id: String(Date.now()) }, ...prev]);
  };

  const handleEdit = (item: Expense) => {
    setEditing(item);
    setOpen(true);
  };

  const handleSaveEdit = (updated: Expense) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDelete = (item: Expense) => {
    setRows((prev) => prev.filter((r) => r.id !== item.id));
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      {/* แถบหัวสีเขียว */}
      <View style={{ backgroundColor: "#2E7D32" }}>
        <Header title="ค่าใช้จ่าย" />
      </View>

      {/* Summary + Search + Filter */}
      <View style={styles.topBar}>
        <SummaryCard
          totalAll={totalAll}
          totalLabor={totalBy("labor")}
          totalMaterial={totalBy("material")}
          totalFuel={totalBy("fuel")}
          fmt={fmt}
        />

        <TextInput
          mode="outlined"
          value={q}
          onChangeText={setQ}
          placeholder="ค้นหาประเภท / วันที่ทำงาน"
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginTop: 10 }}
          returnKeyType="search"
        />

        <FilterChips value={filter} onChange={setFilter} />

        <Text style={{ marginTop: 6, opacity: 0.6 }}>
          {loading ? "กำลังโหลด..." : `พบ ${filtered.length} งาน`}
        </Text>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ExpenseItem
            item={item}
            fmt={fmt}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<EmptyState onAdd={() => setOpen(true)} />}
      />

      <FAB
        icon="plus"
        onPress={() => {
          setEditing(null); // โหมดเพิ่มใหม่
          setOpen(true);
        }}
        style={styles.fab}
        size="medium"
        color="white"
        customSize={56}
      />

      {/* ✅ รองรับทั้ง create/edit */}
      <AddExpenseDialog
        visible={open}
        onClose={handleCloseDialog}
        onAdd={handleAdd}
        onSave={handleSaveEdit}
        initial={editing ?? undefined}
      />
    </>
  );
}
