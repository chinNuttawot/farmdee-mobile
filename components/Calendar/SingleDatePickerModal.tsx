// components/Calendar/SingleDatePickerModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { Text, Portal, Modal, IconButton, Button } from "react-native-paper";
import { monthMatrix, isSameDay } from "../../lib/date";
import { TH_MONTHS, TH_WEEKDAYS } from "./MiniCalendar";

const toLocalNoon = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);

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
  const [selected, setSelected] = useState<Date>(toLocalNoon(initialDate));

  useEffect(() => {
    setViewYear(initialDate.getFullYear());
    setViewMonth0(initialDate.getMonth());
    setSelected(toLocalNoon(initialDate));
  }, [open, initialDate]);

  const yDisplay = useBuddhistYear ? viewYear + 543 : viewYear;
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
    setSelected(toLocalNoon(initialDate));
    onClose();
  };
  const handleOk = () => {
    onConfirm(toLocalNoon(selected));
    setSelected(toLocalNoon(initialDate));
  };

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={handleCancel}
        contentContainerStyle={S.modal}
      >
        {/* Header */}
        <View style={S.header}>
          <IconButton icon="chevron-left" size={20} onPress={gotoPrev} />
          <Text
            style={S.monthText}
          >{`${TH_MONTHS[viewMonth0]} ${yDisplay}`}</Text>
          <IconButton icon="chevron-right" size={20} onPress={gotoNext} />
        </View>

        {/* Weekdays */}
        <View style={S.row7}>
          {TH_WEEKDAYS.map((d) => (
            <Text key={d} style={S.weekCell}>
              {d}
            </Text>
          ))}
        </View>

        {/* Days */}
        <View style={S.grid7}>
          {cells.map(({ date, isCurrentMonth }, idx) => {
            const cellNoon = toLocalNoon(date);
            const isSel = isSameDay(cellNoon, selected);
            return (
              <TouchableOpacity
                key={idx}
                style={S.dayCell}
                onPress={() => setSelected(cellNoon)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    S.circle,
                    isSel && S.circleSelected,
                    !isCurrentMonth && S.circleOutMonth,
                  ]}
                >
                  <Text
                    style={[
                      S.dayText,
                      !isCurrentMonth && S.dayMuted,
                      isSel && S.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={S.footerRow}>
          <Button mode="outlined" onPress={handleCancel} style={S.footerBtn}>
            ยกเลิก
          </Button>
          <Button
            mode="contained"
            onPress={handleOk}
            style={[S.footerBtn, S.okBtn]}
          >
            ตกลง
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const GAP = 6;
const COL_W = "14.2857%";

const S = StyleSheet.create({
  modal: {
    alignSelf: "center",
    width: "92%",
    maxWidth: 520,
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 14,
    ...(Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
      default: {},
    }) as object),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  monthText: { fontSize: 18, fontWeight: "800" },

  row7: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(GAP / 2),
    marginBottom: 4,
  },
  weekCell: {
    width: COL_W,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.7,
    fontWeight: "600",
  },

  grid7: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(GAP / 2),
  },
  dayCell: {
    width: COL_W,
    paddingVertical: GAP / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  circleSelected: { borderWidth: 2, borderColor: "#2563EB" },
  circleOutMonth: { opacity: 0.35 },

  dayText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  dayMuted: { color: "#9CA3AF" },
  dayTextSelected: { color: "#2563EB", fontWeight: "800" },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  footerBtn: { flex: 1, borderRadius: 10 },
  okBtn: { backgroundColor: "#2E7D32" },
});
