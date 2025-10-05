// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { StyleSheet, View, StatusBar, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "../context/AuthContext";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ---- THEME (Agriculture / Farm) ----
export const PRIMARY = "#3E9B4F";
export const BG = "#F6FBF6";
export const OUTLINE = "#C9DEC9";

const farmTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: PRIMARY,
    background: BG,
    surface: "#FFFFFF",
    outline: OUTLINE,
  },
};

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <PaperProvider theme={farmTheme}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            {/* SafeArea ด้านบน */}
            <SafeAreaView
              edges={["top"]}
              style={[styles.topArea, { backgroundColor: PRIMARY }]}
            >
              <StatusBar
                barStyle="light-content"
                backgroundColor={PRIMARY}
                translucent={false}
              />
            </SafeAreaView>

            {/* เนื้อหา */}
            <View
              style={[
                styles.appArea,
                { backgroundColor: farmTheme.colors.background },
              ]}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  headerBackTitleVisible: false,
                  headerShadowVisible: false,
                  headerTitleAlign: "center",
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(employee)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="reports/index"
                  options={{
                    title: "สถิติ & รายงาน",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="salary/index"
                  options={{
                    title: "การเงิน",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="reportsMonthlyScreen/index"
                  options={{
                    title: "รายเดือน",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="configSalary/index"
                  options={({ route }) => ({
                    title: route.params?.employeeName ?? "",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  })}
                />
                <Stack.Screen
                  name="evaluateEmployee/index"
                  options={({ route }) => ({
                    title: route.params?.employeeName ?? "",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  })}
                />
                <Stack.Screen
                  name="employee/index"
                  options={{
                    title: "รายชื่อพนักงาน",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="announcementScreen/index"
                  options={{
                    title: "ประกาศ",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="invoices/index"
                  options={{
                    title: "ใบแจ้งหนี้",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="rewards/index"
                  options={{
                    title: "แต้มสะสม",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="employee/evaluations"
                  options={{
                    title: "การประเมินพนักงาน",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
                <Stack.Screen
                  name="employee/evaluateEmployee"
                  options={{
                    title: "การประเมินพนักงาน",
                    headerShown: true,
                    headerStyle: { backgroundColor: PRIMARY },
                    headerTintColor: "#fff",
                  }}
                />
              </Stack>
            </View>
            {Platform.OS === "android" && (
              <SafeAreaView
                edges={["bottom"]}
                style={{ backgroundColor: "#FFFFFF" }}
              />
            )}
          </GestureHandlerRootView>
        </QueryClientProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  topArea: {},
  appArea: { flex: 1 },
});
