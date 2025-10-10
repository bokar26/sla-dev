import { View, Text, TextInput } from "react-native";
import { useVendorsStore } from "../state/vendors";

export function Filters() {
  const { setFilter } = useVendorsStore();
  
  return (
    <View style={{ padding: 12 }}>
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Filters</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput 
          placeholder="Country" 
          onChangeText={(t)=>setFilter("country", t)} 
          style={{ flex:1, borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:10 }} 
        />
        <TextInput 
          placeholder="Product Type" 
          onChangeText={(t)=>setFilter("productType", t)} 
          style={{ flex:1, borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:10 }} 
        />
      </View>
    </View>
  );
}
