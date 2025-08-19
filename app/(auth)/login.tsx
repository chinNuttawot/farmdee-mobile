// app/(auth)/login.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Surface,
  Checkbox,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";

export default function Login() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const emailErr =
    touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passErr = touched.password && password.trim().length < 6;

  const isValid = useMemo(
    () => !!email && !!password && !emailErr && !passErr,
    [email, password, emailErr, passErr]
  );

  const submit = async () => {
    if (!isValid) {
      setSnack({ visible: true, msg: "กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน" });
      return;
    }
    try {
      setLoading(true);
      // TODO: call API
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setSnack({ visible: true, msg: e?.message ?? "เกิดข้อผิดพลาด" });
    } finally {
      setLoading(false);
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
              <View style={styles.brandRow}>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary, fontWeight: "800" }}
                >
                  🌱 FarmCare
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
                ใส่อีเมลและรหัสผ่านเพื่อดำเนินการต่อ
              </Text>
            </View>

            {/* Card */}
            <Surface
              style={[
                styles.card,
                {
                  borderColor: theme.colors.outline,
                  shadowColor: "#00000022",
                },
              ]}
              elevation={2}
            >
              <TextInput
                mode="outlined"
                label="อีเมล"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                left={<TextInput.Icon icon="sprout-outline" />}
                style={styles.input}
              />
              <HelperText type="error" visible={!!emailErr}>
                กรุณากรอกอีเมลให้ถูกต้อง
              </HelperText>

              <TextInput
                mode="outlined"
                label="รหัสผ่าน"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={submit}
                left={<TextInput.Icon icon="seed-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onPress={() => setShowPassword((v) => !v)}
                    forceTextInputFocus={false}
                  />
                }
                style={styles.input}
              />
              <HelperText type="error" visible={!!passErr}>
                รหัสผ่านอย่างน้อย 6 ตัวอักษร
              </HelperText>

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Checkbox
                    status={remember ? "checked" : "unchecked"}
                    onPress={() => setRemember((v) => !v)}
                  />
                  <Text onPress={() => setRemember((v) => !v)}>
                    จดจำฉันไว้
                  </Text>
                </View>

                <TouchableOpacity onPress={() => {}}>
                  <Text style={[styles.link, { color: theme.colors.primary }]}>
                    ลืมรหัสผ่าน?
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                mode="contained"
                onPress={submit}
                loading={loading}
                disabled={!isValid || loading}
                style={styles.cta}
                contentStyle={{ height: 52 }}
              >
                เข้าสู่ระบบ
              </Button>
            </Surface>

            {/* Footer */}
            <View style={styles.footer}>
              <Text>ยังไม่มีบัญชี?</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text
                  style={[
                    styles.link,
                    { marginLeft: 6, color: theme.colors.primary },
                  ]}
                >
                  สมัครใช้งาน
                </Text>
              </TouchableOpacity>
            </View>
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
  row: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  cta: { marginTop: 12, borderRadius: 12 },
  footer: {
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  link: { fontWeight: "700", textDecorationLine: "underline" },
});
