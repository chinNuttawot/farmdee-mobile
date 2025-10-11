// app/salary/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import {
  Card,
  Text,
  Button,
  IconButton,
  FAB,
  Chip,
  Divider,
} from "react-native-paper";
import SalarySlipFormModal, {
  PreviewSummary,
  PreviewDetail,
  SavePayrollPayload,
} from "@/components/SalarySlipFormModal";
import {
  listPayrollsService,
  statusPayrollService,
  deletePayrollByIDService,
  previewService,
  createPayrollService,
} from "@/service";
import { useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

type SlipDetail = {
  date: string;
  endDate?: string | null;
  taskId: number;
  title: string;
  jobType: string;
  workerPayType: string;
  area?: string | number | null;
  ratePerRai?: string | number | null;
  repairRate?: string | number | null;
  dailyRate?: string | number | null;
  display?: string;
};

type SalarySlip = {
  id: string;
  date: string;
  title: string;
  total_amount: number;
  net_amount: number;
  paid_amount: boolean;
  slip_no?: string | null;
  month?: string | null;
  note?: string | null;
  details: SlipDetail[];
  expanded?: boolean;
};

export default function SalaryScreen() {
  const params = useLocalSearchParams();
  const userId = useMemo(() => {
    const raw = (params as any)?.id;
    return Number(Array.isArray(raw) ? raw[0] : raw);
  }, [params]);

  const [rows, setRows] = useState<SalarySlip[]>([]);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // โหลดระหว่างดาวน์โหลด/แชร์ ทีละรายการ
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // เดือนเริ่มต้น (ล่าสุดจากรายการ หรือเดือนปัจจุบัน)
  const [preferredMonth, setPreferredMonth] = useState<string>(() => ymNow());

  // state สำหรับพรีวิว -> inject เข้าโมดอล
  const [previewInit, setPreviewInit] = useState<any | null>(null);
  const [previewSummary, setPreviewSummary] = useState<
    PreviewSummary | undefined
  >(undefined);
  const [previewDetails, setPreviewDetails] = useState<
    PreviewDetail[] | undefined
  >(undefined);

  const money = (n: number) =>
    "฿" +
    (isNaN(n) ? 0 : n).toLocaleString("th-TH", { minimumFractionDigits: 0 });

  const parseNum = (v: any) => {
    if (v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const lastDayOfMonth = (ym: string) => {
    const [y, m] = ym.split("-").map((x) => Number(x));
    const d = new Date(y, m, 0);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const buildTitle = (slipNo?: string | null) =>
    slipNo ? `ใบแจ้งเงินเดือน #${slipNo}` : "ใบแจ้งเงินเดือน";

  const calcLineAmount = (d: SlipDetail) => {
    const payType = String(d.workerPayType ?? "").toLowerCase();
    const jobType = String(d.jobType ?? "");
    const area = parseNum(d.area);
    const ratePerRai = parseNum(d.ratePerRai);
    const repairRate = parseNum(d.repairRate);
    const dailyRate = parseNum(d.dailyRate);

    if (payType === "daily") return dailyRate;
    if (jobType === "งานไร่") return area * ratePerRai;
    if (jobType === "งานซ่อม") return repairRate;
    return 0;
  };

  const fetchData = useCallback(async () => {
    if (!Number.isFinite(userId) || userId <= 0) return;
    setRefreshing(true);
    try {
      const { data } = await listPayrollsService({ userId });
      const items = Array.isArray(data?.items) ? data.items : [];

      const mapped: SalarySlip[] = items.map((it: any) => {
        const month: string | null = it?.month ?? null;
        const gross = parseNum(it?.gross_amount);
        const net = parseNum(it?.net_amount);
        const status: string = it?.status ?? "Unpaid";
        const slipId = String(it?.id ?? "");
        const slipNo: string | null = it?.slip_no ?? null;

        const detailsRaw: any[] = Array.isArray(it?.details) ? it.details : [];
        const details: SlipDetail[] = detailsRaw.map((d) => ({
          date: d?.date ?? "",
          endDate: d?.endDate ?? null,
          taskId: d?.taskId ?? d?.task_id ?? 0,
          title: d?.title ?? "",
          jobType: d?.jobType ?? d?.job_type ?? "",
          workerPayType: String(d?.workerPayType ?? d?.worker_pay_type ?? ""),
          area: d?.area,
          ratePerRai: d?.ratePerRai ?? d?.rate_per_rai,
          repairRate: d?.repairRate ?? d?.repair_rate,
          dailyRate: d?.dailyRate ?? d?.daily_rate,
          display: d?.display,
        }));

        return {
          id: slipId,
          date: month
            ? lastDayOfMonth(month)
            : String(it?.created_at ?? "").slice(0, 10),
          title: buildTitle(slipNo),
          total_amount: gross,
          net_amount: net,
          paid_amount: status === "Paid",
          slip_no: slipNo,
          month,
          note: it?.note ?? null,
          details,
          expanded: false,
        };
      });

      mapped.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      setRows(mapped);
    } catch (err) {
      setRows([]);
      console.warn("listPayrollsService error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r))
    );
  };

  const togglePaid = async (id: string, current: boolean) => {
    try {
      await statusPayrollService({ id, paid: !current });
      fetchData();
    } catch (err) {
      console.error("update payroll status error:", err);
    }
  };

  // ===== พรีวิวก่อนเปิดโมดอล =====
  const handleOpenForm = async () => {
    if (!Number.isFinite(userId) || userId <= 0) {
      Alert.alert("ไม่พบผู้ใช้", "จำเป็นต้องมีรหัสพนักงานเพื่อสร้างพรีวิว");
      return;
    }
    try {
      setPreviewLoading(true);
      const month = ymNow();

      const { data } = await previewService({ userId, month });
      const detailsText = Array.isArray(data?.details)
        ? data.details
            .map((x: any) => x?.display ?? "")
            .filter(Boolean)
            .join("\n")
        : "";

      const init = {
        employeeName: (params as any)?.full_name || "พนักงาน",
        month: data?.month || month,
        days: Number(data?.repairDays ?? 0),
        pieces: Number(data?.raiQty ?? 0),
        details: detailsText,
        total_amount: Number(data?.grossAmount ?? 0),
        deduct: 0,
        remain: Number(data?.grossAmount ?? 0),
        note: "",
      };

      setPreviewInit(init);

      setPreviewSummary({
        userId: Number(data?.userId ?? userId),
        month: data?.month || month,
        raiQty: Number(data?.raiQty ?? 0),
        raiAmount: Number(data?.raiAmount ?? 0),
        repairDays: Number(data?.repairDays ?? 0),
        repairAmount: Number(data?.repairAmount ?? 0),
        dailyAmount: Number(data?.dailyAmount ?? 0),
        grossAmount: Number(data?.grossAmount ?? 0),
      });

      const mappedDetails: PreviewDetail[] = Array.isArray(data?.details)
        ? data.details.map((d: any) => ({
            date: d?.date ?? "",
            endDate: d?.endDate ?? null,
            taskId: Number(d?.taskId ?? 0),
            title: String(d?.title ?? ""),
            jobType: String(d?.jobType ?? ""),
            workerPayType: String(d?.workerPayType ?? ""),
            area: d?.area,
            ratePerRai: d?.ratePerRai,
            repairRate: d?.repairRate,
            dailyRate: d?.dailyRate,
            display: d?.display,
          }))
        : [];

      setPreviewDetails(mappedDetails);

      setOpen(true);
    } catch (err: any) {
      console.error("previewService error:", err);
      Alert.alert(
        "พรีวิวไม่สำเร็จ",
        "ไม่สามารถดึงข้อมูลพรีวิวได้ โปรดลองอีกครั้งหรือตรวจสอบการเชื่อมต่อ"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // ===== ลบ (เฉพาะ Unpaid) =====
  const confirmDelete = (item: SalarySlip) => {
    if (item.paid_amount) {
      Alert.alert(
        "ไม่สามารถลบได้",
        "ใบแจ้งเงินเดือนที่ชำระแล้วจะไม่สามารถลบได้"
      );
      return;
    }
    Alert.alert(
      "ยืนยันการลบ",
      "คุณต้องการลบใบแจ้งเงินเดือนนี้หรือไม่? การลบจะไม่สามารถย้อนกลับได้",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () => handleDelete(item.id),
        },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deletePayrollByIDService(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      await fetchData();
    } catch (err) {
      console.error("delete payroll error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ===== บันทึกใบจ่าย (ใส่กลับมา) =====
  const handleSave = async (p: SavePayrollPayload) => {
    if (createLoading) return;
    try {
      setCreateLoading(true);
      await createPayrollService(p);
      setOpen(false);
      await fetchData();
      Alert.alert("สำเร็จ", "บันทึกใบจ่ายเงินเดือนเรียบร้อย");
    } catch (err: any) {
      console.error("createPayrollService error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "ไม่สามารถบันทึกได้ โปรดลองใหม่";
      Alert.alert("เกิดข้อผิดพลาด", String(msg));
    } finally {
      setCreateLoading(false);
    }
  };

  // =========================
  //   PDF: สร้างฝั่ง client
  // =========================

  const renderDetailRows = (details: SlipDetail[]) => {
    if (!Array.isArray(details) || details.length === 0) {
      return `<tr><td colspan="4" style="padding:8px;color:#666;text-align:center;">ไม่มีรายละเอียดงาน</td></tr>`;
    }
    const cells = details
      .map((d) => {
        const payType = String(d.workerPayType || "").toLowerCase();
        const amt =
          payType === "daily"
            ? parseNum(d.dailyRate)
            : d.jobType === "งานไร่"
            ? parseNum(d.area) * parseNum(d.ratePerRai)
            : d.jobType === "งานซ่อม"
            ? parseNum(d.repairRate)
            : 0;

        const date =
          d.endDate && d.endDate !== d.date
            ? `${d.date} → ${d.endDate}`
            : d.date;

        const unit =
          d.jobType === "งานไร่"
            ? `${parseNum(d.area)} ไร่ × ${parseNum(d.ratePerRai)}`
            : payType === "daily"
            ? `รายวัน ${parseNum(d.dailyRate)}`
            : d.jobType === "งานซ่อม"
            ? `ซ่อม ${parseNum(d.repairRate)}`
            : "-";

        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${date}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
              d.title || "-"
            )}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
              d.jobType || "-"
            )}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${unit}<br/><strong>${money(
          amt
        )}</strong></td>
          </tr>`;
      })
      .join("");
    return cells;
  };

  const buildSlipHtml = (item: SalarySlip) => {
    const slipNo = item.slip_no || "-";
    const status = item.paid_amount ? "Paid" : "Unpaid";
    const note = item.note ? escapeHtml(item.note) : "-";

    return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(item.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "TH Sarabun New", "Noto Sans Thai", sans-serif; color:#111; }
  .wrap { max-width: 780px; margin: 24px auto; padding: 16px; }
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .badge { font-weight:700; font-size:12px; padding:4px 8px; border-radius:999px; background:#EFF6FF; color:#1E3A8A; }
  h1 { font-size:18px; margin: 0 0 4px; }
  .meta { color:#4B5563; font-size:13px; }
  table { width:100%; border-collapse:collapse; margin-top:12px; }
  th { text-align:left; font-weight:700; padding:8px; border-bottom:2px solid #e5e7eb; background:#f9fafb; font-size:13px; }
  td { font-size:13px; }
  .totals { margin-top:12px; display:flex; gap:16px; justify-content:flex-end; }
  .totals .box { border:1px solid #e5e7eb; padding:10px 12px; border-radius:10px; background:#fff; min-width:220px; }
  .label { color:#6b7280; font-size:12px; }
  .value { font-weight:700; }
  .note { margin-top:12px; color:#374151; }
  .footer { margin-top:24px; color:#6b7280; font-size:12px; text-align:center; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <h1>${escapeHtml(item.title)}</h1>
      <div class="meta">เลขที่: ${escapeHtml(slipNo)} • วันที่ออก: ${escapeHtml(
      item.date
    )}</div>
    </div>
    <div class="badge">${escapeHtml(status === 'Paid' ? "ชำระแล้ว" : "ยังไม่ชำระ")}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:22%;">วันที่</th>
        <th>รายการ</th>
        <th style="width:16%;">ประเภทงาน</th>
        <th style="width:26%; text-align:right;">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${renderDetailRows(item.details || [])}
    </tbody>
  </table>

  <div class="totals">
    <div class="box">
      <div class="label">ยอดก่อนหัก</div>
      <div class="value">${money(item.total_amount)}</div>
      <div class="label">ยอดหลังหัก</div>
      <div class="value">${money(item.net_amount)}</div>
      <div class="label">ยอดที่ต้องจ่าย</div>
      <div class="value">${money(item.net_amount)}</div>
    </div>
  </div>

  ${
    item.note
      ? `<div class="note"><strong>หมายเหตุ:</strong> ${note}</div>`
      : ""
  }

  <div class="footer">สร้างโดยแอป • ${new Date().toLocaleString("th-TH")}</div>
</div>
</body>
</html>`;
  };

  function escapeHtml(s: string) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---- helper: ตั้งชื่อไฟล์ตาม "เดือนที่จ่าย" + เลขที่สลิป (ถ้ามี) ----
  function fileNameFromMonth(item: SalarySlip) {
    const ymFromMonth =
      item.month && /^\d{4}-\d{2}$/.test(item.month) ? item.month : "";
    const ymFromDate =
      !ymFromMonth && item.date ? String(item.date).slice(0, 7) : "";
    const ym = ymFromMonth || ymFromDate || ymNow();
    const base = "salary-" + ym + (item.slip_no ? `-${item.slip_no}` : "");
    return sanitizeFileName(base).toLowerCase() + ".pdf";
  }

  function sanitizeFileName(name: string) {
    return name
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 180);
  }

  /** สร้าง PDF (พร้อม base64) */
  const createPdf = async (item: SalarySlip) => {
    const html = buildSlipHtml(item);
    const { uri, base64 } = await Print.printToFileAsync({
      html,
      base64: true,
    });
    const fileName = fileNameFromMonth(item);
    return { uri, base64, fileName };
  };

  const handleDownload = async (item: SalarySlip) => {
    if (downloadingId) return;
    try {
      setDownloadingId(item.id);
      const { uri, base64, fileName } = await createPdf(item);

      if (Platform.OS === "ios") {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: item.title || "ดาวน์โหลดใบแจ้งเงินเดือน",
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("ดาวน์โหลดแล้ว", `ไฟล์อยู่ที่:\n${uri}`);
        }
        return;
      }

      // ANDROID → ใช้ SAF
      const perms =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perms.granted) {
        Alert.alert("ยกเลิก", "ไม่ได้เลือกโฟลเดอร์ปลายทาง");
        return;
      }

      const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
        perms.directoryUri,
        fileName,
        "application/pdf"
      );

      const data =
        base64 ??
        (await FileSystem.readAsStringAsync(uri, {
          encoding: "base64", // ✅ แทน EncodingType.Base64
        }));

      await FileSystem.writeAsStringAsync(targetUri, data, {
        encoding: "base64", // ✅ แทน EncodingType.Base64
      });

      Alert.alert("บันทึกแล้ว", "ไฟล์ถูกบันทึกลงโฟลเดอร์ที่เลือกเรียบร้อย");
    } catch (err: any) {
      console.error("download pdf error:", err);
      Alert.alert(
        "ดาวน์โหลดไม่สำเร็จ",
        err?.message || "ไม่สามารถดาวน์โหลดไฟล์ได้"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (item: SalarySlip) => {
    if (sharingId) return;
    try {
      setSharingId(item.id);
      const { uri } = await createPdf(item);
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          "แชร์ไม่ได้",
          Platform.OS === "android"
            ? "อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์ ลองเปิดไฟล์แล้วแชร์จากแอปจัดการไฟล์"
            : "อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์"
        );
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: item.title || "แชร์ใบแจ้งเงินเดือน",
        UTI: "com.adobe.pdf",
      });
    } catch (err: any) {
      console.error("share pdf error:", err);
      Alert.alert("แชร์ไม่สำเร็จ", err?.message || "ไม่สามารถแชร์ไฟล์ได้");
    } finally {
      setSharingId(null);
    }
  };

  const DetailRow = ({ d }: { d: SlipDetail }) => {
    const amt = calcLineAmount(d);
    const areaTxt =
      d.jobType === "งานไร่"
        ? ` • ${parseNum(d.area)} ไร่`
        : d.jobType === "งานซ่อม"
        ? ""
        : "";
    const dateRange =
      d.endDate && d.endDate !== d.date ? `${d.date} → ${d.endDate}` : d.date;

    return (
      <View style={styles.detailRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailTitle} numberOfLines={2}>
            {d.title}
          </Text>
          <Text style={styles.detailSub}>
            {dateRange}
            {areaTxt}
          </Text>
          <View style={styles.chips}>
            <Chip compact style={styles.chip} icon="briefcase-variant">
              {d.jobType || "-"}
            </Chip>
            <Chip compact style={styles.chip} icon="account-hard-hat">
              {String(d.workerPayType || "").toLowerCase() === "daily"
                ? "พนักงานรายวัน"
                : "คิดตามงาน"}
            </Chip>
          </View>
        </View>
        <Text style={styles.detailAmount}>{money(amt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          !refreshing ? (
            <Text style={{ textAlign: "center", marginTop: 24, color: "#666" }}>
              ไม่พบใบแจ้งเงินเดือน
            </Text>
          ) : null
        }
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

                <Text style={styles.total_amount}>
                  {money(item.net_amount)}
                </Text>
              </View>

              <View style={{ marginTop: 6 }}>
                <Text style={styles.subText}>
                  ยอดก่อนหัก: {money(item.total_amount)}
                </Text>
                <Text style={styles.subText}>
                  ยอดหลังหัก: {money(item.net_amount)}
                </Text>
                <Text style={styles.subText}>
                  ยอดที่ต้องจ่าย: {money(item.net_amount)}
                </Text>

                {item.paid_amount ? (
                  <Button
                    mode="outlined"
                    icon="check"
                    style={styles.paidBtn}
                    labelStyle={{ color: "#3E9B4F" }}
                    onPress={() => togglePaid(item.id, true)}
                  >
                    ชำระแล้ว (กดเปลี่ยน)
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    icon="clock-outline"
                    style={styles.unpaidBtn}
                    labelStyle={{ color: "#FF9800" }}
                    onPress={() => togglePaid(item.id, false)}
                  >
                    ยังไม่ชำระ (กดเปลี่ยน)
                  </Button>
                )}
              </View>

              <View style={styles.actions}>
                <IconButton
                  icon={item.expanded ? "chevron-up" : "chevron-down"}
                  onPress={() => toggleExpand(item.id)}
                  accessibilityLabel="ดูรายละเอียด"
                />

                {/* แชร์ */}
                <IconButton
                  icon={sharingId === item.id ? "share" : "share-variant"}
                  onPress={() => handleShare(item)}
                  disabled={sharingId === item.id || downloadingId === item.id}
                  accessibilityLabel="แชร์ใบแจ้งเงินเดือน"
                />

                {/* ดาวน์โหลด */}
                {/* <IconButton
                  icon="download"
                  onPress={() => handleDownload(item)}
                  disabled={downloadingId === item.id || sharingId === item.id}
                  accessibilityLabel="ดาวน์โหลดใบแจ้งเงินเดือน"
                /> */}

                {/* ลบ (เฉพาะ Unpaid) */}
                {!item.paid_amount && (
                  <IconButton
                    icon="trash-can-outline"
                    onPress={() => confirmDelete(item)}
                    disabled={
                      deletingId === item.id ||
                      refreshing ||
                      downloadingId === item.id ||
                      sharingId === item.id
                    }
                    accessibilityLabel="ลบใบแจ้งเงินเดือน"
                  />
                )}
              </View>

              {item.expanded && (
                <View style={styles.detailsWrap}>
                  <Divider style={{ marginBottom: 8 }} />
                  {item.details.length === 0 ? (
                    <Text style={{ color: "#666" }}>ไม่มีรายละเอียดงาน</Text>
                  ) : (
                    item.details.map((d, idx) => (
                      <View key={`${item.id}-${d.taskId}-${idx}`}>
                        <DetailRow d={d} />
                        {idx !== item.details.length - 1 && (
                          <Divider style={{ marginVertical: 8 }} />
                        )}
                      </View>
                    ))
                  )}
                  {item.note ? (
                    <>
                      <Divider style={{ marginVertical: 8 }} />
                      <Text style={{ fontSize: 12, color: "#555" }}>
                        หมายเหตุ: {item.note}
                      </Text>
                    </>
                  ) : null}
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        icon={previewLoading ? "refresh" : "plus"}
        onPress={handleOpenForm}
        style={styles.fab}
        size="medium"
        color="white"
        customSize={56}
        disabled={previewLoading || createLoading}
      />

      <SalarySlipFormModal
        visible={open}
        onDismiss={() => setOpen(false)}
        onSave={handleSave}
        initialValues={previewInit ?? undefined}
        previewSummary={previewSummary}
        previewDetails={previewDetails}
      />
    </View>
  );
}

function ymNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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
  total_amount: { fontWeight: "700", fontSize: 15, color: "#000" },
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
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: -4,
    marginBottom: -8,
  },
  detailsWrap: { marginTop: 8 },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailTitle: { fontSize: 14, color: "#111827", fontWeight: "600" },
  detailSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  chips: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  chip: { backgroundColor: "#EEF7EE" },
  detailAmount: {
    fontWeight: "700",
    fontSize: 14,
    color: "#000",
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "#7E57C2",
  },
});
