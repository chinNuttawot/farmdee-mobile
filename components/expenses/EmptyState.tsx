// components/expenses/EmptyState.tsx
import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { styles } from "@/styles/ui";

export default function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>🧾</Text>
      <Text style={{ opacity: 0.7, marginBottom: 12 }}>
        ยังไม่มีรายการค่าใช้จ่าย
      </Text>
      {/* <Button mode="contained" onPress={onAdd}>
        + เพิ่มรายการ
      </Button> */}
    </View>
  );
}
