import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, useColorScheme } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import HeaderBalance from '../../components/HeaderBalance';
import Segmented from '../../components/Segmented';
import MainLineChart from '../../components/MainLineChart';
import Sparkline from '../../components/Sparkline';
import {
  getSupplyMetricsMock,
  getRecentVendorsRowsMock,
  getRecentQuotesRowsMock,
  getCurrentNewsMock,
  getAiSuggestionsMock,
  type MetricPoint,
  type VendorRow,
  type QuoteRow,
} from '@sla/shared';

type Range = '1D'|'1W'|'1M'|'3M'|'1Y'|'ALL';
type MetricKey = 'volume'|'revenue'|'commission';
const GREEN = '#1db954';

export default function SupplyCenter() {
  const scheme = useColorScheme();
  const text = scheme === 'dark' ? '#fff' : '#111';

  const [range, setRange] = useState<Range>('1D');
  const [metric, setMetric] = useState<MetricKey>('revenue');

  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [news, setNews]     = useState<any[]>([]);
  const [ideas, setIdeas]   = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [m, v, q, n, s] = await Promise.all([
        getSupplyMetricsMock(),
        getRecentVendorsRowsMock(),
        getRecentQuotesRowsMock(),
        getCurrentNewsMock(),
        getAiSuggestionsMock(),
      ]);
      setMetrics(m); setVendors(v); setQuotes(q); setNews(n); setIdeas(s);
    })();
  }, []);

  // Derive chart series by metric & range (mock ranges slice)
  const series = useMemo(() => {
    const pick = (m: MetricPoint) => ({ t: m.t, y: m[metric] as number });
    let pts = metrics.map(pick);
    const idx: Record<Range, number> = { '1D': 8, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, 'ALL': pts.length };
    const n = Math.min(idx[range], pts.length);
    return pts.slice(-n);
  }, [metrics, metric, range]);

  const latest = metrics.at(-1);
  const headerValue = latest ? (metric==='revenue' ? `$${latest.revenue.toLocaleString()}` :
                                metric==='commission' ? `$${latest.commission.toLocaleString()}` :
                                `${latest.volume.toLocaleString()}`) : '—';
  const deltaText = latest ? `+${(Math.random()*3+0.5).toFixed(2)}% today` : '';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>

        {/* HEADER */}
        <HeaderBalance title="Supply Center" value={headerValue} delta={deltaText} />

        {/* CHART + TOGGLES */}
        <Card>
          <MainLineChart points={series} />
          <Segmented value={range} onChange={setRange} />
          <View style={{ flexDirection:'row', gap:8, marginTop:4 }}>
            {(['revenue','commission','volume'] as MetricKey[]).map(k => {
              const on = k === metric;
              return (
                <Pressable key={k} onPress={()=>setMetric(k)}
                  style={{ paddingVertical:6, paddingHorizontal:10, borderRadius:999, backgroundColor:on?'#e8f7ee':'transparent', borderWidth:1, borderColor:on?GREEN:'#e6e6e6' }}>
                  <Text style={{ color: on?GREEN:'#555', fontSize:12 }}>{k}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* BUYING POWER / QUICK ACTION (placeholder) */}
        <Card>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ fontWeight:'700', color:text }}>Buying Power</Text>
            <Text>$0.00</Text>
          </View>
        </Card>

        {/* RECENT VENDORS */}
        <Text style={{ fontSize:18, fontWeight:'700', marginTop:8 }}>Recent Vendors</Text>
        <Card>
          <View style={{ gap:14 }}>
            {vendors.map(v => (
              <View key={v.id} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:16, fontWeight:'600' }}>{v.name}</Text>
                  <Text style={{ fontSize:12, opacity:0.6 }}>{v.region} • {v.rating.toFixed(1)}★</Text>
                </View>
                <Sparkline data={v.trend} />
                <View style={{ minWidth:70, alignItems:'flex-end' }}>
                  <Text style={{ color: GREEN, fontWeight:'700' }}>{v.pct.toFixed(2)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* RECENT QUOTES */}
        <Text style={{ fontSize:18, fontWeight:'700', marginTop:8 }}>Recent Quotes</Text>
        <Card>
          <View style={{ gap:14 }}>
            {quotes.map(q => (
              <View key={q.id} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:16, fontWeight:'600' }}>{q.sku}</Text>
                  <Text style={{ fontSize:12, opacity:0.6 }}>{q.vendor} • ${q.price} {q.currency}</Text>
                </View>
                <Sparkline data={q.trend} />
                <View style={{ minWidth:70, alignItems:'flex-end' }}>
                  <Text style={{ color: GREEN, fontWeight:'700' }}>{q.pct.toFixed(2)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* NEWS */}
        <Text style={{ fontSize:18, fontWeight:'700', marginTop:8 }}>News</Text>
        <Card>
          {news.map((n:any) => (
            <View key={n.id} style={{ paddingVertical:8 }}>
              <Text style={{ fontSize:16 }}>{n.title}</Text>
              <Text style={{ fontSize:12, opacity:0.6 }}>{n.source} • {n.time}</Text>
            </View>
          ))}
        </Card>

        {/* SLA AI SUGGESTIONS */}
        <Text style={{ fontSize:18, fontWeight:'700', marginTop:8 }}>SLA AI Suggestions</Text>
        <Card>
          <View style={{ gap:8 }}>
            {ideas.map((s:any) => (
              <View key={s.id} style={{ padding:10, borderRadius:12, borderWidth:1, borderColor:'#e6f2ea', backgroundColor:'#f6faf7' }}>
                <Text style={{ color:text }}>{s.text}</Text>
              </View>
            ))}
          </View>
        </Card>

      </ScrollView>
    </Screen>
  );
}
