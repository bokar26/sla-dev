import { View, Text, useColorScheme } from 'react-native';

export default function KPIStat({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#121212' : '#f6faf7';
  const border = scheme === 'dark' ? '#1f1f1f' : '#e6f2ea';
  const accent = '#1db954';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: accent }}>{value}</Text>
    </View>
  );
}
