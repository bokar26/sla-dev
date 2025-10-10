import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import Globe from "../../../components/Globe";
import { useQuery } from "@tanstack/react-query";
import { useVendorsStore } from "../../../state/vendors";
import { z } from "zod";
import { unifiedSearch, type UnifiedSearchRequest } from "../../../lib/api";

// Validation
const SearchSchema = z.object({
  item: z.string().min(1),
  country: z.string().min(1),
  productType: z.string().min(1),
  quantity: z.string().min(1),
  customization: z.enum(["yes","no"])
});

async function fetchVendors(params: any) {
  const searchParams: UnifiedSearchRequest = {
    q: params.item,
    country: params.country,
    product_type: params.productType,
    quantity: parseInt(params.quantity) || undefined,
    customization: params.customization === "yes" ? "yes" : params.customization === "no" ? "no" : "any"
  };
  
  const result = await unifiedSearch(searchParams);
  return {
    matches: result.items || [],
    meta: result.meta
  };
}

export default function SearchScreen() {
  const [form, setForm] = useState({ item:"", country:"", productType:"", quantity:"", customization:"no" as const });
  const [submitted, setSubmitted] = useState(false);

  // Animation: globe expands while form compresses
  const globeSize = useSharedValue(220);
  const formOpacity = useSharedValue(1);

  const onSubmit = async () => {
    const parse = SearchSchema.safeParse(form);
    if (!parse.success) return;
    setSubmitted(true);
    globeSize.value = withTiming(380, { duration: 600, easing: Easing.inOut(Easing.quad) });
    formOpacity.value = withTiming(0, { duration: 350 });
    refetch();
  };

  const gStyle = useAnimatedStyle(() => ({ transform: [{ scale: globeSize.value / 220 }] }));
  const fStyle = useAnimatedStyle(() => ({ opacity: formOpacity.value, height: submitted ? 0 : undefined }));

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["search", form],
    queryFn: () => fetchVendors(form),
    enabled: false
  });

  const store = useVendorsStore();

  const results = Array.isArray(data?.matches) ? data.matches : []; // expect top 10
  const topMatch = results[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Globe near top, starts small then expands on submit */}
        <Animated.View style={[{ alignItems: "center", marginTop: 8 }, gStyle]}>
          <Globe size={220} />
        </Animated.View>

        {/* Form */}
        <Animated.View style={[{ marginTop: 16 }, fStyle]}>
          {["item","country","productType","quantity"].map((key) => (
            <View key={key} style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{key === "productType" ? "Product Type" : key[0].toUpperCase()+key.slice(1)}</Text>
              <TextInput
                placeholder={`Enter ${key}`}
                value={(form as any)[key]}
                onChangeText={(t) => setForm((s) => ({ ...s, [key]: t }))}
                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
              />
            </View>
          ))}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Customization</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["yes","no"] as const).map(v => (
                <Pressable key={v} onPress={() => setForm((s)=>({ ...s, customization: v }))} style={{
                  paddingVertical: 10, paddingHorizontal: 14,
                  borderRadius: 10, borderWidth: 1,
                  borderColor: form.customization === v ? "#16a34a" : "#ddd",
                  backgroundColor: form.customization === v ? "#dcfce7" : "white"
                }}>
                  <Text style={{ fontWeight: "600" }}>{v.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable onPress={onSubmit} style={{
            backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center"
          }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Search Suppliers</Text>
          </Pressable>
        </Animated.View>

        {/* Loading state */}
        {submitted && isFetching && (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>Looking for matches…</Text>
          </View>
        )}

        {/* Results */}
        {submitted && !isFetching && results.length > 0 && (
          <View style={{ marginTop: 20 }}>
            {results.slice(0,10).map((r: any, idx: number) => (
              <View key={r.id ?? idx} style={{
                borderWidth: 1,
                borderColor: idx === 0 ? "#16a34a" : "#e5e7eb",
                backgroundColor: idx === 0 ? "#ecfdf5" : "white",
                padding: 14, borderRadius: 12, marginBottom: 10
              }}>
                <Text style={{ fontWeight: "700" }}>{r.name}</Text>
                <Text style={{ color: "#555" }}>{r.country} • {r.productType}</Text>
                <View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>
                  <Pressable onPress={() => store.saveVendor(r)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#16a34a" }}>
                    <Text style={{ color: "white", fontWeight: "600" }}>Save</Text>
                  </Pressable>
                  <Pressable onPress={() => {/* TODO: open vendor details */}} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#d1d5db" }}>
                    <Text style={{ fontWeight: "600" }}>Details</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
