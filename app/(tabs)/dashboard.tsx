// app/(tabs)/dashboard.tsx
import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Text, Card, useTheme, Avatar } from "react-native-paper";
import Header from "../../components/Header";

type StatsProps = {
  monthRevenue: number;
  monthExpense: number;
};

function StatsCards({ monthRevenue, monthExpense }: StatsProps) {
  const theme = useTheme();
  const profit = monthRevenue - monthExpense;

  return (
    <View style={{ gap: 16 }}>
      {/* รายได้ */}
      <Card style={styles.card} elevation={3}>
        <Card.Title
          title="รายได้เดือนนี้"
          titleStyle={{ fontWeight: "700" }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="cash-plus"
              color="white"
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          <Text variant="headlineMedium" style={styles.value}>
            {monthRevenue.toLocaleString()} ฿
          </Text>
        </Card.Content>
      </Card>

      {/* ค่าใช้จ่าย */}
      <Card style={styles.card} elevation={3}>
        <Card.Title
          title="ค่าใช้จ่ายเดือนนี้"
          titleStyle={{ fontWeight: "700" }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="cash-minus"
              color="white"
              style={{ backgroundColor: "#E53935" }}
            />
          )}
        />
        <Card.Content>
          <Text
            variant="headlineMedium"
            style={[styles.value, { color: "#E53935" }]}
          >
            {monthExpense.toLocaleString()} ฿
          </Text>
        </Card.Content>
      </Card>

      {/* กำไรสุทธิ */}
      <Card style={styles.card} elevation={4}>
        <Card.Title
          title="กำไรสุทธิ"
          titleStyle={{ fontWeight: "700" }}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="leaf"
              color="white"
              style={{ backgroundColor: "#43A047" }}
            />
          )}
        />
        <Card.Content>
          <Text
            variant="headlineLarge"
            style={[
              styles.value,
              { color: profit >= 0 ? "#2E7D32" : "#C62828", fontWeight: "800" },
            ]}
          >
            {profit.toLocaleString()} ฿
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

export default function Dashboard() {
  return (
    <>
      <Header title="สรุปภาพรวม" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <StatsCards monthRevenue={120000} monthExpense={45000} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  value: {
    marginTop: 8,
    fontWeight: "700",
  },
});
