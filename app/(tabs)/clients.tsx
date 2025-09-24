// app/(tabs)/clients.tsx
import Header from "@/components/Header";
import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Avatar,
  Card,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { StorageUtility } from "@/providers/storageUtility";
import { PROFILE_KEY } from "@/service/profileService/lindex";
import { logoutService } from "@/service"; // ✅ ใส่ API logout

export default function Clients() {
  const [user, setUser] = useState<any>({});
  const theme = useTheme();
  const router = useRouter();

  const menuItems = useMemo(
    () => [
      {
        key: "stats",
        title: "สถิติ & รายงาน",
        onPress: () => router.push("/reports"),
      },
      {
        key: "salary-setting",
        title: "ตั้งค่าเงินเดือนพนักงาน",
        onPress: () =>
          router.push({
            pathname: "/employee",
            params: { menuName: "configSalary" },
          }),
      },
      {
        key: "payroll",
        title: "จ่ายเงินเดือนพนักงาน",
        onPress: () =>
          router.push({
            pathname: "/employee",
            params: { menuName: "salary" },
          }),
      },
      {
        key: "evaluation",
        title: "ประเมินพนักงาน",
        onPress: () =>
          router.push({
            pathname: "/employee",
            params: { menuName: "evaluateEmployee" },
          }),
      },
      {
        key: "announcement",
        title: "ประกาศ",
        onPress: () => router.push("/announcementScreen"),
      },
    ],
    [router]
  );

  useEffect(() => {
    (async () => {
      const res = await StorageUtility.get(PROFILE_KEY);
      if (res) setUser(JSON.parse(res));
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutService({}); // ✅ เรียก API ออกจากระบบ
    } catch (e: any) {
      console.log("logoutService error:", e?.message);
      // ไม่บล็อกผู้ใช้ ถ้า API ล้มเหลวก็ยังล้างข้อมูลและพาออกได้
    } finally {
      await StorageUtility.remove(PROFILE_KEY); // ✅ ล้างโปรไฟล์ในแอป
      router.replace("/(auth)/login"); // ✅ ไปหน้า Login
    }
  };

  const confirmLogout = () =>
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ออกจากระบบ", style: "destructive", onPress: handleLogout },
    ]);

  const ProfileRender = (
    <View style={[styles.topGreen, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.profileRow}>
        <Avatar.Icon
          size={40}
          icon="account"
          color={"#000"}
          style={{ backgroundColor: `${theme.colors.onPrimary}22` }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onPrimary, fontWeight: "700" }}
            numberOfLines={1}
          >
            {user.full_name}
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
            onPress={confirmLogout}
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
