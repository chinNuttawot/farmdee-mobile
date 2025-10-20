import React from "react";
import { Card, Text } from "react-native-paper";
import { styles } from "@/styles/ui";

export default function TaskEmptyCard() {
  return (
    <Card style={styles.emptyCard}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 4 }}>
          ยังไม่มีงานในวันนี้
        </Text>
        {/* <Text style={{ color: "#6B7280" }}>
          ลองเปลี่ยนวันที่/สถานะ หรือสร้างงานใหม่ด้วยปุ่ม “+”
        </Text> */}
      </Card.Content>
    </Card>
  );
}
