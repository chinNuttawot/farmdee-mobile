// app/(tabs)/emp-announcement.tsx
import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Appbar, Card, Text } from "react-native-paper";
import Header from "../../components/Header";

export default function EmpAnnouncement() {
  const rules = [
    "ทำประกันชีวิตปิ่นเกล้าของ ปิดบ่ามส่งให้",
    "ลาออกจากงานต้องแจ้งให้ทราบล่วงหน้า 1 เดือน",
    "งานบางปีไร่ละ 60/คัน ใครมีคนมาเพิ่มแบ่งกันเอง",
    "การเบิกเงินล่วงหน้าสามารถเบิกได้ 80% ของงานที่ทำได้",
    "งานซ่อมใหญ่คิดเงินให้แยกแบ่งมาจ่ายให้ตามความยากง่ายของงาน",
    "การหยุดงาน/ขาด/ลา ต้องแจ้งล่วงหน้าอย่างน้อย 3 วัน",
    "พูดจา ยุยง ส่อเสียด หรือทำให้แตกแยกเป็นหมู่คณะ ตัดการใช้โบนัสครึ่งปี",
    "การเช็ครถ/ซ่อมรถต้องช่วยกัน เอาแรงกัน",
  ];

  return (
    <>
      <Header title="ระเบียบการอยู่ร่วมกัน" backgroundColor="#2E7D32" color="white" />

      {/* เนื้อหา */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={s.card} mode="elevated">
          <Card.Content>
            {rules.map((line, i) => (
              <Text key={i} style={s.rule}>
                {i + 1}. {line}
              </Text>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: "#2E7D32",
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  rule: {
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 20,
  },
});
