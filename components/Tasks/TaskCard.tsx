// components/Tasks/TaskCard.tsx
import React, { useMemo } from "react";
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
import { Task, StatusType } from "../../lib/types";
import { STATUS_COLORS } from "../../lib/constants";
import { formatAPI } from "../../lib/date";
import { styles } from "../../styles/ui";

type Props = {
  task: Task;
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
  onChangeStatus?: (t: Task, next: StatusType) => void;
  onPress?: (t: Task) => void;
};

const NEXT_STATUS: Record<Exclude<StatusType, "ทั้งหมด">, StatusType> = {
  Pending: "InProgress",
  InProgress: "Done",
  Done: "Pending",
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onChangeStatus,
  onPress,
}: Props) {
  const color = task.color || STATUS_COLORS[task.status];

  const left = (props: any) => (
    <Avatar.Icon
      {...props}
      icon={task.jobType === "งานซ่อม" ? "wrench" : "leaf"}
      size={40}
      color="white"
      style={{ backgroundColor: color }}
    />
  );

  const right = () => (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.amountText}>
        {`฿ ${Number(task.total_amount ?? 0).toLocaleString()}`}
      </Text>
      <Badge
        style={[styles.badge, { backgroundColor: STATUS_COLORS[task.status] }]}
      >
        {task.status}
      </Badge>
    </View>
  );

  const isEditable = task.status === "Pending" || task.status === "InProgress";
  const hasProgress = typeof task.progress === "number";
  const progress = useMemo(
    () => (hasProgress ? Math.max(0, Math.min(1, Number(task.progress))) : 0),
    [hasProgress, task.progress]
  );

  const handleCycleStatus = () => {
    const cur = task.status as Exclude<StatusType, "ทั้งหมด">;
    const next = NEXT_STATUS[cur] ?? cur;
    onChangeStatus?.(task, next);
  };

  return (
    <Card
      style={styles.taskCard}
      elevation={2}
      onPress={() => onPress?.(task)}
      accessible
      accessibilityRole="button"
    >
      <Card.Title
        title={task.title}
        titleNumberOfLines={2}
        left={left}
        right={right}
      />

      <Card.Content style={{ gap: 8 }}>
        <Text style={{ color: "#6B7280" }}>
          {`เริ่ม: ${formatAPI(
            task.startDate
          )} • กำหนดส่ง: ${formatAPI(task.endDate)}`}
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

        {hasProgress ? (
          <View style={{ marginTop: 4 }}>
            <ProgressBar progress={progress} />
          </View>
        ) : null}
      </Card.Content>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 8,
          paddingHorizontal: 12,
          paddingTop: 8,
        }}
      >
        {/* เปลี่ยนสถานะ */}
        <View
          style={{
            backgroundColor: (color || "#9CA3AF") + "33",
            borderRadius: 12,
          }}
        >
          <IconButton
            icon="repeat"
            size={18}
            onPress={handleCycleStatus}
            accessibilityLabel="เปลี่ยนสถานะ"
          />
        </View>

        {/* แก้ไข/ลบ */}
        {isEditable && (
          <>
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
          </>
        )}
      </View>

      <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 }}>
        <Divider />
      </View>
    </Card>
  );
}
