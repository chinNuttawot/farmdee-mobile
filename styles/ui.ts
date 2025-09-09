// styles/ui.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    /* ===== Calendar (new look) ===== */
    calCard: {
        borderRadius: 24,
        paddingVertical: 10,
        paddingBottom: 14,
        marginBottom: 16,
        backgroundColor: "#F3EEFA", // ม่วงอ่อนตามภาพ
    },
    calHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingTop: 6,
        paddingBottom: 10,
        borderBottomWidth: 0, // ไม่มีเส้นคั่น
    },
    calHeaderCenter: { alignItems: "center", gap: 6 },
    calMonth: { fontWeight: "800", fontSize: 22 }, // ใหญ่และหนา
    yearChip: {
        borderRadius: 999,
        height: 28,
        backgroundColor: "#EDE7F6", // pill สีม่วงอ่อน
    },

    calWeekRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingTop: 6,
        marginTop: 2,
    },
    calWeekday: {
        width: `${100 / 7}%`,
        textAlign: "center",
        fontSize: 12,
        color: "#9AA0A6", // เทาอ่อน
        fontWeight: "600",
    },

    calGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 14,
    },
    calCell: {
        width: `${100 / 7}%`,
        paddingVertical: 8,
        alignItems: "center",
    },

    // วงกลมของตัวเลขวัน
    calCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    calCircleSelected: {
        borderWidth: 2,
        borderColor: "#2563EB", // วงแหวนฟ้า
        backgroundColor: "transparent",
    },
    calCircleToday: {
        backgroundColor: "#E9F1FF", // ฟ้าอ่อน (วันนี้)
    },

    calDayText: { fontSize: 16, color: "#24292F" },
    calDayMuted: { color: "#C0C4CC" }, // วันของเดือนอื่น

    /* ===== (ของเดิมที่ใช้ร่วม) ===== */
    yearModal: { backgroundColor: "white", marginHorizontal: 24, padding: 16, borderRadius: 16 },
    rangeModal: { backgroundColor: "white", marginHorizontal: 16, padding: 16, borderRadius: 16 },

    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
    filterChip: { borderRadius: 999, backgroundColor: "#EDE7F6" },
    search: { borderRadius: 14, marginBottom: 8 },

    taskCard: { borderRadius: 16, overflow: "hidden" },
    amountText: { fontWeight: "800", fontSize: 16, marginRight: 12, marginTop: 8 },
    badge: { alignSelf: "flex-end", marginTop: 6 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-start" },
    tagChip: { height: 28, borderRadius: 999 },

    emptyCard: { borderRadius: 16, paddingVertical: 8 },

    createModal: { backgroundColor: "#F7F7FB", marginHorizontal: 16, padding: 16, borderRadius: 16 },
    input: { marginBottom: 12, borderRadius: 12 },
    sectionLabel: { marginBottom: 6, fontWeight: "700", color: "#5A5F67" },
    row2: { flexDirection: "row", gap: 12, marginBottom: 12 },
    col: { flex: 1 },

    assigneeModal: { backgroundColor: "#F7F7FB", marginHorizontal: 16, padding: 16, borderRadius: 16 },
    optionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },

    cbBox: { borderWidth: 2, borderColor: "#C7CCD6", backgroundColor: "white", alignItems: "center", justifyContent: "center" },
    cbBoxChecked: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
    cbTick: { color: "white", fontSize: 14, fontWeight: "900", lineHeight: 14 },

    footerRow: { flexDirection: "row", gap: 12, marginTop: 10 },
    footerBtn: { flex: 1, borderRadius: 999 },

    fab: { position: "absolute", right: 20, bottom: 28, backgroundColor: "#6C63FF", elevation: 6 },
});
