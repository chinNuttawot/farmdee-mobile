// app/(tabs)/reports.tsx
import React, { useMemo, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Card,
  Text,
  SegmentedButtons,
  DataTable,
  useTheme,
  Snackbar,
} from "react-native-paper";
import Header from "../../components/Header";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

// --- mock data (แทน API) ---
const SAMPLE = [
  { เดือน: "ส.ค. 2568", รายได้: 120000, ค่าใช้จ่าย: 45000 },
  { เดือน: "ก.ย. 2568", รายได้: 98000, ค่าใช้จ่าย: 38000 },
  { เดือน: "ต.ค. 2568", รายได้: 105000, ค่าใช้จ่าย: 52000 },
  { เดือน: "พ.ย. 2568", รายได้: 112000, ค่าใช้จ่าย: 47000 },
];

export default function Reports() {
  const theme = useTheme();
  const [range, setRange] = useState<"3m" | "6m" | "12m">("3m");
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // เลียนแบบการกรองช่วงเวลา
  const rows = useMemo(() => {
    if (range === "3m") return SAMPLE.slice(-3);
    if (range === "6m") return SAMPLE.slice(-4); // mock ให้ยาวขึ้นได้ตามจริง
    return SAMPLE;
  }, [range]);

  const totalIncome = rows.reduce((s, r) => s + r.รายได้, 0);
  const totalExpense = rows.reduce((s, r) => s + r.ค่าใช้จ่าย, 0);
  const profit = totalIncome - totalExpense;

  const maxIncome = Math.max(...rows.map((r) => r.รายได้), 1);
  const maxExpense = Math.max(...rows.map((r) => r.ค่าใช้จ่าย), 1);

  const fmt = (n: number) => n.toLocaleString();

  const exportExcel = async () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงาน");
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = FileSystem.documentDirectory + "report.xlsx";
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Filter */}
        <SegmentedButtons
          value={range}
          onValueChange={(v: any) => setRange(v)}
          style={{ marginBottom: 12 }}
          buttons={[
            { value: "3m", label: "3 เดือน" },
            { value: "6m", label: "6 เดือน" },
            { value: "12m", label: "12 เดือน" },
          ]}
        />

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard} elevation={2}>
            <Card.Content>
              <Text variant="labelLarge" style={{ opacity: 0.8 }}>
                รายได้รวม
              </Text>
              <Text variant="headlineMedium" style={styles.bold}>
                ฿ {fmt(totalIncome)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard} elevation={2}>
            <Card.Content>
              <Text variant="labelLarge" style={{ opacity: 0.8 }}>
                ค่าใช้จ่ายรวม
              </Text>
              <Text
                variant="headlineMedium"
                style={[styles.bold, { color: "#E53935" }]}
              >
                ฿ {fmt(totalExpense)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={{ borderRadius: 16 }} elevation={2}>
          <Card.Content>
            <Text variant="labelLarge" style={{ opacity: 0.8 }}>
              กำไรสุทธิ
            </Text>
            <Text
              variant="headlineLarge"
              style={[
                styles.bold,
                { color: profit >= 0 ? "#2E7D32" : "#C62828" },
              ]}
            >
              ฿ {fmt(profit)}
            </Text>
          </Card.Content>
        </Card>

        {/* Mini Bar Chart */}
        <Card style={{ borderRadius: 16, marginTop: 16 }} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.bold}>
              กราฟรายได้ vs ค่าใช้จ่าย
            </Text>
            <View style={{ height: 12 }} />
            {rows.map((r, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ marginBottom: 6 }}>{r.เดือน}</Text>

                {/* income */}
                <View style={styles.barRow}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(r.รายได้ / maxIncome) * 100}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>฿ {fmt(r.รายได้)}</Text>
                </View>

                {/* expense */}
                <View style={styles.barRow}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(r.ค่าใช้จ่าย / maxExpense) * 100}%`,
                          backgroundColor: "#E53935",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>฿ {fmt(r.ค่าใช้จ่าย)}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Table */}
        <Card style={{ borderRadius: 16, marginTop: 16 }} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.bold}>
              ตารางสรุป
            </Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>เดือน</DataTable.Title>
                <DataTable.Title numeric>รายได้</DataTable.Title>
                <DataTable.Title numeric>ค่าใช้จ่าย</DataTable.Title>
              </DataTable.Header>

              {rows.map((r, idx) => (
                <DataTable.Row key={idx}>
                  <DataTable.Cell>{r.เดือน}</DataTable.Cell>
                  <DataTable.Cell numeric>฿ {fmt(r.รายได้)}</DataTable.Cell>
                  <DataTable.Cell numeric>฿ {fmt(r.ค่าใช้จ่าย)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        <View style={{ height: 16 }} />
        <Button mode="contained" onPress={exportExcel}>
          Export Excel
        </Button>
      </ScrollView>

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
  bold: { fontWeight: "800" },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  kpiCard: { flex: 1, borderRadius: 16 },

  // --- chart styles (แก้ใหม่ให้เลขไม่ตก) ---
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#00000014",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 6 },
  barLabel: { width: 110, textAlign: "right", opacity: 0.8 },
});
