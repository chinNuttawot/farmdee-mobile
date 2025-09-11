// components/expenses/TypeChip.tsx
import React from "react";
import { Chip } from "react-native-paper";
import { ExpenseType, typeMeta } from "./typeMeta";

export default function TypeChip({ t }: { t: ExpenseType }) {
  return (
    <Chip
      compact
      style={{ backgroundColor: `${typeMeta[t].color}15` }}
      textStyle={{ color: typeMeta[t].color, fontWeight: "700" }}
    >
      {typeMeta[t].label}
    </Chip>
  );
}
