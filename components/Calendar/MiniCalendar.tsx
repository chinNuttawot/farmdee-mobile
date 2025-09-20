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
  Icon,
} from "react-native-paper";
import { monthMatrix, startOfDay, isSameDay } from "../../lib/date";

// ========= ภาษาไทย =========
const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const TH_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// helper: ทำให้เป็น "เที่ยงวัน local" เพื่อกันวันเพี้ยนตอนแปลงเป็น UTC
function toLocalNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

// เพิ่มตัวเลือกใช้ปี พ.ศ. (ค่าเริ่มต้น = true)
export default function MiniCalendar({
  value,
  onChange,
  useBuddhistYear = true,
}: {
  value: Date;
  onChange: (d: Date) => void;
  useBuddhistYear?: boolean;
}) {
  const theme = useTheme();

  const [viewYear, setViewYear] = useState(value.getFullYear()); // เก็บเป็น ค.ศ.
  const [viewMonth0, setViewMonth0] = useState(value.getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const cells = useMemo(
    () => monthMatrix(viewYear, viewMonth0),
    [viewYear, viewMonth0]
  );

  // today แบบ safe (เที่ยงวัน) เพื่อให้เทียบวันไม่โดน timezone แทรกแซง
  const today = toLocalNoon(new Date());

  const yDisplay = useBuddhistYear ? viewYear + 543 : viewYear;

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
    // ทำให้เป็นเที่ยงวัน local แล้วค่อยยิงออกไป
    const normalizedLocalNoon = toLocalNoon(d);

    // sync เดือน/ปีของมุมมองถ้ากดวันที่ข้ามเดือน/ปี
    if (
      d.getMonth() !== viewMonth0 ||
      d.getFullYear() !== viewYear
    ) {
      setViewMonth0(d.getMonth());
      setViewYear(d.getFullYear());
    }

    onChange(normalizedLocalNoon);
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
              {`${TH_MONTHS[viewMonth0]} ${yDisplay}`}
            </Text>
            <Chip
              compact
              mode="flat"
              style={s.yearChip}
              textStyle={s.yearChipText}
              onPress={() => setYearPickerOpen(true)}
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
        <View style={s.row7}>
          {TH_WEEKDAYS.map((d) => (
            <Text key={d} style={s.weekCell}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid7}>
          {cells.map(({ date, isCurrentMonth }, idx) => {
            // เทียบวันที่แบบไม่โดน timezone: ใช้เที่ยงวันทั้งคู่
            const cellNoon = toLocalNoon(date);
            const isToday = isSameDay(cellNoon, today);
            const isSelected = isSameDay(cellNoon, toLocalNoon(value));
            return (
              <TouchableOpacity
                key={idx}
                style={s.dayCell}
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

      {/* Year picker modal (แสดงปีเป็น พ.ศ. แต่ตั้งค่าเป็น ค.ศ.) */}
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
          <ScrollView style={{ maxHeight: 300 }}>
            {Array.from({ length: 41 }, (_, i) => viewYear - 20 + i).map(
              (yCE) => {
                const label = useBuddhistYear ? yCE + 543 : yCE;
                return (
                  <Button
                    key={yCE}
                    mode="text"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => {
                      setViewYear(yCE); // เก็บเป็น ค.ศ.
                      setYearPickerOpen(false);
                    }}
                  >
                    {label}
                  </Button>
                );
              }
            )}
          </ScrollView>
          <View style={s.yearActions}>
            <Button onPress={() => setYearPickerOpen(false)}>ปิด</Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

/** ===== Styles: 7 คอลัมน์เท่ากัน ===== */
const GAP = 6;
const COL_W = "14.2857%";

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
    paddingBottom: 12,
  },
  calHeaderCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  calMonth: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  yearChip: { borderRadius: 12, paddingHorizontal: 10 },
  yearChipText: { fontWeight: "700" },

  row7: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(GAP / 2),
    marginTop: 6,
    marginBottom: 2,
  },
  weekCell: {
    width: COL_W,
    paddingHorizontal: GAP / 2,
    textAlign: "center",
    fontSize: 11,
    opacity: 0.7,
  },

  grid7: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(GAP / 2),
    marginTop: 2,
  },
  dayCell: {
    width: COL_W,
    paddingHorizontal: GAP / 2,
    paddingVertical: GAP / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  calCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  calCircleToday: { backgroundColor: "#DBEAFE" },
  calCircleSelected: { borderWidth: 2, borderColor: "#2563EB" },

  calDayText: { fontSize: 13, fontWeight: "600" },
  calDayMuted: { opacity: 0.35 },
  calDaySelectedText: { color: "#2563EB", fontWeight: "800" },
  calDayTodayText: { color: "#2563EB", fontWeight: "700" },

  yearModal: { marginHorizontal: 20, padding: 14, borderRadius: 12 },
  yearTitle: { marginBottom: 6, fontWeight: "700" },
  yearActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
});
