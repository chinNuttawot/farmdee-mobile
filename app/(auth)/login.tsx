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

  const [user, setUser] = useState("a1");
  const [password, setPassword] = useState("1");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ user: false, password: false });
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const submit = async () => {
    try {
      setLoading(true);
      if (user === "a1") {
        router.replace("/(tabs)/dashboard");
      } else if (user === "a2") {
        router.replace("/(employee)/emp-dashboard");
      }
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
                value={user}
                onChangeText={setUser}
                onBlur={() => setTouched((t) => ({ ...t, user: true }))}
                autoCapitalize="none"
                keyboardType="user-address"
                autoComplete="user"
                textContentType="emailAddress"
                returnKeyType="next"
                left={<TextInput.Icon icon="sprout-outline" />}
                style={styles.input}
              />

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

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Checkbox
                    status={remember ? "checked" : "unchecked"}
                    onPress={() => setRemember((v) => !v)}
                  />
                  <Text onPress={() => setRemember((v) => !v)}>จดจำฉันไว้</Text>
                </View>

                {/* <TouchableOpacity onPress={() => {}}>
                  <Text style={[styles.link, { color: theme.colors.primary }]}>
                    ลืมรหัสผ่าน?
                  </Text>
                </TouchableOpacity> */}
              </View>

              <Button
                mode="contained"
                onPress={submit}
                loading={loading}
                disabled={loading}
                style={styles.cta}
                contentStyle={{ height: 52 }}
              >
                เข้าสู่ระบบ
              </Button>
            </Surface>

            {/* Footer */}
            {/* <View style={styles.footer}>
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
            </View> */}
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
