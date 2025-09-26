import { useState } from 'react';
import { View, Text, useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import GlassSearchBar from '../../components/GlassSearchBar';

export default function SLASearch() {
  const scheme = useColorScheme();
  const text = scheme === 'dark' ? '#ffffff' : '#111111';

  const [form, setForm] = useState({ product: '', material: '', location: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    // TODO: call actual search; simulate delay:
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <Screen>
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:12 }}>
        <Text style={{ fontSize: 18, opacity: 0.8, color: text }}>{loading ? 'Searching…' : 'Ready to search'}</Text>
        {loading ? <ActivityIndicator /> : <Ionicons name="globe-outline" size={120} color={text} />}
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.select({ ios: 'padding', android: undefined })} 
        keyboardVerticalOffset={Platform.OS==='ios'?80:0}
      >
        <GlassSearchBar
          product={form.product}
          material={form.material}
          location={form.location}
          onChange={setForm}
          onSubmit={submit}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
