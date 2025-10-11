// components/expenses/ExpenseItem.tsx
import React from "react";
import { View } from "react-native";
import { Card, Avatar, IconButton, Text } from "react-native-paper";
import { styles } from "@/styles/ui";
import { Expense, typeMeta } from "./typeMeta";
import TypeChip from "./TypeChip";

export default function ExpenseItem({
  item,
  fmt,
  onEdit,
  onDelete,
}: {
  item: Expense;
  fmt: (n: number) => string;
  onEdit?: (item: Expense) => void;
  onDelete?: (item: Expense) => void;
}) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Title
        title={item.title}
        titleNumberOfLines={2}
        titleStyle={{ fontWeight: "700" }}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={typeMeta[item.type].icon}
            color="white"
            style={{ backgroundColor: typeMeta[item.type].color }}
          />
        )}
        right={() => (
          <View style={{ alignItems: "flex-end", marginRight: 6 }}>
            <Text style={{ fontWeight: "800" }}>฿{fmt(item.amount)}</Text>
            <TypeChip t={item.type} />
          </View>
        )}
      />
      <Card.Content style={{ gap: 6 }}>
        {(item.job_note || item.work_date) && (
          <Text style={{ opacity: 0.7 }} numberOfLines={2}>
            {item.job_note ? `งาน: ${item.job_note}` : ""}
            {item.job_note && item.work_date ? " • " : ""}
            {item.work_date ? `วันที่: ${item.work_date}` : ""}
          </Text>
        )}
        {item.qty_note && (
          <Text style={{ opacity: 0.7 }} numberOfLines={1}>
            {item.qty_note}
          </Text>
        )}

        {item.type !== "labor" && (
          <View style={styles.actionRow}>
            <IconButton
              icon="pencil"
              size={18}
              onPress={() => onEdit?.(item)}
              containerColor="#FFEDE0"
              iconColor="#F57C00"
              style={styles.actionBtn}
            />
            <IconButton
              icon="trash-can"
              size={18}
              onPress={() => onDelete?.(item)}
              containerColor="#FFE6E6"
              iconColor="#D32F2F"
              style={styles.actionBtn}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
}
