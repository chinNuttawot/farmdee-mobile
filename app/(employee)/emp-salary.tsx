// app/(tabs)/tasks.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import Header from "../../components/Header";
import {
  Card,
  Chip,
  IconButton,
  Text,
  Snackbar,
  useTheme,
} from "react-native-paper";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// ===== Mock type & data (เงินเดือน/ใบแจ้งหนี้) =====
type SalarySlip = {
  id: string;
  docNo: string; // YYYY-MM-DD
  employee: string;
  date: string; // YYYY-MM-DD
  subtotal: number;
  vat: number;
  total: number;
  paid: boolean;
};

const MOCK: SalarySlip[] = [
  {
    id: "1",
    docNo: "29-08-2025",
    employee: "นายสมคิด",
    date: "2025-08-29",
    subtotal: 1000,
    vat: 70,
    total: 1070,
    paid: true,
  },
  {
    id: "2",
    docNo: "29-08-2025",
    employee: "นายสมคิด",
    date: "2025-08-29",
    subtotal: 1000,
    vat: 70,
    total: 1070,
    paid: false,
  },
];

// ===== Helpers =====
const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2 });

// กันชื่อไฟล์มีอักขระต้องห้าม
const safeFileName = (name: string) =>
  name.trim().replace(/[^A-Za-z0-9ก-๙._-]/g, "_");

// ===== UI: การ์ดแบบในภาพ =====
function SalaryCard({
  item,
  onExport,
}: {
  item: SalarySlip;
  onExport: (item: SalarySlip) => void;
}) {
  const theme = useTheme();
  return (
    <Card style={s.card} mode="elevated" elevation={2}>
      <Card.Content>
        {/* แถวบน: PDF badge + ชื่อเอกสาร / ยอดรวมด้านขวา */}
        <View style={s.rowTop}>
          <View style={s.leftHeader}>
            <View style={s.pdfBadge}>
              <Text style={s.pdfText}>PDF</Text>
            </View>
            <View>
              <Text variant="titleMedium" style={s.docTitle} numberOfLines={1}>
                เงินเดือน {item.docNo}
              </Text>
              <Text style={s.subLine}>
                {item.employee} · {item.date}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text variant="titleMedium" style={s.totalText}>
              ฿ {money(item.total)}
            </Text>
            <Chip
              compact
              mode="flat"
              style={[s.statusChip, item.paid ? s.paidBg : s.unpaidBg]}
              textStyle={[s.statusText, item.paid ? s.paidText : s.unpaidText]}
              icon={item.paid ? "check" : "clock-outline"}
            >
              {item.paid ? "ชำระแล้ว" : "ยังไม่ชำระ"}
            </Chip>
          </View>
        </View>

        {/* บรรทัดยอดเงิน */}
        <View style={{ marginTop: 8 }}>
          <Text style={s.amountLine}>ยอดก่อนภาษี: ฿{money(item.subtotal)}</Text>
        </View>

        {/* ปุ่มมุมขวาล่าง (พื้นม่วงจาง + ไอคอนลิงก์) */}
        <View style={s.bottomRow}>
          <IconButton
            mode="contained-tonal"
            icon="link-variant"
            size={18}
            style={s.linkBtn}
            onPress={() => onExport(item)}
            accessibilityLabel="Export PDF"
          />
        </View>
      </Card.Content>
    </Card>
  );
}

// ===== Main Screen =====
export default function Tasks() {
  const [rows] = useState<SalarySlip[]>(MOCK);
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const list = useMemo(() => rows, [rows]);

  const exportPDF = useCallback(async (item: SalarySlip) => {
    try {
      const html = `
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>เงินเดือน ${item.docNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI","Noto Sans Thai","Sarabun", Roboto, Arial, sans-serif; padding: 24px; color: #111827; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
            h1 { margin: 0 0 8px; font-size: 20px; }
            .muted { color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .right { text-align: right; }
            .total { font-size: 16px; font-weight: 800; }
            .badge { display:inline-block; border-radius:999px; padding:4px 10px; font-size:12px; font-weight:700; }
            .paid { background:#DFF2E2; color:#2E7D32; }
            .unpaid { background:#FFF0D9; color:#C77700; }
          </style>
        </head>
        <body>
          <h1>เงินเดือน ${item.docNo}</h1>
          <div class="muted">${item.employee} · ${item.date}
            &nbsp; <span class="badge ${item.paid ? "paid" : "unpaid"}">${
        item.paid ? "ชำระแล้ว" : "ยังไม่ชำระ"
      }</span>
          </div>

          <div class="card" style="margin-top:12px;">
            <table>
              <thead>
                <tr>
                  <th>รายละเอียด</th>
                  <th class="right">จำนวนเงิน (฿)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ยอดก่อนภาษี</td>
                  <td class="right">${money(item.subtotal)}</td>
                </tr>
                <tr>
                  <td>ภาษี 7%</td>
                  <td class="right">${money(item.vat)}</td>
                </tr>
                <tr>
                  <td class="total">รวมทั้งสิ้น</td>
                  <td class="right total">${money(item.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>`;

      const fileName = safeFileName(item.docNo);
      console.log("fileName ====>", fileName);

      const { uri } = await Prinft.printToFileAsync({
        html,
        fileName: fileName, // 👈 ใช้ชื่อไฟล์ตาม docNo
      });

      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Export ${item.docNo} (PDF)`,
          UTI: "com.adobe.pdf",
        });
      } else {
        setSnack({
          visible: true,
          msg: `บันทึกไฟล์แล้ว: ${uri}`,
        });
      }
    } catch (err: any) {
      console.log("exportPDF error:", err);
      setSnack({
        visible: true,
        msg: "Export PDF ล้มเหลว: " + (err?.message ?? "unknown"),
      });
    }
  }, []);

  return (
    <>
      <Header title="เงินเดือน" backgroundColor="#2E7D32" color="white" />

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
        data={list}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <SalaryCard item={item} onExport={exportPDF} />
        )}
      />

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack((p) => ({ ...p, visible: false }))}
        duration={3000}
      >
        {snack.msg}
      </Snackbar>
    </>
  );
}

// ===== Styles =====
const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "#F7F3FF", // โทนม่วงอ่อนตามภาพ
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pdfBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfText: { color: "white", fontWeight: "800", fontSize: 12 },
  docTitle: { fontWeight: "700" },
  subLine: { opacity: 0.65, marginTop: 2 },

  totalText: { fontWeight: "800" },
  statusChip: {
    alignSelf: "flex-end",
    marginTop: 4,
    borderRadius: 999,
    height: 26,
  },
  paidBg: { backgroundColor: "#DFF2E2" },
  unpaidBg: { backgroundColor: "#FFF0D9" },
  paidText: { color: "#2E7D32", fontWeight: "700" },
  unpaidText: { color: "#C77700", fontWeight: "700" },

  amountLine: {
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 4,
  },

  bottomRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  linkBtn: {
    backgroundColor: "#EEE6FF",
    margin: 0,
  },
});
