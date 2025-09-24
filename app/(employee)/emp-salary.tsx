// app/(tabs)/tasks.tsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import Header from "../../components/Header";
import {
  Card,
  Chip,
  IconButton,
  Text,
  Snackbar,
  useTheme,
  ActivityIndicator,
  Divider,
  Button,
} from "react-native-paper";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { listPayrollsService } from "@/service";
import { PROFILE_KEY } from "@/service/profileService/lindex";
import { StorageUtility } from "@/providers/storageUtility";

/** ========= Types from backend ========= */
type PayrollDetail = {
  area: string; // number-like
  date: string; // YYYY-MM-DD
  endDate?: string | null;
  title: string;
  taskId: number;
  display: string;
  jobType: string; // "งานไร่" | "งานซ่อม" | ...
  dailyRate: string; // number-like
  ratePerRai: string; // number-like
  repairRate: string; // number-like
  workerPayType: "per_rai" | "daily" | string;
};

type PayrollItem = {
  id: number;
  slip_no: string;
  user_id: number;
  month: string; // "YYYY-MM"
  rai_qty: string;
  rai_amount: string;
  repair_days: number;
  repair_amount: string;
  daily_amount: string;
  gross_amount: string;
  deduction: string;
  net_amount: string;
  details: PayrollDetail[];
  note: string;
  status: "Paid" | "Unpaid";
  paid_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  employee_username: string;
  created_by_username: string;
};

/** ========= App model (ขยายให้ครบฟิลด์) ========= */
type SalarySlip = {
  id: string;
  docNo: string;
  employee: string;
  month: string;

  // summary numbers
  raiQty: number;
  raiAmount: number;
  repairDays: number;
  repairAmount: number;
  dailyAmount: number;
  grossAmount: number;
  deduction: number;
  netAmount: number;

  // meta
  note?: string;
  status: "Paid" | "Unpaid";
  paidAt: string | null;
  createdById: number;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;

  // compat fields (เดิม)
  subtotal: number; // = grossAmount
  vat: number; // fixed 0
  total: number; // = netAmount
  paid: boolean;

  details: PayrollDetail[];
};

/** ========= Helpers ========= */
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (n: number) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const safeFileName = (name: string) =>
  name.trim().replace(/[^A-Za-z0-9ก-๙._-]/g, "_");

const mapItem = (p: PayrollItem): SalarySlip => ({
  id: String(p.id),
  docNo: p.slip_no,
  employee: p.employee_username,
  month: p.month,

  raiQty: num(p.rai_qty),
  raiAmount: num(p.rai_amount),
  repairDays: p.repair_days ?? 0,
  repairAmount: num(p.repair_amount),
  dailyAmount: num(p.daily_amount),
  grossAmount: num(p.gross_amount),
  deduction: num(p.deduction),
  netAmount: num(p.net_amount),

  note: p.note,
  status: p.status,
  paidAt: p.paid_at,
  createdById: p.created_by,
  createdByUsername: p.created_by_username,
  createdAt: p.created_at,
  updatedAt: p.updated_at,

  subtotal: num(p.gross_amount),
  vat: 0,
  total: num(p.net_amount),
  paid: p.status === "Paid" || !!p.paid_at,

  details: p.details ?? [],
});

/** คำนวณจำนวนเงินตามประเภทงาน + อธิบายสูตร */
function computeDetailAmount(d: PayrollDetail): {
  label: string;
  value: number;
  formula?: string;
} {
  if (d.jobType === "งานซ่อม") {
    return {
      label: "ค่าซ่อม",
      value: num(d.repairRate),
      formula: `ค่าซ่อม: ${money(num(d.repairRate))}`,
    };
  }
  if (d.workerPayType === "per_rai") {
    const value = num(d.area) * num(d.ratePerRai);
    return {
      label: "ค่าไร่",
      value,
      formula: `${num(d.area)} ไร่ × ${money(num(d.ratePerRai))}`,
    };
  }
  if (d.workerPayType === "daily") {
    return {
      label: "ค่ารายวัน",
      value: num(d.dailyRate),
      formula: `รายวัน: ${money(num(d.dailyRate))}`,
    };
  }
  return { label: "จำนวนเงิน", value: 0 };
}

/** ========= UI: แถวรายละเอียด ========= */
function DetailRow({ d }: { d: PayrollDetail }) {
  const amt = computeDetailAmount(d);
  const isPerRai = d.workerPayType === "per_rai";
  const isRepair = d.jobType === "งานซ่อม";
  const isDaily = d.workerPayType === "daily";

  return (
    <View style={s.detailRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.detailTitle} numberOfLines={2}>
          {d.display || `${d.date}${d.title ? ` ${d.title}` : ""}`}
        </Text>
        <Text style={s.detailSub}>
          {d.jobType}
          {d.endDate && d.endDate !== d.date ? ` · ถึง ${d.endDate}` : ""}
        </Text>
        {/* แสดงสูตรคำนวณชัดเจน */}
        {!!amt.formula && (
          <Text style={s.detailFormula} numberOfLines={1}>
            {amt.formula}
          </Text>
        )}
      </View>

      <View style={s.detailRight}>
        {/* Meta ตามประเภท */}
        {isDaily && (
          <Text style={s.detailMeta}>รายวัน: ฿{money(num(d.dailyRate))}</Text>
        )}
        {isRepair && (
          <Text style={s.detailMeta}>ค่าซ่อม: ฿{money(num(d.repairRate))}</Text>
        )}

        {/* ยอดเงินตามประเภทงาน */}
        <Text style={s.detailAmountLabel}>{amt.label}</Text>
        <Text style={s.detailAmount}>฿ {money(amt.value)}</Text>
      </View>
    </View>
  );
}

/** ========= UI: การ์ดหลัก ========= */
function SalaryCard({
  item,
  onExport,
}: {
  item: SalarySlip;
  onExport: (item: SalarySlip) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={s.card} mode="elevated" elevation={2}>
      <Card.Content>
        {/* แถวบน */}
        <View style={s.rowTop}>
          <View style={s.leftHeader}>
            <View style={s.pdfBadge}>
              <Text style={s.pdfText}>PDF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={s.docTitle} numberOfLines={1}>
                เงินเดือน {item.docNo}
              </Text>
              <Text style={s.subLine}>
                {item.employee} {"\n"}
                {item.month}
              </Text>
              {item.paidAt && (
                <Text style={s.metaPaid} numberOfLines={1}>
                  วันจ่ายเงิน: {new Date(item.paidAt).toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text variant="titleMedium" style={s.totalText}>
              ฿ {money(item.netAmount)}
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

        {/* สรุปค่าแรงแบบครบฟิลด์ */}
        <View style={s.summaryGrid}>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>ยอดก่อนหัก/หนี้</Text>
            <Text style={s.sumValue}>฿{money(item.grossAmount)}</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>หัก/หนี้</Text>
            <Text style={s.sumValue}>฿{money(item.deduction)}</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={[s.sumLabel, { fontWeight: "800" }]}>สุทธิ</Text>
            <Text style={[s.sumValue, { fontWeight: "800" }]}>
              ฿{money(item.netAmount)}
            </Text>
          </View>
        </View>

        {/* หมายเหตุ */}
        {item.note?.trim() ? (
          <View style={{ marginTop: 8 }}>
            <Text style={s.noteLabel}>หมายเหตุ</Text>
            <Text style={s.noteText}>{item.note}</Text>
          </View>
        ) : null}

        {/* ปุ่ม */}
        <View style={s.actionRow}>
          <Button
            mode="contained-tonal"
            icon={expanded ? "chevron-up" : "chevron-down"}
            onPress={() => setExpanded((v) => !v)}
          >
            {expanded
              ? "ซ่อนรายละเอียด"
              : `ดูรายละเอียด (${item.details?.length ?? 0})`}
          </Button>

          <IconButton
            mode="contained-tonal"
            icon="link-variant"
            size={18}
            style={s.linkBtn}
            onPress={() => onExport(item)}
            accessibilityLabel="Export PDF"
          />
        </View>

        {/* รายละเอียด */}
        {expanded && (
          <>
            <Divider style={{ marginVertical: 8, opacity: 0.4 }} />
            {item.details?.length ? (
              <View style={{ gap: 10 }}>
                {item.details.map((d, idx) => (
                  <DetailRow key={`${item.id}-${idx}`} d={d} />
                ))}
              </View>
            ) : (
              <Text style={{ opacity: 0.6, marginTop: 4 }}>
                ไม่มีรายละเอียด
              </Text>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

/** ========= Main Screen ========= */
export default function Tasks() {
  const [rows, setRows] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profileRaw = await StorageUtility.get(PROFILE_KEY);
      const profile = JSON.parse(profileRaw || "{}");
      const { data } = await listPayrollsService({ userId: profile.id });
      const items: PayrollItem[] = data?.items ?? [];
      setRows(items.map(mapItem));
    } catch (err: any) {
      setSnack({
        visible: true,
        msg: "โหลดข้อมูลล้มเหลว: " + (err?.message ?? "unknown"),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const profileRaw = await StorageUtility.get(PROFILE_KEY);
      const profile = JSON.parse(profileRaw || "{}");
      const { data } = await listPayrollsService({ userId: profile.id });
      const items: PayrollItem[] = data?.items ?? [];
      setRows(items.map(mapItem));
    } catch (err: any) {
      setSnack({
        visible: true,
        msg: "รีเฟรชล้มเหลว: " + (err?.message ?? "unknown"),
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const list = useMemo(() => rows, [rows]);

  const exportPDF = useCallback(async (item: SalarySlip) => {
    try {
      const detailRows = (item.details ?? [])
        .map((d) => {
          const amt = computeDetailAmount(d);
          const areaCell =
            d.workerPayType === "per_rai" ? money(num(d.area)) : "-";
          const rateCell =
            d.workerPayType === "per_rai"
              ? money(num(d.ratePerRai))
              : d.jobType === "งานซ่อม"
              ? money(num(d.repairRate))
              : d.workerPayType === "daily"
              ? money(num(d.dailyRate))
              : "-";
          const rateLabel =
            d.workerPayType === "per_rai"
              ? "ค่า/ไร่"
              : d.jobType === "งานซ่อม"
              ? "ค่าซ่อม"
              : d.workerPayType === "daily"
              ? "รายวัน"
              : "อัตรา";
          return `
            <tr>
              <td>${d.display || `${d.date} ${d.title || ""}`}</td>
              <td class="right">${d.jobType || "-"}</td>
              <td class="right">${areaCell}</td>
              <td class="right">${rateLabel}: ${rateCell}</td>
              <td class="right"><b>${money(amt.value)}</b></td>
            </tr>`;
        })
        .join("");

      const html = `
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>เงินเดือน ${item.docNo}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI","Noto Sans Thai","Sarabun", Roboto, Arial, sans-serif; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 20px; }
            h2 { margin: 0 0 6px; font-size: 14px; }
            .muted { color: #6b7280; font-size: 12px; }
            .section { margin-top: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 6px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .right { text-align: right; }
            .total { font-size: 16px; font-weight: 800; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .badge { display:inline-block; border-radius:999px; padding:4px 10px; font-size:12px; font-weight:700; }
            .paid { background:#DFF2E2; color:#2E7D32; }
            .unpaid { background:#FFF0D9; color:#C77700; }
            .hr { border-top: 1px dashed #e5e7eb; margin: 10px 0; }
            .kv { display:flex; justify-content:space-between; gap:8px; }
            .kv b { color:#111827; }
          </style>
        </head>
        <body>
          <h1>เงินเดือน ${item.docNo}</h1>
          <div class="muted">
            พนักงาน: ${item.employee} · เดือน: ${item.month}
            &nbsp; <span class="badge ${item.paid ? "paid" : "unpaid"}">${
        item.paid ? "ชำระแล้ว" : "ยังไม่ชำระ"
      }</span>
          </div>
          <div class="muted">
            ผู้สร้าง: ${item.createdByUsername} · สร้างเมื่อ: ${new Date(
        item.createdAt
      ).toLocaleString()}
            ${
              item.paidAt
                ? `· วันจ่ายเงิน: ${new Date(item.paidAt).toLocaleString()}`
                : ""
            }
          </div>

          <div class="section">
            <h2>สรุปยอด</h2>
            <table>
              <tbody>
                <tr><th>จำนวนไร่</th><td class="right">${money(
                  item.raiQty
                )}</td></tr>
                <tr><th>ค่าทำไร่</th><td class="right">฿${money(
                  item.raiAmount
                )}</td></tr>
                <tr><th>วันซ่อม</th><td class="right">${
                  item.repairDays
                }</td></tr>
                <tr><th>ค่าซ่อม</th><td class="right">฿${money(
                  item.repairAmount
                )}</td></tr>
                <tr><th>ค่ารายวัน</th><td class="right">฿${money(
                  item.dailyAmount
                )}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="section grid">
            <div>
              <table>
                <tbody>
                  <tr><th>ยอดก่อนหัก/หนี้</th><td class="right">฿${money(
                    item.subtotal
                  )}</td></tr>
                  <tr><th>หัก/หนี้</th><td class="right">฿${money(
                    item.deduction
                  )}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table>
                <tbody>
                  <tr><th class="total">รวมทั้งสิ้น (สุทธิ)</th><td class="right total">฿${money(
                    item.total
                  )}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          ${
            (item.details ?? []).length
              ? `
          <div class="section">
            <div class="hr"></div>
            <h2>รายละเอียดรายการ</h2>
            <table>
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th class="right">ประเภทงาน</th>
                  <th class="right">จำนวน (ไร่)</th>
                  <th class="right">อัตรา</th>
                  <th class="right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${detailRows}
              </tbody>
            </table>
          </div>`
              : ""
          }

          ${
            item.note?.trim()
              ? `
          <div class="section">
            <h2>หมายเหตุ</h2>
            <div>${item.note.replace(/\n/g, "<br/>")}</div>
          </div>`
              : ""
          }
        </body>
      </html>`;

      const fileName = safeFileName(item.docNo);
      const { uri } = await Print.printToFileAsync({ html, fileName });

      const canShare = await Sharing.isAvailableAsync().catch(() => false);
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Export ${item.docNo} (PDF)`,
          UTI: "com.adobe.pdf",
        });
      } else {
        // iOS Simulator หรืออุปกรณ์ที่แชร์ไม่ได้
        setSnack({ visible: true, msg: `บันทึกไฟล์แล้ว: ${uri}` });
      }
    } catch (err: any) {
      setSnack({
        visible: true,
        msg: "Export PDF ล้มเหลว: " + (err?.message ?? "unknown"),
      });
    }
  }, []);

  return (
    <>
      <Header title="เงินเดือน" backgroundColor="#2E7D32" color="white" />

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>กำลังโหลด...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
          data={list}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <SalaryCard item={item} onExport={exportPDF} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text>ยังไม่มีสลิปเงินเดือน</Text>
            </View>
          }
        />
      )}

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

/** ========= Styles ========= */
const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "#F7F3FF",
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
  subLine: { opacity: 0.75, marginTop: 2 },
  metaLine: { opacity: 0.6, marginTop: 2, fontSize: 12 },
  metaPaid: { opacity: 0.8, marginTop: 2, fontSize: 12, color: "#2E7D32" },

  totalText: { fontWeight: "800" },
  statusChip: {
    alignSelf: "flex-end",
    marginTop: 4,
    borderRadius: 999,
  },
  paidBg: { backgroundColor: "#DFF2E2" },
  unpaidBg: { backgroundColor: "#FFF0D9" },
  paidText: { color: "#2E7D32", fontWeight: "700" },
  unpaidText: { color: "#C77700", fontWeight: "700" },

  summaryGrid: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  sumCell: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sumLabel: { color: "#6B7280" },
  sumValue: { fontWeight: "700", color: "#111827" },

  amountLine: { fontWeight: "600", letterSpacing: 0.2, marginTop: 4 },

  actionRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  linkBtn: { backgroundColor: "#EEE6FF", margin: 0 },

  // รายละเอียด
  detailRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  detailTitle: { fontWeight: "700", color: "#111827" },
  detailSub: { color: "#6b7280", marginTop: 2, fontSize: 12 },
  detailFormula: { color: "#475569", marginTop: 4, fontSize: 12 },
  detailRight: { minWidth: 160, alignItems: "flex-end" },
  detailMeta: {
    fontVariant: ["tabular-nums"],
    color: "#334155",
    fontSize: 12,
    marginTop: 1,
  },
  detailAmountLabel: { marginTop: 6, fontSize: 12, color: "#64748b" },
  detailAmount: {
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
});
