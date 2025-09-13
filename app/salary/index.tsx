// app/salary.tsx
import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Card, Text, Button, IconButton, FAB } from "react-native-paper";
import SalarySlipFormModal, {
  SalarySlipInput,
} from "@/components/SalarySlipFormModal";

type SalarySlip = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  paid: boolean;
};

const initRows: SalarySlip[] = [
  {
    id: "1",
    date: "2025-08-31",
    title: "ใบแจ้งเงินเดือน #175649379...",
    amount: 1000,
    paid: true,
  },
  {
    id: "2",
    date: "2025-09-30",
    title: "ใบแจ้งเงินเดือน #175649379...",
    amount: 1070,
    paid: false,
  },
];

export default function SalaryScreen() {
  const [rows, setRows] = useState<SalarySlip[]>(initRows);
  const [open, setOpen] = useState(false);

  const money = (n: number) =>
    "฿" +
    (isNaN(n) ? 0 : n).toLocaleString("th-TH", { minimumFractionDigits: 0 });

  const handleSave = (p: SalarySlipInput) => {
    // แปลงเดือนเป็นวันที่ (อย่างง่าย เติม -30)
    const id = String(Date.now());
    const newItem: SalarySlip = {
      id,
      date: `${p.month}-30`,
      title: `ใบแจ้งเงินเดือน #${id.slice(-9)}...`,
      amount: p.remain,
      paid: false,
    };
    setRows((prev) => [newItem, ...prev]);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <View style={styles.pdfIcon}>
                  <Text style={{ color: "white", fontWeight: "700" }}>PDF</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>

                <Text style={styles.amount}>{money(item.amount)}</Text>
              </View>

              <View style={{ marginTop: 6 }}>
                <Text style={styles.subText}>
                  ยอดก่อนหัก: {money(item.amount)}
                </Text>

                {item.paid ? (
                  <Button
                    mode="outlined"
                    icon="check"
                    style={styles.paidBtn}
                    labelStyle={{ color: "#3E9B4F" }}
                  >
                    ชำระแล้ว
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    icon="clock-outline"
                    style={styles.unpaidBtn}
                    labelStyle={{ color: "#FF9800" }}
                  >
                    ยังไม่ชำระ
                  </Button>
                )}
              </View>

              <View style={styles.actions}>
                <IconButton icon="share-variant" onPress={() => {}} />
                <IconButton icon="link" onPress={() => {}} />
              </View>
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        onPress={() => setOpen(true)}
        style={styles.fab}
        size="medium"
        color="white"
        customSize={56}
      />

      {/* ใช้คอมโพเนนต์ Modal */}
      <SalarySlipFormModal
        visible={open}
        onDismiss={() => setOpen(false)}
        onSave={handleSave}
        defaultEmployeeName="นายสมศักดิ์"
        defaultMonth="2025-09"
        ratePerDay={40}
        ratePerPiece={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FBF6" },
  card: { marginBottom: 12, borderRadius: 16, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center" },
  pdfIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#3E9B4F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: { fontWeight: "600", fontSize: 15, color: "#333" },
  date: { fontSize: 12, color: "#666" },
  amount: { fontWeight: "700", fontSize: 15, color: "#000" },
  subText: { fontSize: 13, marginTop: 4 },
  paidBtn: {
    borderColor: "#3E9B4F",
    borderWidth: 1,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  unpaidBtn: {
    borderColor: "#FF9800",
    borderWidth: 1,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: -10 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "#7E57C2",
  },
});
