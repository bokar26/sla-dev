import { Tabs } from "expo-router";

export default function SavedLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#16a34a" }}>
      <Tabs.Screen name="index" options={{ title: "Suppliers" }} />
      <Tabs.Screen name="factories" options={{ title: "Factories" }} />
    </Tabs>
  );
}
