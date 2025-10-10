import { View, Pressable, Text, useColorScheme } from 'react-native';

type Opt = '1D'|'1W'|'1M'|'3M'|'1Y'|'ALL';

export default function Segmented({ value, onChange }: { value: Opt; onChange: (v: Opt)=>void }) {
  const scheme = useColorScheme();
  const opts: Opt[] = ['1D','1W','1M','3M','1Y','ALL'];
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8 }}>
      {opts.map(o => {
        const on = o === value;
        return (
          <Pressable 
            key={o} 
            onPress={()=>onChange(o)} 
            style={{ 
              paddingVertical:6, 
              paddingHorizontal:10, 
              borderRadius:8, 
              backgroundColor: on ? '#e8f7ee' : 'transparent' 
            }}
          >
            <Text style={{ 
              fontSize:12, 
              color: on ? '#1db954' : (scheme==='dark'?'#9aa0a6':'#7a7a7a') 
            }}>
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
