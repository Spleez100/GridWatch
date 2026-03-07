export type PowerStatus = 'green' | 'red' | 'yellow' | 'blue';
export type Band = 'A' | 'B' | 'C' | 'D' | 'E';

export interface PowerNode {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  status: PowerStatus;
  disco: string;
  band: Band;
  areaType: string;
  avgSupplyHours: number;
  lastOutage: string;
  tariffPerKwh: number;
  reportCount: number;
  reliabilityScore: number;
  timeline: { time: string; status: 'power' | 'outage' }[];
}

const discos = {
  lagos_ikeja: 'Ikeja Electric',
  lagos_eko: 'Eko Electricity Distribution Company',
  abuja: 'Abuja Electricity Distribution Company',
  ibadan: 'Ibadan Electricity Distribution Company',
  ph: 'Port Harcourt Electricity Distribution Company',
};

function randomTimeline(): { time: string; status: 'power' | 'outage' }[] {
  const entries: { time: string; status: 'power' | 'outage' }[] = [];
  const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  let current: 'power' | 'outage' = Math.random() > 0.3 ? 'power' : 'outage';
  for (const h of hours) {
    entries.push({ time: `${h.toString().padStart(2, '0')}:00`, status: current });
    if (Math.random() > 0.6) current = current === 'power' ? 'outage' : 'power';
  }
  return entries;
}

function bandFromHours(h: number): Band {
  if (h >= 20) return 'A';
  if (h >= 16) return 'B';
  if (h >= 12) return 'C';
  if (h >= 8) return 'D';
  return 'E';
}

function statusFromHours(h: number): PowerStatus {
  if (h >= 18) return 'green';
  if (h >= 12) return 'yellow';
  if (h >= 6) return 'red';
  return 'red';
}

interface NodeSeed {
  name: string;
  city: string;
  lat: number;
  lng: number;
  disco: string;
  areaType: string;
  avgHours: number;
}

const seeds: NodeSeed[] = [
  // Lagos - Ikeja axis
  { name: 'Ikeja GRA', city: 'Lagos', lat: 6.5833, lng: 3.3500, disco: discos.lagos_ikeja, areaType: 'Residential', avgHours: 20 },
  { name: 'Maryland', city: 'Lagos', lat: 6.5710, lng: 3.3640, disco: discos.lagos_ikeja, areaType: 'Commercial', avgHours: 18 },
  { name: 'Ogba', city: 'Lagos', lat: 6.6150, lng: 3.3400, disco: discos.lagos_ikeja, areaType: 'Residential', avgHours: 12 },
  { name: 'Agege', city: 'Lagos', lat: 6.6182, lng: 3.3280, disco: discos.lagos_ikeja, areaType: 'Residential', avgHours: 8 },
  { name: 'Oshodi', city: 'Lagos', lat: 6.5568, lng: 3.3420, disco: discos.lagos_ikeja, areaType: 'Commercial', avgHours: 14 },
  { name: 'Mushin', city: 'Lagos', lat: 6.5383, lng: 3.3517, disco: discos.lagos_ikeja, areaType: 'Residential', avgHours: 7 },
  { name: 'Surulere', city: 'Lagos', lat: 6.5050, lng: 3.3500, disco: discos.lagos_eko, areaType: 'Residential', avgHours: 16 },
  { name: 'Yaba', city: 'Lagos', lat: 6.5158, lng: 3.3750, disco: discos.lagos_eko, areaType: 'Commercial', avgHours: 15 },
  // Lagos - Island
  { name: 'Victoria Island', city: 'Lagos', lat: 6.4281, lng: 3.4219, disco: discos.lagos_eko, areaType: 'Commercial', avgHours: 22 },
  { name: 'Lekki Phase 1', city: 'Lagos', lat: 6.4400, lng: 3.4730, disco: discos.lagos_eko, areaType: 'Residential', avgHours: 20 },
  { name: 'Ikoyi', city: 'Lagos', lat: 6.4500, lng: 3.4300, disco: discos.lagos_eko, areaType: 'Residential', avgHours: 21 },
  { name: 'Lagos Island', city: 'Lagos', lat: 6.4541, lng: 3.3947, disco: discos.lagos_eko, areaType: 'Commercial', avgHours: 17 },
  { name: 'Ajah', city: 'Lagos', lat: 6.4667, lng: 3.5700, disco: discos.lagos_eko, areaType: 'Residential', avgHours: 10 },
  { name: 'Festac Town', city: 'Lagos', lat: 6.4650, lng: 3.2810, disco: discos.lagos_eko, areaType: 'Residential', avgHours: 11 },
  { name: 'Alimosho', city: 'Lagos', lat: 6.6000, lng: 3.2800, disco: discos.lagos_ikeja, areaType: 'Residential', avgHours: 6 },
  // Abuja
  { name: 'Maitama', city: 'Abuja', lat: 9.0800, lng: 7.4950, disco: discos.abuja, areaType: 'Residential', avgHours: 22 },
  { name: 'Wuse 2', city: 'Abuja', lat: 9.0650, lng: 7.4800, disco: discos.abuja, areaType: 'Commercial', avgHours: 20 },
  { name: 'Garki', city: 'Abuja', lat: 9.0300, lng: 7.4900, disco: discos.abuja, areaType: 'Commercial', avgHours: 19 },
  { name: 'Asokoro', city: 'Abuja', lat: 9.0400, lng: 7.5200, disco: discos.abuja, areaType: 'Residential', avgHours: 22 },
  { name: 'Gwarinpa', city: 'Abuja', lat: 9.1100, lng: 7.4100, disco: discos.abuja, areaType: 'Residential', avgHours: 14 },
  { name: 'Kubwa', city: 'Abuja', lat: 9.1600, lng: 7.3200, disco: discos.abuja, areaType: 'Residential', avgHours: 10 },
  { name: 'Lugbe', city: 'Abuja', lat: 8.9800, lng: 7.3900, disco: discos.abuja, areaType: 'Residential', avgHours: 8 },
  { name: 'Jabi', city: 'Abuja', lat: 9.0700, lng: 7.4300, disco: discos.abuja, areaType: 'Commercial', avgHours: 17 },
  // Ibadan
  { name: 'Bodija', city: 'Ibadan', lat: 7.4167, lng: 3.9000, disco: discos.ibadan, areaType: 'Residential', avgHours: 14 },
  { name: 'Challenge', city: 'Ibadan', lat: 7.3600, lng: 3.8700, disco: discos.ibadan, areaType: 'Commercial', avgHours: 12 },
  { name: 'Mokola', city: 'Ibadan', lat: 7.4000, lng: 3.8900, disco: discos.ibadan, areaType: 'Residential', avgHours: 10 },
  { name: 'Ring Road', city: 'Ibadan', lat: 7.3850, lng: 3.8950, disco: discos.ibadan, areaType: 'Commercial', avgHours: 13 },
  { name: 'UI Area', city: 'Ibadan', lat: 7.4450, lng: 3.8950, disco: discos.ibadan, areaType: 'Institutional', avgHours: 16 },
  { name: 'Dugbe', city: 'Ibadan', lat: 7.3900, lng: 3.8800, disco: discos.ibadan, areaType: 'Commercial', avgHours: 9 },
  // Port Harcourt
  { name: 'GRA Phase 2', city: 'Port Harcourt', lat: 4.8200, lng: 7.0300, disco: discos.ph, areaType: 'Residential', avgHours: 18 },
  { name: 'Trans Amadi', city: 'Port Harcourt', lat: 4.8100, lng: 7.0500, disco: discos.ph, areaType: 'Industrial', avgHours: 16 },
  { name: 'D-Line', city: 'Port Harcourt', lat: 4.7900, lng: 7.0200, disco: discos.ph, areaType: 'Residential', avgHours: 14 },
  { name: 'Rumuola', city: 'Port Harcourt', lat: 4.8350, lng: 7.0150, disco: discos.ph, areaType: 'Residential', avgHours: 11 },
  { name: 'Eleme', city: 'Port Harcourt', lat: 4.7500, lng: 7.1100, disco: discos.ph, areaType: 'Industrial', avgHours: 7 },
  { name: 'Oyigbo', city: 'Port Harcourt', lat: 4.8700, lng: 7.1500, disco: discos.ph, areaType: 'Residential', avgHours: 5 },
];

export const powerNodes: PowerNode[] = seeds.map((s, i) => {
  const statusOverride = Math.random();
  let status = statusFromHours(s.avgHours);
  if (statusOverride > 0.9) status = 'blue';

  return {
    id: `node-${i}`,
    name: s.name,
    city: s.city,
    lat: s.lat,
    lng: s.lng,
    status,
    disco: s.disco,
    band: bandFromHours(s.avgHours),
    areaType: s.areaType,
    avgSupplyHours: s.avgHours,
    lastOutage: `${Math.floor(Math.random() * 12) + 1}h ago`,
    tariffPerKwh: s.avgHours >= 20 ? 225 : s.avgHours >= 16 ? 63.36 : s.avgHours >= 12 ? 50.76 : 36.49,
    reportCount: Math.floor(Math.random() * 200) + 10,
    reliabilityScore: Math.min(100, Math.round((s.avgHours / 24) * 100)),
    timeline: randomTimeline(),
  };
});

export const cityCoords: Record<string, [number, number]> = {
  Lagos: [6.5244, 3.3792],
  Abuja: [9.0579, 7.4951],
  Ibadan: [7.3776, 3.9470],
  'Port Harcourt': [4.8156, 7.0498],
};
