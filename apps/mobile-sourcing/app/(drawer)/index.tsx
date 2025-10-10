import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "expo-router";

export default function TabsLayout() {
  const nav = useNavigation<any>();
  
  return (
    <View style={{ flex: 1 }}>
      {/* Header with hamburger */}
      <View style={{ height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
        <Pressable onPress={() => nav.openDrawer?.()}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </Pressable>
        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: "600" }}>SLA – Sourcing Simplified</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="search" options={{ title: "SLA Search" }} />
          <Tabs.Screen name="saved" options={{ title: "Saved" }} />
          <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
      </View>
    </View>
  );
}
