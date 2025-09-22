// app/employee/configSalary.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Checkbox,
  ActivityIndicator,
  Portal,
  Modal,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { userConfigSalaryService, userService } from "@/service";

const GREEN = "#2E7D32";
const GREEN_DARK = "#1B5E20";
const BG_SOFT = "#F2F7F2";
const INPUT_BG = "#EAF7E9";
const CARD_BORDER = "#DDEDDC";
const SHADOW = "rgba(0,0,0,0.08)";

export default function ConfigSalary() {
  const params = useLocalSearchParams();

  const [namecar, setNamecar] = useState<string>("");
  const [rate_per_rai, setRate_per_rai] = useState<string>("");
  const [repair_rate, setRepair_rate] = useState<string>("");
  const [daily_rate, setDaily_rate] = useState<string>("");
  const [ID, setID] = useState<number>();
  const [fullName, setFullName] = useState<string>("");
  const [isDaily, setIsDaily] = useState<boolean>(false);
  const [loading, setLoading] = useState(false); // โหลดข้อมูล
  const [saving, setSaving] = useState(false); // กำลังบันทึก
  const router = useRouter();

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      setLoading(true);
      const { data } = await userService({
        role: "user",
        username: params.username,
      });
      const p = data.items[0];
      setNamecar(String(p.namecar ?? ""));
      setRate_per_rai(String(p.rate_per_rai ?? ""));
      setRepair_rate(String(p.repair_rate ?? ""));
      setDaily_rate(String(p.daily_rate ?? ""));
      setIsDaily((p.pay_type ?? "") === "daily");
      setID(p.id);
      setFullName(p.full_name);
    } catch (err: any) {
      alert(err?.message ?? "โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const onlyNumber = (s: string) => s.replace(/[^0-9.]/g, "");

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name_car: namecar?.trim() || null,
        pay_type: isDaily ? "daily" : "per_rai",
        default_rate_per_rai:
          rate_per_rai !== "" ? Number(onlyNumber(rate_per_rai)) : null,
        default_repair_rate:
          repair_rate !== "" ? Number(onlyNumber(repair_rate)) : null,
        default_daily_rate:
          daily_rate !== "" ? Number(onlyNumber(daily_rate)) : null,
        id: ID,
      };
      await userConfigSalaryService(payload);
      alert("บันทึกสำเร็จ");
      router.back();
    } catch (err: any) {
      alert(err?.message ?? "บันทึกล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG_SOFT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
    >
      {/* Header */}
      <View style={sx.header}>
        <Text style={sx.headerText}>{fullName || "กำหนดค่าพนักงาน"}</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={sx.screenPad}
      >
        <View style={sx.card}>
          {/* ชื่อรถ */}
          <Text style={sx.label}>ชื่อรถ</Text>
          <TextInput
            mode="flat"
            value={namecar}
            onChangeText={setNamecar}
            left={<TextInput.Icon icon="car" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
            placeholder="ชื่อรถ"
          />

          {/* ราคาต่อไร่ */}
          <Text style={sx.label}>ราคาต่อไร่ / บาท</Text>
          <TextInput
            mode="flat"
            value={rate_per_rai}
            onChangeText={(t) => setRate_per_rai(onlyNumber(t))}
            keyboardType="numeric"
            left={<TextInput.Icon icon="calculator-variant" />}
            right={<TextInput.Affix text="฿" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
            placeholder="0"
          />

          {/* งานซ่อม */}
          <Text style={sx.label}>งานซ่อม / บาท</Text>
          <TextInput
            mode="flat"
            value={repair_rate}
            onChangeText={(t) => setRepair_rate(onlyNumber(t))}
            keyboardType="numeric"
            left={<TextInput.Icon icon="calculator-variant" />}
            right={<TextInput.Affix text="฿" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
            placeholder="0"
          />

          {/* พนักงานรายวัน */}
          <View style={sx.checkboxRow}>
            <Checkbox
              status={isDaily ? "checked" : "unchecked"}
              onPress={() => setIsDaily((v) => !v)}
              color={GREEN}
            />
            <View style={{ flex: 1 }}>
              <Text style={sx.checkboxLabel}>พนักงานรายวัน</Text>
              <Text style={sx.checkboxNote}>
                * ถ้าเลือกแล้วจะใช้ “ราคาต่อวัน” แทน “ราคาต่อไร่”
              </Text>
            </View>
          </View>

          {/* ราคาต่อวัน */}
          <Text style={sx.label}>ราคาต่อวัน / บาท</Text>
          <TextInput
            mode="flat"
            value={daily_rate}
            onChangeText={(t) => setDaily_rate(onlyNumber(t))}
            keyboardType="numeric"
            left={<TextInput.Icon icon="calculator-variant" />}
            right={<TextInput.Affix text="฿" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
            placeholder="0"
          />

          {/* ปุ่มล่างกึ่งกลาง */}
          <View style={sx.footer}>
            <Button
              mode="contained"
              style={sx.btnSave}
              labelStyle={sx.btnSaveLabel}
              onPress={handleSave}
              disabled={loading || saving}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      <Portal>
        <Modal
          visible={loading || saving}
          dismissable={false}
          contentContainerStyle={{
            backgroundColor: "rgba(0,0,0,0.4)",
            padding: 0,
            margin: 0,
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <ActivityIndicator animating size="large" />
            <Text style={{ color: "white" }}>
              {saving ? "กำลังบันทึก..." : "กำลังโหลด..."}
            </Text>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const sx = StyleSheet.create({
  header: {
    marginTop: 16,
    padding: 16,
  },
  headerText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 20,
  },
  screenPad: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: SHADOW,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    height: 46,
  },
  inputContent: {
    paddingVertical: 6,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  checkboxNote: {
    fontSize: 11,
    color: "#D70000",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 28,
  },
  btnSave: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 22,
    elevation: 0,
  },
  btnSaveLabel: {
    color: "#fff",
    fontWeight: "700",
  },
});
