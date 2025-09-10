// app/(tabs)/clients.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Avatar,
  Card,
  Divider,
  List,
  Text,
  useTheme,
  Button,
} from "react-native-paper";
import Header from "../../components/Header";

export default function Clients() {
  const theme = useTheme();

  const menuItems = useMemo(
    () => [
      {
        key: "payroll",
        title: "จ่ายเงินเดือนพนักงาน",
        onPress: () => {
          // TODO: นำทางไปหน้าจ่ายเงินเดือน
        },
      },
      {
        key: "evaluation",
        title: "ประเมินพนักงาน",
        onPress: () => {
          // TODO: นำทางไปหน้าประเมิน
        },
      },
      {
        key: "salary-setting",
        title: "ตั้งค่าเงินเดือนพนักงาน",
        onPress: () => {
          // TODO: นำทางไปหน้าตั้งค่าเงินเดือน
        },
      },
      {
        key: "stats",
        title: "สถิติ & รายงาน",
        onPress: () => {
          // TODO: นำทางไปหน้ารายงาน
        },
      },
    ],
    []
  );

  return (
    <>
      <Header title="เพิ่มเติม" />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: `${theme.colors.primary}08` },
        ]}
      >
        {/* Profile Head (พื้นหลังเขียว + ชื่อ) */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.profileRow}>
            <Avatar.Icon
              size={48}
              icon="account"
              color={theme.colors.onPrimary}
              style={{ backgroundColor: `${theme.colors.onPrimary}22` }}
            />
            <View style={{ marginLeft: 12 }}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onPrimary, fontWeight: "600" }}
                numberOfLines={1}
              >
                นาย เอ สบายดี
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: `${theme.colors.onPrimary}CC` }}
              >
                โปรไฟล์ของฉัน
              </Text>
            </View>
          </View>
        </Card>

        {/* การ์ดเมนู */}
        <Card style={styles.menuCard} mode="elevated">
          {menuItems.map((m, idx) => (
            <View key={m.key}>
              <List.Item
                title={m.title}
                onPress={m.onPress}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                titleNumberOfLines={1}
              />
              {idx < menuItems.length - 1 && <Divider />}
            </View>
          ))}

          <Divider style={{ marginVertical: 2 }} />

          {/* ออกจากระบบ (ตัวอักษรแดง) */}
          <List.Item
            title="ออกจากระบบ"
            onPress={() => {
              // TODO: เขียนลอจิก logout ที่นี่
            }}
            titleStyle={{ color: theme.colors.error, fontWeight: "600" }}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.error} />
            )}
          />
        </Card>

        {/* เว้นพื้นที่ด้านล่างให้สวยเหมือนมีแท็บบาร์ */}
        <View style={{ height: 24 }} />

        {/* ตัวอย่างปุ่มลัด (ไม่บังคับ) — ถ้าไม่ต้องการลบได้เลย */}
        {/* <Button mode="text" onPress={() => {}} style={{ alignSelf: "center" }}>
          เวอร์ชันแอป 1.0.0
        </Button> */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  profileCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 0,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
});
