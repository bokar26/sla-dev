import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, useColorScheme } from 'react-native';

export default function Screen({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#0b0b0b' : '#ffffff';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>{children}</View>
    </SafeAreaView>
  );
}
