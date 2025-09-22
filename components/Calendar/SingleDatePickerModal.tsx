// components/Calendar/SingleDatePickerModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import {
  Text,
  Portal,
  Modal,
  Chip,
  IconButton,
  Button,
} from "react-native-paper";
import { styles } from "../../styles/ui";
import { monthMatrix, startOfDay, isSameDay } from "../../lib/date";
import { TH_MONTHS, TH_WEEKDAYS } from "./MiniCalendar";

export default function SingleDatePickerModal({
  open,
  onClose,
  initialDate,
  onConfirm,
  useBuddhistYear = true,
}: {
  open: boolean;
  onClose: () => void;
  initialDate: Date;
  onConfirm: (d: Date) => void;
  useBuddhistYear?: boolean;
}) {
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(initialDate.getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Date>(startOfDay(initialDate));
  const yDisplay = useBuddhistYear ? viewYear + 543 : viewYear;

  useEffect(() => {
    setViewYear(initialDate.getFullYear());
    setViewMonth0(initialDate.getMonth());
    setSelected(startOfDay(initialDate));
  }, [open, initialDate]);

  const cells = useMemo(
    () => monthMatrix(viewYear, viewMonth0),
    [viewYear, viewMonth0]
  );

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

  const handleCancel = () => {
    setSelected(startOfDay(initialDate));
    onClose();
  };
  const handleOk = () => {
    onConfirm(selected);
    setSelected(startOfDay(initialDate));
  };

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={handleCancel}
        contentContainerStyle={styles.rangeModal}
      >
        <Text
          variant="titleMedium"
          style={{ fontWeight: "800", marginBottom: 8 }}
        >
          เลือกวันที่
        </Text>

        <View style={[styles.calHeader, { borderBottomColor: "#E5E7EB" }]}>
          <IconButton icon="chevron-left" size={20} onPress={gotoPrev} />
          <View style={styles.calHeaderCenter}>
            <Text style={styles.calMonth}>
              {`${TH_MONTHS[viewMonth0]} ${yDisplay}`}
            </Text>
            <Chip
              compact
              onPress={() => setYearPickerOpen(true)}
              style={styles.yearChip}
              icon="calendar"
            >
              เลือกปี ▾
            </Chip>
          </View>
          <IconButton icon="chevron-right" size={20} onPress={gotoNext} />
        </View>

        {/* ✅ ใช้ชื่อวันแบบไทยเหมือน MiniCalendar */}
        <View style={styles.calWeekRow}>
          {TH_WEEKDAYS.map((d) => (
            <Text key={d} style={styles.calWeekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {cells.map(({ date, isCurrentMonth }, idx) => {
            const isSel = isSameDay(date, selected);
            return (
              <TouchableOpacity
                key={idx}
                style={styles.calCell}
                onPress={() => setSelected(startOfDay(date))}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.calPill,
                    isSel && {
                      backgroundColor: "#1E88E522",
                      borderColor: "#1E88E5",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      !isCurrentMonth && { color: "#B0B4BB" },
                      isSel && { color: "#1E88E5", fontWeight: "800" },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.footerBtn}
          >
            ยกเลิก
          </Button>
          <Button
            mode="contained"
            onPress={handleOk}
            style={[styles.footerBtn, { backgroundColor: "#2E7D32" }]}
          >
            ตกลง
          </Button>
        </View>

        {/* ✅ Year picker: แสดง label เป็น พ.ศ. ถ้าเลือกใช้ */}
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
              ).map((yCE) => {
                const label = useBuddhistYear ? yCE + 543 : yCE;
                return (
                  <Button
                    key={yCE}
                    mode="text"
                    onPress={() => {
                      setViewYear(yCE); // เก็บเป็น ค.ศ.
                      setYearPickerOpen(false);
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
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
      </Modal>
    </Portal>
  );
}
