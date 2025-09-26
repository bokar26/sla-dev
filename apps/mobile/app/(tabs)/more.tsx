import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';

const rows = [
  { key: 'orders', label: 'Orders' },
  { key: 'finances', label: 'Finances' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'account', label: 'Account' },
  { key: 'settings', label: 'Settings' },
];

export default function More() {
  return (
    <Screen>
      <Text style={{ fontSize:24, fontWeight:'700' }}>More</Text>
      <Card>
        <View style={{ gap: 8 }}>
          {rows.map(r => (
            <Pressable key={r.key} onPress={() => router.push(`/database/${r.key}`)} style={{ paddingVertical:12 }}>
              <Text style={{ fontSize:16 }}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
