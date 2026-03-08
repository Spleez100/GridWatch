import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── DisCo coverage by state ──────────────────────────────────
const DISCO_MAP: Record<string, string> = {
  "Lagos": "Eko Electric",
  "FCT": "Abuja Electric (AEDC)",
  "Rivers": "Port Harcourt Electric (PHED)",
  "Oyo": "Ibadan Electric (IBEDC)",
  "Kano": "Kano Electric (KEDCO)",
  "Kaduna": "Kaduna Electric",
  "Enugu": "Enugu Electric (EEDC)",
  "Delta": "Benin Electric (BEDC)",
  "Edo": "Benin Electric (BEDC)",
  "Anambra": "Enugu Electric (EEDC)",
  "Abia": "Enugu Electric (EEDC)",
  "Imo": "Enugu Electric (EEDC)",
  "Kwara": "Ibadan Electric (IBEDC)",
  "Osun": "Ibadan Electric (IBEDC)",
  "Ondo": "Benin Electric (BEDC)",
  "Ogun": "Ibadan Electric (IBEDC)",
  "Plateau": "Jos Electric (JEDC)",
  "Benue": "Jos Electric (JEDC)",
  "Nassarawa": "Abuja Electric (AEDC)",
  "Niger": "Abuja Electric (AEDC)",
  "Kogi": "Abuja Electric (AEDC)",
  "Ekiti": "Benin Electric (BEDC)",
  "Cross River": "Port Harcourt Electric (PHED)",
  "Akwa Ibom": "Port Harcourt Electric (PHED)",
  "Bayelsa": "Port Harcourt Electric (PHED)",
  "Ebonyi": "Enugu Electric (EEDC)",
  "Sokoto": "Kaduna Electric",
  "Kebbi": "Kaduna Electric",
  "Zamfara": "Kaduna Electric",
  "Katsina": "Kano Electric (KEDCO)",
  "Jigawa": "Kano Electric (KEDCO)",
  "Bauchi": "Jos Electric (JEDC)",
  "Gombe": "Jos Electric (JEDC)",
  "Adamawa": "Yola Electric (YEDC)",
  "Taraba": "Yola Electric (YEDC)",
  "Borno": "Yola Electric (YEDC)",
  "Yobe": "Yola Electric (YEDC)",
};

// Lagos special: Ikeja Electric covers northern Lagos LGAs
const IKEJA_ELECTRIC_LGAS = [
  "Ikeja", "Agege", "Alimosho", "Ifako-Ijaiye", "Kosofe", "Mushin",
  "Oshodi-Isolo", "Shomolu", "Ikorodu",
];

function getDisco(state: string, lga?: string): string {
  if (state === "Lagos" && lga && IKEJA_ELECTRIC_LGAS.some(l => lga.includes(l))) {
    return "Ikeja Electric";
  }
  return DISCO_MAP[state] || "Unknown DisCo";
}

// ── Band assignment rules ─────────────────────────────────────
// Band A: GRA, Island, high-income areas (20+ hrs)
// Band B: Mid-income urban (16 hrs)
// Band C: Mixed urban (12 hrs)
// Band D: Dense residential (8 hrs)
// Band E: Underserved/rural (<8 hrs)
const BAND_A_KEYWORDS = ["gra", "phase 1", "island", "ikoyi", "bourdillon", "alexander", "admiralty", "maitama", "asokoro", "wuse 2", "alausa", "allen avenue", "toyin street"];
const BAND_B_KEYWORDS = ["estate", "phase 2", "lekki", "surulere", "magodo", "gbagada", "opebi", "adeniyi jones", "garki", "utako", "jabi", "d-line", "trans amadi"];
const BAND_E_KEYWORDS = ["village", "rural", "settlement", "camp"];

function assignBand(name: string, areaType: string, state: string): string {
  const lower = name.toLowerCase();
  if (BAND_A_KEYWORDS.some(k => lower.includes(k))) return "A";
  if (BAND_B_KEYWORDS.some(k => lower.includes(k))) return "B";
  if (BAND_E_KEYWORDS.some(k => lower.includes(k))) return "E";
  if (areaType === "Commercial" || areaType === "Government") return "B";
  if (["Sokoto", "Zamfara", "Kebbi", "Yobe", "Borno", "Taraba"].includes(state)) return "D";
  return "C";
}

function bandToTariff(band: string): number {
  return { A: 225, B: 63.36, C: 50.76, D: 36.49, E: 36.49 }[band] || 50;
}
function bandToHours(band: string): number {
  return { A: 20, B: 16, C: 12, D: 8, E: 4 }[band] || 12;
}

// ── Comprehensive location dataset ────────────────────────────
// Every entry: [name, type, state, lga, city, lat, lng, areaType]
type LocEntry = [string, string, string, string, string, number, number, string];

const LOCATIONS: LocEntry[] = [
  // ══════════════════════════════════════════════════════════════
  // LAGOS STATE — Streets & Neighborhoods
  // ══════════════════════════════════════════════════════════════
  // Eti-Osa (Lekki, VI, Ikoyi)
  ["Lekki Phase 1", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4478, 3.4723, "Residential"],
  ["Admiralty Way, Lekki", "street", "Lagos", "Eti-Osa", "Lagos", 6.4380, 3.4710, "Commercial"],
  ["Fola Osibo Street, Lekki", "street", "Lagos", "Eti-Osa", "Lagos", 6.4410, 3.4750, "Residential"],
  ["Lekki Phase 2", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4350, 3.5200, "Residential"],
  ["Chevron Drive, Lekki", "street", "Lagos", "Eti-Osa", "Lagos", 6.4340, 3.5100, "Residential"],
  ["Jakande, Lekki", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4400, 3.4880, "Commercial"],
  ["Ikate, Lekki", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4320, 3.4650, "Residential"],
  ["Marwa, Lekki", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4350, 3.4580, "Residential"],
  ["Ajah", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4667, 3.5700, "Residential"],
  ["Abraham Adesanya, Ajah", "street", "Lagos", "Eti-Osa", "Lagos", 6.4620, 3.5580, "Residential"],
  ["Ogombo Road, Ajah", "street", "Lagos", "Eti-Osa", "Lagos", 6.4550, 3.5700, "Residential"],
  ["Sangotedo", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4580, 3.5650, "Residential"],
  ["Ibeju-Lekki", "neighborhood", "Lagos", "Ibeju-Lekki", "Lagos", 6.4500, 3.6200, "Residential"],
  ["Eleko, Ibeju-Lekki", "neighborhood", "Lagos", "Ibeju-Lekki", "Lagos", 6.4400, 3.6500, "Residential"],
  ["Victoria Island", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4281, 3.4219, "Commercial"],
  ["Adeola Odeku Street, VI", "street", "Lagos", "Eti-Osa", "Lagos", 6.4310, 3.4210, "Commercial"],
  ["Akin Adesola Street, VI", "street", "Lagos", "Eti-Osa", "Lagos", 6.4280, 3.4180, "Commercial"],
  ["Kofo Abayomi Street, VI", "street", "Lagos", "Eti-Osa", "Lagos", 6.4290, 3.4230, "Commercial"],
  ["Ozumba Mbadiwe Avenue, VI", "street", "Lagos", "Eti-Osa", "Lagos", 6.4350, 3.4250, "Commercial"],
  ["Sanusi Fafunwa Street, VI", "street", "Lagos", "Eti-Osa", "Lagos", 6.4305, 3.4195, "Commercial"],
  ["Ikoyi", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4500, 3.4300, "Residential"],
  ["Bourdillon Road, Ikoyi", "street", "Lagos", "Eti-Osa", "Lagos", 6.4530, 3.4320, "Residential"],
  ["Alexander Avenue, Ikoyi", "street", "Lagos", "Eti-Osa", "Lagos", 6.4480, 3.4280, "Residential"],
  ["Kingsway Road, Ikoyi", "street", "Lagos", "Eti-Osa", "Lagos", 6.4510, 3.4350, "Residential"],
  ["Banana Island, Ikoyi", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4620, 3.4340, "Residential"],
  ["Parkview Estate, Ikoyi", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4440, 3.4400, "Residential"],
  ["Dolphin Estate, Ikoyi", "neighborhood", "Lagos", "Eti-Osa", "Lagos", 6.4500, 3.4180, "Residential"],
  
  // Lagos Island
  ["Lagos Island", "neighborhood", "Lagos", "Lagos Island", "Lagos", 6.4541, 3.3947, "Commercial"],
  ["Broad Street, Lagos Island", "street", "Lagos", "Lagos Island", "Lagos", 6.4510, 3.3900, "Commercial"],
  ["Marina, Lagos Island", "street", "Lagos", "Lagos Island", "Lagos", 6.4470, 3.3930, "Commercial"],
  ["Tinubu Square", "neighborhood", "Lagos", "Lagos Island", "Lagos", 6.4530, 3.3880, "Commercial"],
  ["Idumota", "neighborhood", "Lagos", "Lagos Island", "Lagos", 6.4560, 3.3870, "Commercial"],
  
  // Lagos Mainland / Yaba / Surulere
  ["Yaba", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.5158, 3.3750, "Commercial"],
  ["Herbert Macaulay Way, Yaba", "street", "Lagos", "Lagos Mainland", "Lagos", 6.5120, 3.3780, "Commercial"],
  ["Commercial Avenue, Yaba", "street", "Lagos", "Lagos Mainland", "Lagos", 6.5180, 3.3810, "Commercial"],
  ["Abule Oja, Yaba", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.5200, 3.3850, "Residential"],
  ["Sabo, Yaba", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.5130, 3.3820, "Residential"],
  ["Akoka", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.5280, 3.3880, "Residential"],
  ["Tunde Bello Street, Akoka", "street", "Lagos", "Lagos Mainland", "Lagos", 6.5295, 3.3895, "Residential"],
  ["University of Lagos", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.5158, 3.3975, "Institutional"],
  ["Ebute Metta", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.4850, 3.3750, "Residential"],
  ["Oyingbo", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.4800, 3.3820, "Commercial"],
  ["Iwaya", "neighborhood", "Lagos", "Lagos Mainland", "Lagos", 6.5050, 3.3900, "Residential"],
  ["Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5050, 3.3500, "Residential"],
  ["Adeniran Ogunsanya Street, Surulere", "street", "Lagos", "Surulere", "Lagos", 6.4980, 3.3530, "Commercial"],
  ["Bode Thomas Street, Surulere", "street", "Lagos", "Surulere", "Lagos", 6.5010, 3.3560, "Commercial"],
  ["Aguda, Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5050, 3.3470, "Residential"],
  ["Iponri, Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.4920, 3.3620, "Residential"],
  ["Ojuelegba", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5110, 3.3610, "Commercial"],
  ["Shitta, Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5045, 3.3510, "Residential"],
  ["Masha, Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5020, 3.3550, "Residential"],
  ["Lawanson, Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5070, 3.3490, "Residential"],
  ["Itire, Surulere", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5100, 3.3450, "Residential"],
  ["Abule Ijesha", "neighborhood", "Lagos", "Surulere", "Lagos", 6.5050, 3.3550, "Residential"],
  
  // Apapa / Amuwo-Odofin
  ["Apapa", "neighborhood", "Lagos", "Apapa", "Lagos", 6.4481, 3.3590, "Industrial"],
  ["Ajegunle", "neighborhood", "Lagos", "Ajeromi-Ifelodun", "Lagos", 6.4550, 3.3250, "Residential"],
  ["Festac Town", "neighborhood", "Lagos", "Amuwo-Odofin", "Lagos", 6.4660, 3.2830, "Residential"],
  ["Mile 2", "neighborhood", "Lagos", "Amuwo-Odofin", "Lagos", 6.4700, 3.2900, "Commercial"],
  ["Satellite Town", "neighborhood", "Lagos", "Amuwo-Odofin", "Lagos", 6.4550, 3.2700, "Residential"],
  ["Orile", "neighborhood", "Lagos", "Ajeromi-Ifelodun", "Lagos", 6.4650, 3.3500, "Residential"],
  
  // Ikeja LGA
  ["Ikeja", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.6018, 3.3515, "Commercial"],
  ["Ikeja GRA", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.5900, 3.3450, "Residential"],
  ["Allen Avenue, Ikeja", "street", "Lagos", "Ikeja", "Lagos", 6.6010, 3.3530, "Commercial"],
  ["Obafemi Awolowo Way, Ikeja", "street", "Lagos", "Ikeja", "Lagos", 6.5960, 3.3460, "Commercial"],
  ["Alausa, Ikeja", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.6120, 3.3580, "Government"],
  ["Adeniyi Jones, Ikeja", "street", "Lagos", "Ikeja", "Lagos", 6.6050, 3.3490, "Residential"],
  ["Opebi, Ikeja", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.5880, 3.3610, "Residential"],
  ["Toyin Street, Ikeja", "street", "Lagos", "Ikeja", "Lagos", 6.5950, 3.3540, "Commercial"],
  ["Computer Village, Ikeja", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.5920, 3.3420, "Commercial"],
  ["Maryland", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.5710, 3.3640, "Commercial"],
  ["Ikorodu Road, Maryland", "street", "Lagos", "Ikeja", "Lagos", 6.5680, 3.3680, "Commercial"],
  ["Anthony Village", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.5600, 3.3700, "Residential"],
  ["Oregun", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.5950, 3.3700, "Commercial"],
  
  // Mushin / Oshodi
  ["Mushin", "neighborhood", "Lagos", "Mushin", "Lagos", 6.5383, 3.3517, "Residential"],
  ["Idi-Araba, Mushin", "neighborhood", "Lagos", "Mushin", "Lagos", 6.5280, 3.3450, "Residential"],
  ["Palm Avenue, Mushin", "street", "Lagos", "Mushin", "Lagos", 6.5350, 3.3500, "Residential"],
  ["Oshodi", "neighborhood", "Lagos", "Oshodi-Isolo", "Lagos", 6.5568, 3.3420, "Commercial"],
  ["Isolo", "neighborhood", "Lagos", "Oshodi-Isolo", "Lagos", 6.5350, 3.3200, "Residential"],
  ["Ajao Estate", "neighborhood", "Lagos", "Oshodi-Isolo", "Lagos", 6.5450, 3.3350, "Residential"],
  ["Mafoluku, Oshodi", "neighborhood", "Lagos", "Oshodi-Isolo", "Lagos", 6.5520, 3.3380, "Residential"],
  ["Okota", "neighborhood", "Lagos", "Oshodi-Isolo", "Lagos", 6.5200, 3.3150, "Residential"],
  
  // Alimosho / Agege / Ifako-Ijaiye
  ["Alimosho", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.6000, 3.2800, "Residential"],
  ["Iyana Ipaja", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.6050, 3.2600, "Residential"],
  ["Egbeda", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.5950, 3.2850, "Residential"],
  ["Idimu", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.5700, 3.2700, "Residential"],
  ["Igando", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.5550, 3.2550, "Residential"],
  ["Ipaja", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.6150, 3.2650, "Residential"],
  ["Ayobo", "neighborhood", "Lagos", "Alimosho", "Lagos", 6.6300, 3.2400, "Residential"],
  ["Agege", "neighborhood", "Lagos", "Agege", "Lagos", 6.6182, 3.3280, "Residential"],
  ["Pen Cinema, Agege", "neighborhood", "Lagos", "Agege", "Lagos", 6.6200, 3.3200, "Commercial"],
  ["Ogba", "neighborhood", "Lagos", "Ifako-Ijaiye", "Lagos", 6.6240, 3.3380, "Residential"],
  ["Ifako", "neighborhood", "Lagos", "Ifako-Ijaiye", "Lagos", 6.6400, 3.3200, "Residential"],
  
  // Kosofe / Shomolu
  ["Gbagada", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5520, 3.3900, "Residential"],
  ["Gbagada Estate", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5540, 3.3920, "Residential"],
  ["Ogudu", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5700, 3.3900, "Residential"],
  ["Ogudu GRA", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5750, 3.3950, "Residential"],
  ["Ojota", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5820, 3.3780, "Commercial"],
  ["Ketu", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5850, 3.3850, "Residential"],
  ["Mile 12", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.5950, 3.4000, "Commercial"],
  ["Magodo", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.6200, 3.3800, "Residential"],
  ["Magodo Phase 2", "neighborhood", "Lagos", "Kosofe", "Lagos", 6.6250, 3.3850, "Residential"],
  ["Ojodu Berger", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.6320, 3.3370, "Commercial"],
  ["Ojodu", "neighborhood", "Lagos", "Ikeja", "Lagos", 6.6300, 3.3600, "Residential"],
  ["Shomolu", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5400, 3.3800, "Residential"],
  ["Pedro, Shomolu", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5420, 3.3820, "Residential"],
  ["Bariga", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5350, 3.3950, "Residential"],
  ["Palmgrove, Shomolu", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5380, 3.3700, "Residential"],
  ["Fadeyi", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5230, 3.3730, "Residential"],
  ["Onipanu", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5380, 3.3660, "Residential"],
  ["Ilupeju", "neighborhood", "Lagos", "Shomolu", "Lagos", 6.5520, 3.3680, "Residential"],
  
  // Ikorodu
  ["Ikorodu", "neighborhood", "Lagos", "Ikorodu", "Lagos", 6.6194, 3.5105, "Residential"],
  ["Igbogbo, Ikorodu", "neighborhood", "Lagos", "Ikorodu", "Lagos", 6.6100, 3.5200, "Residential"],
  ["Benson, Ikorodu", "neighborhood", "Lagos", "Ikorodu", "Lagos", 6.6200, 3.5050, "Commercial"],
  ["Agric, Ikorodu", "neighborhood", "Lagos", "Ikorodu", "Lagos", 6.6150, 3.5300, "Residential"],
  
  // Ojo / Badagry / Epe
  ["Ojo", "neighborhood", "Lagos", "Ojo", "Lagos", 6.4667, 3.2000, "Residential"],
  ["Badagry", "neighborhood", "Lagos", "Badagry", "Lagos", 6.4158, 2.8814, "Residential"],
  ["Epe", "neighborhood", "Lagos", "Epe", "Lagos", 6.5833, 3.9833, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // FCT ABUJA — Streets & Neighborhoods
  // ══════════════════════════════════════════════════════════════
  ["Maitama", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0833, 7.5000, "Residential"],
  ["Aguyi Ironsi Street, Maitama", "street", "FCT", "Abuja Municipal", "Abuja", 9.0850, 7.4950, "Residential"],
  ["Amazon Street, Maitama", "street", "FCT", "Abuja Municipal", "Abuja", 9.0820, 7.5030, "Residential"],
  ["Asokoro", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0500, 7.5300, "Residential"],
  ["Gana Street, Maitama", "street", "FCT", "Abuja Municipal", "Abuja", 9.0800, 7.4980, "Commercial"],
  ["Wuse", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0700, 7.4900, "Commercial"],
  ["Wuse 2", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0750, 7.4850, "Commercial"],
  ["Aminu Kano Crescent, Wuse 2", "street", "FCT", "Abuja Municipal", "Abuja", 9.0760, 7.4830, "Commercial"],
  ["Herbert Macaulay Way, Wuse", "street", "FCT", "Abuja Municipal", "Abuja", 9.0720, 7.4870, "Commercial"],
  ["Garki", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0400, 7.4900, "Commercial"],
  ["Garki Area 1", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0450, 7.4850, "Commercial"],
  ["Garki Area 2", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0380, 7.4920, "Commercial"],
  ["Garki Area 3", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0350, 7.4880, "Residential"],
  ["Central Business District", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0580, 7.4950, "Commercial"],
  ["Gwarinpa", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.1100, 7.4100, "Residential"],
  ["1st Avenue, Gwarinpa", "street", "FCT", "Abuja Municipal", "Abuja", 9.1120, 7.4080, "Residential"],
  ["3rd Avenue, Gwarinpa", "street", "FCT", "Abuja Municipal", "Abuja", 9.1080, 7.4120, "Residential"],
  ["Jabi", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0700, 7.4200, "Commercial"],
  ["Utako", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0800, 7.4400, "Residential"],
  ["Lifecamp", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.1000, 7.4000, "Residential"],
  ["Kubwa", "neighborhood", "FCT", "Bwari", "Abuja", 9.1333, 7.3333, "Residential"],
  ["Kubwa FHA", "neighborhood", "FCT", "Bwari", "Abuja", 9.1400, 7.3300, "Residential"],
  ["Dutse Alhaji", "neighborhood", "FCT", "Bwari", "Abuja", 9.1200, 7.3700, "Residential"],
  ["Lugbe", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 8.9833, 7.3667, "Residential"],
  ["Nyanya", "neighborhood", "FCT", "Karu", "Abuja", 9.0200, 7.5600, "Residential"],
  ["Karu", "neighborhood", "FCT", "Karu", "Abuja", 9.0300, 7.5800, "Residential"],
  ["Mpape", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.1100, 7.4900, "Residential"],
  ["Gwagwalada", "neighborhood", "FCT", "Gwagwalada", "Abuja", 8.9400, 7.0800, "Residential"],
  ["Kuje", "neighborhood", "FCT", "Kuje", "Abuja", 8.8700, 7.2200, "Residential"],
  ["Lokogoma", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 8.9900, 7.4300, "Residential"],
  ["Apo", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0100, 7.4900, "Residential"],
  ["Durumi", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0200, 7.4700, "Residential"],
  ["Gudu", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0150, 7.4600, "Residential"],
  ["Kaura", "neighborhood", "FCT", "Abuja Municipal", "Abuja", 9.0000, 7.4500, "Residential"],
  ["Dawaki", "neighborhood", "FCT", "Bwari", "Abuja", 9.1300, 7.4500, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // RIVERS STATE — Port Harcourt Streets & Neighborhoods
  // ══════════════════════════════════════════════════════════════
  ["Rumuokoro", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8600, 7.0200, "Residential"],
  ["Rumuola", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8500, 7.0100, "Residential"],
  ["Rumuodara", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8700, 7.0300, "Residential"],
  ["Rukpokwu", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8900, 7.0400, "Residential"],
  ["D-Line", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.7900, 7.0200, "Residential"],
  ["GRA Phase 2, Port Harcourt", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.8000, 7.0000, "Residential"],
  ["GRA Phase 1, Port Harcourt", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.7950, 7.0050, "Residential"],
  ["Trans Amadi", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.8100, 7.0500, "Industrial"],
  ["Eleme", "neighborhood", "Rivers", "Eleme", "Port Harcourt", 4.7500, 7.1100, "Industrial"],
  ["Choba", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8800, 6.9200, "Residential"],
  ["Oyigbo", "neighborhood", "Rivers", "Oyigbo", "Port Harcourt", 4.8700, 7.1500, "Residential"],
  ["Woji", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8200, 7.0600, "Residential"],
  ["Ada George", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.8300, 7.0000, "Residential"],
  ["Eliozu", "neighborhood", "Rivers", "Obio-Akpor", "Port Harcourt", 4.8550, 7.0500, "Residential"],
  ["Abuloma", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.7600, 7.0400, "Residential"],
  ["Mile 1, Diobu", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.7800, 7.0100, "Commercial"],
  ["Mile 3, Diobu", "neighborhood", "Rivers", "Port Harcourt", "Port Harcourt", 4.7750, 7.0150, "Commercial"],
  ["Onne", "neighborhood", "Rivers", "Eleme", "Port Harcourt", 4.7300, 7.1400, "Industrial"],
  ["Bonny", "neighborhood", "Rivers", "Bonny", "Port Harcourt", 4.4400, 7.1700, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // OYO STATE — Ibadan Streets & Neighborhoods
  // ══════════════════════════════════════════════════════════════
  ["Bodija", "neighborhood", "Oyo", "Ibadan North", "Ibadan", 7.4200, 3.9000, "Residential"],
  ["UI, Ibadan", "neighborhood", "Oyo", "Ibadan North", "Ibadan", 7.4400, 3.9000, "Institutional"],
  ["Agodi GRA", "neighborhood", "Oyo", "Ibadan North", "Ibadan", 7.4100, 3.9100, "Residential"],
  ["Mokola", "neighborhood", "Oyo", "Ibadan North", "Ibadan", 7.4000, 3.8800, "Commercial"],
  ["Sango, Ibadan", "neighborhood", "Oyo", "Ibadan North", "Ibadan", 7.4300, 3.8700, "Residential"],
  ["Dugbe", "neighborhood", "Oyo", "Ibadan North West", "Ibadan", 7.3900, 3.8800, "Commercial"],
  ["Challenge", "neighborhood", "Oyo", "Ibadan South East", "Ibadan", 7.3600, 3.8700, "Residential"],
  ["Ring Road, Ibadan", "neighborhood", "Oyo", "Ibadan South West", "Ibadan", 7.3800, 3.8900, "Commercial"],
  ["Apata", "neighborhood", "Oyo", "Ibadan South West", "Ibadan", 7.3700, 3.8500, "Residential"],
  ["Oke-Ado", "neighborhood", "Oyo", "Ibadan South West", "Ibadan", 7.3850, 3.8850, "Residential"],
  ["Oluyole Estate", "neighborhood", "Oyo", "Ibadan South West", "Ibadan", 7.3500, 3.8600, "Residential"],
  ["Iwo Road", "neighborhood", "Oyo", "Ibadan North East", "Ibadan", 7.4050, 3.9300, "Commercial"],
  ["Gate, Ibadan", "neighborhood", "Oyo", "Ibadan North East", "Ibadan", 7.4150, 3.9400, "Commercial"],
  ["Ojoo", "neighborhood", "Oyo", "Ibadan North", "Ibadan", 7.4600, 3.8800, "Residential"],
  ["Moniya", "neighborhood", "Oyo", "Akinyele", "Ibadan", 7.5200, 3.9200, "Residential"],
  ["Ogbomosho", "neighborhood", "Oyo", "Ogbomosho North", "Ogbomosho", 8.1333, 4.2500, "Residential"],
  ["Oyo Town", "neighborhood", "Oyo", "Oyo West", "Oyo", 7.8500, 3.9333, "Residential"],
  ["Iseyin", "neighborhood", "Oyo", "Iseyin", "Iseyin", 7.9700, 3.5900, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // KANO STATE
  // ══════════════════════════════════════════════════════════════
  ["Sabon Gari, Kano", "neighborhood", "Kano", "Fagge", "Kano", 11.9600, 8.5200, "Commercial"],
  ["Nassarawa, Kano", "neighborhood", "Kano", "Nassarawa", "Kano", 11.9800, 8.5300, "Residential"],
  ["Bompai", "neighborhood", "Kano", "Nassarawa", "Kano", 11.9700, 8.5500, "Industrial"],
  ["Gwale", "neighborhood", "Kano", "Gwale", "Kano", 11.9900, 8.5100, "Residential"],
  ["Tarauni", "neighborhood", "Kano", "Tarauni", "Kano", 11.9500, 8.4800, "Residential"],
  ["Sharada", "neighborhood", "Kano", "Kano Municipal", "Kano", 11.9550, 8.4700, "Industrial"],
  ["Hotoro", "neighborhood", "Kano", "Nassarawa", "Kano", 11.9650, 8.5600, "Residential"],
  ["Zoo Road, Kano", "street", "Kano", "Kano Municipal", "Kano", 11.9750, 8.5100, "Commercial"],
  ["Court Road, Kano", "street", "Kano", "Kano Municipal", "Kano", 11.9800, 8.5200, "Commercial"],
  ["Fagge", "neighborhood", "Kano", "Fagge", "Kano", 11.9580, 8.5250, "Commercial"],
  ["Kofar Mata", "neighborhood", "Kano", "Kano Municipal", "Kano", 12.0000, 8.5200, "Residential"],
  ["Wudil", "neighborhood", "Kano", "Wudil", "Kano", 11.8100, 8.8500, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // KADUNA STATE
  // ══════════════════════════════════════════════════════════════
  ["Barnawa", "neighborhood", "Kaduna", "Kaduna South", "Kaduna", 10.4800, 7.4200, "Residential"],
  ["Kakuri", "neighborhood", "Kaduna", "Kaduna South", "Kaduna", 10.4600, 7.4300, "Residential"],
  ["Ungwan Rimi", "neighborhood", "Kaduna", "Kaduna North", "Kaduna", 10.5300, 7.4400, "Residential"],
  ["Sabon Tasha", "neighborhood", "Kaduna", "Chikun", "Kaduna", 10.4400, 7.3900, "Residential"],
  ["Malali", "neighborhood", "Kaduna", "Kaduna North", "Kaduna", 10.5500, 7.4300, "Residential"],
  ["Narayi", "neighborhood", "Kaduna", "Chikun", "Kaduna", 10.4500, 7.4100, "Residential"],
  ["Tudun Wada, Kaduna", "neighborhood", "Kaduna", "Kaduna North", "Kaduna", 10.5200, 7.4500, "Residential"],
  ["Rigasa", "neighborhood", "Kaduna", "Igabi", "Kaduna", 10.5400, 7.3800, "Residential"],
  ["Zaria", "neighborhood", "Kaduna", "Zaria", "Zaria", 11.0667, 7.7000, "Residential"],
  ["Sabon Gari, Zaria", "neighborhood", "Kaduna", "Sabon Gari", "Zaria", 11.0800, 7.7100, "Commercial"],
  ["Samaru, Zaria", "neighborhood", "Kaduna", "Sabon Gari", "Zaria", 11.1000, 7.6500, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // ENUGU STATE
  // ══════════════════════════════════════════════════════════════
  ["Independence Layout, Enugu", "neighborhood", "Enugu", "Enugu North", "Enugu", 6.4600, 7.5200, "Residential"],
  ["New Haven, Enugu", "neighborhood", "Enugu", "Enugu North", "Enugu", 6.4400, 7.5000, "Residential"],
  ["Trans Ekulu", "neighborhood", "Enugu", "Enugu East", "Enugu", 6.4700, 7.5400, "Residential"],
  ["Achara Layout", "neighborhood", "Enugu", "Enugu South", "Enugu", 6.4100, 7.4800, "Residential"],
  ["Ogui, Enugu", "neighborhood", "Enugu", "Enugu North", "Enugu", 6.4550, 7.5100, "Commercial"],
  ["Coal Camp, Enugu", "neighborhood", "Enugu", "Enugu South", "Enugu", 6.4200, 7.4900, "Residential"],
  ["Abakpa Nike", "neighborhood", "Enugu", "Enugu East", "Enugu", 6.4800, 7.5600, "Residential"],
  ["Emene", "neighborhood", "Enugu", "Enugu East", "Enugu", 6.4900, 7.5700, "Industrial"],
  ["Nsukka", "neighborhood", "Enugu", "Nsukka", "Nsukka", 6.8567, 7.3958, "Residential"],
  ["Agbani", "neighborhood", "Enugu", "Nkanu West", "Enugu", 6.3300, 7.5500, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // EDO STATE — Benin City
  // ══════════════════════════════════════════════════════════════
  ["GRA, Benin City", "neighborhood", "Edo", "Oredo", "Benin City", 6.3400, 5.6200, "Residential"],
  ["Uselu", "neighborhood", "Edo", "Egor", "Benin City", 6.3600, 5.6100, "Residential"],
  ["Ugbowo", "neighborhood", "Edo", "Egor", "Benin City", 6.3700, 5.6300, "Residential"],
  ["Sapele Road, Benin", "street", "Edo", "Oredo", "Benin City", 6.3350, 5.6100, "Commercial"],
  ["Ring Road, Benin", "neighborhood", "Edo", "Oredo", "Benin City", 6.3380, 5.6150, "Commercial"],
  ["Ikpoba Hill", "neighborhood", "Edo", "Ikpoba-Okha", "Benin City", 6.3100, 5.6400, "Residential"],
  ["Aduwawa", "neighborhood", "Edo", "Ikpoba-Okha", "Benin City", 6.3200, 5.6500, "Residential"],
  ["Ekenwan", "neighborhood", "Edo", "Oredo", "Benin City", 6.3250, 5.5900, "Residential"],
  ["Upper Sokponba", "neighborhood", "Edo", "Oredo", "Benin City", 6.3150, 5.6300, "Residential"],
  ["Auchi", "neighborhood", "Edo", "Etsako West", "Auchi", 7.0700, 6.2700, "Residential"],
  ["Ekpoma", "neighborhood", "Edo", "Esan West", "Ekpoma", 6.7400, 6.1400, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // DELTA STATE
  // ══════════════════════════════════════════════════════════════
  ["Warri", "neighborhood", "Delta", "Warri South", "Warri", 5.5167, 5.7500, "Commercial"],
  ["Effurun", "neighborhood", "Delta", "Uvwie", "Warri", 5.5600, 5.7900, "Residential"],
  ["Ekpan", "neighborhood", "Delta", "Uvwie", "Warri", 5.5500, 5.7700, "Residential"],
  ["Enerhen", "neighborhood", "Delta", "Uvwie", "Warri", 5.5400, 5.7800, "Residential"],
  ["Asaba", "neighborhood", "Delta", "Oshimili South", "Asaba", 6.1941, 6.7335, "Residential"],
  ["Cable Point, Asaba", "neighborhood", "Delta", "Oshimili South", "Asaba", 6.2000, 6.7200, "Residential"],
  ["Okpanam", "neighborhood", "Delta", "Oshimili North", "Asaba", 6.2200, 6.7100, "Residential"],
  ["Sapele", "neighborhood", "Delta", "Sapele", "Sapele", 5.8940, 5.6770, "Residential"],
  ["Agbor", "neighborhood", "Delta", "Ika South", "Agbor", 6.2500, 6.2000, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // ANAMBRA STATE
  // ══════════════════════════════════════════════════════════════
  ["Awka", "neighborhood", "Anambra", "Awka South", "Awka", 6.2100, 7.0700, "Residential"],
  ["Amawbia", "neighborhood", "Anambra", "Awka South", "Awka", 6.2000, 7.0600, "Residential"],
  ["Onitsha", "neighborhood", "Anambra", "Onitsha North", "Onitsha", 6.1453, 6.7887, "Commercial"],
  ["Fegge, Onitsha", "neighborhood", "Anambra", "Onitsha South", "Onitsha", 6.1350, 6.7800, "Commercial"],
  ["Nnewi", "neighborhood", "Anambra", "Nnewi North", "Nnewi", 6.0200, 6.9100, "Commercial"],
  ["Ekwulobia", "neighborhood", "Anambra", "Aguata", "Ekwulobia", 6.0400, 7.0700, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // ABIA STATE
  // ══════════════════════════════════════════════════════════════
  ["Aba", "neighborhood", "Abia", "Aba South", "Aba", 5.1067, 7.3667, "Commercial"],
  ["Aba GRA", "neighborhood", "Abia", "Aba South", "Aba", 5.1100, 7.3700, "Residential"],
  ["Ariaria, Aba", "neighborhood", "Abia", "Aba South", "Aba", 5.1000, 7.3600, "Commercial"],
  ["Ogbor Hill, Aba", "neighborhood", "Abia", "Aba South", "Aba", 5.0900, 7.3800, "Residential"],
  ["Umuahia", "neighborhood", "Abia", "Umuahia North", "Umuahia", 5.5244, 7.4944, "Residential"],
  ["World Bank, Umuahia", "neighborhood", "Abia", "Umuahia North", "Umuahia", 5.5300, 7.5000, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // IMO STATE
  // ══════════════════════════════════════════════════════════════
  ["Owerri", "neighborhood", "Imo", "Owerri Municipal", "Owerri", 5.4850, 7.0333, "Commercial"],
  ["New Owerri", "neighborhood", "Imo", "Owerri Municipal", "Owerri", 5.4700, 7.0200, "Residential"],
  ["Ikenegbu, Owerri", "neighborhood", "Imo", "Owerri Municipal", "Owerri", 5.4900, 7.0300, "Commercial"],
  ["World Bank, Owerri", "neighborhood", "Imo", "Owerri West", "Owerri", 5.4600, 7.0100, "Residential"],
  ["Orlu", "neighborhood", "Imo", "Orlu", "Orlu", 5.7928, 7.0353, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // OGUN STATE
  // ══════════════════════════════════════════════════════════════
  ["Abeokuta", "neighborhood", "Ogun", "Abeokuta South", "Abeokuta", 7.1475, 3.3619, "Residential"],
  ["Kuto, Abeokuta", "neighborhood", "Ogun", "Abeokuta South", "Abeokuta", 7.1500, 3.3500, "Commercial"],
  ["Oke-Ilewo, Abeokuta", "neighborhood", "Ogun", "Abeokuta South", "Abeokuta", 7.1550, 3.3580, "Residential"],
  ["Sagamu", "neighborhood", "Ogun", "Sagamu", "Sagamu", 6.8333, 3.6500, "Residential"],
  ["Ota", "neighborhood", "Ogun", "Ado-Odo/Ota", "Ota", 6.6889, 3.2333, "Industrial"],
  ["Sango Ota", "neighborhood", "Ogun", "Ado-Odo/Ota", "Ota", 6.7000, 3.2500, "Residential"],
  ["Ijebu Ode", "neighborhood", "Ogun", "Ijebu Ode", "Ijebu Ode", 6.8167, 3.9167, "Residential"],
  ["Ilaro", "neighborhood", "Ogun", "Yewa South", "Ilaro", 6.8900, 3.0100, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // OSUN STATE
  // ══════════════════════════════════════════════════════════════
  ["Osogbo", "neighborhood", "Osun", "Osogbo", "Osogbo", 7.7667, 4.5667, "Residential"],
  ["Oke-Fia, Osogbo", "neighborhood", "Osun", "Osogbo", "Osogbo", 7.7700, 4.5700, "Commercial"],
  ["Ile-Ife", "neighborhood", "Osun", "Ife Central", "Ile-Ife", 7.4667, 4.5667, "Residential"],
  ["Ilesa", "neighborhood", "Osun", "Ilesa West", "Ilesa", 7.6167, 4.6833, "Residential"],
  ["Ede", "neighborhood", "Osun", "Ede North", "Ede", 7.7333, 4.4333, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // ONDO STATE
  // ══════════════════════════════════════════════════════════════
  ["Akure", "neighborhood", "Ondo", "Akure South", "Akure", 7.2500, 5.1950, "Residential"],
  ["Alagbaka, Akure", "neighborhood", "Ondo", "Akure South", "Akure", 7.2600, 5.2000, "Government"],
  ["Ondo Town", "neighborhood", "Ondo", "Ondo West", "Ondo", 7.1000, 4.8333, "Residential"],
  ["Ore", "neighborhood", "Ondo", "Odigbo", "Ore", 6.7500, 4.8800, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // KWARA STATE
  // ══════════════════════════════════════════════════════════════
  ["GRA, Ilorin", "neighborhood", "Kwara", "Ilorin South", "Ilorin", 8.4700, 4.5500, "Residential"],
  ["Tanke, Ilorin", "neighborhood", "Kwara", "Ilorin South", "Ilorin", 8.4500, 4.5700, "Residential"],
  ["Fate, Ilorin", "neighborhood", "Kwara", "Ilorin South", "Ilorin", 8.4600, 4.5800, "Residential"],
  ["Taiwo Road, Ilorin", "street", "Kwara", "Ilorin West", "Ilorin", 8.4900, 4.5500, "Commercial"],
  ["Surulere, Ilorin", "neighborhood", "Kwara", "Ilorin West", "Ilorin", 8.4800, 4.5400, "Residential"],
  ["Offa", "neighborhood", "Kwara", "Offa", "Offa", 8.1500, 4.7167, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // EKITI STATE
  // ══════════════════════════════════════════════════════════════
  ["Ado-Ekiti", "neighborhood", "Ekiti", "Ado-Ekiti", "Ado-Ekiti", 7.6167, 5.2333, "Residential"],
  ["Basiri, Ado-Ekiti", "neighborhood", "Ekiti", "Ado-Ekiti", "Ado-Ekiti", 7.6200, 5.2400, "Residential"],
  ["Ikere-Ekiti", "neighborhood", "Ekiti", "Ikere", "Ikere-Ekiti", 7.5000, 5.2300, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // PLATEAU STATE — Jos
  // ══════════════════════════════════════════════════════════════
  ["Jos", "neighborhood", "Plateau", "Jos North", "Jos", 9.8965, 8.8583, "Residential"],
  ["Rayfield, Jos", "neighborhood", "Plateau", "Jos South", "Jos", 9.8500, 8.8700, "Residential"],
  ["Bukuru", "neighborhood", "Plateau", "Jos South", "Jos", 9.8000, 8.8667, "Residential"],
  ["Angwan Rogo, Jos", "neighborhood", "Plateau", "Jos North", "Jos", 9.9000, 8.8500, "Residential"],
  ["Terminus, Jos", "neighborhood", "Plateau", "Jos North", "Jos", 9.9100, 8.8600, "Commercial"],
  
  // ══════════════════════════════════════════════════════════════
  // CROSS RIVER / AKWA IBOM / BAYELSA / EBONYI
  // ══════════════════════════════════════════════════════════════
  ["Calabar", "neighborhood", "Cross River", "Calabar Municipal", "Calabar", 4.9517, 8.3220, "Residential"],
  ["Calabar South", "neighborhood", "Cross River", "Calabar South", "Calabar", 4.9400, 8.3150, "Residential"],
  ["Diamond Hill, Calabar", "neighborhood", "Cross River", "Calabar Municipal", "Calabar", 4.9600, 8.3300, "Residential"],
  ["Uyo", "neighborhood", "Akwa Ibom", "Uyo", "Uyo", 5.0333, 7.9333, "Residential"],
  ["Shelter Afrique, Uyo", "neighborhood", "Akwa Ibom", "Uyo", "Uyo", 5.0400, 7.9400, "Residential"],
  ["Ikot Ekpene", "neighborhood", "Akwa Ibom", "Ikot Ekpene", "Ikot Ekpene", 5.1833, 7.7167, "Residential"],
  ["Eket", "neighborhood", "Akwa Ibom", "Eket", "Eket", 4.6500, 7.9300, "Residential"],
  ["Yenagoa", "neighborhood", "Bayelsa", "Yenagoa", "Yenagoa", 4.9247, 6.2642, "Residential"],
  ["Abakaliki", "neighborhood", "Ebonyi", "Abakaliki", "Abakaliki", 6.3249, 8.1137, "Residential"],
  ["Onueke", "neighborhood", "Ebonyi", "Ezza South", "Onueke", 6.2600, 8.0800, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // BENUE / NASSARAWA / KOGI / NIGER
  // ══════════════════════════════════════════════════════════════
  ["Makurdi", "neighborhood", "Benue", "Makurdi", "Makurdi", 7.7333, 8.5333, "Residential"],
  ["High Level, Makurdi", "neighborhood", "Benue", "Makurdi", "Makurdi", 7.7400, 8.5200, "Residential"],
  ["North Bank, Makurdi", "neighborhood", "Benue", "Makurdi", "Makurdi", 7.7500, 8.5400, "Residential"],
  ["Gboko", "neighborhood", "Benue", "Gboko", "Gboko", 7.3167, 9.0000, "Residential"],
  ["Otukpo", "neighborhood", "Benue", "Otukpo", "Otukpo", 7.1900, 8.1300, "Residential"],
  ["Lafia", "neighborhood", "Nassarawa", "Lafia", "Lafia", 8.4833, 8.5167, "Residential"],
  ["Keffi", "neighborhood", "Nassarawa", "Keffi", "Keffi", 8.8500, 7.8700, "Residential"],
  ["Lokoja", "neighborhood", "Kogi", "Lokoja", "Lokoja", 7.8000, 6.7333, "Residential"],
  ["Lokoja GRA", "neighborhood", "Kogi", "Lokoja", "Lokoja", 7.8100, 6.7400, "Residential"],
  ["Okene", "neighborhood", "Kogi", "Okene", "Okene", 7.5500, 6.2333, "Residential"],
  ["Kabba", "neighborhood", "Kogi", "Kabba/Bunu", "Kabba", 7.8300, 6.0700, "Residential"],
  ["Minna", "neighborhood", "Niger", "Chanchaga", "Minna", 9.6139, 6.5569, "Residential"],
  ["Bosso, Minna", "neighborhood", "Niger", "Bosso", "Minna", 9.6300, 6.5400, "Residential"],
  ["Suleja", "neighborhood", "Niger", "Suleja", "Suleja", 9.1833, 7.1833, "Residential"],
  ["Bida", "neighborhood", "Niger", "Bida", "Bida", 9.0800, 6.0100, "Residential"],
  ["Kontagora", "neighborhood", "Niger", "Kontagora", "Kontagora", 10.4000, 5.4700, "Residential"],
  
  // ══════════════════════════════════════════════════════════════
  // NORTHERN STATES
  // ══════════════════════════════════════════════════════════════
  ["Sokoto", "neighborhood", "Sokoto", "Sokoto North", "Sokoto", 13.0600, 5.2400, "Residential"],
  ["Arkilla, Sokoto", "neighborhood", "Sokoto", "Sokoto North", "Sokoto", 13.0500, 5.2300, "Residential"],
  ["Birnin Kebbi", "neighborhood", "Kebbi", "Birnin Kebbi", "Birnin Kebbi", 12.4500, 4.2000, "Residential"],
  ["Argungu", "neighborhood", "Kebbi", "Argungu", "Argungu", 12.7500, 4.5300, "Residential"],
  ["Gusau", "neighborhood", "Zamfara", "Gusau", "Gusau", 12.1700, 6.6700, "Residential"],
  ["Katsina", "neighborhood", "Katsina", "Katsina", "Katsina", 13.0000, 7.6000, "Residential"],
  ["Funtua", "neighborhood", "Katsina", "Funtua", "Funtua", 11.5300, 7.3100, "Residential"],
  ["Daura", "neighborhood", "Katsina", "Daura", "Daura", 13.0300, 8.3200, "Residential"],
  ["Dutse", "neighborhood", "Jigawa", "Dutse", "Dutse", 11.7600, 9.3400, "Residential"],
  ["Hadejia", "neighborhood", "Jigawa", "Hadejia", "Hadejia", 12.4500, 10.0400, "Residential"],
  ["Bauchi", "neighborhood", "Bauchi", "Bauchi", "Bauchi", 10.3100, 9.8400, "Residential"],
  ["Azare", "neighborhood", "Bauchi", "Katagum", "Azare", 11.6800, 10.2000, "Residential"],
  ["Gombe", "neighborhood", "Gombe", "Gombe", "Gombe", 10.2900, 11.1700, "Residential"],
  ["Yola", "neighborhood", "Adamawa", "Yola North", "Yola", 9.2000, 12.4833, "Residential"],
  ["Jimeta", "neighborhood", "Adamawa", "Yola North", "Yola", 9.2800, 12.4600, "Commercial"],
  ["Numan", "neighborhood", "Adamawa", "Numan", "Numan", 9.4700, 12.0400, "Residential"],
  ["Jalingo", "neighborhood", "Taraba", "Jalingo", "Jalingo", 8.9000, 11.3667, "Residential"],
  ["Maiduguri", "neighborhood", "Borno", "Maiduguri", "Maiduguri", 11.8333, 13.1500, "Residential"],
  ["GRA, Maiduguri", "neighborhood", "Borno", "Maiduguri", "Maiduguri", 11.8400, 13.1600, "Residential"],
  ["Biu", "neighborhood", "Borno", "Biu", "Biu", 10.6100, 12.1900, "Residential"],
  ["Damaturu", "neighborhood", "Yobe", "Damaturu", "Damaturu", 11.7500, 11.9667, "Residential"],
  ["Potiskum", "neighborhood", "Yobe", "Potiskum", "Potiskum", 11.7100, 11.0800, "Residential"],
  ["Gashua", "neighborhood", "Yobe", "Bade", "Gashua", 12.8700, 11.0500, "Residential"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get existing node names to avoid duplicates
    const { data: existingNodes } = await supabase.from("nodes").select("name");
    const existingNames = new Set((existingNodes || []).map((n) => n.name));

    // Get existing location names
    const { data: existingLocs } = await supabase.from("locations").select("name");
    const existingLocNames = new Set((existingLocs || []).map((l) => l.name));

    // Insert new locations
    const newLocations = LOCATIONS
      .filter(([name]) => !existingLocNames.has(name))
      .map(([name, type, state, lga, city, lat, lng]) => ({
        name, type, state, lga, city, latitude: lat, longitude: lng,
      }));

    let insertedLocations = 0;
    const locationIds: Record<string, string> = {};
    const batchSize = 50;

    for (let i = 0; i < newLocations.length; i += batchSize) {
      const batch = newLocations.slice(i, i + batchSize);
      const { data, error } = await supabase.from("locations").insert(batch).select("id, name");
      if (error) { console.error("Location insert error:", error); continue; }
      if (data) {
        data.forEach((d) => { locationIds[d.name] = d.id; });
        insertedLocations += data.length;
      }
    }

    // Insert new nodes
    const newNodes = LOCATIONS
      .filter(([name]) => !existingNames.has(name))
      .map(([name, type, state, lga, city, lat, lng, areaType]) => {
        const disco = getDisco(state, lga);
        const band = assignBand(name, areaType, state);
        return {
          name, city, state, latitude: lat, longitude: lng,
          disco, band, area_type: areaType,
          status: "POWER_AVAILABLE",
          confidence: 50,
          severity: "LOW",
          tariff_per_kwh: bandToTariff(band),
          avg_supply_hours: bandToHours(band),
          location_id: locationIds[name] || null,
        };
      });

    let insertedNodes = 0;
    for (let i = 0; i < newNodes.length; i += batchSize) {
      const batch = newNodes.slice(i, i + batchSize);
      const { error } = await supabase.from("nodes").insert(batch);
      if (error) { console.error("Node insert error:", error); continue; }
      insertedNodes += batch.length;
    }

    // Recalculate grid status
    const { count: totalNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true });
    const { count: poweredNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "POWER_AVAILABLE");
    const { count: outageNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "OUTAGE");
    const { count: intermittentNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "INTERMITTENT");

    const outPct = (outageNodes || 0) / Math.max(totalNodes || 1, 1);
    let gridStatusVal = "GRID_STABLE";
    if (outPct > 0.6) gridStatusVal = "GRID_COLLAPSE";
    else if (outPct > 0.4) gridStatusVal = "PARTIAL_OUTAGE";
    else if (outPct > 0.2) gridStatusVal = "GRID_FLUCTUATING";

    const { data: existingGrid } = await supabase.from("grid_status").select("id").limit(1).single();
    if (existingGrid) {
      await supabase.from("grid_status").update({
        status: gridStatusVal,
        total_nodes: totalNodes ?? 0,
        powered_nodes: poweredNodes ?? 0,
        outage_nodes: outageNodes ?? 0,
        intermittent_nodes: intermittentNodes ?? 0,
      }).eq("id", existingGrid.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        locations_inserted: insertedLocations,
        nodes_created: insertedNodes,
        total_entries: LOCATIONS.length,
        existing_skipped: LOCATIONS.length - newNodes.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
