// app/employee/configSalary.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, TextInput, Button, Checkbox } from "react-native-paper";
import { useLocalSearchParams } from "@/node_modules/expo-router/build/hooks";
const GREEN = "#2E7D32"; // header / ปุ่มบันทึก
const GREEN_DARK = "#1B5E20"; // ตัวอักษรปุ่มยกเลิก
const BG_SOFT = "#F2F7F2"; // พื้นหลังจอ
const INPUT_BG = "#EAF7E9"; // พื้นช่องกรอก
const CARD_BORDER = "#DDEDDC"; // เส้นขอบการ์ดเขียวอ่อน
const SHADOW = "rgba(0,0,0,0.08)";

export default function ConfigSalary() {
  const [dailyRate, setdailyRate] = useState("40");
  const [rateRepair, setRateRepair] = useState("300");
  const [isDaily, setIsDaily] = useState(false);
  const [ratePerDay, setRatePerDay] = useState("250");
  const { name } = useLocalSearchParams<{ name?: string }>();
  const handleSave = () => {
    console.log("handleSave ::",{ dailyRate, rateRepair, isDaily, ratePerDay });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG_SOFT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
    >
      {/* Header */}
      <View style={sx.header}>
        <Text style={sx.headerText}>{name}</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={sx.screenPad}
      >
        <View style={sx.card}>
          {/* ราคาต่อไร่ */}
          <Text style={sx.label}>ราคาต่อไร่ / บาท</Text>
          <TextInput
            mode="flat"
            value={dailyRate}
            onChangeText={setdailyRate}
            keyboardType="numeric"
            left={<TextInput.Icon icon="calculator-variant" />}
            right={<TextInput.Affix text="B" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
          />

          {/* งานซ่อม */}
          <Text style={sx.label}>งานซ่อม / บาท</Text>
          <TextInput
            mode="flat"
            value={rateRepair}
            onChangeText={setRateRepair}
            keyboardType="numeric"
            left={<TextInput.Icon icon="calculator-variant" />}
            right={<TextInput.Affix text="B" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
          />

          {/* พนักงานรายวัน */}
          <View style={sx.checkboxRow}>
            <Checkbox
              status={isDaily ? "checked" : "unchecked"}
              onPress={() => setIsDaily(!isDaily)}
              color={GREEN}
            />
            <View style={{ flex: 1 }}>
              <Text style={sx.checkboxLabel}>พนักงานรายวัน</Text>
              <Text style={sx.checkboxNote}>
                * ถ้าเลือกแล้วจะใช้ ราคาต่อวัน แทน ราคาต่อไร่
              </Text>
            </View>
          </View>

          {/* ราคาต่อวัน */}
          <Text style={sx.label}>ราคาต่อวัน / บาท</Text>
          <TextInput
            mode="flat"
            value={ratePerDay}
            onChangeText={setRatePerDay}
            keyboardType="numeric"
            left={<TextInput.Icon icon="calculator-variant" />}
            right={<TextInput.Affix text="B" />}
            style={sx.input}
            contentStyle={sx.inputContent}
            underlineColor="transparent"
            selectionColor={GREEN}
          />

          {/* ปุ่มล่างกึ่งกลาง */}
          <View style={sx.footer}>
            <Button
              mode="contained"
              style={sx.btnSave}
              labelStyle={sx.btnSaveLabel}
              onPress={handleSave}
            >
              บันทึก
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const sx = StyleSheet.create({
  header: {
    paddingVertical: 18,
    alignItems: "center",
  },
  headerText: {
    color: "#000",
    // fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
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

  btnCancel: {
    backgroundColor: "#E8EFE7",
    borderRadius: 999,
    paddingHorizontal: 18,
    elevation: 0,
  },
  btnCancelLabel: {
    color: GREEN_DARK,
    fontWeight: "700",
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
