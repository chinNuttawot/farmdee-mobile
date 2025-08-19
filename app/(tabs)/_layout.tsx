import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: "สรุป" }} />
      <Tabs.Screen name="tasks" options={{ title: "งาน" }} />
      <Tabs.Screen name="clients" options={{ title: "ลูกค้า" }} />
      <Tabs.Screen name="reports" options={{ title: "รายงาน" }} />
      <Tabs.Screen name="finance" options={{ title: "การเงิน" }} />
      <Tabs.Screen name="invoices" options={{ title: "ใบแจ้งหนี้" }} />
      <Tabs.Screen name="rewards" options={{ title: "แต้มสะสม" }} />
    </Tabs>
  );
}
