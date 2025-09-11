import React from "react";
import { View } from "react-native";
import { Chip } from "react-native-paper";
import { styles } from "@/styles/ui";
import { StatusType } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";

type Props = {
  value: StatusType;
  onChange: (s: StatusType) => void;
};

export default function StatusFilterChips({ value, onChange }: Props) {
  const items: StatusType[] = ["ทั้งหมด", "รอทำ", "กำลังทำ", "เสร็จ"];
  return (
    <View style={styles.chipRow}>
      {items.map((s) => {
        const selected = value === s;
        return (
          <Chip
            key={s}
            selected={selected}
            onPress={() => onChange(s)}
            style={[
              styles.filterChip,
              selected ? { backgroundColor: STATUS_COLORS[s] + "22" } : null,
            ]}
            textStyle={
              selected
                ? { color: STATUS_COLORS[s], fontWeight: "700" }
                : undefined
            }
            icon={selected ? "check" : undefined}
          >
            {s}
          </Chip>
        );
      })}
    </View>
  );
}
