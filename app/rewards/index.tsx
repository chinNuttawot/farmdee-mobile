// app/(tabs)/rewards.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, FlatList, ListRenderItemInfo } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
  Avatar,
  Chip,
  FAB,
  Snackbar,
} from "react-native-paper";
import Header from "../../components/Header";

type Txn = {
  id: string;
  points: number; // + ได้รับ / - แลกใช้
  reason: string;
  createdAt: string; // YYYY-MM-DD
};
type Filter = "all" | "earn" | "redeem";

export default function Rewards() {
  const theme = useTheme();

  // data
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(false);

  // ui
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [redeem, setRedeem] = useState("0");
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const load = async () => {
    setLoading(true);
    // mock
    setRows([
      {
        id: "1",
        points: +120,
        reason: "แต้มจากใบแจ้งหนี้ #20250819",
        createdAt: "2025-08-19",
      },
      {
        id: "2",
        points: -50,
        reason: "แลกส่วนลดค่าสินค้า",
        createdAt: "2025-08-18",
      },
      {
        id: "3",
        points: +80,
        reason: "แต้มจากใบแจ้งหนี้ #20250817",
        createdAt: "2025-08-17",
      },
    ]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  // computed
  const total = useMemo(
    () => rows.reduce((s, r) => s + (r.points || 0), 0),
    [rows]
  );
  const list = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "earn") return rows.filter((r) => r.points > 0);
    return rows.filter((r) => r.points < 0);
  }, [rows, filter]);

  // Tier / progress
  const tier = useMemo(() => {
    if (total >= 2000)
      return { name: "Gold", color: "#D4AF37", nextAt: 999999 };
    if (total >= 1000)
      return { name: "Silver", color: "#9E9E9E", nextAt: 2000 };
    return { name: "Bronze", color: "#8D6E63", nextAt: 1000 };
  }, [total]);
  const progress = Math.min(
    1,
    tier.nextAt === 999999 ? 1 : total / tier.nextAt
  );

  // actions
  const doRedeem = async () => {
    const value = Number((redeem || "0").replace(/[^\d]/g, "")) || 0;
    if (value <= 0)
      return setSnack({ visible: true, msg: "กรุณากรอกจำนวนแต้มที่มากกว่า 0" });
    if (value > total)
      return setSnack({ visible: true, msg: "แต้มไม่พอสำหรับการแลก" });

    const tx: Txn = {
      id: String(Date.now()),
      points: -value,
      reason: `แลกแต้ม ${value.toLocaleString()} แต้ม`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setRows((p) => [tx, ...p]);
    setOpen(false);
    setRedeem("0");
    setSnack({ visible: true, msg: "แลกแต้มสำเร็จ" });
  };

  const renderItem = ({ item }: ListRenderItemInfo<Txn>) => {
    const positive = item.points > 0;
    const icon = positive ? "plus-circle" : "ticket-percent";
    const color = positive ? "#2E7D32" : "#C62828";
    return (
      <Card style={styles.card} elevation={2}>
        <Card.Title
          title={`${positive ? "+" : ""}${item.points.toLocaleString()} แต้ม`}
          titleStyle={{ color, fontWeight: "800" }}
          subtitle={`${item.reason} • ${item.createdAt}`}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={icon}
              color="white"
              style={{ backgroundColor: color }}
            />
          )}
          right={() => (
            <Chip
              style={{ backgroundColor: `${color}15`, marginRight: 16 }}
              textStyle={{ color }}
            >
              {positive ? "ได้รับ" : "แลกใช้"}
            </Chip>
          )}
        />
      </Card>
    );
  };

  return (
    <>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />} // ระยะห่างระหว่างการ์ด
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Card style={styles.summary} elevation={2}>
              <Card.Content style={{ gap: 12 }}>
                <Text variant="labelLarge" style={{ opacity: 0.7 }}>
                  แต้มคงเหลือ
                </Text>
                <Text variant="headlineLarge" style={styles.bold}>
                  {total.toLocaleString()} แต้ม
                </Text>

                <View style={[styles.rowBetween, { marginTop: 6 }]}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Avatar.Icon
                      size={28}
                      icon="star-circle"
                      color="white"
                      style={{ backgroundColor: tier.color }}
                    />
                    <Text style={{ fontWeight: "700" }}>ระดับ {tier.name}</Text>
                  </View>
                  <Text style={{ opacity: 0.7 }}>
                    {tier.nextAt === 999999
                      ? "ระดับสูงสุดแล้ว"
                      : `${Math.max(
                          0,
                          tier.nextAt - total
                        ).toLocaleString()} แต้มถึงระดับถัดไป`}
                  </Text>
                </View>

                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: tier.color,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.rowBetween, { marginTop: 6, gap: 8 }]}>
                  <View
                    style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                  >
                    <Chip
                      selected={filter === "all"}
                      onPress={() => setFilter("all")}
                      icon="view-grid-outline"
                    >
                      ทั้งหมด
                    </Chip>
                    <Chip
                      selected={filter === "earn"}
                      onPress={() => setFilter("earn")}
                      icon="plus-circle-outline"
                    >
                      ได้รับ
                    </Chip>
                    <Chip
                      selected={filter === "redeem"}
                      onPress={() => setFilter("redeem")}
                      icon="ticket-percent-outline"
                    >
                      แลกใช้
                    </Chip>
                  </View>
                </View>
                <Text style={{ opacity: 0.6 }}>
                  {loading ? "กำลังโหลด..." : `พบ ${list.length} รายการ`}
                </Text>
              </Card.Content>
            </Card>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎁</Text>
            <Text style={{ opacity: 0.7, marginBottom: 12 }}>
              ยังไม่มีประวัติแต้ม
            </Text>
            <Button mode="contained" onPress={() => setOpen(true)}>
              แลกแต้ม
            </Button>
          </View>
        }
      />

      <FAB
        icon="ticket-percent"
        style={styles.fab}
        onPress={() => setOpen(true)}
      />

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ borderRadius: 12 }}
        >
          <Dialog.Title>แลกแต้ม</Dialog.Title>
          <Dialog.Content style={{ gap: 10 }}>
            <Text>
              แต้มคงเหลือ:{" "}
              <Text style={styles.bold}>{total.toLocaleString()}</Text>
            </Text>
            <TextInput
              mode="outlined"
              label="จำนวนแต้ม"
              value={redeem}
              onChangeText={(t) => setRedeem(t.replace(/[^\d]/g, ""))}
              keyboardType="numeric"
              left={<TextInput.Icon icon="ticket-percent-outline" />}
            />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {[100, 500, 1000].map((n) => (
                <Chip key={n} onPress={() => setRedeem(String(n))}>
                  {n.toLocaleString()}
                </Chip>
              ))}
            </View>
            <Text style={{ opacity: 0.7 }}>
              1 แต้ม ≈ ส่วนลด 1 บาท (ตัวอย่าง) — ปรับกติกาได้ภายหลัง
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>ยกเลิก</Button>
            <Button mode="contained" onPress={doRedeem}>
              ยืนยัน
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
  // spacing/visual
  headerBlock: { gap: 12, marginBottom: 8 },
  card: { borderRadius: 16, marginVertical: 4 }, // ระยะรอบการ์ด
  summary: { borderRadius: 16 },
  fab: { position: "absolute", right: 16, bottom: 24 },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bold: { fontWeight: "800" },

  track: {
    marginTop: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#00000014",
    overflow: "hidden",
    marginBottom: 8, // กันชนก่อน chips
  },
  fill: { height: "100%", borderRadius: 6 },
});
