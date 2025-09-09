// components/Tasks/TaskCard.tsx
import React from "react";
import { View } from "react-native";
import {
  Card,
  Avatar,
  Text,
  Chip,
  Badge,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { Task } from "../../lib/types";
import { STATUS_COLORS } from "../../lib/constants";
import { formatLocalYYYYMMDD } from "../../lib/date";
import { styles } from "../../styles/ui";

export default function TaskCard({ task }: { task: Task }) {
  const left = (props: any) => (
    <Avatar.Icon
      {...props}
      icon={task.jobType === "งานซ่อม" ? "wrench" : "leaf"}
      size={40}
      color="white"
      style={{ backgroundColor: task.color }}
    />
  );
  const right = () => (
    <View style={{ alignItems: "flex-end" }}>
      <Text
        style={styles.amountText}
      >{`฿ ${task.amount.toLocaleString()}`}</Text>
      <Badge
        style={[styles.badge, { backgroundColor: STATUS_COLORS[task.status] }]}
      >
        {task.status}
      </Badge>
    </View>
  );

  return (
    <Card style={styles.taskCard} elevation={2}>
      <Card.Title
        title={task.title}
        titleNumberOfLines={2}
        left={left}
        right={right}
      />
      <Card.Content style={{ gap: 8 }}>
        <Text style={{ color: "#6B7280" }}>
          {`เริ่ม: ${formatLocalYYYYMMDD(
            task.startDate
          )} • กำหนดส่ง: ${formatLocalYYYYMMDD(task.endDate)}`}
        </Text>
        {task.jobType ? (
          <Chip compact style={styles.tagChip}>
            {task.jobType}
          </Chip>
        ) : null}
        {task.note ? (
          <Text style={{ color: "#6B7280" }}>{task.note}</Text>
        ) : null}
        {task.tags?.length ? (
          <View style={styles.tagRow}>
            {task.tags.map((t) => (
              <Chip key={t} compact elevated style={styles.tagChip}>
                {t}
              </Chip>
            ))}
          </View>
        ) : null}
        {typeof task.progress === "number" ? (
          <View style={{ marginTop: 4 }}>
            <ProgressBar progress={task.progress} />
          </View>
        ) : null}
      </Card.Content>
      <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 }}>
        <Divider />
      </View>
    </Card>
  );
}
