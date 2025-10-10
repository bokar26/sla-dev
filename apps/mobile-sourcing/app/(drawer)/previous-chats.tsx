import { View, Text, Pressable, FlatList } from "react-native";
import { useHistoryStore } from "../../state/history";

export default function PreviousChats() {
  const { history, loadToForm } = useHistoryStore();
  
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Previous Chats</Text>
      <FlatList
        data={history}
        keyExtractor={(h) => h.id}
        renderItem={({ item }) => (
          <Pressable
            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" }}
            onPress={() => loadToForm(item)}
          >
            <Text style={{ fontWeight: "600" }}>{item.item} • {item.country}</Text>
            <Text style={{ color: "#666" }}>{item.productType} • qty {item.quantity} • {item.customization}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
