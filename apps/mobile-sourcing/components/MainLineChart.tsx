import { useMemo } from 'react';
import { View } from 'react-native';

// Guarded import to avoid cache crashes if victory-native mis-resolves during first run
let VictoryChart:any, VictoryLine:any, VictoryAxis:any;
try { 
  const V = require('victory-native'); 
  VictoryChart=V.VictoryChart; 
  VictoryLine=V.VictoryLine; 
  VictoryAxis=V.VictoryAxis; 
} catch {}

export default function MainLineChart({ 
  points 
}: { 
  points: { t: string; y: number }[] 
}) {
  if (!VictoryChart) return <View style={{ height: 180 }} />;
  
  const data = useMemo(()=> points.map(p=>({ x: new Date(p.t), y: p.y })), [points]);
  
  return (
    <View style={{ height: 180 }}>
      <VictoryChart height={180} domainPadding={{ x: 10 }}>
        <VictoryAxis 
          tickFormat={()=>''} 
          style={{ axis:{ stroke:'#e6e6e6' } }} 
        />
        <VictoryAxis 
          dependentAxis 
          tickFormat={()=>''} 
          style={{ axis:{ stroke:'#e6e6e6' } }} 
        />
        <VictoryLine 
          data={data} 
          style={{ data:{ stroke:'#1db954', strokeWidth:2 } }} 
        />
      </VictoryChart>
    </View>
  );
}
