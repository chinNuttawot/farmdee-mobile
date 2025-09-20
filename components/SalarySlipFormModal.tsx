// components/SalarySlipFormModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import {
  Button,
  Card,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";

export type SalarySlipInput = {
  employeeName: string;
  month: string; // YYYY-MM
  days: number;
  pieces: number;
  details: string;
  total_amount: number; // รวมก่อนหัก
  deduct: number; // หักเบิก
  remain: number; // คงเหลือ
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (payload: SalarySlipInput) => void;
  defaultEmployeeName?: string;
  defaultMonth?: string; // YYYY-MM
  ratePerDay?: number;
  ratePerPiece?: number;
};

const PRIMARY = "#2E7D32"; // เขียวปุ่มบันทึก / แถบบน
const PRIMARY_TEXT = "#1B5E20";
const BLUE = "#4F86FF";
const LAVENDER = "#F4F6FF";
const GREEN_SOFT = "#EAF7E9";
const GRAY_SOFT = "#F1F2F4";

const { height: H } = Dimensions.get("window");

export default function SalarySlipFormModal({
  visible,
  onDismiss,
  onSave,
  defaultEmployeeName = "นายสมศักดิ์",
  defaultMonth = "2025-09",
  ratePerDay = 40,
  ratePerPiece = 300,
}: Props) {
  // ===== form states =====
  const [employeeName] = useState(defaultEmployeeName);
  const [month, setMonth] = useState(defaultMonth);
  const [days, setDays] = useState<string>("1");
  const [pieces, setPieces] = useState<string>("1");
  const [details, setDetails] = useState<string>(
    `2025-09-01
เก็บลอตแรก 12 ไร่
2025-09-10
เก็บอีกชุด 7 ไร่
2025-09-17
เก็บอีกชุด 7 ไร่
2025-09-29
เก็บอีกชุด 7 ไร่`
  );
  const [total_amount, setAmount] = useState<number>(0);
  const [deduct, setDeduct] = useState<string>("2000");
  const [remain, setRemain] = useState<number>(0);

  // ===== recalc =====
  useEffect(() => {
    const d = Number(days) || 0;
    const p = Number(pieces) || 0;
    const total = d * ratePerDay + p * ratePerPiece;
    setAmount(total);
    const dd = Number(deduct) || 0;
    setRemain(total - dd);
  }, [days, pieces, deduct, ratePerDay, ratePerPiece]);

  const handleSave = () => {
    onSave({
      employeeName,
      month,
      days: Number(days) || 0,
      pieces: Number(pieces) || 0,
      details,
      total_amount,
      deduct: Number(deduct) || 0,
      remain,
    });
  };

  // ===== slide-in animation when opening =====
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 -> hidden, 1 -> shown
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const animatedStyle = useMemo(
    () => ({
      opacity: slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0], // สไลด์ขึ้นจากล่างเล็กน้อย
          }),
        },
      ],
    }),
    [slideAnim]
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={sx.modalWrap}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <Animated.View style={animatedStyle}>
            <Card style={sx.modalCard}>
              <Animated.ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                contentContainerStyle={sx.scrollInner}
              >
                <Text style={sx.title}>สร้างใบจ่ายเงินเดือน</Text>

                <Text style={sx.label}>ชื่อ</Text>
                <TextInput
                  mode="outlined"
                  value={employeeName}
                  editable={false}
                  style={sx.input}
                />

                <Text style={sx.label}>เดือนที่จ่ายเงิน</Text>
                <TextInput
                  mode="outlined"
                  value={month}
                  onChangeText={setMonth}
                  style={[sx.input, sx.inputGreen]}
                  left={<TextInput.Icon icon="calendar" />}
                  placeholder="YYYY-MM"
                />

                <View style={sx.inline}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={sx.label}>จำนวนวัน × {ratePerDay} บาท</Text>
                    <TextInput
                      mode="outlined"
                      keyboardType="numeric"
                      value={days}
                      onChangeText={setDays}
                      style={[sx.input, sx.inputPill]}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={sx.label}>
                      งานชิ้น × {ratePerPiece} บาท ต่อชิ้น
                    </Text>
                    <TextInput
                      mode="outlined"
                      keyboardType="numeric"
                      value={pieces}
                      onChangeText={setPieces}
                      style={[sx.input, sx.inputPill]}
                    />
                  </View>
                </View>

                {/* รายละเอียด */}
                <Text style={sx.label}>รายละเอียด</Text>
                <TextInput
                  mode="outlined"
                  value={details}
                  onChangeText={setDetails}
                  style={[sx.input, sx.textarea]}
                  multiline
                />

                {/* จำนวนเงิน / หักเบิก / คงเหลือ */}
                <Text style={sx.label}>จำนวนเงิน</Text>
                <TextInput
                  mode="outlined"
                  value={String(total_amount)}
                  editable={false}
                  right={<TextInput.Affix text="฿" />}
                  style={[sx.input, sx.inputPill]}
                />

                <Text style={sx.label}>หักเบิก</Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={deduct}
                  onChangeText={setDeduct}
                  right={<TextInput.Affix text="฿" />}
                  style={[sx.input, sx.inputPill]}
                />

                <Text style={sx.label}>คงเหลือ</Text>
                <TextInput
                  mode="outlined"
                  value={String(remain)}
                  editable={false}
                  right={<TextInput.Affix text="฿" />}
                  style={[sx.input, sx.inputPill]}
                />

                {/* แถบปุ่มล่างชิดขวา */}
                <View style={sx.footerWrap}>
                  <View style={{ flex: 1 }} />
                  <View style={sx.footerBtns}>
                    <Button
                      mode="contained-tonal"
                      onPress={onDismiss}
                      style={sx.btnCancel}
                      labelStyle={sx.btnCancelLabel}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSave}
                      style={sx.btnSave}
                      labelStyle={sx.btnSaveLabel}
                    >
                      บันทึก
                    </Button>
                  </View>
                </View>
              </Animated.ScrollView>
            </Card>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const sx = StyleSheet.create({
  modalWrap: {
    padding: 12,
    alignSelf: "center",
    width: "92%",
    maxWidth: 520,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: LAVENDER,
    borderWidth: 2,
    borderColor: BLUE,
    overflow: "hidden",
    // จำกัดความสูง เพื่อให้ scroll ภายในโมดอลได้ทุกจอ
    maxHeight: Math.min(H * 0.86, 720),
  },

  // แถบบนสีเขียวให้เหมือนภาพแรก
  greenHeader: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  greenHeaderText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  // เนื้อหาภายใน (ส่วนที่เลื่อน)
  scrollInner: {
    padding: 14,
    paddingBottom: 22,
  },

  tagWrap: { alignItems: "center", marginTop: 4, marginBottom: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#E7EAF3",
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 1,
    color: "#364152",
    fontWeight: "700",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1F2937",
  },
  label: { fontSize: 12, color: "#374151", marginBottom: 6, marginTop: 8 },

  input: { backgroundColor: "#FFFFFF", borderRadius: 12 },
  inputGreen: { backgroundColor: GREEN_SOFT },
  inputPill: { backgroundColor: GRAY_SOFT },
  textarea: { height: 120, backgroundColor: "#F6F7F9" },

  inline: { flexDirection: "row", alignItems: "flex-start" },

  footerWrap: { marginTop: 16, marginBottom: 4 },
  footerBtns: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },

  btnCancel: {
    borderRadius: 999,
    paddingHorizontal: 18,
  },
  btnCancelLabel: {
    color: PRIMARY_TEXT,
    fontWeight: "700",
  },

  btnSave: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 22,
    elevation: 0,
  },
  btnSaveLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
