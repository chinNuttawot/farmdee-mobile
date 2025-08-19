// app/(tabs)/clients.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  Linking,
} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  Card,
  Text,
  Avatar,
  IconButton,
  useTheme,
  Snackbar,
  HelperText,
} from "react-native-paper";
import Header from "../../components/Header";
import Empty from "../../components/Empty";

type Client = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
};

export default function Clients() {
  const theme = useTheme();

  const [rows, setRows] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [snack, setSnack] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  // mock load
  const load = async () => {
    setRows([
      { id: "1", name: "ร้านผักบ้านสวน", phone: "0812345678", address: "อ.เมือง, เชียงใหม่" },
      { id: "2", name: "ตลาดชุมชนวันพุธ", phone: "0891112222" },
    ]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.phone?.includes(t) ||
        c.address?.toLowerCase().includes(t)
    );
  }, [rows, q]);

  const initial = (s: string) =>
    s
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const add = async () => {
    if (!name.trim()) {
      setSnack({ visible: true, msg: "กรุณากรอกชื่อ" });
      return;
    }
    setRows((prev) => [
      {
        id: String(Date.now()),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
      ...prev,
    ]);
    setName("");
    setPhone("");
    setAddress("");
    setOpen(false);
  };

  const renderItem = ({ item }: ListRenderItemInfo<Client>) => (
    <Card style={styles.card} elevation={2}>
      <Card.Title
        title={item.name}
        titleNumberOfLines={1}
        subtitle={
          [item.phone ? `โทร: ${item.phone}` : "", item.address || ""]
            .filter(Boolean)
            .join(" • ")
        }
        left={(props) => (
          <Avatar.Text
            {...props}
            size={42}
            label={initial(item.name)}
            style={{ backgroundColor: `${theme.colors.primary}20` }}
            color={theme.colors.primary}
          />
        )}
        right={() => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {!!item.phone && (
              <IconButton
                icon="phone"
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              />
            )}
            <IconButton icon="map-marker-outline" onPress={() => {}} />
          </View>
        )}
      />
    </Card>
  );

  return (
    <>
      <Header title="ลูกค้า / โครงการ" />

      <FlatList
        ListHeaderComponent={
          <View style={styles.top}>
            <TextInput
              mode="outlined"
              placeholder="ค้นหาชื่อ / เบอร์ / ที่อยู่"
              value={q}
              onChangeText={setQ}
              left={<TextInput.Icon icon="magnify" />}
            />
            <Text style={{ marginTop: 8, opacity: 0.6 }}>
              พบ {filtered.length} รายการ
            </Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 8 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Empty />}
      />

      <View style={{ padding: 16 }}>
        <Button mode="contained" onPress={() => setOpen(true)}>
          + เพิ่มลูกค้า
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={{ borderRadius: 12 }}
        >
          <Dialog.Title>เพิ่มลูกค้า</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <TextInput
              mode="outlined"
              label="ชื่อ"
              value={name}
              onChangeText={setName}
              left={<TextInput.Icon icon="account-outline" />}
            />
            <HelperText type="error" visible={!name.trim()}>
              * จำเป็นต้องกรอกชื่อ
            </HelperText>

            <TextInput
              mode="outlined"
              label="เบอร์"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ""))}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
            />
            <TextInput
              mode="outlined"
              label="ที่อยู่"
              value={address}
              onChangeText={setAddress}
              left={<TextInput.Icon icon="home-outline" />}
              multiline
              numberOfLines={2}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>ยกเลิก</Button>
            <Button mode="contained" onPress={add}>
              บันทึก
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, msg: "" })}
        duration={2200}
      >
        {snack.msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  top: { padding: 16, paddingBottom: 8, gap: 8 },
  card: { borderRadius: 16, marginBottom: 8 },
});
