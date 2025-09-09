// components/Calendar/MiniCalendar.tsx
import React, { useMemo, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import {
  Card,
  IconButton,
  Text,
  Chip,
  Portal,
  Modal,
  Button,
} from "react-native-paper";
import { styles } from "../../styles/ui";
import { MONTH_NAMES } from "../../lib/constants";
import { monthMatrix, startOfDay, isSameDay } from "../../lib/date";

export default function MiniCalendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
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
      <Card style={styles.calCard} elevation={3}>
        <View style={styles.calHeader}>
          <IconButton icon="chevron-left" size={20} onPress={gotoPrev} />
          <View style={styles.calHeaderCenter}>
            <Text
              style={styles.calMonth}
            >{`${MONTH_NAMES[viewMonth0]} ${viewYear}`}</Text>
            <Chip
              compact
              mode="flat"
              icon="calendar"
              style={styles.yearChip}
              textStyle={{ fontWeight: "700" }}
              onPress={() => setYearPickerOpen(true)}
            >
              เลือกปี ▾
            </Chip>
          </View>
          <IconButton icon="chevron-right" size={20} onPress={gotoNext} />
        </View>

        <View style={styles.calWeekRow}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <Text key={d} style={styles.calWeekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {cells.map(({ date, isCurrentMonth }, idx) => {
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, value);
            return (
              <TouchableOpacity
                key={idx}
                style={styles.calCell}
                onPress={() => selectDate(date)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.calCircle,
                    !isSelected && isToday && styles.calCircleToday, // วันนี้ = วงกลมทึบฟ้าอ่อน
                    isSelected && styles.calCircleSelected, // วันที่เลือก = วงแหวน
                  ]}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      !isCurrentMonth && styles.calDayMuted,
                      isSelected && { color: "#2563EB", fontWeight: "800" },
                      !isSelected &&
                        isToday && { color: "#2563EB", fontWeight: "700" },
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

      <Portal>
        <Modal
          visible={yearPickerOpen}
          onDismiss={() => setYearPickerOpen(false)}
          contentContainerStyle={styles.yearModal}
        >
          <Text
            variant="titleMedium"
            style={{ marginBottom: 8, fontWeight: "700" }}
          >
            เลือกปี
          </Text>
          <View style={{ maxHeight: 300 }}>
            {Array.from(
              { length: 41 },
              (_, i) => new Date().getFullYear() - 20 + i
            ).map((y) => (
              <Button
                key={y}
                mode="text"
                onPress={() => {
                  setViewYear(y);
                  setYearPickerOpen(false);
                }}
              >
                {y}
              </Button>
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <Button onPress={() => setYearPickerOpen(false)}>ปิด</Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}
