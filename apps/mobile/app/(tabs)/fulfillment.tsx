import { useState } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme, ScrollView } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';

export default function Fulfillment() {
  const scheme = useColorScheme();
  const text = scheme === 'dark' ? '#fff' : '#111';
  const [vendor, setVendor] = useState('');
  const [product, setProduct] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<string | null>(null);

  const generate = () => {
    setRoute(`Best route: ${vendor || 'Vendor ?'} → ${destination || 'Destination ?'} • ETA 9 days • Cost ~$1,240`);
  };
  const exportInvoice = () => {
    console.log('Export invoice for', { vendor, product, destination, route });
    alert('Invoice exported (placeholder).');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize:24, fontWeight:'700', color:text }}>Fulfillment</Text>

        <Card>
          <Text style={{ fontWeight:'700', marginBottom:8, color:text }}>Select Vendor & Product</Text>
          <TextInput 
            placeholder="Saved vendor (e.g., VN-Textiles 23)" 
            value={vendor} 
            onChangeText={setVendor} 
            style={{ borderWidth:1, borderRadius:12, padding:10, marginBottom:8 }} 
          />
          <TextInput 
            placeholder="Product (e.g., HOODIE-400GSM-BLK)" 
            value={product} 
            onChangeText={setProduct} 
            style={{ borderWidth:1, borderRadius:12, padding:10 }} 
          />
        </Card>

        <Card>
          <Text style={{ fontWeight:'700', marginBottom:8, color:text }}>Shipping Destination</Text>
          <TextInput 
            placeholder="City, Country" 
            value={destination} 
            onChangeText={setDestination} 
            style={{ borderWidth:1, borderRadius:12, padding:10 }} 
          />
        </Card>

        <Card>
          <Pressable 
            onPress={generate} 
            style={{ padding:12, borderRadius:12, borderWidth:1, alignItems:'center' }}
          >
            <Text>Generate Route</Text>
          </Pressable>
          {route && (
            <View style={{ marginTop:12 }}>
              <Text style={{ marginBottom:8, color:text }}>{route}</Text>
              <Pressable 
                onPress={exportInvoice} 
                style={{ padding:12, borderRadius:12, borderWidth:1, alignItems:'center' }}
              >
                <Text>Export as Invoice</Text>
              </Pressable>
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
