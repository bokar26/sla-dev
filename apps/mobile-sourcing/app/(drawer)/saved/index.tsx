import { View, Text, FlatList, Pressable } from "react-native";
import { useVendorsStore } from "../../../state/vendors";
import { Filters } from "../../../components/Filters";

export default function SavedSuppliers() {
  const { savedSuppliers, removeVendor } = useVendorsStore();
  
  return (
    <View style={{ flex: 1 }}>
      <Filters />
      <FlatList
        data={savedSuppliers()}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <Text style={{ fontWeight: "700" }}>{item.name}</Text>
            <Text style={{ color: "#666" }}>{item.country} • {item.productType}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable onPress={() => removeVendor(item.id)}>
                <Text style={{ color: "#ef4444", fontWeight: "600" }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}
