// app/(auth)/login.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Surface,
  Checkbox,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { loginService, Profile } from "@/service";
import { StorageUtility } from "@/providers/storageUtility";
import { PROFILE_KEY } from "@/service/profileService/lindex";

const SAVED_CREDENTIALS = "SAVED_CREDENTIALS"; // { username, password, remember }

export default function Login() {
  const theme = useTheme();
  const router = useRouter();

  const [username, setUsername] = useState(__DEV__ ? "boss1" : "");
  const [password, setPassword] = useState(__DEV__ ? "Passw0rd!" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // โหลด credentials ที่เคยจำไว้ แล้ว auto login ถ้ามี
  useEffect(() => {
    (async () => {
      try {
        const raw = await StorageUtility.get(SAVED_CREDENTIALS);
        if (!raw) return;
        const saved = JSON.parse(raw) as {
          username?: string;
          password?: string;
          remember?: boolean;
        };
        if (saved?.username) setUsername(saved.username);
        if (saved?.password) setPassword(saved.password);
        if (typeof saved?.remember === "boolean") setRemember(saved.remember);

        // ถ้าติ๊กจำฉันไว้ และมี user/pass ครบ → ล็อกอินอัตโนมัติ
        if (saved?.remember && saved.username && saved.password) {
          setAutoLogging(true);
          await submit(saved.username, saved.password, /*silent*/ true);
        }
      } catch {}
    })();
  }, []);

  const usernameErr = useMemo(() => {
    if (!touched.username) return "";
    return (username || "").trim() ? "" : "กรุณาใส่ชื่อผู้ใช้";
  }, [username, touched.username]);

  const passwordErr = useMemo(() => {
    if (!touched.password) return "";
    return (password || "").length ? "" : "กรุณาใส่รหัสผ่าน";
  }, [password, touched.password]);

  const formValid = useMemo(
    () => !usernameErr && !passwordErr && !!username && !!password,
    [usernameErr, passwordErr, username, password]
  );

  // ทำเป็นฟังก์ชันรับพารามิเตอร์ เพื่อเรียก auto login ได้ชัวร์
  const submit = async (
    u?: string,
    p?: string,
    silent = false // ถ้าเป็น auto login จะไม่โชว์ snack เวลาฟอร์มไม่ครบ
  ) => {
    if (loading) return;
    const userVal = (u ?? username).trim();
    const passVal = p ?? password;

    setTouched({ username: true, password: true });
    if (!userVal || !passVal) {
      if (!silent)
        setSnack({ visible: true, msg: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      setAutoLogging(false);
      return;
    }

    try {
      setLoading(true);

      // 1) Login
      await loginService({
        username: userVal,
        password: passVal,
      });

      // 2) โหลดโปรไฟล์
      const { user: userProfile } = await Profile();

      // 3) เก็บโปรไฟล์ไว้ใช้ทั้งแอป
      await StorageUtility.set(PROFILE_KEY, JSON.stringify(userProfile));

      // 4) จำ credentials (ตามสวิทช์ remember)
      if (remember) {
        await StorageUtility.set(
          SAVED_CREDENTIALS,
          JSON.stringify({
            username: userVal,
            password: passVal,
            remember: true,
          })
        );
      } else {
        await StorageUtility.remove(SAVED_CREDENTIALS);
      }

      // 5) นำทางตาม role
      if (userProfile.role === "boss") {
        router.replace("/(tabs)/dashboard");
      } else if (userProfile.role === "user") {
        router.replace("/(employee)/emp-dashboard");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      setSnack({
        visible: true,
        msg: e?.message ?? "เข้าสู่ระบบไม่สำเร็จ",
      });
    } finally {
      setLoading(false);
      setAutoLogging(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerWrap}>
              <View className="brandRow" style={styles.brandRow}>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary, fontWeight: "800" }}
                >
                  🌱 FarmDee
                </Text>
                <Text
                  variant="labelMedium"
                  style={{ marginLeft: 8, opacity: 0.7 }}
                >
                  สำหรับเกษตรกร
                </Text>
              </View>

              <Text variant="headlineLarge" style={styles.title}>
                เข้าสู่ระบบ
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                ใส่ชื่อผู้ใช้และรหัสผ่านเพื่อดำเนินการต่อ
              </Text>
              {autoLogging ? (
                <Text style={{ marginTop: 6, opacity: 0.7 }}>
                  กำลังเข้าสู่ระบบอัตโนมัติ…
                </Text>
              ) : null}
            </View>

            {/* Card */}
            <Surface
              style={[
                styles.card,
                { borderColor: theme.colors.outline, shadowColor: "#00000022" },
              ]}
              elevation={2}
            >
              <TextInput
                mode="outlined"
                label="ชื่อผู้ใช้"
                value={username}
                onChangeText={setUsername}
                onBlur={() => setTouched((x) => ({ ...x, username: true }))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                left={<TextInput.Icon icon="account-outline" />}
                style={styles.input}
                error={!!usernameErr}
              />
              {!!usernameErr && (
                <Text style={styles.errText}>{usernameErr}</Text>
              )}

              <TextInput
                mode="outlined"
                label="รหัสผ่าน"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched((x) => ({ ...x, password: true }))}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => submit()}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onPress={() => setShowPassword((v) => !v)}
                    forceTextInputFocus={false}
                  />
                }
                style={styles.input}
                error={!!passwordErr}
              />
              {!!passwordErr && (
                <Text style={styles.errText}>{passwordErr}</Text>
              )}

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Checkbox
                    status={remember ? "checked" : "unchecked"}
                    onPress={() => setRemember((v) => !v)}
                  />
                  <Text onPress={() => setRemember((v) => !v)}>จดจำฉันไว้</Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() => submit()}
                loading={loading}
                disabled={loading || !username || !password}
                style={styles.cta}
                contentStyle={{ height: 52 }}
              >
                เข้าสู่ระบบ
              </Button>
            </Surface>
          </View>
        </ScrollView>

        <Snackbar
          visible={snack.visible}
          onDismiss={() => setSnack({ visible: false, msg: "" })}
          duration={2500}
          action={{ label: "ปิด", onPress: () => {} }}
        >
          {snack.msg}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 20 },
  container: { flex: 1, justifyContent: "center" },
  headerWrap: { marginBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { fontWeight: "800" },
  subtitle: { opacity: 0.7, marginTop: 4 },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "white",
    borderWidth: 1,
  },
  input: { marginTop: 8 },
  errText: {
    color: "#dc2626",
    marginTop: 4,
    marginLeft: 2,
    fontSize: 12,
  },
  row: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  cta: { marginTop: 12, borderRadius: 12 },
});
