// app/(tabs)/emp-announcement.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import {
  Card,
  Text,
  ActivityIndicator,
  Button,
  Snackbar,
} from "react-native-paper";
import Header from "../../components/Header";
import { empAnnouncementsService } from "@/service";

type Announcement = {
  id: string;
  content: string;
  is_active: boolean;
  sort_order: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export default function EmpAnnouncement() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // เรียก API: active = true
      const { data } = await empAnnouncementsService({ active: true });

      // ป้องกัน null/undefined และ sort ตาม sort_order (น้อยไปมาก)
      const list: Announcement[] = (data?.items ?? [])
        .slice()
        .sort(
          (a: Announcement, b: Announcement) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const countLabel = useMemo(() => {
    const n = items.length;
    if (n <= 0) return "ยังไม่มีประกาศ";
    return `รวม ${n} ข้อ`;
  }, [items.length]);

  return (
    <>
      <Header
        title="ระเบียบการอยู่ร่วมกัน"
        backgroundColor="#2E7D32"
        color="white"
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator animating />
          <Text style={{ marginTop: 8 }}>กำลังโหลด...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
            />
          }
        >
          <Card style={s.card} mode="elevated">
            <Card.Content>
              <View style={s.headerRow}>
                <Text style={s.sectionTitle}>ข้อปฏิบัติ / ประกาศ</Text>
                <Text style={s.countText}>{countLabel}</Text>
              </View>

              {items.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Text style={{ opacity: 0.7 }}>ยังไม่มีประกาศที่ใช้งาน</Text>
                  <Button
                    mode="text"
                    onPress={() => fetchData()}
                    style={{ marginTop: 6 }}
                  >
                    โหลดอีกครั้ง
                  </Button>
                </View>
              ) : (
                items.map((it, i) => (
                  <Text key={it.id ?? i} style={s.rule}>
                    {i + 1}. {it.content}
                  </Text>
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4500}
        action={{
          label: "ลองใหม่",
          onPress: () => fetchData(),
        }}
      >
        {error}
      </Snackbar>
    </>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  rule: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 20,
    color: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  countText: {
    fontSize: 13,
    opacity: 0.6,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 20,
  },
});
