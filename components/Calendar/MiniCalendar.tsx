// components/Calendar/MiniCalendar.tsx
import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import {
  Card,
  IconButton,
  Text,
  Chip,
  Portal,
  Modal,
  Button,
  useTheme,
  Icon, // ✅ ใช้ Icon ของ react-native-paper เพื่อคุมขนาดไอคอนใน Chip
} from "react-native-paper";
import { MONTH_NAMES } from "../../lib/constants";
import { monthMatrix, startOfDay, isSameDay } from "../../lib/date";

export default function MiniCalendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const theme = useTheme();

  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(value.getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const cells = useMemo(
    () => monthMatrix(viewYear, viewMonth0),
    [viewYear, viewMonth0]
  );
  const today = startOfDay(new Date());

  const gotoPrev = () => {
    const d = new Date(viewYear, viewMonth0 - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  };
  const gotoNext = () => {
    const d = new Date(viewYear, viewMonth0 + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  };

  const selectDate = (d: Date) => {
    const normalized = startOfDay(d);
    if (d.getMonth() !== viewMonth0 || d.getFullYear() !== viewYear) {
      setViewMonth0(d.getMonth());
      setViewYear(d.getFullYear());
    }
    onChange(normalized);
  };

  return (
    <>
      <Card
        style={[s.calCard, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        {/* Header */}
        <View style={s.calHeader}>
          <IconButton icon="chevron-left" size={18} onPress={gotoPrev} />
          <View style={s.calHeaderCenter}>
            <Text style={s.calMonth}>
              {`${MONTH_NAMES[viewMonth0]} ${viewYear}`}
            </Text>
            <Chip
              compact
              mode="flat"
              style={s.yearChip}
              textStyle={s.yearChipText}
              onPress={() => setYearPickerOpen(true)}
              // ✅ คุมขนาดไอคอนให้เล็กลงและจัดกึ่งกลางสวย ๆ
              left={(props) => (
                <Icon
                  {...props}
                  source="calendar"
                  size={14}
                  color={theme.colors.primary}
                />
              )}
            >
              เลือกปี ▾
            </Chip>
          </View>
          <IconButton icon="chevron-right" size={18} onPress={gotoNext} />
        </View>

        {/* Weekdays */}
        <View style={s.calWeekRow}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Text key={d} style={s.calWeekday}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={s.calGrid}>
          {cells.map(({ date, isCurrentMonth }, idx) => {
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, value);
            return (
              <TouchableOpacity
                key={idx}
                style={s.calCell}
                onPress={() => selectDate(date)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    s.calCircle,
                    !isSelected && isToday && s.calCircleToday,
                    isSelected && s.calCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      s.calDayText,
                      !isCurrentMonth && s.calDayMuted,
                      isSelected && s.calDaySelectedText,
                      !isSelected && isToday && s.calDayTodayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Year picker modal */}
      <Portal>
        <Modal
          visible={yearPickerOpen}
          onDismiss={() => setYearPickerOpen(false)}
          contentContainerStyle={[
            s.yearModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={s.yearTitle}>
            เลือกปี
          </Text>

          {/* เลื่อนรายการปีได้ ไม่ตกหน้าจอ */}
          <ScrollView style={{ maxHeight: 300 }}>
            {Array.from(
              { length: 41 },
              (_, i) => new Date().getFullYear() - 20 + i
            ).map((y) => (
              <Button
                key={y}
                mode="text"
                style={{ alignSelf: "flex-start" }}
                onPress={() => {
                  setViewYear(y);
                  setYearPickerOpen(false);
                }}
              >
                {y}
              </Button>
            ))}
          </ScrollView>

          <View style={s.yearActions}>
            <Button onPress={() => setYearPickerOpen(false)}>ปิด</Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

/** ==== Compact Styles (ประมาณ 85–90% ของเดิม) ==== */
const CELL = 36;
const CIRCLE = 28;
const GAP = 4;

const s = StyleSheet.create({
  calCard: {
    borderRadius: 14,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    marginHorizontal: 10,
    marginVertical: 8,
    marginBottom: 32,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12, // ⬆️ เพิ่มช่องว่าง กันชิปตกชนแถววัน
  },
  calHeaderCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  calMonth: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6, // เว้นกับชิปมากขึ้นเล็กน้อย
  },
  yearChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  yearChipText: {
    fontWeight: "700",
  },

  calWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8, // ⬆️ เพิ่ม margin ป้องกันการชนแน่นอน
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  calWeekday: {
    width: CELL,
    textAlign: "center",
    fontSize: 11,
    opacity: 0.7,
  },

  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: GAP,
    columnGap: GAP,
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  calCell: {
    width: CELL,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
  },
  calCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  calCircleToday: {
    backgroundColor: "#DBEAFE",
  },
  calCircleSelected: {
    borderWidth: 2,
    borderColor: "#2563EB",
  },

  calDayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  calDayMuted: { opacity: 0.35 },
  calDaySelectedText: { color: "#2563EB", fontWeight: "800" },
  calDayTodayText: { color: "#2563EB", fontWeight: "700" },

  yearModal: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
  },
  yearTitle: { marginBottom: 6, fontWeight: "700" },
  yearActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
});
