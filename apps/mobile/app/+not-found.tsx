import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function NotFound() {
  return (
    <View style={{ flex:1, padding:24, alignItems:'center', justifyContent:'center', gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:'700' }}>Page not found</Text>
      <Pressable onPress={() => router.replace('/(tabs)/supply')} style={{ padding:12, borderRadius:12, borderWidth:1 }}>
        <Text>Go to Supply Center</Text>
      </Pressable>
    </View>
  );
}
