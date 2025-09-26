import { View, Text } from 'react-native';

export default function HeaderBalance({ 
  title, 
  value, 
  delta 
}: { 
  title: string; 
  value: string; 
  delta: string; 
}) {
  return (
    <View style={{ paddingVertical: 8, gap: 6 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{title}</Text>
      <Text style={{ fontSize: 32, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#1db954', fontWeight: '600' }}>{delta}</Text>
    </View>
  );
}
