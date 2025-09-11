// components/expenses/FilterChips.tsx
import React from "react";
import { View } from "react-native";
import { Avatar, Chip } from "react-native-paper";
import { styles } from "@/styles/ui";
import { ExpenseType, typeMeta } from "./typeMeta";

export default function FilterChips({
  value,
  onChange,
}: {
  value: "all" | ExpenseType;
  onChange: (v: "all" | ExpenseType) => void;
}) {
  return (
    <View style={styles.chipsRow}>
      <Chip
        selected={value === "all"}
        onPress={() => onChange("all")}
        icon="filter-variant"
      >
        ทั้งหมด
      </Chip>

      <Chip
        selected={value === "labor"}
        onPress={() => onChange("labor")}
        avatar={
          <Avatar.Icon
            size={18}
            icon={typeMeta.labor.icon}
            style={{ backgroundColor: "transparent" }}
            color={typeMeta.labor.color}
          />
        }
      >
        ค่าแรง
      </Chip>

      <Chip
        selected={value === "material"}
        onPress={() => onChange("material")}
        avatar={
          <Avatar.Icon
            size={18}
            icon={typeMeta.material.icon}
            style={{ backgroundColor: "transparent" }}
            color={typeMeta.material.color}
          />
        }
      >
        ค่าวัสดุ
      </Chip>

      <Chip
        selected={value === "fuel"}
        onPress={() => onChange("fuel")}
        avatar={
          <Avatar.Icon
            size={18}
            icon={typeMeta.fuel.icon}
            style={{ backgroundColor: "transparent" }}
            color={typeMeta.fuel.color}
          />
        }
      >
        ค่าน้ำมัน
      </Chip>
    </View>
  );
}
