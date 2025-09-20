import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2E7D32", // เขียวเมื่อ active
        tabBarInactiveTintColor: "#888", // เทาเมื่อ inactive
      }}
    >
      <Tabs.Screen
        name="emp-dashboard"
        options={{
          title: "งานของฉัน",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="briefcase-check"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="emp-salary"
        options={{
          title: "เงินเดือน",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cash-multiple"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="emp-announcement"
        options={{
          title: "ระเบียบ",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="bullhorn"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="emp-clients"
        options={{
          title: "เพิ่มเติม",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="dots-horizontal-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
