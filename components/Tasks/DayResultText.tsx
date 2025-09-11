import React from "react";
import { Text } from "react-native-paper";

export default function DayResultText({
  count,
  dateText,
}: {
  count: number;
  dateText: string;
}) {
  return (
    <Text style={{ marginBottom: 8, color: "#6B7280" }}>
      {`พบ ${count} งาน ในวันที่ ${dateText}`}
    </Text>
  );
}
