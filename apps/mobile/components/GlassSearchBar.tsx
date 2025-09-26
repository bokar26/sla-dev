import { useState } from 'react';
import { View, TextInput, Pressable, useColorScheme, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  product: string; material: string; location: string;
  onChange: (next: { product: string; material: string; location: string }) => void;
  onSubmit: () => void;
  placeholderProduct?: string; placeholderMaterial?: string; placeholderLocation?: string;
};

export default function GlassSearchBar({ 
  product, 
  material, 
  location, 
  onChange, 
  onSubmit, 
  placeholderProduct='Product name', 
  placeholderMaterial='Material', 
  placeholderLocation='Preferred location' 
}: Props) {
  const scheme = useColorScheme(); 
  const isDark = scheme === 'dark';
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!res.canceled) console.log('Picked:', res.assets?.[0]?.uri);
  };
  
  const set = (k: 'product'|'material'|'location') => (t: string) => onChange({ product, material, location, [k]: t });

  return (
    <View style={styles.container}>
      <BlurView intensity={24} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
        <Ionicons name="search-outline" size={20} style={{ marginLeft: 10, opacity: 0.8 }} />
        <View style={{ flex:1, paddingRight:8 }}>
          <TextInput 
            style={[styles.input, { color: isDark ? '#fff' : '#111' }]} 
            placeholder={placeholderProduct} 
            placeholderTextColor={isDark ? '#aaa' : '#777'} 
            value={product} 
            onChangeText={set('product')} 
            returnKeyType="next" 
          />
          <TextInput 
            style={[styles.input, { color: isDark ? '#fff' : '#111' }]} 
            placeholder={placeholderMaterial} 
            placeholderTextColor={isDark ? '#aaa' : '#777'} 
            value={material} 
            onChangeText={set('material')} 
            returnKeyType="next" 
          />
          <TextInput 
            style={[styles.input, { color: isDark ? '#fff' : '#111' }]} 
            placeholder={placeholderLocation} 
            placeholderTextColor={isDark ? '#aaa' : '#777'} 
            value={location} 
            onChangeText={set('location')} 
            returnKeyType="search" 
            onSubmitEditing={onSubmit} 
          />
        </View>
        <Pressable onPress={pickImage} style={styles.iconButton} hitSlop={10}>
          <Ionicons name="image-outline" size={20} style={{ opacity: 0.9 }} />
        </Pressable>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  blur: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 12, 
    borderRadius: 20, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)' 
  },
  input: { paddingVertical: 8, fontSize: 15 },
  iconButton: { paddingHorizontal: 12, paddingVertical: 8 },
});