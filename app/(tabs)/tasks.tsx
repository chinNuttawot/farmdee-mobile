// app/(tabs)/tasks.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import {
  FAB,
  Text,
  ActivityIndicator,
  Portal,
  Modal,
} from "react-native-paper";
import Header from "../../components/Header";
import { styles } from "@/styles/ui";

import { Expense } from "@/components/expenses/typeMeta";
import SummaryCard from "@/components/expenses/SummaryCard";
import ExpenseItem from "@/components/expenses/ExpenseItem";
import EmptyState from "@/components/expenses/EmptyState";
import AddExpenseDialog from "@/components/expenses/AddExpenseDialog";
import {
  expensesDeleteService,
  expensesSaveService,
  expensesService,
  expensesUpdateService,
} from "@/service";
import moment from "moment";

export default function Tasks() {
  // ---- data state ----
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false); // โหลดรายการ
  const [saving, setSaving] = useState(false); // เพิ่ม/แก้ไข/ลบ
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const normalize = (list: any[]): Expense[] =>
    (list ?? []).map((v: any) => ({
      ...v,
      id: v?.id,
      amount: n(v?.amount),
      work_date: v?.work_date
        ? moment(v.work_date).format("YYYY-MM-DD")
        : undefined,
    }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await expensesService();

      const list = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.item)
        ? data.item
        : [];

      setRows(normalize(list));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- sums ----
  const totalAll = useMemo(
    () => (Array.isArray(rows) ? rows.reduce((s, r) => s + n(r.amount), 0) : 0),
    [rows]
  );

  const totalBy = (t: "labor" | "material" | "fuel") =>
    Array.isArray(rows)
      ? rows.filter((r) => r.type === t).reduce((s, r) => s + n(r.amount), 0)
      : 0;

  // ---- helpers ----
  const fmt = (val?: number | string) => {
    const num = n(val);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  // ---- actions ----
  const handleAdd = async (exp: Omit<Expense, "id">) => {
    try {
      setSaving(true);
      const res = await expensesSaveService(exp);
    } finally {
      setSaving(false);
      load();
    }
  };

  const handleEdit = (item: Expense) => {
    setEditing(item);
    setOpen(true);
  };

  const handleSaveEdit = async (updated: Expense) => {
    try {
      setSaving(true);
      await expensesUpdateService(updated);
    } finally {
      setSaving(false);
      load();
    }
  };

  const handleDelete = async (item: Expense) => {
    try {
      setSaving(true);
      await expensesDeleteService(item.id);
    } finally {
      setSaving(false);
      load();
    }
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

      {/* Summary */}
      <View style={styles.topBar}>
        <SummaryCard
          totalAll={totalAll}
          totalLabor={totalBy("labor")}
          totalMaterial={totalBy("material")}
          totalFuel={totalBy("fuel")}
          fmt={fmt}
        />

        <Text style={{ marginTop: 6, opacity: 0.6 }}>
          {loading ? "กำลังโหลด..." : `พบ ${rows?.length ?? 0} รายการ`}
        </Text>
      </View>

      {/* List + Pull to refresh */}
      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        data={rows}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <ExpenseItem
            item={item}
            fmt={fmt}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          !loading ? <EmptyState onAdd={() => setOpen(true)} /> : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
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
        disabled={loading || saving} // ป้องกันกดระหว่างโหลด/บันทึก
      />

      {/* ✅ รองรับทั้ง create/edit */}
      <AddExpenseDialog
        visible={open}
        onClose={handleCloseDialog}
        onAdd={handleAdd}
        onSave={handleSaveEdit}
        initial={editing ?? undefined}
      />

      {/* Global Loading Overlay: ใช้ร่วมกันทั้งโหลด/บันทึก */}
      <Portal>
        <Modal
          visible={loading || saving}
          onDismiss={() => {}}
          dismissable={false}
          contentContainerStyle={{
            backgroundColor: "rgba(0,0,0,0.4)",
            padding: 0,
            margin: 0,
          }}
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
              {saving ? "กำลังบันทึก..." : "กำลังโหลด..."}
            </Text>
          </View>
        </Modal>
      </Portal>
    </>
  );
}
