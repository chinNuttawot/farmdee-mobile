// components/Tasks/AssigneePickerModal.tsx
import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import {
  Portal,
  Modal,
  Text,
  Card,
  Avatar,
  Chip,
  Button,
  TextInput,
} from "react-native-paper";
import { styles } from "../../styles/ui";
import { AssigneeConfig } from "../../lib/types";
import { CustomCheckbox, LabeledCheckbox } from "../Common/CustomCheckbox";

export default function AssigneePickerModal({
  open,
  onClose,
  initial,
  onConfirm,
  onResetInitial,
  selecteds,
}: {
  open: boolean;
  onClose: () => void;
  initial: AssigneeConfig[];
  selecteds: AssigneeConfig[];
  onConfirm: (cfgs: any[]) => void;
  onResetInitial: () => void; // เรียกเมื่อปิดเพื่อเคลียร์ค่า default รอบถัดไป
}) {
  const [cfgs, setCfgs] = useState<AssigneeConfig[]>();
  useEffect(() => {
    setCfgs(initial);
  }, [open, initial]);

  const toggleSelected = (i: number) => {
    setCfgs((arr) =>
      arr.map((c, idx) => (idx === i ? { ...c, selected: !c.selected } : c))
    );
  };
  const setDefaultMode = (i: number, val: boolean) => {
    setCfgs((arr) =>
      arr.map((c, idx) => (idx === i ? { ...c, useDefault: val } : c))
    );
  };
  const setField = (i: number, key: keyof AssigneeConfig, v: string) => {
    setCfgs((arr) => arr.map((c, idx) => (idx === i ? { ...c, [key]: v } : c)));
  };

  const clearLocalAndClose = () => {
    const blank = initial.map((c) => ({
      ...c,
      selected: false,
      useDefault: true,
      ratePerRai: "",
      repairRate: "",
      dailyRate: c.isDaily ? "" : "",
    }));
    setCfgs(blank);
    onResetInitial();
    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={open}
        onDismiss={clearLocalAndClose}
        contentContainerStyle={styles.assigneeModal}
      >
        <Text
          variant="titleMedium"
          style={{ fontWeight: "800", marginBottom: 8, textAlign: "center" }}
        >
          รายชื่อ
        </Text>

        <ScrollView style={{ maxHeight: 420 }}>
          {cfgs &&
            cfgs.map((c, i) => (
              <Card
                key={c.name}
                mode="outlined"
                style={{ borderRadius: 14, marginBottom: 12 }}
              >
                <Card.Content>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Avatar.Icon
                        size={24}
                        icon="account"
                        style={{ backgroundColor: "#E8F5E9" }}
                        color="#2E7D32"
                      />
                      <Text style={{ fontWeight: "700" }}>{c.name}</Text>
                      {c.isDaily && (
                        <Chip compact style={{ marginLeft: 6 }} mode="flat">
                          รายวัน
                        </Chip>
                      )}
                    </View>
                    <CustomCheckbox
                      checked={c.selected as any}
                      onPress={() => toggleSelected(i)}
                    />
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <LabeledCheckbox
                      label="ใช้ราคาตามตั้งค่า"
                      checked={c.useDefault}
                      onPress={() => setDefaultMode(i, true)}
                    />
                    <LabeledCheckbox
                      label="กำหนดราคาเอง"
                      checked={!c.useDefault}
                      onPress={() => setDefaultMode(i, false)}
                    />

                    <View
                      style={{ opacity: c.useDefault ? 0.5 : 1, marginTop: 4 }}
                    >
                      {c.isDaily ? (
                        <TextInput
                          mode="outlined"
                          label="ราคาต่อวัน / บาท"
                          value={c.dailyRate ?? ""}
                          onChangeText={(v) =>
                            setField(i, "dailyRate", v.replace(/[^0-9.]/g, ""))
                          }
                          keyboardType="numeric"
                          style={styles.input}
                          editable={!c.useDefault}
                        />
                      ) : (
                        <View style={styles.row2}>
                          <TextInput
                            mode="outlined"
                            label="ราคาต่อไร่ / บาท"
                            value={c.ratePerRai ?? ""}
                            onChangeText={(v) =>
                              setField(
                                i,
                                "ratePerRai",
                                v.replace(/[^0-9.]/g, "")
                              )
                            }
                            keyboardType="numeric"
                            style={[styles.input, styles.col]}
                            editable={!c.useDefault}
                          />
                          <TextInput
                            mode="outlined"
                            label="ราคาซ่อม / บาท"
                            value={c.repairRate ?? ""}
                            onChangeText={(v) =>
                              setField(
                                i,
                                "repairRate",
                                v.replace(/[^0-9.]/g, "")
                              )
                            }
                            keyboardType="numeric"
                            style={[styles.input, styles.col]}
                            editable={!c.useDefault}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
        </ScrollView>

        <View style={styles.footerRow}>
          <Button
            mode="outlined"
            onPress={clearLocalAndClose}
            style={styles.footerBtn}
          >
            ยกเลิก
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              const res = cfgs?.filter((v) => v.selected);
              onConfirm(res as AssigneeConfig[]);
              clearLocalAndClose();
            }}
            style={[styles.footerBtn, { backgroundColor: "#2E7D32" }]}
          >
            ตกลง
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
