// components/Common/CustomCheckbox.tsx
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { styles } from "../../styles/ui";

export function CustomCheckbox({
  checked,
  onPress,
  disabled,
  size = 22,
}: {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={[
          styles.cbBox,
          { width: size, height: size, borderRadius: 6 },
          checked && styles.cbBoxChecked,
        ]}
      >
        {checked ? <Text style={styles.cbTick}>✓</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export function LabeledCheckbox({
  label,
  checked,
  onPress,
  disabled,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.optionRow, disabled && { opacity: 0.5 }]}
    >
      <CustomCheckbox checked={checked} onPress={onPress} />
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}
