import { View, Text, Pressable } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { router } from 'expo-router';

const rows = [
  { key: 'vendors', label: 'Vendors' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'clients', label: 'Clients' },
];

export default function Database() {
  return (
    <Screen>
      <Text style={{ fontSize:24, fontWeight:'700' }}>Database</Text>
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
