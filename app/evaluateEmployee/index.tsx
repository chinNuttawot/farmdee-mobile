// app/employee/evaluateEmployee.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, TextInput, Button, Avatar } from "react-native-paper";

const GREEN = "#2E7D32";
const BG_SOFT = "#F2F7F2";
const INPUT_BG = "#EAF7E9";
const CARD_BORDER = "#DDEDDC";
const SUBCARD_BORDER = "#E6F1E6";
const TAG_BG = "#E7F3E7";
const SHADOW = "rgba(0,0,0,0.08)";

type Question = { id: string; text: string; max: number };

export default function EvaluateEmployee() {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [position, setPosition] = useState("");

  const part1: Question[] = [
    { id: "q1", text: "ไม่ขับขี่ประมาท/เคารพกฏ (เต็ม 20)", max: 20 },
    { id: "q2", text: "ขับแบบระมัดระวัง/ไม่หวาดเสียว (เต็ม 20)", max: 20 },
    {
      id: "q3",
      text: "ขับแบบมืออาชีพ ช่างสังเกตุ/สามารถแก้ปัญหาเฉพาะหน้าได้ (เต็ม 20)",
      max: 20,
    },
    { id: "q4", text: "เมาไม่ขับ เอารถเข้าบ้านค่อยดื่ม (เต็ม 40)", max: 40 },
  ];
  const part2: Question[] = [
    {
      id: "q5",
      text: "สามารถเช็ครถให้Doneครบ ได้ในเวลา 8:30 น. ของทุกวัน (เต็ม 50)",
      max: 50,
    },
    {
      id: "q6",
      text: "เกี่ยวDoneตามคิวงานที่ได้รับมอบหมาย (เต็ม 20)",
      max: 20,
    },
    { id: "q7", text: "งานซ่อมบำรุงทำต่อเนื่อง (เต็ม 30)", max: 30 },
  ];

  const all = useMemo(() => [...part1, ...part2], []);
  const total = all.reduce(
    (sum, q) => sum + (parseInt(scores[q.id] || "0", 10) || 0),
    0
  );
  const maxTotal = all.reduce((sum, q) => sum + q.max, 0);

  const renderQuestion = (q: Question) => (
    <View key={q.id} style={sx.qItem}>
      <Text style={sx.qText}>{q.text}</Text>
      <TextInput
        mode="flat"
        keyboardType="numeric"
        placeholder="0"
        value={scores[q.id] || ""}
        onChangeText={(v) => setScores((s) => ({ ...s, [q.id]: v }))}
        style={sx.input}
        underlineColor="transparent"
        selectionColor={GREEN}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG_SOFT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
    >
      <ScrollView
        contentContainerStyle={sx.screenPad}
        keyboardShouldPersistTaps="handled"
      >
        <View style={sx.card}>
          {/* Employee block */}
          <View style={sx.employeeRow}>
            <Avatar.Icon size={46} icon="account" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={sx.empName}>นายสมศักดิ์</Text>

              {/* ระบุตำแหน่ง (Tag + Input แนวนอน) */}
              <View style={sx.positionRow}>
                <View style={sx.tag}>
                  <Text style={sx.tagText}>ระบุตัวรถ</Text>
                </View>
                <TextInput
                  placeholder="ระบุตัวรถ"
                  placeholderTextColor={"#000"}
                  mode="flat"
                  value={position}
                  onChangeText={setPosition}
                  style={sx.positionInput}
                  left={<TextInput.Icon icon="car" />}
                  underlineColor="transparent"
                />
              </View>
            </View>
          </View>

          {/* Section 1 */}
          <View style={sx.subCard}>
            <Text style={sx.sectionTitle}>1. ขับขี่ปลอดภัย</Text>
            {part1.map(renderQuestion)}
          </View>

          {/* Section 2 */}
          <View style={sx.subCard}>
            <Text style={sx.sectionTitle}>2. การตรงต่อเวลา</Text>
            {part2.map(renderQuestion)}
          </View>

          {/* หมายเหตุ */}
          <Text style={sx.label}>หมายเหตุ</Text>
          <TextInput
            mode="flat"
            placeholder="รายละเอียด"
            value={note}
            onChangeText={setNote}
            style={sx.inputNote}
            multiline
            underlineColor="transparent"
          />

          {/* รวมคะแนน ชิดซ้าย */}
          <Text style={sx.totalTextLeft}>
            รวมคะแนน: {total} / {maxTotal}
          </Text>

          {/* Buttons */}
          <View style={sx.footer}>
            <Button
              mode="contained"
              style={sx.btnCancel}
              labelStyle={sx.btnCancelLabel}
              onPress={() => {}}
            >
              ย้อนกลับ
            </Button>
            <Button
              mode="contained"
              style={sx.btnSave}
              labelStyle={sx.btnSaveLabel}
              onPress={() => {}}
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
    backgroundColor: GREEN,
    paddingVertical: 18,
    alignItems: "center",
  },
  headerText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  screenPad: { padding: 16 },

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

  // Employee
  employeeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  empName: { fontSize: 14, fontWeight: "700", marginBottom: 8 },

  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    backgroundColor: TAG_BG,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagText: { fontWeight: "700", color: "#2C5E2C", fontSize: 12 },
  positionInput: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    height: 40,
  },

  // Sections
  subCard: {
    borderWidth: 1,
    borderColor: SUBCARD_BORDER,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1F2937",
  },

  qItem: { marginBottom: 10 },
  qText: { fontSize: 13, marginBottom: 4, color: "#1F2937" },

  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 8,
  },

  label: { fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  inputNote: { backgroundColor: INPUT_BG, borderRadius: 10, minHeight: 60 },

  totalTextLeft: {
    marginTop: 14,
    fontWeight: "700",
    textAlign: "left",
    color: "#0f5132",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    gap: 12,
  },
  btnCancel: {
    backgroundColor: "#E8EFE7",
    borderRadius: 999,
    paddingHorizontal: 18,
    elevation: 0,
  },
  btnCancelLabel: { color: GREEN, fontWeight: "700" },
  btnSave: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 22,
    elevation: 0,
  },
  btnSaveLabel: { color: "#fff", fontWeight: "700" },
});
