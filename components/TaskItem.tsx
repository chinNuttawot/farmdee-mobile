import React from 'react';
import { Card, Text } from 'react-native-paper';
import { Task } from '../types/models';
export default function TaskItem({ t }: { t: Task }) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <Card.Content>
        <Text variant="titleMedium">{t.title}</Text>
        <Text variant="bodySmall">สถานะ: {t.status}</Text>
        {t.price ? <Text variant="bodySmall">ราคา: {t.price}</Text> : null}
      </Card.Content>
    </Card>
  );
}
