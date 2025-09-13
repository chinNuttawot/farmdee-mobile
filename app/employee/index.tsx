import React, { useMemo, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { TextInput, Text, Divider, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "@/node_modules/expo-router/build/hooks";
import { useNavigation } from "@/node_modules/expo-router/build/useNavigation";

type Employee = { id: string; name: string };

const DATA: Employee[] = [
  { id: "1", name: "นายสมศักดิ์" },
  { id: "2", name: "นางสาวกนกมล" },
  { id: "3", name: "นายประทับ" },
  { id: "4", name: "นางสาววรรณา" },
  { id: "5", name: "นายวิทูรย์" },
  { id: "6", name: "นางสาวลลิษา" },
];

export default function EmployeeScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const navigation = useNavigation();
  const { menuName } = useLocalSearchParams<{ menuName?: string }>();
  const list = useMemo(
    () => DATA.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  const goSalary = (name) => {
    router.push({
      pathname: `/${menuName}`,
      params: { name },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerWrap}>
        {/* ค้นหา */}
        <TextInput
          mode="flat"
          placeholder="ค้นหาชื่อพนักงาน"
          value={q}
          onChangeText={setQ}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.search}
          underlineColor="transparent"
          theme={{ colors: { background: "#fff" } }}
        />

        {/* Card ใหญ่ รวมทุกแถว */}
        <View style={styles.card}>
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider style={styles.divider} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => goSalary(item.name)}
                activeOpacity={0.7}
              >
                {/* ไอคอนวงกลมซ้าย */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarIcon}>👤</Text>
                </View>

                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>

                <IconButton
                  icon="chevron-right"
                  size={22}
                  style={styles.chevron}
                  onPress={() => goSalary(item.name)}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </View>
  );
}

const RADIUS = 14;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F7F1" },
  centerWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    alignSelf: "center",
    width: "100%",
    maxWidth: 480,
  },
  search: {
    borderRadius: RADIUS,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS,
    paddingVertical: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: { marginLeft: 60, opacity: 0.4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#F0F1F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarIcon: { fontSize: 18 },
  name: { flex: 1, fontSize: 16, fontWeight: "600", color: "#2A2A2A" },
  chevron: { margin: 0 },
});
