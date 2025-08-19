// app/(tabs)/invoices.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
} from "react-native";
import {
  Button,
  Card,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
  Avatar,
  IconButton,
  Chip,
  FAB,
  Snackbar,
  HelperText,
} from "react-native-paper";
import Header from "../../components/Header";
import { makeInvoicePDF } from "../../lib/invoice";
import { money } from "../../lib/currency";
import * as Sharing from "expo-sharing";

type Invoice = {
  id: string;
  invoiceNo: number;
  clientName: string;
  subtotal: number;
  tax: number;
  total: number;
  pdfPath: string;
  createdAt: string;     // YYYY-MM-DD
  status: "unpaid" | "paid";
  points: number;
};

export default function Invoices() {
  const theme = useTheme();

  // ------- data -------
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // ------- form -------
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("ลูกค้าทดสอบ");
  const [amount, setAmount] = useState("1000"); // string for input
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const amtNum = useMemo(
    () => Number((amount || "0").replace(/[^\d.]/g, "")) || 0,
    [amount]
  );
  const tax = Math.round(amtNum * 0.07);
  const total = amtNum + tax;

  const load = async () => {
    setLoading(true);
    // TODO: โหลดจากฐานข้อมูลจริง
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!clientName.trim()) {
      setSnack({ visible: true, msg: "กรุณากรอกชื่อลูกค้า" });
      return;
    }
    if (amtNum <= 0) {
      setSnack({ visible: true, msg: "จำนวนเงินต้องมากกว่า 0" });
      return;
    }

    const invoiceNo = Date.now();
    const pdfPath = await makeInvoicePDF({
      invoiceNo,
      clientName: clientName.trim(),
      items: [{ label: "ค่าบริการ", amount: amtNum }],
      subtotal: amtNum,
      tax,
      total,
    });

    const inv: Invoice = {
      id: String(invoiceNo),
      invoiceNo,
      clientName: clientName.trim(),
      subtotal: amtNum,
      tax,
      total,
      pdfPath,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "unpaid",
      points: Math.floor(total / 100), // 1 แต้มต่อทุก ๆ 100 บาท
    };

    setRows((prev) => [inv, ...prev]);
    setOpen(false);
    setSnack({ visible: true, msg: "สร้างใบแจ้งหนี้เรียบร้อย" });
    // reset
    setClientName("ลูกค้าทดสอบ");
    setAmount("1000");
  };

  const togglePaid = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: r.status === "paid" ? "unpaid" : "paid" } : r))
    );
  };

  const openPdf = async (path: string) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: "application/pdf" });
    } else {
      setSnack({ visible: true, msg: `ไฟล์บันทึกที่: ${path}` });
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Invoice>) => (
    <Card style={styles.card} elevation={2}>
      <Card.Title
        title={`ใบแจ้งหนี้ #${item.invoiceNo}`}
        subtitle={`${item.clientName} • ${item.createdAt}`}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon="file-pdf-box"
            color="white"
            style={{ backgroundColor: theme.colors.primary }}
          />
        )}
        right={() => (
          <Text style={{ fontWeight: "800", marginRight: 12 }}>
            {money(item.total)}
          </Text>
        )}
      />
      <Card.Content style={{ gap: 6 }}>
        <View style={styles.row}>
          <Text>ยอดก่อนภาษี:</Text>
          <Text style={styles.bold}>{money(item.subtotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text>ภาษี 7%:</Text>
          <Text style={styles.bold}>{money(item.tax)}</Text>
        </View>
        <View style={styles.row}>
          <Text>แต้มสะสม:</Text>
          <Text style={styles.bold}>{item.points} แต้ม</Text>
        </View>

        <View style={[styles.row, { marginTop: 6 }]}>
          <Chip
            icon={item.status === "paid" ? "check-circle" : "clock-outline"}
            style={{
              backgroundColor:
                item.status === "paid" ? "#2E7D3215" : "#E6510015",
            }}
            textStyle={{
              color: item.status === "paid" ? "#2E7D32" : "#E65100",
              fontWeight: "700",
            }}
          >
            {item.status === "paid" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
          </Chip>

          <View style={{ flexDirection: "row" }}>
            <IconButton icon="share-variant" onPress={() => openPdf(item.pdfPath)} />
            <IconButton
              icon={item.status === "paid" ? "refresh" : "check"}
              onPress={() => togglePaid(item.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Header title="ใบแจ้งหนี้ / ใบเสร็จ (PDF)" />

      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🧾</Text>
            <Text style={{ opacity: 0.7, marginBottom: 12 }}>
              ยังไม่มีใบแจ้งหนี้
            </Text>
            <Button mode="contained" onPress={() => setOpen(true)}>
              + ออกใบแจ้งหนี้
            </Button>
          </View>
        }
      />

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => setOpen(true)} />

      {/* Dialog: create invoice */}
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={{ borderRadius: 12 }}>
          <Dialog.Title>ออกใบแจ้งหนี้</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <TextInput
              mode="outlined"
              label="ชื่อลูกค้า"
              value={clientName}
              onChangeText={setClientName}
              left={<TextInput.Icon icon="account-outline" />}
            />
            <HelperText type="error" visible={!clientName.trim()}>
              * จำเป็นต้องกรอกชื่อลูกค้า
            </HelperText>

            <TextInput
              mode="outlined"
              label="จำนวนเงิน (ก่อน VAT)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="฿" />}
            />

            {/* live summary */}
            <View style={styles.breakdown}>
              <View style={styles.row}>
                <Text>ยอดก่อนภาษี</Text>
                <Text style={styles.bold}>{money(amtNum)}</Text>
              </View>
              <View style={styles.row}>
                <Text>ภาษี (7%)</Text>
                <Text style={styles.bold}>{money(tax)}</Text>
              </View>
              <View style={styles.row}>
                <Text>ยอดสุทธิ</Text>
                <Text style={[styles.bold, { color: theme.colors.primary }]}>
                  {money(total)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text>แต้มสะสม (≈ 1/฿100)</Text>
                <Text style={styles.bold}>{Math.floor(total / 100)} แต้ม</Text>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>ยกเลิก</Button>
            <Button mode="contained" onPress={add}>
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

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
  fab: { position: "absolute", right: 16, bottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdown: {
    marginTop: 6,
    paddingVertical: 8,
    gap: 6,
  },
  bold: { fontWeight: "800" },
});
