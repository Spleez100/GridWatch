import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Comprehensive Nigerian locations dataset
// Covering all 36 states + FCT with neighborhoods, cities, and key areas
const LOCATIONS = [
  // ── LAGOS STATE ─────────────────────────────────────────
  { name: "Lekki Phase 1", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4478, lng: 3.4723, pop: 45000 },
  { name: "Lekki Phase 2", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4420, lng: 3.5100, pop: 30000 },
  { name: "Ajah", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4667, lng: 3.5833, pop: 120000 },
  { name: "Victoria Island", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4281, lng: 3.4219, pop: 25000 },
  { name: "Ikoyi", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4488, lng: 3.4345, pop: 20000 },
  { name: "Yaba", type: "neighborhood", state: "Lagos", lga: "Lagos Mainland", city: "Lagos", lat: 6.5100, lng: 3.3700, pop: 150000 },
  { name: "Surulere", type: "neighborhood", state: "Lagos", lga: "Surulere", city: "Lagos", lat: 6.4969, lng: 3.3481, pop: 300000 },
  { name: "Abule Ijesha", type: "neighborhood", state: "Lagos", lga: "Surulere", city: "Lagos", lat: 6.5050, lng: 3.3550, pop: 40000 },
  { name: "Ikeja", type: "neighborhood", state: "Lagos", lga: "Ikeja", city: "Lagos", lat: 6.6018, lng: 3.3515, pop: 350000 },
  { name: "Ikeja GRA", type: "neighborhood", state: "Lagos", lga: "Ikeja", city: "Lagos", lat: 6.5900, lng: 3.3450, pop: 15000 },
  { name: "Maryland", type: "neighborhood", state: "Lagos", lga: "Ikeja", city: "Lagos", lat: 6.5697, lng: 3.3644, pop: 80000 },
  { name: "Ojodu Berger", type: "neighborhood", state: "Lagos", lga: "Ikeja", city: "Lagos", lat: 6.6320, lng: 3.3370, pop: 100000 },
  { name: "Magodo", type: "neighborhood", state: "Lagos", lga: "Kosofe", city: "Lagos", lat: 6.6200, lng: 3.3900, pop: 60000 },
  { name: "Gbagada", type: "neighborhood", state: "Lagos", lga: "Kosofe", city: "Lagos", lat: 6.5545, lng: 3.3930, pop: 120000 },
  { name: "Bariga", type: "neighborhood", state: "Lagos", lga: "Shomolu", city: "Lagos", lat: 6.5339, lng: 3.3928, pop: 200000 },
  { name: "Shomolu", type: "neighborhood", state: "Lagos", lga: "Shomolu", city: "Lagos", lat: 6.5400, lng: 3.3800, pop: 180000 },
  { name: "Mushin", type: "neighborhood", state: "Lagos", lga: "Mushin", city: "Lagos", lat: 6.5277, lng: 3.3530, pop: 400000 },
  { name: "Oshodi", type: "neighborhood", state: "Lagos", lga: "Oshodi-Isolo", city: "Lagos", lat: 6.5500, lng: 3.3300, pop: 200000 },
  { name: "Isolo", type: "neighborhood", state: "Lagos", lga: "Oshodi-Isolo", city: "Lagos", lat: 6.5350, lng: 3.3200, pop: 150000 },
  { name: "Festac Town", type: "neighborhood", state: "Lagos", lga: "Amuwo-Odofin", city: "Lagos", lat: 6.4660, lng: 3.2830, pop: 200000 },
  { name: "Ajegunle", type: "neighborhood", state: "Lagos", lga: "Ajeromi-Ifelodun", city: "Lagos", lat: 6.4550, lng: 3.3250, pop: 500000 },
  { name: "Apapa", type: "neighborhood", state: "Lagos", lga: "Apapa", city: "Lagos", lat: 6.4480, lng: 3.3590, pop: 100000 },
  { name: "Lagos Island", type: "neighborhood", state: "Lagos", lga: "Lagos Island", city: "Lagos", lat: 6.4541, lng: 3.3947, pop: 200000 },
  { name: "Iyana Ipaja", type: "neighborhood", state: "Lagos", lga: "Alimosho", city: "Lagos", lat: 6.6050, lng: 3.2600, pop: 300000 },
  { name: "Egbeda", type: "neighborhood", state: "Lagos", lga: "Alimosho", city: "Lagos", lat: 6.5950, lng: 3.2850, pop: 250000 },
  { name: "Alimosho", type: "neighborhood", state: "Lagos", lga: "Alimosho", city: "Lagos", lat: 6.6100, lng: 3.2800, pop: 400000 },
  { name: "Agege", type: "neighborhood", state: "Lagos", lga: "Agege", city: "Lagos", lat: 6.6167, lng: 3.3222, pop: 300000 },
  { name: "Ogba", type: "neighborhood", state: "Lagos", lga: "Ifako-Ijaiye", city: "Lagos", lat: 6.6240, lng: 3.3380, pop: 150000 },
  { name: "Ikorodu", type: "city", state: "Lagos", lga: "Ikorodu", city: "Ikorodu", lat: 6.6194, lng: 3.5105, pop: 500000 },
  { name: "Epe", type: "city", state: "Lagos", lga: "Epe", city: "Epe", lat: 6.5833, lng: 3.9833, pop: 200000 },
  { name: "Badagry", type: "city", state: "Lagos", lga: "Badagry", city: "Badagry", lat: 6.4158, lng: 2.8814, pop: 150000 },
  { name: "Ojo", type: "neighborhood", state: "Lagos", lga: "Ojo", city: "Lagos", lat: 6.4667, lng: 3.2000, pop: 200000 },
  { name: "Sangotedo", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4700, lng: 3.5600, pop: 80000 },
  { name: "Chevron", type: "neighborhood", state: "Lagos", lga: "Eti-Osa", city: "Lagos", lat: 6.4380, lng: 3.5000, pop: 25000 },
  { name: "Ogudu", type: "neighborhood", state: "Lagos", lga: "Kosofe", city: "Lagos", lat: 6.5700, lng: 3.3900, pop: 80000 },
  { name: "Ketu", type: "neighborhood", state: "Lagos", lga: "Kosofe", city: "Lagos", lat: 6.5850, lng: 3.3850, pop: 120000 },
  { name: "Mile 12", type: "neighborhood", state: "Lagos", lga: "Kosofe", city: "Lagos", lat: 6.5950, lng: 3.4000, pop: 100000 },
  { name: "Anthony Village", type: "neighborhood", state: "Lagos", lga: "Ikeja", city: "Lagos", lat: 6.5600, lng: 3.3700, pop: 50000 },

  // ── FCT ABUJA ───────────────────────────────────────────
  { name: "Garki", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0400, lng: 7.4900, pop: 100000 },
  { name: "Wuse", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0700, lng: 7.4900, pop: 150000 },
  { name: "Wuse 2", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0750, lng: 7.4850, pop: 80000 },
  { name: "Maitama", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0833, lng: 7.5000, pop: 40000 },
  { name: "Asokoro", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0500, lng: 7.5300, pop: 30000 },
  { name: "Gwarinpa", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.1100, lng: 7.4100, pop: 200000 },
  { name: "Kubwa", type: "neighborhood", state: "FCT", lga: "Bwari", city: "Abuja", lat: 9.1333, lng: 7.3333, pop: 300000 },
  { name: "Lugbe", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 8.9833, lng: 7.3667, pop: 200000 },
  { name: "Jabi", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0700, lng: 7.4200, pop: 100000 },
  { name: "Utako", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0800, lng: 7.4400, pop: 80000 },
  { name: "Lifecamp", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.1000, lng: 7.4000, pop: 120000 },
  { name: "Nyanya", type: "neighborhood", state: "FCT", lga: "Karu", city: "Abuja", lat: 9.0200, lng: 7.5600, pop: 250000 },
  { name: "Karu", type: "neighborhood", state: "FCT", lga: "Karu", city: "Abuja", lat: 9.0300, lng: 7.5800, pop: 200000 },
  { name: "Mpape", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.1100, lng: 7.4900, pop: 100000 },
  { name: "Central Business District", type: "neighborhood", state: "FCT", lga: "Abuja Municipal", city: "Abuja", lat: 9.0580, lng: 7.4950, pop: 50000 },
  { name: "Gwagwalada", type: "city", state: "FCT", lga: "Gwagwalada", city: "Gwagwalada", lat: 8.9400, lng: 7.0800, pop: 150000 },
  { name: "Kuje", type: "city", state: "FCT", lga: "Kuje", city: "Kuje", lat: 8.8700, lng: 7.2200, pop: 100000 },

  // ── RIVERS STATE ────────────────────────────────────────
  { name: "Rumuokoro", type: "neighborhood", state: "Rivers", lga: "Obio-Akpor", city: "Port Harcourt", lat: 4.8600, lng: 7.0200, pop: 100000 },
  { name: "Rumuola", type: "neighborhood", state: "Rivers", lga: "Obio-Akpor", city: "Port Harcourt", lat: 4.8500, lng: 7.0100, pop: 80000 },
  { name: "D-Line", type: "neighborhood", state: "Rivers", lga: "Port Harcourt", city: "Port Harcourt", lat: 4.7900, lng: 7.0200, pop: 40000 },
  { name: "GRA Phase 2", type: "neighborhood", state: "Rivers", lga: "Port Harcourt", city: "Port Harcourt", lat: 4.8000, lng: 7.0000, pop: 30000 },
  { name: "Trans Amadi", type: "neighborhood", state: "Rivers", lga: "Port Harcourt", city: "Port Harcourt", lat: 4.8100, lng: 7.0500, pop: 50000 },
  { name: "Eleme", type: "city", state: "Rivers", lga: "Eleme", city: "Eleme", lat: 4.7500, lng: 7.1100, pop: 80000 },
  { name: "Choba", type: "neighborhood", state: "Rivers", lga: "Obio-Akpor", city: "Port Harcourt", lat: 4.8800, lng: 6.9200, pop: 60000 },
  { name: "Oyigbo", type: "city", state: "Rivers", lga: "Oyigbo", city: "Oyigbo", lat: 4.8700, lng: 7.1500, pop: 70000 },

  // ── OYO STATE ───────────────────────────────────────────
  { name: "Bodija", type: "neighborhood", state: "Oyo", lga: "Ibadan North", city: "Ibadan", lat: 7.4200, lng: 3.9000, pop: 80000 },
  { name: "Challenge", type: "neighborhood", state: "Oyo", lga: "Ibadan South East", city: "Ibadan", lat: 7.3600, lng: 3.8700, pop: 120000 },
  { name: "Ring Road", type: "neighborhood", state: "Oyo", lga: "Ibadan South West", city: "Ibadan", lat: 7.3800, lng: 3.8900, pop: 100000 },
  { name: "Dugbe", type: "neighborhood", state: "Oyo", lga: "Ibadan North West", city: "Ibadan", lat: 7.3900, lng: 3.8800, pop: 80000 },
  { name: "Mokola", type: "neighborhood", state: "Oyo", lga: "Ibadan North", city: "Ibadan", lat: 7.4000, lng: 3.8800, pop: 60000 },
  { name: "Agodi", type: "neighborhood", state: "Oyo", lga: "Ibadan North", city: "Ibadan", lat: 7.4100, lng: 3.9100, pop: 50000 },
  { name: "Apata", type: "neighborhood", state: "Oyo", lga: "Ibadan South West", city: "Ibadan", lat: 7.3700, lng: 3.8500, pop: 100000 },
  { name: "Ogbomosho", type: "city", state: "Oyo", lga: "Ogbomosho North", city: "Ogbomosho", lat: 8.1333, lng: 4.2500, pop: 300000 },
  { name: "Oyo Town", type: "city", state: "Oyo", lga: "Oyo West", city: "Oyo", lat: 7.8500, lng: 3.9333, pop: 200000 },
  
  // ── KANO STATE ──────────────────────────────────────────
  { name: "Sabon Gari", type: "neighborhood", state: "Kano", lga: "Fagge", city: "Kano", lat: 11.9600, lng: 8.5200, pop: 200000 },
  { name: "Nassarawa", type: "neighborhood", state: "Kano", lga: "Nassarawa", city: "Kano", lat: 11.9800, lng: 8.5300, pop: 100000 },
  { name: "Bompai", type: "neighborhood", state: "Kano", lga: "Nassarawa", city: "Kano", lat: 11.9700, lng: 8.5500, pop: 80000 },
  { name: "Gwale", type: "neighborhood", state: "Kano", lga: "Gwale", city: "Kano", lat: 11.9900, lng: 8.5100, pop: 150000 },
  { name: "Tarauni", type: "neighborhood", state: "Kano", lga: "Tarauni", city: "Kano", lat: 11.9500, lng: 8.4800, pop: 120000 },
  { name: "Wudil", type: "city", state: "Kano", lga: "Wudil", city: "Wudil", lat: 11.8100, lng: 8.8500, pop: 50000 },

  // ── KADUNA STATE ────────────────────────────────────────
  { name: "Barnawa", type: "neighborhood", state: "Kaduna", lga: "Kaduna South", city: "Kaduna", lat: 10.4800, lng: 7.4200, pop: 80000 },
  { name: "Kakuri", type: "neighborhood", state: "Kaduna", lga: "Kaduna South", city: "Kaduna", lat: 10.4600, lng: 7.4300, pop: 100000 },
  { name: "Ungwan Rimi", type: "neighborhood", state: "Kaduna", lga: "Kaduna North", city: "Kaduna", lat: 10.5300, lng: 7.4400, pop: 60000 },
  { name: "Sabon Tasha", type: "neighborhood", state: "Kaduna", lga: "Chikun", city: "Kaduna", lat: 10.4400, lng: 7.3900, pop: 120000 },
  { name: "Zaria", type: "city", state: "Kaduna", lga: "Zaria", city: "Zaria", lat: 11.0667, lng: 7.7000, pop: 400000 },

  // ── ENUGU STATE ─────────────────────────────────────────
  { name: "Independence Layout", type: "neighborhood", state: "Enugu", lga: "Enugu North", city: "Enugu", lat: 6.4600, lng: 7.5200, pop: 40000 },
  { name: "New Haven", type: "neighborhood", state: "Enugu", lga: "Enugu North", city: "Enugu", lat: 6.4400, lng: 7.5000, pop: 80000 },
  { name: "Trans Ekulu", type: "neighborhood", state: "Enugu", lga: "Enugu East", city: "Enugu", lat: 6.4700, lng: 7.5400, pop: 60000 },
  { name: "Achara Layout", type: "neighborhood", state: "Enugu", lga: "Enugu South", city: "Enugu", lat: 6.4100, lng: 7.4800, pop: 50000 },
  { name: "Nsukka", type: "city", state: "Enugu", lga: "Nsukka", city: "Nsukka", lat: 6.8567, lng: 7.3958, pop: 120000 },
  { name: "Agbani", type: "city", state: "Enugu", lga: "Nkanu West", city: "Agbani", lat: 6.3300, lng: 7.5500, pop: 50000 },

  // ── DELTA STATE ─────────────────────────────────────────
  { name: "Warri", type: "city", state: "Delta", lga: "Warri South", city: "Warri", lat: 5.5167, lng: 5.7500, pop: 500000 },
  { name: "Effurun", type: "city", state: "Delta", lga: "Uvwie", city: "Effurun", lat: 5.5600, lng: 5.7900, pop: 200000 },
  { name: "Asaba", type: "city", state: "Delta", lga: "Oshimili South", city: "Asaba", lat: 6.1941, lng: 6.7335, pop: 200000 },
  { name: "Sapele", type: "city", state: "Delta", lga: "Sapele", city: "Sapele", lat: 5.8940, lng: 5.6770, pop: 150000 },

  // ── EDO STATE ───────────────────────────────────────────
  { name: "GRA Benin", type: "neighborhood", state: "Edo", lga: "Oredo", city: "Benin City", lat: 6.3400, lng: 5.6200, pop: 50000 },
  { name: "Uselu", type: "neighborhood", state: "Edo", lga: "Egor", city: "Benin City", lat: 6.3600, lng: 5.6100, pop: 80000 },
  { name: "Ugbowo", type: "neighborhood", state: "Edo", lga: "Egor", city: "Benin City", lat: 6.3700, lng: 5.6300, pop: 100000 },
  { name: "Sapele Road", type: "neighborhood", state: "Edo", lga: "Oredo", city: "Benin City", lat: 6.3350, lng: 5.6100, pop: 60000 },
  { name: "Auchi", type: "city", state: "Edo", lga: "Etsako West", city: "Auchi", lat: 7.0700, lng: 6.2700, pop: 100000 },

  // ── ANAMBRA STATE ───────────────────────────────────────
  { name: "Awka", type: "city", state: "Anambra", lga: "Awka South", city: "Awka", lat: 6.2100, lng: 7.0700, pop: 300000 },
  { name: "Onitsha", type: "city", state: "Anambra", lga: "Onitsha North", city: "Onitsha", lat: 6.1453, lng: 6.7887, pop: 500000 },
  { name: "Nnewi", type: "city", state: "Anambra", lga: "Nnewi North", city: "Nnewi", lat: 6.0200, lng: 6.9100, pop: 200000 },

  // ── ABIA STATE ──────────────────────────────────────────
  { name: "Aba", type: "city", state: "Abia", lga: "Aba South", city: "Aba", lat: 5.1067, lng: 7.3667, pop: 500000 },
  { name: "Umuahia", type: "city", state: "Abia", lga: "Umuahia North", city: "Umuahia", lat: 5.5244, lng: 7.4944, pop: 200000 },

  // ── IMO STATE ───────────────────────────────────────────
  { name: "Owerri", type: "city", state: "Imo", lga: "Owerri Municipal", city: "Owerri", lat: 5.4850, lng: 7.0333, pop: 300000 },
  { name: "Orlu", type: "city", state: "Imo", lga: "Orlu", city: "Orlu", lat: 5.7928, lng: 7.0353, pop: 100000 },

  // ── KWARA STATE ─────────────────────────────────────────
  { name: "GRA Ilorin", type: "neighborhood", state: "Kwara", lga: "Ilorin South", city: "Ilorin", lat: 8.4700, lng: 4.5500, pop: 40000 },
  { name: "Tanke", type: "neighborhood", state: "Kwara", lga: "Ilorin South", city: "Ilorin", lat: 8.4500, lng: 4.5700, pop: 60000 },
  { name: "Offa", type: "city", state: "Kwara", lga: "Offa", city: "Offa", lat: 8.1500, lng: 4.7167, pop: 80000 },

  // ── OSUN STATE ──────────────────────────────────────────
  { name: "Osogbo", type: "city", state: "Osun", lga: "Osogbo", city: "Osogbo", lat: 7.7667, lng: 4.5667, pop: 400000 },
  { name: "Ile-Ife", type: "city", state: "Osun", lga: "Ife Central", city: "Ile-Ife", lat: 7.4667, lng: 4.5667, pop: 300000 },
  { name: "Ilesa", type: "city", state: "Osun", lga: "Ilesa West", city: "Ilesa", lat: 7.6167, lng: 4.6833, pop: 200000 },

  // ── ONDO STATE ──────────────────────────────────────────
  { name: "Akure", type: "city", state: "Ondo", lga: "Akure South", city: "Akure", lat: 7.2500, lng: 5.1950, pop: 400000 },
  { name: "Ondo Town", type: "city", state: "Ondo", lga: "Ondo West", city: "Ondo", lat: 7.1000, lng: 4.8333, pop: 200000 },

  // ── OGUN STATE ──────────────────────────────────────────
  { name: "Abeokuta", type: "city", state: "Ogun", lga: "Abeokuta South", city: "Abeokuta", lat: 7.1475, lng: 3.3619, pop: 500000 },
  { name: "Sagamu", type: "city", state: "Ogun", lga: "Sagamu", city: "Sagamu", lat: 6.8333, lng: 3.6500, pop: 200000 },
  { name: "Ota", type: "city", state: "Ogun", lga: "Ado-Odo/Ota", city: "Ota", lat: 6.6889, lng: 3.2333, pop: 300000 },
  { name: "Ijebu Ode", type: "city", state: "Ogun", lga: "Ijebu Ode", city: "Ijebu Ode", lat: 6.8167, lng: 3.9167, pop: 200000 },

  // ── PLATEAU STATE ───────────────────────────────────────
  { name: "Jos", type: "city", state: "Plateau", lga: "Jos North", city: "Jos", lat: 9.8965, lng: 8.8583, pop: 500000 },
  { name: "Bukuru", type: "city", state: "Plateau", lga: "Jos South", city: "Bukuru", lat: 9.8000, lng: 8.8667, pop: 150000 },
  { name: "Rayfield", type: "neighborhood", state: "Plateau", lga: "Jos South", city: "Jos", lat: 9.8500, lng: 8.8700, pop: 40000 },

  // ── BENUE STATE ─────────────────────────────────────────
  { name: "Makurdi", type: "city", state: "Benue", lga: "Makurdi", city: "Makurdi", lat: 7.7333, lng: 8.5333, pop: 400000 },
  { name: "Gboko", type: "city", state: "Benue", lga: "Gboko", city: "Gboko", lat: 7.3167, lng: 9.0000, pop: 150000 },

  // ── NASSARAWA STATE ─────────────────────────────────────
  { name: "Lafia", type: "city", state: "Nassarawa", lga: "Lafia", city: "Lafia", lat: 8.4833, lng: 8.5167, pop: 200000 },

  // ── NIGER STATE ─────────────────────────────────────────
  { name: "Minna", type: "city", state: "Niger", lga: "Chanchaga", city: "Minna", lat: 9.6139, lng: 6.5569, pop: 300000 },
  { name: "Suleja", type: "city", state: "Niger", lga: "Suleja", city: "Suleja", lat: 9.1833, lng: 7.1833, pop: 200000 },

  // ── KOGI STATE ──────────────────────────────────────────
  { name: "Lokoja", type: "city", state: "Kogi", lga: "Lokoja", city: "Lokoja", lat: 7.8000, lng: 6.7333, pop: 200000 },
  { name: "Okene", type: "city", state: "Kogi", lga: "Okene", city: "Okene", lat: 7.5500, lng: 6.2333, pop: 150000 },

  // ── EKITI STATE ─────────────────────────────────────────
  { name: "Ado-Ekiti", type: "city", state: "Ekiti", lga: "Ado-Ekiti", city: "Ado-Ekiti", lat: 7.6167, lng: 5.2333, pop: 300000 },

  // ── CROSS RIVER STATE ───────────────────────────────────
  { name: "Calabar", type: "city", state: "Cross River", lga: "Calabar Municipal", city: "Calabar", lat: 4.9517, lng: 8.3220, pop: 400000 },

  // ── AKWA IBOM STATE ─────────────────────────────────────
  { name: "Uyo", type: "city", state: "Akwa Ibom", lga: "Uyo", city: "Uyo", lat: 5.0333, lng: 7.9333, pop: 400000 },
  { name: "Ikot Ekpene", type: "city", state: "Akwa Ibom", lga: "Ikot Ekpene", city: "Ikot Ekpene", lat: 5.1833, lng: 7.7167, pop: 100000 },

  // ── BAYELSA STATE ───────────────────────────────────────
  { name: "Yenagoa", type: "city", state: "Bayelsa", lga: "Yenagoa", city: "Yenagoa", lat: 4.9247, lng: 6.2642, pop: 300000 },

  // ── EBONYI STATE ────────────────────────────────────────
  { name: "Abakaliki", type: "city", state: "Ebonyi", lga: "Abakaliki", city: "Abakaliki", lat: 6.3249, lng: 8.1137, pop: 200000 },

  // ── SOKOTO STATE ────────────────────────────────────────
  { name: "Sokoto", type: "city", state: "Sokoto", lga: "Sokoto North", city: "Sokoto", lat: 13.0600, lng: 5.2400, pop: 400000 },

  // ── KEBBI STATE ─────────────────────────────────────────
  { name: "Birnin Kebbi", type: "city", state: "Kebbi", lga: "Birnin Kebbi", city: "Birnin Kebbi", lat: 12.4500, lng: 4.2000, pop: 200000 },

  // ── ZAMFARA STATE ───────────────────────────────────────
  { name: "Gusau", type: "city", state: "Zamfara", lga: "Gusau", city: "Gusau", lat: 12.1700, lng: 6.6700, pop: 250000 },

  // ── KATSINA STATE ───────────────────────────────────────
  { name: "Katsina", type: "city", state: "Katsina", lga: "Katsina", city: "Katsina", lat: 13.0000, lng: 7.6000, pop: 400000 },

  // ── JIGAWA STATE ────────────────────────────────────────
  { name: "Dutse", type: "city", state: "Jigawa", lga: "Dutse", city: "Dutse", lat: 11.7600, lng: 9.3400, pop: 150000 },

  // ── BAUCHI STATE ────────────────────────────────────────
  { name: "Bauchi", type: "city", state: "Bauchi", lga: "Bauchi", city: "Bauchi", lat: 10.3100, lng: 9.8400, pop: 400000 },

  // ── GOMBE STATE ─────────────────────────────────────────
  { name: "Gombe", type: "city", state: "Gombe", lga: "Gombe", city: "Gombe", lat: 10.2900, lng: 11.1700, pop: 300000 },

  // ── ADAMAWA STATE ───────────────────────────────────────
  { name: "Yola", type: "city", state: "Adamawa", lga: "Yola North", city: "Yola", lat: 9.2000, lng: 12.4833, pop: 300000 },
  { name: "Jimeta", type: "city", state: "Adamawa", lga: "Yola North", city: "Yola", lat: 9.2800, lng: 12.4600, pop: 200000 },

  // ── TARABA STATE ────────────────────────────────────────
  { name: "Jalingo", type: "city", state: "Taraba", lga: "Jalingo", city: "Jalingo", lat: 8.9000, lng: 11.3667, pop: 150000 },

  // ── BORNO STATE ─────────────────────────────────────────
  { name: "Maiduguri", type: "city", state: "Borno", lga: "Maiduguri", city: "Maiduguri", lat: 11.8333, lng: 13.1500, pop: 600000 },

  // ── YOBE STATE ──────────────────────────────────────────
  { name: "Damaturu", type: "city", state: "Yobe", lga: "Damaturu", city: "Damaturu", lat: 11.7500, lng: 11.9667, pop: 100000 },
];

// DisCo assignment by state
const DISCO_MAP: Record<string, string> = {
  "Lagos": "Eko Electric / Ikeja Electric",
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
  "Benue": "Enugu Electric (EEDC)",
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

// Band assignment based on area type
function assignBand(type: string, pop: number): string {
  if (type === "neighborhood" && pop < 50000) return "A";
  if (type === "neighborhood" && pop < 100000) return "B";
  if (type === "city" && pop > 300000) return "B";
  if (type === "city" && pop > 150000) return "C";
  return "D";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if locations already seeded
    const { count: existingCount } = await supabase
      .from("locations")
      .select("*", { count: "exact", head: true });

    if ((existingCount || 0) > 50) {
      return new Response(
        JSON.stringify({ message: "Locations already seeded", count: existingCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert locations in batches
    const locationRecords = LOCATIONS.map((l) => ({
      name: l.name,
      type: l.type,
      state: l.state,
      lga: l.lga,
      city: l.city,
      latitude: l.lat,
      longitude: l.lng,
      population_estimate: l.pop,
    }));

    const batchSize = 50;
    let insertedLocations = 0;
    const locationIds: Record<string, string> = {};

    for (let i = 0; i < locationRecords.length; i += batchSize) {
      const batch = locationRecords.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("locations")
        .insert(batch)
        .select("id, name");
      
      if (error) {
        console.error("Location insert error:", error);
        continue;
      }
      if (data) {
        data.forEach((d) => { locationIds[d.name] = d.id; });
        insertedLocations += data.length;
      }
    }

    // Now create power nodes for each location (that don't already exist)
    const { data: existingNodes } = await supabase
      .from("nodes")
      .select("name");
    const existingNodeNames = new Set((existingNodes || []).map((n) => n.name));

    const newNodes = LOCATIONS
      .filter((l) => !existingNodeNames.has(l.name))
      .map((l) => ({
        name: l.name,
        city: l.city || l.name,
        state: l.state,
        latitude: l.lat,
        longitude: l.lng,
        disco: DISCO_MAP[l.state] || "Unknown DisCo",
        band: assignBand(l.type, l.pop),
        area_type: l.type === "neighborhood" ? "Urban" : l.type === "city" ? "Urban" : "Suburban",
        status: "POWER_AVAILABLE",
        confidence: 50,
        severity: "LOW",
        tariff_per_kwh: 50,
        location_id: locationIds[l.name] || null,
      }));

    let insertedNodes = 0;
    for (let i = 0; i < newNodes.length; i += batchSize) {
      const batch = newNodes.slice(i, i + batchSize);
      const { error } = await supabase.from("nodes").insert(batch);
      if (error) {
        console.error("Node insert error:", error);
        continue;
      }
      insertedNodes += batch.length;
    }

    // Recalculate grid status
    const { count: totalNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true });
    const { count: poweredNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "POWER_AVAILABLE");
    const { count: outageNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "OUTAGE");
    const { count: intermittentNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "INTERMITTENT");

    const { data: existingGrid } = await supabase.from("grid_status").select("id").limit(1).single();
    if (existingGrid) {
      await supabase.from("grid_status").update({
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
        total_locations: LOCATIONS.length,
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
