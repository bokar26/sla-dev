import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GREEN = '#1db954';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#0b0b0b' : '#ffffff';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: scheme === 'dark' ? '#9aa0a6' : '#7a7a7a',
        tabBarStyle: { backgroundColor: bg, borderTopColor: scheme === 'dark' ? '#222' : '#ddd' },
      }}
    >
      {/* 1 Supply Center */}
      <Tabs.Screen
        name="supply"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      {/* 2 Fulfillment */}
      <Tabs.Screen
        name="fulfillment"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      {/* 3 SLA Search (center focal) */}
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={{ backgroundColor: GREEN, padding: 8, borderRadius: 999 }}>
              <Ionicons name="globe-outline" size={size} color="#fff" />
            </View>
          ),
        }}
      />
      {/* 4 Database */}
      <Tabs.Screen
        name="database"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-open-outline" size={size} color={color} />,
        }}
      />
      {/* 5 More */}
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
