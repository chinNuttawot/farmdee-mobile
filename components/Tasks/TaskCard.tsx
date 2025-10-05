// components/Tasks/TaskCard.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { View, Animated, Easing } from "react-native";
import {
  Card,
  Text,
  Chip,
  Badge,
  Divider,
  ProgressBar,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Task, StatusType } from "../../lib/types";
import { STATUS_COLORS } from "../../lib/constants";
import { formatAPI } from "../../lib/date";
import { styles } from "../../styles/ui";

type Props = {
  task: Task;
  job_type?: Task; // คงไว้ตามไฟล์เดิม
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

export const TH_Status: any = {
  InProgress: "เริ่มทำ",
  Pending: "กำลังมาถึง",
  Done: "สำเร็จ",
  ทั้งหมด: "ทั้งหมด",
};

const AVATAR_SIZE = 40;
const ICON_SIZE = 26;

/** LeftAvatar (ไอคอน + แอนิเมชันตามสถานะ):
 * - Pending: truck-delivery (แกว่งนิดๆ + เฟด)
 * - InProgress:
 *    - งานซ่อม: wrench หมุน
 *    - งานอื่น: tractor แกว่งซ้าย-ขวา + เอน
 * - Done: check-circle เต้นจังหวะ (scale)
 * - สถานะอื่น/ไม่ตรงเงื่อนไข: ใช้ใบไม้ (leaf) นิ่ง
 */
function LeftAvatar({
  colorBg,
  jobType,
  status,
}: {
  colorBg: string;
  jobType?: string | null;
  status: StatusType;
}) {
  const jt = (jobType ?? "").trim();
  const isRepair = jt === "งานซ่อม";
  const isPending = status === "Pending";
  const isInProgress = status === "InProgress";
  const isDone = status === "Done";

  // แยกแอนิเมชันเป็นตัวๆ ไป
  const animTractor = useRef(new Animated.Value(0)).current; // แกว่ง/เอน
  const animWrench = useRef(new Animated.Value(0)).current; // หมุน
  const animTruck = useRef(new Animated.Value(0)).current; // วิ่ง/เฟด
  const animCheck = useRef(new Animated.Value(0)).current; // scale

  useEffect(() => {
    let loopTractor: Animated.CompositeAnimation | null = null;
    let loopWrench: Animated.CompositeAnimation | null = null;
    let loopTruck: Animated.CompositeAnimation | null = null;
    let loopCheck: Animated.CompositeAnimation | null = null;

    // Tractor (เฉพาะ InProgress + ไม่ใช่งานซ่อม)
    if (isInProgress && !isRepair) {
      loopTractor = Animated.loop(
        Animated.sequence([
          Animated.timing(animTractor, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animTractor, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loopTractor.start();
    } else {
      animTractor.stopAnimation();
      animTractor.setValue(0);
    }

    // Wrench (เฉพาะ InProgress + งานซ่อม)
    if (isInProgress && isRepair) {
      loopWrench = Animated.loop(
        Animated.timing(animWrench, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopWrench.start();
    } else {
      animWrench.stopAnimation();
      animWrench.setValue(0);
    }

    // Truck (เฉพาะ Pending)
    if (isPending) {
      loopTruck = Animated.loop(
        Animated.sequence([
          Animated.timing(animTruck, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animTruck, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loopTruck.start();
    } else {
      animTruck.stopAnimation();
      animTruck.setValue(0);
    }

    // Check (เฉพาะ Done)
    if (isDone) {
      loopCheck = Animated.loop(
        Animated.sequence([
          Animated.timing(animCheck, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animCheck, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loopCheck.start();
    } else {
      animCheck.stopAnimation();
      animCheck.setValue(0);
    }

    return () => {
      loopTractor?.stop?.();
      loopWrench?.stop?.();
      loopTruck?.stop?.();
      loopCheck?.stop?.();
    };
  }, [
    isInProgress,
    isRepair,
    isPending,
    isDone,
    animTractor,
    animWrench,
    animTruck,
    animCheck,
  ]);

  // Tractor transforms
  const translateXTractor = animTractor.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 3],
  });
  const rotateTractor = animTractor.interpolate({
    inputRange: [0, 1],
    outputRange: ["-4deg", "4deg"],
  });

  // Wrench rotation
  const rotateWrench = animWrench.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Truck transforms (แกว่ง + เฟด)
  const translateXTruck = animTruck.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 2],
  });
  const opacityTruck = animTruck.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  // Check scale
  const scaleCheck = animCheck.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });

  // เลือกว่าจะโชว์อะไร
  const showTractor = isInProgress && !isRepair;
  const showWrench = isInProgress && isRepair;
  const showTruck = isPending;
  const showCheck = isDone;

  return (
    <View
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: colorBg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {showTractor ? (
        <Animated.View
          style={{
            transform: [
              { translateX: translateXTractor },
              { rotate: rotateTractor },
            ],
          }}
          accessible
          accessibilityLabel="กำลังทำงาน"
        >
          <MaterialCommunityIcons
            name="tractor"
            size={ICON_SIZE}
            color="white"
          />
        </Animated.View>
      ) : showWrench ? (
        <Animated.View
          style={{ transform: [{ rotate: rotateWrench }] }}
          accessible
          accessibilityLabel="กำลังซ่อม"
        >
          <MaterialCommunityIcons
            name="wrench"
            size={ICON_SIZE}
            color="white"
          />
        </Animated.View>
      ) : showTruck ? (
        <Animated.View
          style={{
            transform: [{ translateX: translateXTruck }],
            opacity: opacityTruck,
          }}
          accessible
          accessibilityLabel="กำลังมาถึง"
        >
          <MaterialCommunityIcons
            name="truck-delivery"
            size={ICON_SIZE}
            color="white"
          />
        </Animated.View>
      ) : showCheck ? (
        <Animated.View
          style={{ transform: [{ scale: scaleCheck }] }}
          accessible
          accessibilityLabel="สำเร็จ"
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={ICON_SIZE}
            color="white"
          />
        </Animated.View>
      ) : (
        <MaterialCommunityIcons
          name="leaf"
          size={ICON_SIZE}
          color="white"
          accessible
          accessibilityLabel="งานไร่"
        />
      )}
    </View>
  );
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onChangeStatus,
  onPress,
}: Props) {
  const color = task.color || STATUS_COLORS[task.status];

  const right = () => (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.amountText}>
        {`฿ ${Number(task.total_amount ?? 0).toLocaleString()}`}
      </Text>
      <Badge
        style={[styles.badge, { backgroundColor: STATUS_COLORS[task.status] }]}
      >
        {TH_Status[task.status]}
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

  const jobType = (task as any).jobType ?? (task as any).job_type ?? null;

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
        left={() => (
          <LeftAvatar colorBg={color} jobType={jobType} status={task.status} />
        )}
        right={right}
      />

      <Card.Content style={{ gap: 8 }}>
        <Text style={{ color: "#6B7280" }}>
          {`เริ่ม: ${formatAPI(task.start_date)} • กำหนดส่ง: ${formatAPI(
            task.end_date
          )}`}
        </Text>

        {jobType ? (
          <Chip compact style={styles.tagChip}>
            {jobType}
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
        {/* เปลี่ยนสถานะ (โชว์เฉพาะตอน dev) */}
        {__DEV__ && (
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
        )}

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
