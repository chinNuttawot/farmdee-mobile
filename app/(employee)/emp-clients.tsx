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
import { logoutService } from "@/service";

const SAVED_CREDENTIALS = "SAVED_CREDENTIALS"; // <- ใช้คู่กับหน้า login (remember me + auto login)

export default function Clients() {
  const [user, setUser] = useState<any>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const menuItems = useMemo(
    () => [
      {
        key: "evaluation",
        title: "การประเมินงานของฉัน",
        onPress: () => {},
      },
    ],
    []
  );

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      const res = await StorageUtility.get(PROFILE_KEY);
      if (res) setUser(JSON.parse(res));
    } catch (e) {
      // เงียบไว้ ไม่ต้อง block หน้าจอ
    }
  };

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // เรียก API ออกจากระบบ (ถ้า backend ต้องการ body ว่าง ให้ส่ง {} ได้)
      await logoutService({});
    } catch (err: any) {
      console.log("logout error:", err?.message);
      // ไม่บล็อกผู้ใช้: ต่อให้ API ล้มเหลวก็ล้างข้อมูลในเครื่องต่อได้
    } finally {
      try {
        // 1) กัน auto-login รอบถัดไป: ล้าง credentials ที่หน้า login เคยจำไว้
        await StorageUtility.remove(SAVED_CREDENTIALS);

        // 2) ล้างโปรไฟล์ที่เก็บไว้ใช้ในแอป
        await StorageUtility.remove(PROFILE_KEY);
      } catch {}

      // 3) พาไปหน้า Login และรีเซ็ตสแตก
      router.replace("/(auth)/login");
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    if (loggingOut) return;
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ออกจากระบบ", style: "destructive", onPress: doLogout },
    ]);
  };

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
            {user?.full_name ?? "ผู้ใช้งาน"}
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
            title={loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            onPress={confirmLogout}
            titleStyle={{
              color: loggingOut
                ? theme.colors.onSurfaceDisabled
                : theme.colors.error,
              fontWeight: "700",
            }}
            style={styles.item}
            disabled={loggingOut}
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
