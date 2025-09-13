// app/(tabs)/reportsMonthly.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Card, Text, Menu, Button, Divider } from "react-native-paper";
import { ChevronDown } from "lucide-react-native"; // ใช้แค่กับปุ่มปี

type Item = { label: string; value: number; color?: string };
type MonthBlock = {
  monthLabel: string;
  incomeItems: Item[];
  expenseItems: Item[];
};

const DATA: MonthBlock[] = [
  {
    monthLabel: "ก.ย. 2568",
    incomeItems: [
      { label: "ขายสินค้า A", value: 50000, color: "#2E7D32" },
      { label: "ขายสินค้า B", value: 30000, color: "#2E7D32" },
      { label: "บริการซ่อมบำรุง", value: 20000, color: "#2E7D32" },
    ],
    expenseItems: [
      { label: "ต้นทุนสินค้า", value: 25000, color: "#C62828" },
      { label: "ค่าแรงพนักงาน", value: 8000, color: "#C62828" },
      { label: "ค่าโฆษณาออนไลน์", value: 56000, color: "#C62828" },
    ],
  },
  {
    monthLabel: "ต.ค. 2568",
    incomeItems: [
      { label: "ขายสินค้า C", value: 32000, color: "#2E7D32" },
      { label: "บริการ A/S", value: 20000, color: "#2E7D32" },
    ],
    expenseItems: [
      { label: "ค่าเช่า", value: 20000, color: "#C62828" },
      { label: "ค่าดำเนินงาน", value: 18000, color: "#C62828" },
    ],
  },
  {
    monthLabel: "พ.ย. 2568",
    incomeItems: [
      { label: "ขายสินค้า D", value: 17000, color: "#2E7D32" },
      { label: "ขายสินค้า E", value: 30000, color: "#2E7D32" },
    ],
    expenseItems: [
      { label: "ต้นทุนสินค้า", value: 25000, color: "#C62828" },
      { label: "ค่าน้ำ/ไฟ", value: 13000, color: "#C62828" },
    ],
  },
];

const thMoney = (n: number) => "฿" + n.toLocaleString("th-TH");

function Pill({
  text,
  bg = "#E8F5E9",
  color = "#2E7D32",
  bold = false,
}: {
  text: string;
  bg?: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={{ color, fontWeight: bold ? "800" : "700", fontSize: 13 }}>
        {text}
      </Text>
    </View>
  );
}

function Dot({ color = "#2E7D32" }: { color?: string }) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        marginRight: 8,
        marginTop: 6,
      }}
    />
  );
}

export default function ReportsMonthlyScreen() {
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [year, setYear] = useState("2568");
  const [openYearMenu, setOpenYearMenu] = useState(false);

  // เปิด/ปิดรายละเอียดบล็อกบนสุด
  const [openMainDetails, setOpenMainDetails] = useState(true);
  // เปิด/ปิดคอลัมน์ย่อย
  const [openIncome, setOpenIncome] = useState(true);
  const [openExpense, setOpenExpense] = useState(true);
  // เปิด/ปิดการ์ดเล็กแต่ละเดือน
  const [openMonth, setOpenMonth] = useState<Record<number, boolean>>({});

  // NEW: state สำหรับสถานะ "เปิดทั้งหมด"
  const [allOpen, setAllOpen] = useState(true); // true = เปิดทั้งหมด, false = ปิดทั้งหมด

  const selected = useMemo(() => DATA[0], []);
  const incomeTotal = useMemo(
    () => selected.incomeItems.reduce((s, i) => s + i.value, 0),
    [selected]
  );
  const expenseTotal = useMemo(
    () => selected.expenseItems.reduce((s, i) => s + i.value, 0),
    [selected]
  );
  const profit = incomeTotal - expenseTotal;

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  // NEW: ฟังก์ชันเปิด/ปิดทั้งหมดในครั้งเดียว
  const setOpenAll = (open: boolean) => {
    animate();
    setAllOpen(open);
    setOpenMainDetails(open);
    setOpenIncome(open);
    setOpenExpense(open);
    // ตั้งค่าสำหรับการ์ดเล็กทุกใบ
    const allMonths: Record<number, boolean> = {};
    DATA.slice(1).forEach((_, idx) => {
      allMonths[idx + 1] = open;
    });
    setOpenMonth(allMonths);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F4F8F4" }}>
      {/* Top green header */}
      <View style={styles.headerTop} />

      {/* Year selector + Toggle All */}
      <View style={{ marginTop: -26, paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={styles.yearRow}>
          <Menu
            visible={openYearMenu}
            onDismiss={() => setOpenYearMenu(false)}
            anchor={
              <Button
                mode="contained-tonal"
                onPress={() => setOpenYearMenu(true)}
                style={styles.yearButton}
                contentStyle={{ justifyContent: "space-between" }}
              >
                <Text style={styles.yearText}>{year}</Text>
                <ChevronDown size={18} color="#111" />
              </Button>
            }
          >
            {["2568", "2567", "2566"].map((y) => (
              <Menu.Item
                key={y}
                onPress={() => {
                  setYear(y);
                  setOpenYearMenu(false);
                }}
                title={y}
              />
            ))}
          </Menu>

          {/* NEW: ปุ่มเปิด/ปิดทั้งหมด */}
          <TouchableOpacity
            onPress={() => setOpenAll(!allOpen)}
            activeOpacity={0.8}
            style={styles.toggleAllBtn}
          >
            <Text style={styles.toggleAllText}>
              {allOpen ? "ซ่อนทั้งหมด" : "แสดงทั้งหมด"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main big card */}
      <Card style={[styles.card, styles.shadow]}>
        <Card.Content>
          {/* top row */}
          <View style={styles.cardTopRow}>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Pill text={selected.monthLabel} />
              {/* แตะเพื่อพับ/ขยายทั้งบล็อก */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  animate();
                  const nv = !openMainDetails;
                  setOpenMainDetails(nv);
                  // sync allOpen ถ้าปิดรายละเอียดหลักให้เป็น false (ถือว่าไม่ได้เปิดทั้งหมด)
                  if (!nv) setAllOpen(false);
                }}
              >
                <Pill
                  text={`${selected.incomeItems.length} รายการรับ • ${selected.expenseItems.length} รายการจ่าย`}
                  bg="#E8F0FE"
                  color="#1E40AF"
                  bold
                />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.totalRight}>
                รายรับ {thMoney(incomeTotal)}
              </Text>
              <Text style={styles.subRight}>
                รายจ่าย {thMoney(expenseTotal)}
              </Text>
            </View>
          </View>

          {/* details block */}
          {openMainDetails && (
            <>
              <View style={styles.columnsWrap}>
                {/* INCOME */}
                <View style={styles.columnBox}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      animate();
                      const nv = !openIncome;
                      setOpenIncome(nv);
                      if (!nv) setAllOpen(false);
                    }}
                    style={styles.columnHeader}
                  >
                    <Text style={styles.columnTitle}>รายรับ</Text>
                    <Text style={styles.headerCount}>
                      {selected.incomeItems.length} รายการ
                    </Text>
                  </TouchableOpacity>

                  {openIncome && (
                    <>
                      {selected.incomeItems.map((it, idx) => (
                        <View key={idx} style={styles.line}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "flex-start",
                              flex: 1,
                            }}
                          >
                            <Dot color={it.color} />
                            <Text style={styles.lineLabel}>{it.label}</Text>
                          </View>
                          <Text style={styles.lineValue}>
                            {thMoney(it.value)}
                          </Text>
                        </View>
                      ))}
                      <Divider style={{ marginVertical: 6 }} />
                    </>
                  )}

                  <View style={styles.line}>
                    <Text style={[styles.lineLabel, { opacity: 0.7 }]}>
                      รวมรายรับ
                    </Text>
                    <Text style={[styles.lineValue, { fontWeight: "800" }]}>
                      {thMoney(incomeTotal)}
                    </Text>
                  </View>
                </View>

                {/* EXPENSE */}
                <View style={styles.columnBox}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      animate();
                      const nv = !openExpense;
                      setOpenExpense(nv);
                      if (!nv) setAllOpen(false);
                    }}
                    style={styles.columnHeader}
                  >
                    <Text style={styles.columnTitle}>รายจ่าย</Text>
                    <Text style={styles.headerCount}>
                      {selected.expenseItems.length} รายการ
                    </Text>
                  </TouchableOpacity>

                  {openExpense && (
                    <>
                      {selected.expenseItems.map((it, idx) => (
                        <View key={idx} style={styles.line}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "flex-start",
                              flex: 1,
                            }}
                          >
                            <Dot color={it.color} />
                            <Text style={styles.lineLabel}>{it.label}</Text>
                          </View>
                          <Text style={styles.lineValue}>
                            {thMoney(it.value)}
                          </Text>
                        </View>
                      ))}
                      <Divider style={{ marginVertical: 6 }} />
                    </>
                  )}

                  <View style={styles.line}>
                    <Text style={[styles.lineLabel, { opacity: 0.7 }]}>
                      รวมรายจ่าย
                    </Text>
                    <Text style={[styles.lineValue, { fontWeight: "800" }]}>
                      {thMoney(expenseTotal)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.profitBar}>
                <Text style={styles.profitLeft}>
                  กำไรสุทธิ เดือน {selected.monthLabel}
                </Text>
                <Text style={styles.profitRight}>{thMoney(profit)}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* การ์ดเล็ก (แตะหัวเพื่อพับ/ขยาย) */}
      {DATA.slice(1).map((m, idx) => {
        const i = idx + 1;
        const income = m.incomeItems.reduce((s, it) => s + it.value, 0);
        const expense = m.expenseItems.reduce((s, it) => s + it.value, 0);
        const opened = !!openMonth[i];

        return (
          <Card key={i} style={[styles.compactCard, styles.shadow]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                animate();
                const nv = !opened;
                setOpenMonth((prev) => ({ ...prev, [i]: nv }));
                if (!nv) setAllOpen(false);
              }}
            >
              <Card.Content>
                <View style={styles.compactRow}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      flex: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Pill text={m.monthLabel} />
                    <Pill
                      text={`${m.incomeItems.length} รายการรับ • ${m.expenseItems.length} รายการจ่าย`}
                      bg="#E8F0FE"
                      color="#1E40AF"
                      bold
                    />
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.totalRight}>
                      รายรับ {thMoney(income)}
                    </Text>
                    <Text style={styles.subRight}>
                      รายจ่าย {thMoney(expense)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </TouchableOpacity>

            {opened && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                <View style={[styles.columnsWrap, { marginTop: 0 }]}>
                  <View style={styles.columnBoxMini}>
                    <Text style={styles.columnTitle}>รายรับ</Text>
                    {m.incomeItems.map((it, k) => (
                      <View key={k} style={styles.line}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            flex: 1,
                          }}
                        >
                          <Dot color={it.color} />
                          <Text style={styles.lineLabel}>{it.label}</Text>
                        </View>
                        <Text style={styles.lineValue}>
                          {thMoney(it.value)}
                        </Text>
                      </View>
                    ))}
                    <Divider style={{ marginVertical: 6 }} />
                    <View style={styles.line}>
                      <Text style={[styles.lineLabel, { opacity: 0.7 }]}>
                        รวมรายรับ
                      </Text>
                      <Text style={[styles.lineValue, { fontWeight: "800" }]}>
                        {thMoney(income)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.columnBoxMini}>
                    <Text style={styles.columnTitle}>รายจ่าย</Text>
                    {m.expenseItems.map((it, k) => (
                      <View key={k} style={styles.line}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            flex: 1,
                          }}
                        >
                          <Dot color={it.color} />
                          <Text style={styles.lineLabel}>{it.label}</Text>
                        </View>
                        <Text style={styles.lineValue}>
                          {thMoney(it.value)}
                        </Text>
                      </View>
                    ))}
                    <Divider style={{ marginVertical: 6 }} />
                    <View style={styles.line}>
                      <Text style={[styles.lineLabel, { opacity: 0.7 }]}>
                        รวมรายจ่าย
                      </Text>
                      <Text style={[styles.lineValue, { fontWeight: "800" }]}>
                        {thMoney(expense)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Card>
        );
      })}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    backgroundColor: "#3E9B4F",
    paddingTop: 24,
    paddingBottom: 40,
  },

  yearRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between", // NEW: ให้ปุ่มไปชิดขวา
  },
  yearButton: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    width: 130,
    height: 40,
  },
  yearText: { fontWeight: "800", fontSize: 18, color: "#111" },

  // NEW: ปุ่มเปิด/ปิดทั้งหมด
  toggleAllBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#E6F0E8",
    justifyContent: "center",
  },
  toggleAllText: { fontWeight: "800", color: "#166534", fontSize: 14 },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  compactCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  totalRight: { fontWeight: "800", fontSize: 16, color: "#111" },
  subRight: { marginTop: 2, color: "#6B7280", fontSize: 12 },

  columnsWrap: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  columnBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  columnBoxMini: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },

  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerCount: { color: "#6B7280", fontSize: 12 },

  columnTitle: { fontWeight: "800", color: "#111" },

  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  lineLabel: { fontSize: 13, color: "#111" },
  lineValue: { fontSize: 13, fontWeight: "700", color: "#111" },

  profitBar: {
    marginTop: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDEDDC",
  },
  profitLeft: { fontWeight: "800", color: "#111" },
  profitRight: { fontWeight: "800", color: "#2E7D32" },

  compactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});
