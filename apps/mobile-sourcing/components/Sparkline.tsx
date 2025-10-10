import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function Sparkline({ 
  data, 
  color='#1db954', 
  width=64, 
  height=24 
}: { 
  data: number[]; 
  color?: string; 
  width?: number; 
  height?: number; 
}) {
  if (!data?.length) return <View style={{ width, height }} />;
  
  const w = width, h = height, n = data.length;
  const max = 1, min = 0;
  const scaleX = (i:number) => (i/(n-1))*w;
  const scaleY = (v:number) => h - ((v-min)/(max-min))*h;
  
  let d = `M ${scaleX(0)} ${scaleY(data[0])}`;
  for (let i=1;i<n;i++) d += ` L ${scaleX(i)} ${scaleY(data[i])}`;
  
  return (
    <Svg width={w} height={h}>
      <Path d={d} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}
