// app/announcementScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import {
  Card,
  List,
  Switch,
  FAB,
  useTheme,
  Divider,
  IconButton,
  Text,
  Portal,
  Modal,
  Button,
  TextInput,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";

// ===== Services (ต้องมีใน "@/service")
import {
  createAnnouncementService,
  deleteAnnouncementService,
  getAnnouncementsService,
  toggleAnnouncementService,
  updateAnnouncementService,
} from "@/service";

type BackendAnnouncement = {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AnnouncementRow = {
  id: number;
  title: string;
  enabled: boolean;
  detail: string;
};

type FormMode = "create" | "edit";

export default function AnnouncementScreen() {
  const theme = useTheme();

  // ===== State =====
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ---- delete modal ----
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AnnouncementRow | null>(null);

  // ---- form modal ----
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formTitle, setFormTitle] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // ===== Mappers =====
  const mapToRow = (b: BackendAnnouncement): AnnouncementRow => ({
    id: b.id,
    title: b.title ?? "",
    detail: b.content ?? "",
    enabled: !!b.is_active,
  });

  // ===== Load data =====
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAnnouncementsService(); // expect { ok, message, data: BackendAnnouncement[] }
      const list: AnnouncementRow[] = (data.items ?? []).map(mapToRow);
      setRows(list);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "โหลดข้อมูลประกาศไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await getAnnouncementsService();
      const list: AnnouncementRow[] = (data.items ?? []).map(mapToRow);
      setRows(list);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "รีเฟรชไม่สำเร็จ");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ===== List actions =====
  const toggleRow = async (id: number) => {
    try {
      await toggleAnnouncementService(id); // server จะ flip is_active เอง
      setInfoMsg("อัปเดตสถานะประกาศแล้ว");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      await onRefresh();
    }
  };

  // ===== Form actions =====
  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormTitle("");
    setFormDetail("");
    setFormOpen(true);
  };

  const openEdit = (row: AnnouncementRow) => {
    setFormMode("edit");
    setEditingId(row.id);
    setFormTitle(row.title ?? "");
    setFormDetail(row.detail ?? "");
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const saveForm = async () => {
    if (!formTitle.trim()) {
      setErrorMsg("กรุณากรอกหัวข้อประกาศ");
      return;
    }

    try {
      if (formMode === "create") {
        const payload = { title: formTitle.trim(), content: formDetail.trim() };
        await createAnnouncementService(payload);
        setInfoMsg("สร้างประกาศสำเร็จ");
        setFormOpen(false);
        return;
      }
      // edit
      if (!editingId) return;
      const updatingRow = rows.find((r) => r.id === editingId);
      const payload = {
        title: formTitle.trim(),
        content: formDetail.trim(),
        is_active: updatingRow?.enabled ?? true,
        id: editingId,
      };
      await updateAnnouncementService(payload);
      setInfoMsg("บันทึกการแก้ไขแล้ว");
      setFormOpen(false);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "บันทึกประกาศไม่สำเร็จ");
    } finally {
      await onRefresh();
    }
  };

  // ===== Delete actions =====
  const openConfirm = (row: AnnouncementRow) => {
    setSelectedRow(row);
    setConfirmOpen(true);
  };
  const closeConfirm = () => {
    setConfirmOpen(false);
    setSelectedRow(null);
  };
  const deleteItem = async () => {
    if (!selectedRow) return;
    const targetId = selectedRow.id;

    // optimistic remove
    const backup = rows;
    setRows((prev) => prev.filter((r) => r.id !== targetId));

    try {
      await deleteAnnouncementService(targetId);
      setInfoMsg("ลบประกาศแล้ว");
      closeConfirm();
    } catch (e: any) {
      // rollback
      setRows(backup);
      setErrorMsg(e?.message ?? "ลบประกาศไม่สำเร็จ");
      closeConfirm();
    }
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={s.card} mode="elevated">
          {loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>กำลังโหลดประกาศ…</Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text>ยังไม่มีประกาศ</Text>
            </View>
          ) : (
            rows.map((row, idx) => (
              <View key={row.id}>
                <List.Item
                  title={row.title}
                  description={row.detail ? row.detail : undefined}
                  onLongPress={() => openConfirm(row)} // กดค้างเพื่อลบ
                  onPress={() => openEdit(row)} // แตะเพื่อแก้ไข
                  titleStyle={s.title}
                  style={s.item}
                  right={() => (
                    <View style={s.rightWrap}>
                      <Switch
                        value={row.enabled}
                        onValueChange={() => toggleRow(row.id)}
                        color={theme.colors.primary}
                      />
                      {/* เอาปุ่มดินสอออก เหลือ chevron อย่างเดียว */}
                      <IconButton
                        icon="chevron-right"
                        size={22}
                        onPress={() => openEdit(row)}
                      />
                    </View>
                  )}
                />
                {idx < rows.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        onPress={openCreate}
        style={s.fab}
        size="medium"
        color="white"
        customSize={56}
      />

      {/* ====== Form Modal (Create/Edit) ====== */}
      <Portal>
        <Modal
          visible={formOpen}
          onDismiss={closeForm}
          contentContainerStyle={s.createModalContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={s.createCard}>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={s.sectionLabel}>
                  {formMode === "edit" ? "แก้ไขประกาศ" : "หัวข้อประกาศ"}
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="เช่น แจ้งปรับเงินเดือนประจำปี"
                  value={formTitle}
                  onChangeText={setFormTitle}
                  style={s.input}
                />

                <Text style={[s.sectionLabel, { marginTop: 12 }]}>
                  รายละเอียด
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="พิมพ์รายละเอียดประกาศ…"
                  value={formDetail}
                  onChangeText={setFormDetail}
                  multiline
                  numberOfLines={6}
                  style={[s.input, s.textArea]}
                />

                <View style={s.actionRow}>
                  <Button
                    mode="contained-tonal"
                    style={[s.btn, s.btnCancelSoft]}
                    labelStyle={s.btnLabel}
                    onPress={closeForm}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    mode="contained"
                    style={[s.btn, s.btnSave]}
                    labelStyle={s.btnLabel}
                    onPress={saveForm}
                  >
                    {formMode === "edit" ? "บันทึกการแก้ไข" : "บันทึก"}
                  </Button>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      {/* ====== Confirm Delete Modal ====== */}
      <Portal>
        <Modal
          visible={confirmOpen}
          onDismiss={closeConfirm}
          contentContainerStyle={s.modalContainer}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              ต้องการ <Text style={s.textDanger}>ลบ</Text> หัวข้อประกาศ
            </Text>
            <Text style={s.modalQuote}>“ {selectedRow?.title ?? ""} ”</Text>

            <View style={s.btnRow}>
              <Button
                mode="contained-tonal"
                style={[s.btn, s.btnCancel]}
                labelStyle={s.btnLabel}
                onPress={closeConfirm}
              >
                ยกเลิก
              </Button>
              <Button
                mode="contained"
                style={[s.btn, s.btnDelete]}
                labelStyle={s.btnLabel}
                onPress={deleteItem}
              >
                ตกลง
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Snackbars */}
      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg("")}
        duration={2200}
      >
        {errorMsg}
      </Snackbar>
      <Snackbar
        visible={!!infoMsg}
        onDismiss={() => setInfoMsg("")}
        duration={1800}
      >
        {infoMsg}
      </Snackbar>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FBF6" },
  content: { padding: 16 },
  card: { borderRadius: 12, overflow: "hidden" },
  item: { paddingVertical: 6, paddingRight: 4 },
  title: { fontSize: 14, fontWeight: "700" },
  rightWrap: { flexDirection: "row", alignItems: "center", gap: 2 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    backgroundColor: "#6C63FF",
    elevation: 6,
  },

  // ----- Form modal styles -----
  createModalContainer: { padding: 24, justifyContent: "center" },
  createCard: {
    backgroundColor: "#EEF6EE",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sectionLabel: { fontWeight: "800", color: "#1F2937", marginBottom: 6 },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
  },
  textArea: { minHeight: 140 },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 6,
  },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 6 },
  btnCancelSoft: { backgroundColor: "#E5EDE7" },
  btnSave: { backgroundColor: "#2E7D32" },

  // ----- Delete modal styles -----
  modalContainer: { padding: 24, justifyContent: "center" },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  textDanger: { color: "#E53935", fontWeight: "900" },
  modalQuote: {
    textAlign: "center",
    marginTop: 10,
    marginBottom: 18,
    fontSize: 15,
    color: "#374151",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 4,
  },
  btnCancel: { backgroundColor: "#E5EDE7" },
  btnDelete: { backgroundColor: "#FF2D2D" },
  btnLabel: { fontWeight: "700" },
});
