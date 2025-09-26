import { useState, useEffect } from 'react';

// Sample factory data based on your provided list
const sampleFactories = [
  { id: '1', name: 'Shahi Exports Pvt Ltd', status: 'active' },
  { id: '2', name: 'The Civil Engineers Ltd', status: 'active' },
  { id: '3', name: 'Creative Collection Ltd', status: 'active' },
  { id: '4', name: 'SUNRISE FASHIONS', status: 'active' },
  { id: '5', name: 'Himachal WoollenMills', status: 'active' },
  { id: '6', name: 'Sahu Exports-A 204', status: 'active' },
  { id: '7', name: 'Ananta Casual Wear Ltd-F', status: 'active' },
  { id: '8', name: 'Pee Empro Exports Pvt. Ltd', status: 'active' },
  { id: '9', name: 'Tangerine Skies Private Limited - Unit-1', status: 'active' },
  { id: '10', name: 'Richaco Exports Private Limited - 30\\6 Manesar', status: 'active' },
  { id: '11', name: 'TNG INVESTMENT AND TRADING JSC-PHU BINH 1,2, 3,4 BRANCH', status: 'active' },
  { id: '12', name: 'Tangerine Skies Private Limited - Unit-2', status: 'active' },
  { id: '13', name: 'Thanh Tai Garment and Wash Company Ltd', status: 'active' },
  { id: '14', name: 'Courtaulds Clothing Watawala (pvt) Ltd.', status: 'active' },
  { id: '15', name: 'Pee Empro Exports P Ltd (Unit 13)', status: 'active' },
  { id: '16', name: 'TNG INVESTMENT AND TRADING JSC - VIET DUC BRANCH', status: 'active' },
  { id: '17', name: 'DA NANG branch PHONG PHU INTERNATIONAL JSC PHONG PHU DA', status: 'active' },
  { id: '18', name: 'Courtaulds Clothing Lanka (Pvt) Ltd', status: 'active' },
  { id: '19', name: 'Branch of Phong Phu International J.S.C. - Phong Phu - Quang Tri Export Garment Factory', status: 'active' },
  { id: '20', name: 'SHAHI EXPORTS PVT LTD UNIT 9', status: 'active' },
  { id: '21', name: 'Courtaulds Clothing Veyangoda (pvt)ltd', status: 'active' },
  { id: '22', name: 'Courtaulds Clothing Rajanganaya (pvt) Ltd', status: 'active' },
  { id: '23', name: 'CROSSING SARL-F', status: 'active' },
  { id: '24', name: 'PHONG PHU - PHU YEN 3 EXPORT GARMENT FACTORY', status: 'active' },
  { id: '25', name: 'Shahi Exports Pvt. Ltd.  (F2)', status: 'active' },
  { id: '26', name: 'Richaco Exports Private Limited  - (Knits Unit)', status: 'active' },
  { id: '27', name: 'Bhavik Terryfab', status: 'active' },
  { id: '28', name: 'RADNIK AUTO EXPORTS -F', status: 'active' },
  { id: '29', name: 'HUE BRANCH-VINATEX INTERNATIONAL JOINT STOCK COMPANY', status: 'active' },
  { id: '30', name: 'TDT INVESTMENT AND DEVELOPMENT JOINT STOCK COMPANY', status: 'active' },
  { id: '31', name: 'Kardem Kesan Factory', status: 'active' },
  { id: '32', name: 'TNG INVESTMENT AND TRADING JSC - SONG CONG 1 BRANCH', status: 'active' },
  { id: '33', name: 'SUNRISE FASHIONS II', status: 'active' },
  { id: '34', name: 'HUE TEXTILE GARMENT JSC - QUANG BINH BRANCH', status: 'active' },
  { id: '35', name: 'FASHION LINE APPARELS', status: 'active' },
  { id: '36', name: 'Bac Giang LGG Garment Corporation', status: 'active' },
  { id: '37', name: 'Alpine Apparels Pvt. Ltd. (Plot No-19)', status: 'active' },
  { id: '38', name: 'Courtaulds Clothing Dambadeniya (pvt) Ltd', status: 'active' },
  { id: '39', name: 'SHAHI EXPORTS PVT LTD-UNIT 31', status: 'active' },
  { id: '40', name: 'EMSAM TEKSTIL SAN VE DIS TIC A S', status: 'active' },
  { id: '41', name: 'Pee Empro Exports Pvt Ltd-(Plot No-67)', status: 'active' },
  { id: '42', name: 'ORMA TEKSTIL SAN. VE TIC. A.S.', status: 'active' },
  { id: '43', name: 'ISABELLA (PRIVATE) LIMITED', status: 'active' },
  { id: '44', name: 'Viet Y - Hung Yen Garment Joint Stock Company', status: 'active' },
  { id: '45', name: 'PHU SINH GARMENT CO., LTD', status: 'active' },
  { id: '46', name: 'Ideateks Moda ve Konf San Dis Tic AS', status: 'active' },
  { id: '47', name: 'AHP APPAREL PVT LTD., UNIT - 45', status: 'active' },
  { id: '48', name: 'SAHU GLOBAL PVT LTD', status: 'active' },
  { id: '49', name: 'Thagaco international investment joint stock company', status: 'active' },
  { id: '50', name: 'EXCEL PRODUCTIONS', status: 'active' },
  { id: '51', name: 'Sahu Global Pvt Ltd - C19', status: 'active' },
  { id: '52', name: 'UNLU TEKSTIL SAN.TIC.A.S', status: 'active' },
  { id: '53', name: 'Timex Garments (Pvt) Ltd. Unit 3', status: 'active' },
  { id: '54', name: 'TIMEX GARMENTS (PVT) LTD - UNIT 12', status: 'active' },
  { id: '55', name: 'MODELAMA EXPORTS PVT LTD - 198', status: 'active' },
  { id: '56', name: 'MODELAMA EXPORTS PVT LTD - 105-106', status: 'active' },
  { id: '57', name: 'Linea Aqua Vietnam Co., Ltd', status: 'active' },
  { id: '58', name: 'Shahi Export Pvt Ltd Unit - 05', status: 'active' },
  { id: '59', name: 'HNC WASHING TECHNOLOGY J.S.C', status: 'active' },
  { id: '60', name: 'E LAND APPAREL LTD - UNIT-4', status: 'active' },
  { id: '61', name: 'Gaurav International-Noida', status: 'active' },
  { id: '62', name: 'Hirdaramani Industries (Private) Limited', status: 'active' },
  { id: '63', name: 'Ananta Huaxiang Ltd.', status: 'active' },
  { id: '64', name: 'Ozman Deri Teks. Ve Ins. Imal. Gida. Ith. Ihr. Paz. Ltd', status: 'active' },
  { id: '65', name: 'Viet Thai Garment Branch - TNG Investment and Trading J', status: 'active' },
  { id: '66', name: 'HUE TEXTILE GARMENT JSC', status: 'active' },
  { id: '67', name: 'Hoang Mai Vinatex Garment Joint Stock Company', status: 'active' },
  { id: '68', name: 'Indigo Blues', status: 'active' },
  { id: '69', name: 'Shahi Exports (Unit 7) - Wash', status: 'active' },
  { id: '70', name: 'Shahi Exports Pvt Ltd', status: 'active' },
  { id: '71', name: 'Shahi Exports (Unit 6)', status: 'active' },
  { id: '72', name: 'Alpine Apparels Pvt. Ltd.', status: 'active' },
  { id: '73', name: 'GOKALDAS INDIA', status: 'active' },
  { id: '74', name: 'Denimach Ltd', status: 'active' },
  { id: '75', name: 'Richaco Exports Private Limited', status: 'active' },
  { id: '76', name: 'AYESHA CLOTHING CO. LTD.', status: 'active' },
  { id: '77', name: 'Linea Aqua Pvt Ltd', status: 'active' },
  { id: '78', name: 'That\'s It Sports Wear Ltd', status: 'active' },
  { id: '79', name: 'Pee Empro Exports Pvt. Ltd.', status: 'active' },
  { id: '80', name: 'Timex Garments (PVT) Ltd.', status: 'active' },
  { id: '81', name: 'Linea Aqua Pvt Ltd No 1', status: 'active' },
  { id: '82', name: 'J D CLOTHING COMPANY', status: 'active' },
  { id: '83', name: 'Richaco Exports Private Limited - Manesar', status: 'active' },
  { id: '84', name: 'World Easy Garment (DongGuan) Factory Limited', status: 'new' },
  { id: '85', name: 'Parawin Industries(Ganzhou) Limited', status: 'new' },
  { id: '86', name: 'United Swimwear Apparel Co.,Ltd', status: 'new' },
  { id: '87', name: 'ZHEJIANG NIAN NIAN WANG KNITTING CO., LTD.', status: 'new' },
  { id: '88', name: 'Bogart Lingerie (Thailand) Limited', status: 'new' },
  { id: '89', name: 'Nien Hsing (Ninh Binh) Garment Co., Ltd', status: 'new' },
  { id: '90', name: 'Speed Motion Vietnam Company Limited', status: 'new' },
  { id: '91', name: 'ZHEJIANG FASHIONNING KNITTING CLOTHING CO.,LTD', status: 'new' },
  { id: '92', name: 'P.T. DIAMONDFIT GARMENT INDONESIA', status: 'new' },
  { id: '93', name: 'TCE JEANS CO., LTD', status: 'new' },
  { id: '94', name: 'Zhongshan Yijin Rubber Products Co., Ltd', status: 'new' },
  { id: '95', name: 'Yorkmars (Cambodia) Garment MFG Co., LTD.', status: 'new' },
  { id: '96', name: 'Bogart Lingerie(Guangzhou) Ltd.', status: 'new' },
  { id: '97', name: 'PuJiang Cap Fashion Co., Ltd', status: 'new' },
  { id: '98', name: 'P.T. SENTRAL BRA MAKMUR', status: 'new' },
  { id: '99', name: 'FTN Vietnam Co.,LTD', status: 'new' },
  { id: '100', name: 'PT. PAN RAMA VISTA GARMENT INDUSTRIES', status: 'new' }
];

/* -------- Helpers: deterministic jittered coords by country -------- */

const COUNTRY_CENTROIDS = {
  india:       { lat: 22.9734, lng: 78.6569 },
  vietnam:     { lat: 14.0583, lng: 108.2772 },
  sri_lanka:   { lat: 7.8731,  lng: 80.7718 },
  turkey:      { lat: 39.0000, lng: 35.0000 },
  china:       { lat: 35.8617, lng: 104.1954 },
  thailand:    { lat: 15.8700, lng: 100.9925 },
  cambodia:    { lat: 12.5657, lng: 104.9910 },
  indonesia:   { lat: -2.5489, lng: 118.0149 },
  bangladesh:  { lat: 23.6850, lng: 90.3563 },
  morocco:     { lat: 31.6295, lng: -7.9811 },
  guatemala:   { lat: 15.7835, lng: -90.2308 },
  philippines: { lat: 12.8797, lng: 121.7740 },
  jordan:      { lat: 30.5852, lng: 36.2384 },
  macau:       { lat: 22.1987, lng: 113.5439 },
  mexico:      { lat: 23.6345, lng: -102.5528 }
};

const KEYWORDS = [
  ['vietnam', 'viet ', 'vietnam', 'hue', 'hoang', 'phong phu', 'tng', 'thanh tai', 'da nang', 'hung yen', 'bac giang', 'quang tri', 'phu yen', 'quang binh', 'thai nguyen', 'binh duong', 'nam dinh', 'hai duong', 'ben tre', 'phu ly', 'khanh', 'tra vinh', 'ho chi minh', 'hanoi', 'viet tri', 'yen khanh', 'thanh hoa', 'cam lam', 'ben cat', 'duy tien', 'bim son', '888 company', 'osung vina', 'hantex vina', 'crystal martin', 'eco tank', 'eco way', 'hualida', 'ever glory', 'great super', 'hansoll vina', 'gennon', 'lang ham', 'meng tong', 'k+k fashion', 'shinwon ebenezer', 'beeahn vietnam', 'pearl garment', 'phu thinh', 'araviet', 'viet pan-pacific', 'lang giang bgg', 'viet tri thai binh', 'vin global', 'eins vina', 'ha hae vietnam', 'viet pacific apparel', 'manseon global', 'viet panpacific world', 'leader garment', 'saigon knitwear', 'triple garment'],
  ['sri_lanka', 'lanka', 'courtaulds', 'isabella', 'timex', 'linea aqua', 'hirdaramani'],
  ['turkey', 'tekstil', 'istanbul', ' a s', ' a.s', ' a.s.', 'kardem', 'emsam', 'orma', 'ideateks', 'unlu', 'ozman', 'att', 'domino', 'alpin'],
  ['china', 'guangzhou', 'dongguan', 'zhejiang', 'ningbo', 'zhongshan', 'yijin', 'bogart lingerie', 'pujiang', 'foshan', 'shunde', 'ideal wisdom', 'regal footwear', 'wings footwear', 'haining', 'united socks', 'zaozhuang', 'hioyoung', 'quanjiao', 'jiashida', 'hangzhou', 'hs fashion', 'cobest', 'jiangsu', 'tonglu', 'chunlei', 'shuyang', 'litai', 'zhangjiagang', 'stp headwear', 'fu xuan', 'jiangyin', 'chengtai', 'nantong', 'renaissance', 'yutu', 'spinning', 'jiaxing', 'hualishi', 'chengjie', 'knitting', 'guotai', 'rugao', 'yantai', 'yaqi', 'shanghai', 'globaltex', 'aoxinte', 'clothing', 'zhongyu', 'huajun', 'toprank', 'industrial', 'hongrui', 'fuqing', 'jile', 'toy', 'model', 'shoe', 'xuzhou', 'penfolds', 'easy rich', 'jun wei', 'zhuhai', 'haoyi', 'suzhou', 'yingjia', 'yida', 'jstart', 'silk', 'sanbao', 'headwears', 'berrex', 'rongli', 'anhui', 'qilong', 'chongqing', 'sumec', 'changjiang', 'taian', 'xinyi', 'gtig', 'hubo', 'taizhou'],
  ['thailand', 'thai', 'bogart lingerie'],
  ['cambodia', 'cambodian', 'phnom', 'yorkmars', 'orient international', 'new mingda', 'sunicon', 'meng yee', 'fortuna international', 'solamoda', 'great fashion', 'joyance international', 'jiangyao', 'tainan enterprise', 'winas', 'new wish', 'lianfa', 'hengyu', 'perfect vision', 'chun xue', 'cashmere', 'cb kingtop', 'xin yunfeng', 'cs goldway', 'grand textiles', 'wtx leading', 'new wide', 'powerful riches', 'winsand', 'glory knitwear', 'moon tai', 'hc global', 'goldfame star', 'neo meridian', 'new era'],
  ['indonesia', 'jakarta', 'surabaya', 'bandung', 'p.t.', 'diamondfit', 'sentral bra', 'makmur', 'pan rama', 'vista', 'anugerah', 'abadi', 'magelang', 'dreamwear', 'mod indo', 'handsome', 'glory industrial', 'semarang', 'demak', 'busanaremaja', 'agracipta', 'iemoto', 'pan pacific', 'nesia', 'koinbaju', 'global', 'daehan', 'sukabumi', 'eins trend'],
  ['bangladesh', 'dhaka', 'chittagong', 'narayanganj', 'civil engineers', 'creative collection', 'ananta', 'denimach', 'ayesha', 'clothing', 'that\'s it', 'sports wear', 'huaxiang'],
  ['morocco', 'crossing', 'sarl'],
  ['guatemala', 'js international', 'j. apparel', 'denimville'],
  ['philippines', 'frankhaus', 'leading success', 'phils', 'garments'],
  ['jordan', 'classic fashion', 'apparel industry'],
  ['macau', 'shun tat', 'hang shun'],
  ['mexico', 'indigo trade', 'gomez palacio']
];

function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function PRNG(seed) {
  let s = seed >>> 0;
  return function next() {
    // LCG
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function jitterAround({ lat, lng }, seedStr, maxDeg = 2.5) {
  const rnd = PRNG(hash32(seedStr));
  // small jitter box (±maxDeg), deterministic per id/name
  const dLat = (rnd() * 2 - 1) * maxDeg;
  const dLng = (rnd() * 2 - 1) * maxDeg;
  return { lat: clampLat(lat + dLat), lng: wrapLng(lng + dLng) };
}

function clampLat(lat) {
  return Math.max(-89.9, Math.min(89.9, lat));
}

function wrapLng(lng) {
  let x = lng;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

function inferCoords(name, id) {
  const n = name.toLowerCase();

  // Find the first matching keyword group
  for (const group of KEYWORDS) {
    const [countryKey, ...terms] = group;
    if (terms.some(t => n.includes(t))) {
      const center = COUNTRY_CENTROIDS[countryKey];
      if (center) return jitterAround(center, `${id}:${name}`);
    }
  }

  // Default to India
  return jitterAround(COUNTRY_CENTROIDS.india, `${id}:${name}`);
}

export const useFactoriesForGlobe = () => {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchFactories = async () => {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Enrich with lat/lng
      const enriched = sampleFactories.map(f => {
        const { lat, lng } = inferCoords(f.name, f.id);
        return { ...f, lat, lng };
      });
      
      setFactories(enriched);
      setLoading(false);
    };

    fetchFactories();
  }, []);

  const totalCount = factories.length;
  const activeCount = factories.filter(f => f.status === 'active').length;
  const newCount = factories.filter(f => f.status === 'new').length;

  return {
    factories,
    loading,
    totalCount,
    activeCount,
    newCount
  };
};
