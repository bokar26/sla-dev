import { View, Text, Pressable } from "react-native";
import { useAccountStore } from "../../../state/account";

export default function Settings() {
  const { user, plan, coinBalance, signIn, signOut, openBillingPortal } = useAccountStore();
  
  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:18, fontWeight:"700" }}>Account</Text>
      <Text style={{ marginTop:8 }}>{user ? user.email : "Not signed in"}</Text>
      
      <View style={{ height:16 }} />
      
      <Text style={{ fontSize:18, fontWeight:"700" }}>Plan</Text>
      <Text style={{ marginTop:8 }}>{plan?.name ?? "Free"} • Coins: {coinBalance}</Text>
      
      <View style={{ flexDirection:"row", gap:12, marginTop:12 }}>
        {user ? (
          <>
            <Pressable onPress={openBillingPortal} style={{ padding:10, backgroundColor:"#16a34a", borderRadius:10 }}>
              <Text style={{ color: "white", fontWeight:"700" }}>Manage Billing</Text>
            </Pressable>
            <Pressable onPress={signOut} style={{ padding:10, borderWidth:1, borderColor:"#ddd", borderRadius:10 }}>
              <Text style={{ fontWeight:"700" }}>Sign Out</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={signIn} style={{ padding:10, backgroundColor:"#16a34a", borderRadius:10 }}>
            <Text style={{ color: "white", fontWeight:"700" }}>Sign In</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height:24 }} />
      
      <Text style={{ fontSize:18, fontWeight:"700" }}>Help</Text>
      <Pressable onPress={() => {/* navigate to help/FAQ URL */}} style={{ marginTop:8 }}>
        <Text style={{ color:"#0ea5e9" }}>Open Help Center</Text>
      </Pressable>
    </View>
  );
}
