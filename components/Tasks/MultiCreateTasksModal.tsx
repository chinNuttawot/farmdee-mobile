// components/MilesBenefitModal.tsx
import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Card,
  Divider,
  Button,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import {
  fetchMilesBenefit,
  MilesBenefitResponse,
  MilesTier,
} from "@/service/milesBenefitService";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default function MilesBenefitModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const [data, setData] = useState<MilesBenefitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchMilesBenefit();
        if (!ignore) setData(res);
      } catch (e: any) {
        if (!ignore) setErr(e?.message ?? "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (visible) load();
    return () => {
      ignore = true;
    };
  }, [visible]);

  const title = useMemo(() => data?.title ?? "เกณฑ์การใช้ไมล์", [data]);

  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <View style={{ flex: 1 }}>
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={{ marginTop: 8 }}>กำลังโหลดข้อมูล...</Text>
              </View>
            )}

            {!!err && !loading && (
              <View style={styles.center}>
                <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
                  {err}
                </Text>
                <Button
                  mode="contained"
                  onPress={() => {
                    setData(null);
                    setErr(null);
                    setLoading(true);
                    fetchMilesBenefit()
                      .then(setData)
                      .catch((e) => setErr(e?.message ?? "โหลดข้อมูลไม่ได้"))
                      .finally(() => setLoading(false));
                  }}
                >
                  ลองใหม่
                </Button>
              </View>
            )}

            {data && !loading && !err && (
              <>
                <Card style={styles.card}>
                  <Card.Title
                    title="เกณฑ์การใช้ไมล์สำหรับการเที่ยวเดียว"
                    titleVariant="titleMedium"
                  />
                  <Card.Content>
                    {(data.oneWay ?? []).filter(Boolean).map((t, idx) => (
                      <MilesRow key={`ow-${idx}`} tier={t as MilesTier} />
                    ))}
                  </Card.Content>
                </Card>

                <Card style={styles.card}>
                  <Card.Title
                    title="เกณฑ์การใช้ไมล์สำหรับการไป-กลับ"
                    titleVariant="titleMedium"
                  />
                  <Card.Content>
                    {(data.roundTrip ?? []).filter(Boolean).map((t, idx) => (
                      <MilesRow key={`rt-${idx}`} tier={t as MilesTier} />
                    ))}
                  </Card.Content>
                </Card>

                {data.notes?.length ? (
                  <View style={{ marginTop: 4 }}>
                    {data.notes.map((n, i) => (
                      <Text key={i} style={styles.note}>
                        *{n}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </>
            )}

            <Button
              mode="contained"
              onPress={onDismiss}
              style={styles.closeBtn}
              contentStyle={{ paddingVertical: 6 }}
            >
              ปิด
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

function MilesRow({ tier }: { tier?: MilesTier }) {
  if (!tier) return null; // กัน null/undefined
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>
        {formatRange(tier.min, tier.max)}: ไมล์ละ {formatTHB(tier.priceTHB)} บาท
      </Text>
      <Divider style={styles.divider} />
    </View>
  );
}

function formatRange(min: number, max: number) {
  const fmt = (n: number) => n.toLocaleString("th-TH");
  return `${fmt(min)} - ${fmt(max)} miles`;
}
function formatTHB(n: number) {
  return n.toLocaleString("th-TH");
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    maxHeight: "100%",
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    overflow: "hidden",
  },
  row: { marginVertical: 4 },
  rowText: {
    fontSize: 14,
  },
  divider: { marginTop: 6 },
  note: {
    fontSize: 12,
    color: "gray",
    marginTop: 2,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 12,
    borderRadius: 8,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
});
