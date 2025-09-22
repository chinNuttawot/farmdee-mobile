// components/expenses/SummaryCard.tsx
import React from "react";
import { View } from "react-native";
import { Avatar, Card, Divider, Text } from "react-native-paper";
import { styles } from "@/styles/ui";
import { typeMeta } from "./typeMeta";

export default function SummaryCard({
  totalAll,
  totalLabor,
  totalMaterial,
  totalFuel,
  fmt,
}: {
  totalAll: number;
  totalLabor: number;
  totalMaterial: number;
  totalFuel: number;
  fmt: (n?: number | string) => string;
}) {
  return (
    <Card style={styles.summaryCard} elevation={0}>
      <Card.Content style={{ paddingVertical: 12 }}>
        <View style={styles.summaryHeader}>
          <Text style={{ fontWeight: "800", opacity: 0.8 }}>รวมทั้งหมด</Text>
          <View style={styles.amountPill}>
            <Text style={{ fontWeight: "900" }}>฿ {fmt(totalAll)}</Text>
          </View>
        </View>

        <View style={{ height: 8 }} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryLine}>
            <Avatar.Icon
              size={26}
              icon={typeMeta.labor.icon}
              style={{ backgroundColor: "#E8F5E9" }}
              color={typeMeta.labor.color}
            />
            <Text style={styles.summaryLabel}>ค่าแรง</Text>
          </View>
          <Text style={styles.summaryValue}>{fmt(totalLabor)}</Text>
        </View>
        <Divider />
        <View style={styles.summaryRow}>
          <View style={styles.summaryLine}>
            <Avatar.Icon
              size={26}
              icon={typeMeta.material.icon}
              style={{ backgroundColor: "#FFF3E0" }}
              color={typeMeta.material.color}
            />
            <Text style={styles.summaryLabel}>ค่าวัสดุ</Text>
          </View>
          <Text style={styles.summaryValue}>{fmt(totalMaterial)}</Text>
        </View>
        <Divider />
        <View style={styles.summaryRow}>
          <View style={styles.summaryLine}>
            <Avatar.Icon
              size={26}
              icon={typeMeta.fuel.icon}
              style={{ backgroundColor: "#E3F2FD" }}
              color={typeMeta.fuel.color}
            />
            <Text style={styles.summaryLabel}>ค่าน้ำมัน</Text>
          </View>
          <Text style={styles.summaryValue}>{fmt(totalFuel)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}
