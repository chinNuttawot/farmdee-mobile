import React from "react";
import { Searchbar, IconButton } from "react-native-paper";
import { View } from "react-native";
import { styles } from "@/styles/ui";

type Props = {
  value: string;
  onChange: (s: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
};

export default function TaskSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
}: Props) {
  return (
    <View style={{ position: "relative" }}>
      <Searchbar
        placeholder="ค้นหางาน"
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        style={styles.search}
      />
    </View>
  );
}
