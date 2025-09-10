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
  IconButton,
} from "react-native-paper";
import { Task } from "../../lib/types";
import { STATUS_COLORS } from "../../lib/constants";
import { formatLocalYYYYMMDD } from "../../lib/date";
import { styles } from "../../styles/ui";

type Props = {
  task: Task;
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
};

export default function TaskCard({ task, onEdit, onDelete }: Props) {
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

  const isEditable = task.status === "รอทำ" || task.status === "กำลังทำ";

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

      {/* ปุ่มแก้ไข/ลบ — เฉพาะ "รอทำ" และ "กำลังทำ" */}
      {isEditable && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 8,
            paddingHorizontal: 12,
            paddingTop: 8,
          }}
        >
          <View style={{ backgroundColor: "#FFE082", borderRadius: 12 }}>
            <IconButton
              icon="pencil"
              size={18}
              onPress={() => onEdit?.(task)}
              accessibilityLabel="แก้ไขงาน"
            />
          </View>
          <View style={{ backgroundColor: "#F8BBD0", borderRadius: 12 }}>
            <IconButton
              icon="trash-can"
              size={18}
              onPress={() => onDelete?.(task)}
              accessibilityLabel="ลบงาน"
            />
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 }}>
        <Divider />
      </View>
    </Card>
  );
}
