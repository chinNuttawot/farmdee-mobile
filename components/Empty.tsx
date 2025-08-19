import React from 'react';
import { Text } from 'react-native-paper';
export default function Empty({ label = 'ไม่มีข้อมูล' }: { label?: string }) {
  return <Text style={{ opacity: 0.5, textAlign: 'center', marginTop: 24 }}>{label}</Text>;
}
