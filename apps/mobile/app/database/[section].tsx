import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { getRecentVendorsMock, getRecentQuotesMock } from '@sla/shared';

export default function Section() {
  const { section } = useLocalSearchParams<{ section: string }>();

  if (section === 'vendors') {
    return <VendorsList />;
  }
  if (section === 'quotes') {
    return <QuotesList />;
  }
  // Simple placeholders for invoices/clients
  return (
    <Screen>
      <Text style={{ fontSize:24, fontWeight:'700', textTransform:'capitalize' }}>{section}</Text>
      <Card><Text>Coming soon.</Text></Card>
    </Screen>
  );
}

function VendorsList() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string,string>>({});
  useEffect(() => { getRecentVendorsMock().then(setVendors); }, []);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap:16, paddingBottom:24 }}>
        <Text style={{ fontSize:24, fontWeight:'700' }}>Vendors</Text>
        {vendors.map(v=>(
          <Card key={v.id}>
            <Pressable onPress={()=> router.push(`/vendor/${v.id}`)}><Text style={{ fontSize:16, fontWeight:'700' }}>{v.name}</Text></Pressable>
            <Text style={{ opacity:0.7 }}>{v.region} • {v.rating.toFixed(1)}★</Text>
            <TextInput placeholder="Notes…" value={notes[v.id] ?? ''} onChangeText={(t)=> setNotes(p=>({ ...p, [v.id]: t }))} style={{ marginTop:8, borderWidth:1, borderRadius:12, padding:10 }} />
            <Text style={{ marginTop:8, opacity:0.7 }}>Used for: Client A, Client B</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

function QuotesList() {
  const [quotes, setQuotes] = useState<any[]>([]);
  useEffect(()=>{ getRecentQuotesMock().then(setQuotes); },[]);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap:16, paddingBottom:24 }}>
        <Text style={{ fontSize:24, fontWeight:'700' }}>Quotes</Text>
        {quotes.map(q=>(
          <Card key={q.id}>
            <Text style={{ fontWeight:'700' }}>{q.sku}</Text>
            <Text style={{ opacity:0.7 }}>${q.price} {q.currency}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
