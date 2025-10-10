import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: 300 }
      }}
    >
      <Drawer.Screen name="index" options={{ title: "App" }} />
      <Drawer.Screen name="previous-chats" options={{ title: "Previous Chats" }} />
    </Drawer>
  );
}
