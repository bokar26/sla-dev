import { ReactNode } from 'react';
import { View, useColorScheme } from 'react-native';

export default function Card({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#121212' : '#f9fafb';
  const border = scheme === 'dark' ? '#222' : '#e6e6e6';
  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      {children}
    </View>
  );
}
