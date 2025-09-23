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
  ActivityIndicator,
} from "react-native";
import {
  Card,
  Text,
  Menu,
  Button,
  Divider,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { ChevronDown } from "lucide-react-native";
import { byMonthlyService } from "@/service";
import { PRIMARY } from "../_layout";

/** ========= Types ========= */
type Item = { label: string; value: number; color?: string };
type Block = {
  month: string;
  monthLabel: string;
  incomeTotal: number;
  expenseTotal: number;
  incomeCount: number;
  expenseCount: number;
  incomeItems: Item[];
  expenseItems: Item[];
};
type ApiRes = {
  ok: boolean;
  message: string;
  data: { year: number; months: number; blocks: Block[] };
};

/** ========= Helpers ========= */
const money = (n: number) => "฿" + (Number(n) || 0).toLocaleString("th-TH");
const now = new Date();
const AD2BE = (y: number) => y + 543;
const BE2AD = (y: number) => y - 543;

const NumText = ({
  children,
  color = "#111827",
  size = 16,
  weight = "800",
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  weight?: "700" | "800" | "900" | "normal";
}) => (
  <Text
    style={{
      color,
      fontSize: size,
      fontWeight: weight,
      fontVariant: ["tabular-nums"],
    }}
  >
    {children}
  </Text>
);

function Chip({
  text,
  bg = "#EEF7F0",
  color = "#14532D",
  bold = true,
}: {
  text: string;
  bg?: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={{ color, fontWeight: bold ? "800" : "600", fontSize: 13 }}>
        {text}
      </Text>
    </View>
  );
}

function StatBox({
  title,
  value,
  count,
  variant = "income",
}: {
  title: string;
  value: string;
  count: number;
  variant?: "income" | "expense";
}) {
  const color = variant === "income" ? "#166534" : "#B91C1C";
  const tone = variant === "income" ? "#EAF6EE" : "#FDECEC";
  const border = variant === "income" ? "#D6E7DB" : "#F5D2D2";
  return (
    <View
      style={[styles.statBox, { backgroundColor: tone, borderColor: border }]}
    >
      <Text style={styles.statTitle}>{title}</Text>
      <NumText color={color} size={18}>
        {value}
      </NumText>
      <View style={{ height: 6 }} />
      <Chip text={`${count} รายการ`} bg="#E8F0FE" color="#1E40AF" />
    </View>
  );
}

function Bullet({ color = "#16A34A" }: { color?: string }) {
  return (
    <View
      style={{
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: color,
        marginRight: 10,
        marginTop: 5,
      }}
    />
  );
}

/** ========= Screen ========= */
export default function ReportsMonthlyScreen() {
  const theme = useTheme();

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // UI
  const [yearBE, setYearBE] = useState(String(AD2BE(now.getFullYear())));
  const [openYearMenu, setOpenYearMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // Data
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Expand (ค่าเริ่มต้น = ปิด)
  const [openMain, setOpenMain] = useState(true);
  const [openMonth, setOpenMonth] = useState<Record<number, boolean>>({});
  const [allOpen, setAllOpen] = useState(false);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const setOpenAll = (open: boolean) => {
    animate();
    setAllOpen(open);
    setOpenMain(open);
    const map: Record<number, boolean> = {};
    blocks.forEach((_, idx) => {
      if (idx !== selectedIndex) map[idx] = open;
    });
    setOpenMonth(map);
  };

  /** Fetch */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = (await byMonthlyService({
        year: BE2AD(parseInt(yearBE, 10)),
        months: 12,
      })) as ApiRes;

      const list = res?.data?.blocks ?? [];

      // เลือกเดือนล่าสุดที่มีข้อมูล
      let idx = list.length - 1;
      for (let i = list.length - 1; i >= 0; i--) {
        if ((list[i].incomeTotal ?? 0) > 0 || (list[i].expenseTotal ?? 0) > 0) {
          idx = i;
          break;
        }
      }
      setBlocks(list);
      setSelectedIndex(Math.max(0, idx));

      // reset toggle => ปิดทั้งหมดเป็นค่าเริ่มต้น
      setAllOpen(false);
      setOpenMain(true);
      const map: Record<number, boolean> = {};
      list.forEach((_, i) => {
        if (i !== idx) map[i] = false;
      });
      setOpenMonth(map);
    } catch (e: any) {
      console.error(e);
      setSnack({
        visible: true,
        msg: "โหลดรายเดือนล้มเหลว: " + (e?.message ?? "unknown"),
      });
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearBE]);

  // Derived
  const selected = blocks[selectedIndex];
  const incomeTotal = selected?.incomeTotal ?? 0;
  const expenseTotal = selected?.expenseTotal ?? 0;
  const profit = incomeTotal - expenseTotal;

  const yearOptionsBE = useMemo(() => {
    const y = AD2BE(now.getFullYear());
    return [y, y - 1, y - 2, y + 1].map(String);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F6FAF7" }}>
      {/* Header */}
      <View style={styles.headerBand} />

      {/* Controls */}
      <View style={styles.controls}>
        <Menu
          visible={openYearMenu}
          onDismiss={() => setOpenYearMenu(false)}
          anchor={
            <Button
              mode="contained"
              onPress={() => setOpenYearMenu(true)}
              style={styles.yearBtn}
              contentStyle={{ justifyContent: "space-between" }}
            >
              <View style={styles.yearBtnInner}>
                <Text style={styles.yearText}>{yearBE}</Text>
                <ChevronDown size={18} color="#0B3A1F" />
              </View>
            </Button>
          }
        >
          {yearOptionsBE.map((y) => (
            <Menu.Item
              key={y}
              onPress={() => {
                setYearBE(y);
                setOpenYearMenu(false);
              }}
              title={y}
            />
          ))}
        </Menu>

        <TouchableOpacity
          onPress={() => setOpenAll(!allOpen)}
          activeOpacity={0.9}
          style={styles.toggleAll}
          disabled={!blocks.length}
        >
          <Text style={styles.toggleAllText}>
            {allOpen ? "ซ่อนทั้งหมด" : "แสดงทั้งหมด"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ paddingVertical: 18 }}>
          <ActivityIndicator />
        </View>
      )}

      {/* Empty */}
      {!loading && blocks.length === 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Card style={[styles.card, styles.shadow]}>
            <Card.Content>
              <Text style={{ opacity: 0.6 }}>ไม่พบข้อมูลปี {yearBE}</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* ===== Main card (focus month) ===== */}
      {!!selected && (
        <View style={{ paddingHorizontal: 16 }}>
          <Card style={[styles.card, styles.shadow]}>
            <Card.Content>
              {/* Header row */}
              <View style={styles.rowBetween}>
                <View style={styles.leftHeader}>
                  <Chip text={selected.monthLabel} />
                  <Chip
                    text={`${selected.incomeCount} รายการรับ • ${selected.expenseCount} รายการจ่าย`}
                    bg="#E8F0FE"
                    color="#1E40AF"
                  />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.gray12}>รายรับ</Text>
                  <NumText>{money(incomeTotal)}</NumText>
                  <Text style={[styles.gray12, { marginTop: 6 }]}>รายจ่าย</Text>
                  <NumText color="#B91C1C">{money(expenseTotal)}</NumText>
                </View>
              </View>

              {/* Toggle details */}
              <TouchableOpacity
                onPress={() => {
                  animate();
                  const nv = !openMain;
                  setOpenMain(nv);
                  if (!nv) setAllOpen(false);
                }}
                activeOpacity={0.8}
                style={styles.showHideBtn}
              >
                <Text style={styles.showHideText}>
                  {openMain ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                </Text>
              </TouchableOpacity>

              {/* Details */}
              {openMain && (
                <>
                  {/* Stat boxes */}
                  <View style={styles.statRow}>
                    <StatBox
                      title="รายรับ"
                      value={money(incomeTotal)}
                      count={selected.incomeCount}
                      variant="income"
                    />
                    <StatBox
                      title="รายจ่าย"
                      value={money(expenseTotal)}
                      count={selected.expenseCount}
                      variant="expense"
                    />
                  </View>

                  {/* Two columns */}
                  <View style={styles.columns}>
                    {/* Income list */}
                    <View style={styles.listCard}>
                      <View style={styles.listHead}>
                        <Text style={styles.listTitle}>รายการรับ</Text>
                        <Text style={styles.listCount}>
                          {selected.incomeCount} รายการ
                        </Text>
                      </View>
                      <Divider />
                      {selected.incomeCount === 0 ? (
                        <Text style={styles.emptyText}>ไม่มีรายการ</Text>
                      ) : (
                        selected.incomeItems.map((it, idx) => (
                          <View key={idx} style={styles.rowItem}>
                            <View
                              style={{
                                flexDirection: "row",
                                flex: 1,
                                paddingRight: 8,
                              }}
                            >
                              <Bullet color={it.color ?? "#16A34A"} />
                              <Text style={styles.itemLabel}>{it.label}</Text>
                            </View>
                            <NumText size={15}>{money(it.value)}</NumText>
                          </View>
                        ))
                      )}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>รวมรายรับ</Text>
                        <NumText>{money(incomeTotal)}</NumText>
                      </View>
                    </View>

                    {/* Expense list */}
                    <View style={styles.listCard}>
                      <View style={styles.listHead}>
                        <Text style={styles.listTitle}>รายการจ่าย</Text>
                        <Text style={styles.listCount}>
                          {selected.expenseCount} รายการ
                        </Text>
                      </View>
                      <Divider />
                      {selected.expenseCount === 0 ? (
                        <Text style={styles.emptyText}>ไม่มีรายการ</Text>
                      ) : (
                        selected.expenseItems.map((it, idx) => (
                          <View key={idx} style={styles.rowItem}>
                            <View
                              style={{
                                flexDirection: "row",
                                flex: 1,
                                paddingRight: 8,
                              }}
                            >
                              <Bullet color={it.color ?? "#DC2626"} />
                              <Text style={styles.itemLabel}>{it.label}</Text>
                            </View>
                            <NumText size={15}>{money(it.value)}</NumText>
                          </View>
                        ))
                      )}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>รวมรายจ่าย</Text>
                        <NumText>{money(expenseTotal)}</NumText>
                      </View>
                    </View>
                  </View>

                  {/* Profit bar */}
                  <View style={styles.profitBar}>
                    <Text style={styles.profitLeft}>
                      กำไรสุทธิ เดือน {selected.monthLabel}
                    </Text>
                    <NumText color={profit >= 0 ? "#166534" : "#B91C1C"}>
                      {money(profit)}
                    </NumText>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      )}

      {/* ===== Other months (compact) ===== */}
      {blocks.map((b, idx) => {
        if (idx === selectedIndex) return null;
        const opened = !!openMonth[idx];

        return (
          <View key={idx} style={{ paddingHorizontal: 16 }}>
            <Card style={[styles.compactCard, styles.shadow]}>
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                activeOpacity={0.9}
                onPress={() => {
                  animate();
                  const nv = !opened;
                  setOpenMonth((p) => ({ ...p, [idx]: nv }));
                  if (!nv) setAllOpen(false);
                }}
              >
                <Card.Content>
                  <View style={styles.rowBetween}>
                    <View style={styles.leftHeader}>
                      <Chip text={b.monthLabel} />
                      <Chip
                        text={`${b.incomeCount} รับ • ${b.expenseCount} จ่าย`}
                        bg="#E8F0FE"
                        color="#1E40AF"
                      />
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.gray12}>รายรับ</Text>
                      <NumText>{money(b.incomeTotal)}</NumText>
                      <Text style={[styles.gray12, { marginTop: 6 }]}>
                        รายจ่าย
                      </Text>
                      <NumText color="#B91C1C">{money(b.expenseTotal)}</NumText>
                    </View>
                  </View>
                </Card.Content>
              </TouchableOpacity>

              {opened && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  <View style={[styles.statRow, { marginTop: 0 }]}>
                    <StatBox
                      title="รายรับ"
                      value={money(b.incomeTotal)}
                      count={b.incomeCount}
                      variant="income"
                    />
                    <StatBox
                      title="รายจ่าย"
                      value={money(b.expenseTotal)}
                      count={b.expenseCount}
                      variant="expense"
                    />
                  </View>

                  <View style={[styles.columns, { marginTop: 6 }]}>
                    <View style={styles.listCardMini}>
                      <Text style={styles.listTitle}>รายการรับ</Text>
                      <Divider />
                      {b.incomeCount === 0 ? (
                        <Text style={styles.emptyText}>ไม่มีรายการ</Text>
                      ) : (
                        b.incomeItems.map((it, k) => (
                          <View key={k} style={styles.rowItem}>
                            <View
                              style={{
                                flexDirection: "row",
                                flex: 1,
                                paddingRight: 8,
                              }}
                            >
                              <Bullet color={it.color ?? "#16A34A"} />
                              <Text style={styles.itemLabel}>{it.label}</Text>
                            </View>
                            <NumText size={15}>{money(it.value)}</NumText>
                          </View>
                        ))
                      )}
                    </View>

                    <View style={styles.listCardMini}>
                      <Text style={styles.listTitle}>รายการจ่าย</Text>
                      <Divider />
                      {b.expenseCount === 0 ? (
                        <Text style={styles.emptyText}>ไม่มีรายการ</Text>
                      ) : (
                        b.expenseItems.map((it, k) => (
                          <View key={k} style={styles.rowItem}>
                            <View
                              style={{
                                flexDirection: "row",
                                flex: 1,
                                paddingRight: 8,
                              }}
                            >
                              <Bullet color={it.color ?? "#DC2626"} />
                              <Text style={styles.itemLabel}>{it.label}</Text>
                            </View>
                            <NumText size={15}>{money(it.value)}</NumText>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </View>
              )}
            </Card>
          </View>
        );
      })}

      <View style={{ height: 22 }} />

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, msg: "" })}
        duration={2200}
      >
        {snack.msg}
      </Snackbar>
    </ScrollView>
  );
}

/** ========= Styles ========= */
const styles = StyleSheet.create({
  headerBand: {
    paddingBottom: 46,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 0.2,
  },

  controls: {
    marginTop: -28,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  yearBtn: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    width: 140,
    height: 42,
    elevation: 2,
  },
  yearBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  yearText: { fontWeight: "800", fontSize: 18, color: "#0B3A1F" },

  toggleAll: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#EAF4ED",
    justifyContent: "center",
  },
  toggleAllText: { fontWeight: "800", color: "#166534", fontSize: 14 },

  card: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },
  compactCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftHeader: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    flex: 1,
  },

  gray12: { color: "#6B7280", fontSize: 12 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  showHideBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  showHideText: { fontWeight: "700", color: "#374151", fontSize: 12.5 },

  /** Stat boxes */
  statRow: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 8 },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statTitle: { fontWeight: "800", color: "#111827", marginBottom: 4 },

  /** Lists */
  columns: { flexDirection: "row", gap: 12, marginTop: 8 },
  listCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  listHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  listTitle: { fontWeight: "900", color: "#111827", fontSize: 15 },
  listCount: { color: "#6B7280", fontSize: 12, fontWeight: "700" },

  listCardMini: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 10,
  },

  rowItem: {
    paddingVertical: 6,
    borderBottomColor: "#F1F5F9",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  itemLabel: { fontSize: 14, color: "#111827", lineHeight: 20, flexShrink: 1 },

  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: "#E5E7EB",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#374151" },

  /** Profit */
  profitBar: {
    marginTop: 12,
    backgroundColor: "#EEF7F0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDEDDC",
  },
  profitLeft: { fontWeight: "900", color: "#111827" },
});
