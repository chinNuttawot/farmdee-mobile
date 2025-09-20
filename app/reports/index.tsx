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
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import * as Print from "expo-print";
import { router } from "expo-router";

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
  const fmtTH = (n: number) => n.toLocaleString("th-TH");

  // -------- Export Excel (FS API ใหม่ + sandbox) --------
  const exportExcel = async () => {
    try {
      // 1) workbook -> ArrayBuffer -> Uint8Array
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "รายงาน");
      const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const bytes = new Uint8Array(ab);

      // 2) เขียนไว้ในโฟลเดอร์ sandbox ของแอป (ไม่ต้องขอ permission)
      const outDir = new Directory(Paths.cache, "exports");
      if (!outDir.exists) outDir.create();

      const file = new File(outDir, "report.xlsx");
      if (file.exists) file.delete();
      file.create();
      file.write(bytes);

      // 3) แชร์ไฟล์
      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export รายงาน",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        setSnack({
          visible: true,
          msg: "บันทึกไฟล์แล้ว: report.xlsx (อุปกรณ์นี้ไม่รองรับการแชร์)",
        });
      }
    } catch (err: any) {
      console.error("exportExcel error:", err);
      setSnack({
        visible: true,
        msg: "Export ล้มเหลว: " + (err?.message ?? "unknown"),
      });
    }
  };

  // -------- Export PDF (UTF-8 ภาษาไทยผ่านแน่นอน ด้วย expo-print) --------
  const exportPDF = async () => {
    try {
      const tableRows = rows
        .map(
          (r) => `
          <tr>
            <td>${r.เดือน}</td>
            <td style="text-align:right">฿ ${fmtTH(r.รายได้)}</td>
            <td style="text-align:right">฿ ${fmtTH(r.ค่าใช้จ่าย)}</td>
          </tr>`
        )
        .join("");

      const html = `
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>รายงานผลประกอบการ</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Thai", "Sarabun", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans Thai", sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px 0; font-size: 20px; }
            h2 { margin: 16px 0 8px 0; font-size: 16px; }
            .kpi { display: flex; gap: 12px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .profit { font-size: 18px; font-weight: 700; color: ${
              profit >= 0 ? "#2E7D32" : "#C62828"
            }; }
            .muted { color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>รายงานผลประกอบการ</h1>
          <div class="muted">ช่วงข้อมูล: ${rows[0]?.เดือน} – ${
        rows[rows.length - 1]?.เดือน
      }</div>

          <div class="kpi" style="margin-top:12px;">
            <div class="card" style="flex:1">
              <div class="muted">รายได้รวม</div>
              <div style="font-weight:800; font-size:16px;">฿ ${fmtTH(
                totalIncome
              )}</div>
            </div>
            <div class="card" style="flex:1">
              <div class="muted">ค่าใช้จ่ายรวม</div>
              <div style="font-weight:800; font-size:16px; color:#E53935;">฿ ${fmtTH(
                totalExpense
              )}</div>
            </div>
          </div>

          <div class="card" style="margin-top:12px;">
            <div class="muted">กำไรสุทธิ</div>
            <div class="profit">฿ ${fmtTH(profit)}</div>
          </div>

          <h2>ตารางสรุป</h2>
          <table>
            <thead>
              <tr>
                <th>เดือน</th>
                <th style="text-align:right;">รายได้</th>
                <th style="text-align:right;">ค่าใช้จ่าย</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export รายงาน (PDF)",
          UTI: "com.adobe.pdf",
        });
      } else {
        setSnack({
          visible: true,
          msg: "บันทึกไฟล์แล้ว: report.pdf (อุปกรณ์นี้ไม่รองรับการแชร์)",
        });
      }
    } catch (err: any) {
      console.error("exportPDF error:", err);
      setSnack({
        visible: true,
        msg: "Export PDF ล้มเหลว: " + (err?.message ?? "unknown"),
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

        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Button
            mode="contained"
            onPress={() => {
              router.push({
                pathname: "/reportsMonthlyScreen",
                params: {},
              });
            }}
            style={{
              backgroundColor: "#E0E0E0",
              borderRadius: 8,
              paddingHorizontal: 16,
              elevation: 0,
            }}
            labelStyle={{ color: "#000", fontWeight: "700" }}
          >
            ดูรายเดือน
          </Button>

          <Button
            mode="contained"
            onPress={exportPDF}
            style={{
              backgroundColor: "#2E7D32",
              borderRadius: 8,
              paddingHorizontal: 20,
              elevation: 0,
            }}
            labelStyle={{ color: "#fff", fontWeight: "700" }}
          >
            Export
          </Button>
        </View>
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
