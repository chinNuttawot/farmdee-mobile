import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function StatsCards({ monthRevenue, monthExpense }: { monthRevenue: number; monthExpense: number; }) {
  return (
    <View style={{ gap: 12 }}>
      <Card><Card.Content><Text variant="titleMedium">รายได้เดือนนี้</Text><Text variant="headlineSmall">{monthRevenue.toLocaleString('th-TH')}</Text></Card.Content></Card>
      <Card><Card.Content><Text variant="titleMedium">ค่าใช้จ่ายเดือนนี้</Text><Text variant="headlineSmall">{monthExpense.toLocaleString('th-TH')}</Text></Card.Content></Card>
    </View>
  );
}
