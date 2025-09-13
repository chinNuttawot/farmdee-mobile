// app/announcementScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
} from "react-native-paper";

type Announcement = {
  id: string;
  title: string;
  enabled: boolean;
  detail?: string;
};

type FormMode = "create" | "edit";

export default function AnnouncementScreen() {
  const theme = useTheme();

  const [rows, setRows] = useState<Announcement[]>([
    {
      id: "1",
      title: "เช็กรถก่อนออกงาน (รถเที่ยว)",
      enabled: true,
      detail: "",
    },
    {
      id: "2",
      title: "ประกาศ 2",
      enabled: false,
      detail: "รายละเอียดประกาศ 2",
    },
    { id: "3", title: "เช็กรถก่อนออกงาน (สิบล้อ)", enabled: true, detail: "" },
  ]);

  // ---- delete modal ----
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Announcement | null>(null);

  // ---- form modal ----
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formTitle, setFormTitle] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState("");

  const toggleRow = (id: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );

  // ----- Create -----
  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormTitle("");
    setFormDetail("");
    setFormOpen(true);
  };

  // ----- Edit -----
  const openEdit = (row: Announcement) => {
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

    if (formMode === "create") {
      const nextId = String(
        rows.length ? Math.max(...rows.map((r) => +r.id)) + 1 : 1
      );
      setRows((prev) => [
        ...prev,
        {
          id: nextId,
          title: formTitle.trim(),
          detail: formDetail.trim(),
          enabled: false,
        },
      ]);
      setFormOpen(false);
      return;
    }

    if (!editingId) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? { ...r, title: formTitle.trim(), detail: formDetail.trim() }
          : r
      )
    );
    setFormOpen(false);
  };

  // ----- Delete -----
  const openConfirm = (row: Announcement) => {
    setSelectedRow(row);
    setConfirmOpen(true);
  };
  const closeConfirm = () => {
    setConfirmOpen(false);
    setSelectedRow(null);
  };
  const deleteItem = async () => {
    if (!selectedRow) return;
    setRows((prev) => prev.filter((r) => r.id !== selectedRow.id));
    closeConfirm();
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Card style={s.card} mode="elevated">
          {rows.map((row, idx) => (
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
          ))}
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

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg("")}
        duration={2000}
      >
        {errorMsg}
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
