import React from "react";
import { Appbar, useTheme } from "react-native-paper";
import { StyleSheet, Platform } from "react-native";

type Props = {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  color?: string;
};

export default function Header({ title, onBack, rightAction }: Props) {
  const theme = useTheme();

  return (
    <Appbar.Header
      style={[styles.header, { backgroundColor: theme.colors.primary }]}
    >
      {/* ปุ่มย้อนกลับ */}
      {onBack && <Appbar.BackAction color="white" onPress={onBack} />}

      {/* ชื่อ Title */}
      {title && (
        <Appbar.Content
          title={title}
          titleStyle={styles.title}
          style={{ alignItems: "center", justifyContent: "center" }}
        />
      )}

      {/* ปุ่มด้านขวา */}
      {rightAction}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    height: Platform.OS === "android" ? 40 : 0,
  },
  title: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },
});
