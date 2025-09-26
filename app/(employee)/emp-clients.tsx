// app/(tabs)/clients.tsx
import Header from "@/components/Header";
import React, { useEffect, useMemo, useState, useCallback } from "react";
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

const SAVED_CREDENTIALS = "SAVED_CREDENTIALS";

type Profile = {
  id: number;
  full_name?: string;
  role?: "Admin" | "Boss" | "User" | string;
};

export default function Clients() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const raw = await StorageUtility.get(PROFILE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch {
        /* เงียบไว้ */
      }
    })();
  }, []);

  const openMyEvaluations = useCallback(() => {
    if (!user?.id) {
      Alert.alert("ไม่พบผู้ใช้", "กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      return;
    }
    // ไปที่หน้ารายการประเมิน โดยบังคับส่ง id ของตัวเองเท่านั้น
    router.push({
      pathname: "/employee/evaluations",
      params: {
        id: String(user.id),
        full_name: user.full_name ?? "ฉัน",
        isView: true,
      },
    });
  }, [router, user]);

  // เมนู: สำหรับ role 'User' ให้มีเฉพาะเมนูของตัวเอง
  // ถ้าเป็น Admin/Boss อนาคตค่อยเติมเมนูเพิ่มได้
  const menuItems = useMemo(() => {
    if (!user) return [];
    if (user.role === "User") {
      return [
        {
          key: "evaluation-me",
          title: "การประเมินงานของฉัน",
          onPress: openMyEvaluations,
        },
      ];
    }
    // Admin/Boss อาจมีเมนูอื่น (ยังคงมี "ของฉัน" ไว้ด้วย)
    return [
      {
        key: "evaluation-me",
        title: "การประเมินงานของฉัน",
        onPress: openMyEvaluations,
      },
      // ตัวอย่างเมนูสำหรับผู้ดูแล (คอมเมนต์ไว้ก่อน)
      // { key: "evaluation-manage", title: "จัดการการประเมินพนักงาน", onPress: () => router.push("/employee/manage") },
    ];
  }, [user, openMyEvaluations]);

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutService({});
    } catch (err: any) {
      console.log("logout error:", err?.message);
    } finally {
      try {
        await StorageUtility.remove(SAVED_CREDENTIALS);
        await StorageUtility.remove(PROFILE_KEY);
      } catch {}
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
          <Text
            style={{
              color: `${theme.colors.onPrimary}CC`,
              fontSize: 12,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {user?.role ?? "-"}
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
