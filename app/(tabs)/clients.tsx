// app/(tabs)/clients.tsx
import Header from "@/components/Header";
import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Avatar,
  Card,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router"; // ✅ ใช้สำหรับนำทาง

export default function Clients() {
  const theme = useTheme();

  const menuItems = useMemo(
    () => [
      {
        key: "payroll",
        title: "จ่ายเงินเดือนพนักงาน",
        onPress: () => router.push("/finance"), // ✅ ไปหน้า การเงิน
      },
      {
        key: "evaluation",
        title: "ประเมินพนักงาน",
        onPress: () => router.push("/reports"), // ✅ ไปหน้า รายงาน (ใช้แทนหน้าประเมิน)
      },
      {
        key: "salary-setting",
        title: "ตั้งค่าเงินเดือนพนักงาน",
        onPress: () => router.push("/invoices"), // ✅ ไปหน้า ใบแจ้งหนี้ (ตัวอย่างปลายทาง)
      },
      {
        key: "stats",
        title: "สถิติ & รายงาน",
        onPress: () => router.push("/reports"), // ✅ ไปหน้า รายงาน
      },
    ],
    []
  );

  const ProfileRender = (
    <View style={[styles.topGreen, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.profileRow}>
        <Avatar.Icon
          size={40}
          icon="account"
          color={theme.colors.onPrimary}
          style={{ backgroundColor: `${theme.colors.onPrimary}22` }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onPrimary, fontWeight: "700" }}
            numberOfLines={1}
          >
            นาย เอ สบายดี
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Header backgroundColor="#2E7D32" color="white" />
      {ProfileRender}
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: `${theme.colors.primary}14` },
        ]}
      >
        <Card style={styles.menuCard} mode="contained">
          {menuItems.map((m, idx) => (
            <View key={m.key}>
              <List.Item
                title={m.title}
                onPress={m.onPress}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                style={styles.item}
                titleNumberOfLines={1}
              />
              {idx < menuItems.length - 1 && <Divider />}
            </View>
          ))}

          <Divider />

          {/* ออกจากระบบ */}
          <List.Item
            title="ออกจากระบบ"
            onPress={() => {
              // ตัวอย่าง: router.replace("/(auth)/login");
            }}
            titleStyle={{ color: theme.colors.error, fontWeight: "700" }}
            style={styles.item}
          />
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 12,
    flexGrow: 1,
  },
  topGreen: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  item: {
    height: 52,
    justifyContent: "center",
  },
});
