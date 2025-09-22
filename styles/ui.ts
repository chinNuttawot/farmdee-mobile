// styles/ui.ts
import { Platform, StyleSheet } from "react-native";

const shadow = Platform.select({
    ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 3 },
});

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
    badge: { alignSelf: "flex-end", marginTop: 6, marginRight: 12 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-start" },
    tagChip: { borderRadius: 999 },

    emptyCard: { borderRadius: 16, paddingVertical: 8 },

    createModal: { backgroundColor: "#F7F7FB", marginHorizontal: 16, padding: 16, borderRadius: 16 },
    input: { marginBottom: 12, borderRadius: 12, fontSize: 14 },
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
    topBar: { padding: 16, paddingBottom: 0, gap: 6 },
    summaryCard: {
        borderRadius: 16,
        backgroundColor: "white",
    },
    summaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    amountPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "#E8F5E9",
    },
    summaryRow: {
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryLine: { flexDirection: "row", alignItems: "center", gap: 8 },
    summaryLabel: { fontWeight: "700", opacity: 0.8 },
    summaryValue: { fontWeight: "800", opacity: 0.9 },

    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
    },

    card: { borderRadius: 16 },
    emptyWrap: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },

    actionRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 6,
        marginTop: 4,
    },
    actionBtn: {
        borderRadius: 12,
        marginHorizontal: 2,
        ...(shadow as any),
    },
    hideStyle: { backgroundColor: "#d3d2d2ff", },
    // FAB แบบในภาพ
    fabWrap: {
        position: "absolute",
        right: 16,
        bottom: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 8,
        ...(Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.16,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
            },
            android: { elevation: 8 },
        }) as any),
    },
    fabInside: {
        backgroundColor: "#7C4DFF",
        borderRadius: 28,
    },

    // ===== Modal styles (เวอร์ชัน UI เดิมสีพาสเทล) =====
    dialog: {
        borderRadius: 20,
        backgroundColor: "#F9F7FF", // ม่วงอ่อน
    },
    dialogTitle: {
        fontWeight: "800",
    },
    dialogContent: {
        gap: 14,
    },
    fieldLabel: {
        fontWeight: "600",
        marginBottom: -6,
    },
    inputSoft: {
        backgroundColor: "#F0F7EB", // เขียวอ่อน
        borderRadius: 12,
    },

    // segmented look ด้วย Chip (เวอร์ชันเดิม)
    segmentWrap: {
        flexDirection: "row",
        backgroundColor: "#ECE8FF",
        padding: 4,
        borderRadius: 12,
        gap: 6,
    },
    segmentChip: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: "transparent",
    },
    segmentChipSelected: {
        backgroundColor: "#FFFFFF",
    },
    segmentText: { textAlign: "center", color: "#6B6B6B", fontWeight: "700" },
    segmentTextSelected: { color: "#7C4DFF" },

    dialogActions: {
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    btnCancel: {
        flex: 1,
        marginRight: 6,
        borderRadius: 12,
        borderColor: "#CFCFCF",
    },
    btnSave: {
        flex: 1,
        marginLeft: 6,
        borderRadius: 12,
        backgroundColor: "#2E7D32",
    },

    /* ===== AddExpenseDialog v2 (outlined) — ใช้กับเวอร์ชันใหม่ก็ได้ ===== */
    dialogV2: {
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
    },
    dialogTitleV2: {
        fontWeight: "800",
        paddingBottom: 0,
    },
    dialogContentV2: {
        paddingTop: 6,
    },
    fieldLabelV2: {
        marginTop: 6,
        marginBottom: 6,
        color: "#6B7280",
        fontSize: 13,
        fontWeight: "600",
    },
    inputOutlined: {
        marginBottom: 10,
        backgroundColor: "white",
        borderRadius: 12,
    },
    segmentWrapV2: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
        justifyContent: "center"
    },
    segmentChipV2: {
        borderWidth: 1,
        backgroundColor: "#F3F4F6",
        borderColor: "#E5E7EB",
    },
    segmentTextV2: {
        color: "#374151",
        fontWeight: "600",
    },
    dialogActionsV2: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        justifyContent: "flex-end",
        gap: 10,
        flexDirection: "row",
    },
    btnV2: {
        borderRadius: 10,
    },
    btnPrimaryV2: {
        backgroundColor: "#2E7D32",
    },
});
