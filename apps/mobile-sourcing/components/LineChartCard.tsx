import { useMemo, useState } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';

// Guarded import to avoid cache crashes if victory-native mis-resolves during first run
let VictoryChart:any, VictoryLine:any, VictoryAxis:any, VictoryGroup:any;
try { 
  const V = require('victory-native'); 
  VictoryChart=V.VictoryChart; 
  VictoryLine=V.VictoryLine; 
  VictoryAxis=V.VictoryAxis; 
  VictoryGroup=V.VictoryGroup; 
} catch {}

type MetricKey = 'volume' | 'revenue' | 'commission';
type Point = { t: string } & Record<MetricKey, number>;

const COLORS: Record<MetricKey, string> = { 
  volume:'#6ccf94', 
  revenue:'#1db954', 
  commission:'#12a454' 
};

export default function LineChartCard({ data }: { data: Point[] }) {
  const scheme = useColorScheme();
  const text = scheme === 'dark' ? '#fff' : '#111';
  const axis = scheme === 'dark' ? '#666' : '#888';
  const bg = scheme === 'dark' ? '#121212' : '#f9fafb';
  const border = scheme === 'dark' ? '#222' : '#e6e6e6';
  const [metric, setMetric] = useState<MetricKey>('volume');

  const x = useMemo(() => data.map(d => new Date(d.t)), [data]);

  if (!VictoryChart) {
    return (
      <View style={{ backgroundColor:bg, borderColor:border, borderWidth:1, borderRadius:16, padding:16 }}>
        <Text style={{ fontWeight:'700', marginBottom:8, color:text }}>Performance</Text>
        <Text style={{ opacity:0.7 }}>Loading chart…</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor:bg, borderColor:border, borderWidth:1, borderRadius:16, padding:12 }}>
      <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
        {(['volume','revenue','commission'] as MetricKey[]).map(k => (
          <Pressable 
            key={k} 
            onPress={() => setMetric(k)} 
            style={{ 
              paddingVertical:6, 
              paddingHorizontal:10, 
              borderRadius:999, 
              backgroundColor: metric===k? COLORS[k]:'transparent', 
              borderWidth:1, 
              borderColor: metric===k? COLORS[k]:border 
            }}
          >
            <Text style={{ color: metric===k? '#fff':'#555', fontSize:12 }}>{k}</Text>
          </Pressable>
        ))}
      </View>

      <VictoryChart domainPadding={{ x:15, y:12 }} height={240}>
        <VictoryAxis 
          tickFormat={(t:any)=>{ 
            const d=new Date(t); 
            return `${d.getMonth()+1}/${d.getDate()}`; 
          }} 
          style={{ 
            tickLabels:{ fill:axis, fontSize:10 }, 
            axis:{ stroke:axis } 
          }} 
        />
        <VictoryAxis 
          dependentAxis 
          style={{ 
            tickLabels:{ fill:axis, fontSize:10 }, 
            axis:{ stroke:axis } 
          }} 
        />
        <VictoryGroup>
          <VictoryLine 
            data={data.map((d,i)=>({ x:x[i], y:d[metric] }))} 
            style={{ data:{ stroke:COLORS[metric], strokeWidth:2 } }} 
          />
        </VictoryGroup>
      </VictoryChart>
    </View>
  );
}