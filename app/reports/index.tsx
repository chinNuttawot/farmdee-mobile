// app/(tabs)/reports.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import {
  Button,
  Card,
  Text,
  SegmentedButtons,
  DataTable,
  useTheme,
  Snackbar,
} from "react-native-paper";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import { reportsService } from "@/service";

/** ===== Types ===== */
type Range = "3m" | "6m" | "12m";
type ApiRow = { month: string; income: number; expense: number };
type ApiRes = {
  ok: boolean;
  message: string;
  data: {
    range: Range;
    summary: { totalIncome: number; totalExpense: number; profit: number };
    rows: ApiRow[];
  };
};

/** ===== Helpers ===== */
const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const fmt = (n: number) => n.toLocaleString();
const fmtTH = (n: number) => n.toLocaleString("th-TH");
const fmtTHB = (n: number) => `฿ ${fmt(n)}`;

function monthToThaiLabel(yyyyMM: string) {
  // input: "2025-09"
  const [y, m] = yyyyMM.split("-").map((v) => parseInt(v, 10));
  const be = y + 543;
  const mo = TH_MONTHS[(m || 1) - 1] ?? "";
  return `${mo} ${be}`;
}

export default function Reports() {
  const theme = useTheme();
  const [range, setRange] = useState<Range>("3m");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // ===== state from API =====
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [profit, setProfit] = useState(0);

  /** Fetch from API whenever range changes */
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = (await reportsService({ range })) as ApiRes;
        if (ignore) return;

        const rws = data?.rows ?? [];
        setRows(rws);
        setTotalIncome(data?.summary?.totalIncome ?? 0);
        setTotalExpense(data?.summary?.totalExpense ?? 0);
        setProfit(data?.summary?.profit ?? 0);
      } catch (err: any) {
        console.error("reportsService error:", err);
        setSnack({
          visible: true,
          msg: "ดึงรายงานไม่สำเร็จ: " + (err?.message ?? "unknown"),
        });
        // clear UI to safe defaults
        setRows([]);
        setTotalIncome(0);
        setTotalExpense(0);
        setProfit(0);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [range]);

  /** chart scales */
  const { maxIncome, maxExpense } = useMemo(() => {
    const incomes = rows.map((r) => r.income);
    const expenses = rows.map((r) => r.expense);
    return {
      maxIncome: Math.max(1, ...incomes),
      maxExpense: Math.max(1, ...expenses),
    };
  }, [rows]);

  /** ===== Export Excel (sandbox FS) ===== */
  const exportExcel = async () => {
    try {
      // Prepare display rows for Excel
      const excelRows = rows.map((r) => ({
        เดือน: monthToThaiLabel(r.month),
        รายได้: r.income,
        ค่าใช้จ่าย: r.expense,
      }));
      const ws = XLSX.utils.json_to_sheet(excelRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "รายงาน");
      const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const bytes = new Uint8Array(ab);

      const outDir = new Directory(Paths.cache, "exports");
      if (!outDir.exists) outDir.create();
      const file = new File(outDir, `report_${range}.xlsx`);
      if (file.exists) file.delete();
      file.create();
      file.write(bytes);

      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export รายงาน (Excel)",
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

  /** ===== Export PDF (ภาษาไทยด้วย expo-print) ===== */
  const exportPDF = async () => {
    try {
      const tableRows = rows
        .map(
          (r) => `
          <tr>
            <td>${monthToThaiLabel(r.month)}</td>
            <td style="text-align:right">฿ ${fmtTH(r.income)}</td>
            <td style="text-align:right">฿ ${fmtTH(r.expense)}</td>
          </tr>`
        )
        .join("");

      const startLabel =
        rows.length > 0 ? monthToThaiLabel(rows[0].month) : "-";
      const endLabel =
        rows.length > 0 ? monthToThaiLabel(rows[rows.length - 1].month) : "-";

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
          <div class="muted">ช่วงข้อมูล: ${startLabel} – ${endLabel}</div>

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
            <tbody>${tableRows}</tbody>
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
                {fmtTHB(totalIncome)}
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
                {fmtTHB(totalExpense)}
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
              {fmtTHB(profit)}
            </Text>
          </Card.Content>
        </Card>

        {/* Loading state */}
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {/* Mini Bar Chart */}
        <Card style={{ borderRadius: 16, marginTop: 16 }} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.bold}>
              กราฟรายได้ vs ค่าใช้จ่าย
            </Text>
            <View style={{ height: 12 }} />
            {rows.map((r, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ marginBottom: 6 }}>
                  {monthToThaiLabel(r.month)}
                </Text>

                {/* income */}
                <View style={styles.barRow}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(r.income / maxIncome) * 100}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{fmtTHB(r.income)}</Text>
                </View>

                {/* expense */}
                <View style={styles.barRow}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(r.expense / maxExpense) * 100}%`,
                          backgroundColor: "#E53935",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{fmtTHB(r.expense)}</Text>
                </View>
              </View>
            ))}
            {rows.length === 0 && !loading ? (
              <Text style={{ opacity: 0.6 }}>ไม่พบข้อมูลช่วงนี้</Text>
            ) : null}
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
                  <DataTable.Cell>{monthToThaiLabel(r.month)}</DataTable.Cell>
                  <DataTable.Cell numeric>{fmtTHB(r.income)}</DataTable.Cell>
                  <DataTable.Cell numeric>{fmtTHB(r.expense)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        {/* Bottom buttons */}
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
            onPress={() => router.push("/reportsMonthlyScreen")}
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
            Export PDF
          </Button>

          {/* <Button
            mode="outlined"
            onPress={exportExcel}
            style={{ borderRadius: 8, paddingHorizontal: 20 }}
            labelStyle={{ fontWeight: "700" }}
          >
            Export Excel
          </Button> */}
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

  // --- chart styles (เว้นพื้นที่ตัวเลขไม่ให้ตก)
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
