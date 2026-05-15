import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

// Complete list of TCN Transmission Stations & Substations
// Source: Official TCN documents and tcn.org.ng
interface TCNStation {
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  voltage_class: string;
  tcn_region: string;
  station_type: string; // transmission, distribution, generation
  disco: string;
  band: string;
  area_type: string;
}

// DisCo assignment by state
function getDisco(state: string): string {
  const map: Record<string, string> = {
    Lagos: "EKEDC",
    Ogun: "IBEDC",
    Oyo: "IBEDC",
    Osun: "IBEDC",
    Kwara: "IBEDC",
    Ekiti: "IBEDC",
    Ondo: "BEDC",
    Edo: "BEDC",
    Delta: "BEDC",
    "Rivers": "PHED",
    Bayelsa: "PHED",
    "Akwa Ibom": "PHED",
    "Cross River": "PHED",
    Abia: "EEDC",
    Anambra: "EEDC",
    Ebonyi: "EEDC",
    Enugu: "EEDC",
    Imo: "EEDC",
    Benue: "BEDC",
    Kogi: "AEDC",
    Nasarawa: "AEDC",
    Niger: "AEDC",
    FCT: "AEDC",
    Plateau: "JED",
    Kaduna: "KAEDCO",
    Kano: "KEDCO",
    Katsina: "KEDCO",
    Jigawa: "KEDCO",
    Kebbi: "KAEDCO",
    Sokoto: "KAEDCO",
    Zamfara: "KAEDCO",
    Bauchi: "BEDC",
    Gombe: "BEDC",
    Borno: "YEDC",
    Yobe: "YEDC",
    Adamawa: "YEDC",
    Taraba: "YEDC",
  };
  // Lagos has two DISCOs - Ikeja Electric for north, EKEDC for south
  return map[state] || "AEDC";
}

// For Lagos specifically, differentiate IKEDC vs EKEDC
function getLagosDisco(name: string): string {
  const ikedcAreas = [
    "Ikeja West", "Oke-Aro", "Alimosho", "Ogba", "Alausa", "Ayobo", "Ejigbo", "Agbara",
  ];
  return ikedcAreas.some((a) => name.includes(a)) ? "IKEDC" : "EKEDC";
}

function assignBand(stationType: string, areaType: string): string {
  if (stationType === "transmission") return "A";
  if (areaType === "industrial") return "A";
  if (areaType === "urban") return "B";
  return "C";
}

function getAreaType(name: string, city: string): string {
  const industrial = ["Afam", "Egbin", "Geregu", "Kainji", "Jebba", "Shiroro", "Omotosho", "Olorunsogo", "Aladja Steel", "African Foundry", "Sagamu Cement", "Agbara"];
  if (industrial.some((i) => name.includes(i))) return "industrial";
  const urban = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Benin City", "Enugu", "Kaduna"];
  if (urban.some((u) => city.includes(u))) return "urban";
  return "semi-urban";
}

// ══════════════════════════════════════════════════════════════
// COMPLETE TCN STATION DATABASE
// Coordinates sourced from known locations of these substations
// ══════════════════════════════════════════════════════════════

const TCN_STATIONS: TCNStation[] = [
  // ── LAGOS REGION ─────────────────────────────────────────
  // 330/132kV Transmission Stations
  { name: "Akangba 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.5244, longitude: 3.3481, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "transmission", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Ikeja West 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.6018, longitude: 3.3515, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "transmission", disco: "IKEDC", band: "A", area_type: "urban" },
  { name: "Oke-Aro 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.6735, longitude: 3.2985, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "transmission", disco: "IKEDC", band: "A", area_type: "urban" },
  { name: "Egbin 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.5515, longitude: 3.6089, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "generation", disco: "EKEDC", band: "A", area_type: "industrial" },
  { name: "Ajah 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.4698, longitude: 3.5852, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "transmission", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Alagbon 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.4396, longitude: 3.4224, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "transmission", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Lekki 330/132kV T/S", city: "Lagos", state: "Lagos", latitude: 6.4478, longitude: 3.4723, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "transmission", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Olorunsogo I 330/132kV T/S", city: "Papalanto", state: "Ogun", latitude: 6.8925, longitude: 3.1978, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "generation", disco: "IBEDC", band: "A", area_type: "industrial" },
  { name: "Olorunsogo II 330/132kV T/S", city: "Papalanto", state: "Ogun", latitude: 6.8935, longitude: 3.1988, voltage_class: "330/132kV", tcn_region: "LAGOS", station_type: "generation", disco: "IBEDC", band: "A", area_type: "industrial" },

  // 132/33kV Distribution Substations - Lagos
  { name: "Akangba 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5254, longitude: 3.3491, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Ijora 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4540, longitude: 3.3741, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Ilupeju 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5530, longitude: 3.3600, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Isolo 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5335, longitude: 3.3238, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Itire 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5087, longitude: 3.3548, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Ojo 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4579, longitude: 3.1584, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "B", area_type: "urban" },
  { name: "Ikeja West 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6028, longitude: 3.3525, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "A", area_type: "urban" },
  { name: "Ayobo 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6124, longitude: 3.2430, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "B", area_type: "urban" },
  { name: "Alimosho 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6112, longitude: 3.2570, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "B", area_type: "urban" },
  { name: "Ogba 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6320, longitude: 3.3389, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "A", area_type: "urban" },
  { name: "Alausa 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6275, longitude: 3.3612, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "A", area_type: "urban" },
  { name: "Ejigbo 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5532, longitude: 3.2938, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "B", area_type: "urban" },
  { name: "Agbara 132/33kV S/S", city: "Agbara", state: "Lagos", latitude: 6.5107, longitude: 3.0870, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "A", area_type: "industrial" },
  { name: "Oke-Aro 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6745, longitude: 3.2995, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IKEDC", band: "B", area_type: "urban" },
  { name: "Papalanto 132/33kV S/S", city: "Papalanto", state: "Ogun", latitude: 6.8900, longitude: 3.1956, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "semi-urban" },
  { name: "Otta 132/33kV S/S", city: "Otta", state: "Ogun", latitude: 6.6826, longitude: 3.2335, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Abeokuta 132/33kV S/S", city: "Abeokuta", state: "Ogun", latitude: 7.1475, longitude: 3.3619, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Egbin 132kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5525, longitude: 3.6099, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "industrial" },
  { name: "Ikorodu 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.6194, longitude: 3.5105, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "B", area_type: "urban" },
  { name: "Maryland 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5659, longitude: 3.3684, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Ajah 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4708, longitude: 3.5862, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Lekki 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4488, longitude: 3.4733, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Alagbon 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4406, longitude: 3.4234, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Akoka 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5285, longitude: 3.3918, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },
  { name: "Oworosoki 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.5510, longitude: 3.3968, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "B", area_type: "urban" },
  { name: "Amuwo-Odofin 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4667, longitude: 3.2920, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "B", area_type: "urban" },
  { name: "Apapa Road 132/33kV S/S", city: "Lagos", state: "Lagos", latitude: 6.4449, longitude: 3.3593, voltage_class: "132/33kV", tcn_region: "LAGOS", station_type: "distribution", disco: "EKEDC", band: "A", area_type: "urban" },

  // ── KANO REGION ──────────────────────────────────────────
  { name: "Kumbotso 330/132kV T/S", city: "Kano", state: "Kano", latitude: 11.8688, longitude: 8.5098, voltage_class: "330/132kV", tcn_region: "KANO", station_type: "transmission", disco: "KEDCO", band: "B", area_type: "urban" },
  { name: "Kumbotso 132/33kV S/S", city: "Kano", state: "Kano", latitude: 11.8698, longitude: 8.5108, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "B", area_type: "urban" },
  { name: "Dakata 132/33kV S/S", city: "Kano", state: "Kano", latitude: 11.9578, longitude: 8.5558, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "B", area_type: "urban" },
  { name: "Dan-Agundi 132/33kV S/S", city: "Kano", state: "Kano", latitude: 11.9831, longitude: 8.5177, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "C", area_type: "semi-urban" },
  { name: "Tambarawa 132/33kV S/S", city: "Kano", state: "Kano", latitude: 12.0150, longitude: 8.5600, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "C", area_type: "semi-urban" },
  { name: "Wudil 132/33kV S/S", city: "Wudil", state: "Kano", latitude: 11.8100, longitude: 8.8434, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },
  { name: "Katsina 132/33kV S/S", city: "Katsina", state: "Katsina", latitude: 13.0059, longitude: 7.5972, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "C", area_type: "urban" },
  { name: "Daura 132/33kV S/S", city: "Daura", state: "Katsina", latitude: 13.0340, longitude: 8.3158, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },
  { name: "Kankia 132/33kV S/S", city: "Kankia", state: "Katsina", latitude: 12.4656, longitude: 7.9322, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },
  { name: "Dutse 132/33kV S/S", city: "Dutse", state: "Jigawa", latitude: 11.7659, longitude: 9.3408, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },
  { name: "Hadejia 132/33kV S/S", city: "Hadejia", state: "Jigawa", latitude: 12.4577, longitude: 10.0432, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },
  { name: "Azare 132/33kV S/S", city: "Azare", state: "Bauchi", latitude: 11.6828, longitude: 10.1942, voltage_class: "132/33kV", tcn_region: "KANO", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },

  // ── OSOGBO REGION ────────────────────────────────────────
  { name: "Osogbo 330/132/33kV T/S", city: "Osogbo", state: "Osun", latitude: 7.7669, longitude: 4.5624, voltage_class: "330/132kV", tcn_region: "OSOGBO", station_type: "transmission", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Ayede 330/132/33kV T/S", city: "Ibadan", state: "Oyo", latitude: 7.3964, longitude: 3.9114, voltage_class: "330/132kV", tcn_region: "OSOGBO", station_type: "transmission", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Ganmo 330/132/33kV T/S", city: "Ilorin", state: "Kwara", latitude: 8.4799, longitude: 4.5418, voltage_class: "330/132kV", tcn_region: "OSOGBO", station_type: "transmission", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Osogbo 132/33kV S/S", city: "Osogbo", state: "Osun", latitude: 7.7679, longitude: 4.5634, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Ofa 132/33kV S/S", city: "Offa", state: "Kwara", latitude: 8.1480, longitude: 4.7228, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "semi-urban" },
  { name: "Ilesha 132/33kV S/S", city: "Ilesa", state: "Osun", latitude: 7.6252, longitude: 4.7422, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "semi-urban" },
  { name: "Ife 132/33kV S/S", city: "Ile-Ife", state: "Osun", latitude: 7.4905, longitude: 4.5521, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "semi-urban" },
  { name: "Jericho 132/33kV S/S", city: "Ibadan", state: "Oyo", latitude: 7.3876, longitude: 3.8634, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Ibadan North 132/33kV S/S", city: "Ibadan", state: "Oyo", latitude: 7.4246, longitude: 3.9167, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Iwo 132/33kV S/S", city: "Iwo", state: "Osun", latitude: 7.6354, longitude: 4.1797, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "semi-urban" },
  { name: "Iseyin 132/33kV S/S", city: "Iseyin", state: "Oyo", latitude: 7.9719, longitude: 3.5954, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "D", area_type: "semi-urban" },
  { name: "Ijebu-Ode 132/33kV S/S", city: "Ijebu-Ode", state: "Ogun", latitude: 6.8152, longitude: 3.9290, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "semi-urban" },
  { name: "Sagamu 132/33kV S/S", city: "Sagamu", state: "Ogun", latitude: 6.8435, longitude: 3.6467, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Ado-Ekiti 132/33kV S/S", city: "Ado-Ekiti", state: "Ekiti", latitude: 7.6124, longitude: 5.2215, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "C", area_type: "urban" },
  { name: "Akure 132/33kV S/S", city: "Akure", state: "Ondo", latitude: 7.2526, longitude: 5.2103, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Ilorin 132/33kV S/S", city: "Ilorin", state: "Kwara", latitude: 8.4966, longitude: 4.5426, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "B", area_type: "urban" },
  { name: "Omuaran 132/33kV S/S", city: "Omu-Aran", state: "Kwara", latitude: 8.1390, longitude: 5.1014, voltage_class: "132/33kV", tcn_region: "OSOGBO", station_type: "distribution", disco: "IBEDC", band: "D", area_type: "semi-urban" },

  // ── BENIN REGION ─────────────────────────────────────────
  { name: "Benin 330/132kV T/S", city: "Benin City", state: "Edo", latitude: 6.3350, longitude: 5.6037, voltage_class: "330/132kV", tcn_region: "BENIN", station_type: "transmission", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Ihovbor 330/132kV T/S", city: "Benin City", state: "Edo", latitude: 6.3560, longitude: 5.5850, voltage_class: "330/132kV", tcn_region: "BENIN", station_type: "transmission", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Sapele 330/132kV T/S", city: "Sapele", state: "Delta", latitude: 5.8944, longitude: 5.6842, voltage_class: "330/132kV", tcn_region: "BENIN", station_type: "generation", disco: "BEDC", band: "B", area_type: "industrial" },
  { name: "Omotosho 330/132/33kV T/S", city: "Omotosho", state: "Ondo", latitude: 6.7230, longitude: 4.6340, voltage_class: "330/132kV", tcn_region: "BENIN", station_type: "generation", disco: "BEDC", band: "B", area_type: "industrial" },
  { name: "Benin 132/33kV S/S", city: "Benin City", state: "Edo", latitude: 6.3360, longitude: 5.6047, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Irrua 132/33kV S/S", city: "Irrua", state: "Edo", latitude: 6.7383, longitude: 6.2178, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },
  { name: "Auchi 132/33kV S/S", city: "Auchi", state: "Edo", latitude: 7.0667, longitude: 6.2667, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "C", area_type: "semi-urban" },
  { name: "Ihovbor 132/33kV S/S", city: "Benin City", state: "Edo", latitude: 6.3570, longitude: 5.5860, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Okada 132/33kV S/S", city: "Okada", state: "Edo", latitude: 6.7272, longitude: 5.4144, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },
  { name: "Amukpe 132/33kV S/S", city: "Sapele", state: "Delta", latitude: 5.8680, longitude: 5.6910, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "C", area_type: "semi-urban" },
  { name: "Effurun 132/33kV S/S", city: "Effurun", state: "Delta", latitude: 5.5563, longitude: 5.7898, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Delta 132/33kV S/S", city: "Ughelli", state: "Delta", latitude: 5.4931, longitude: 6.0041, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "C", area_type: "semi-urban" },
  { name: "Oghara 132/33kV S/S", city: "Oghara", state: "Delta", latitude: 5.9738, longitude: 5.8877, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },
  { name: "Ozoro 132/33kV S/S", city: "Ozoro", state: "Delta", latitude: 5.5480, longitude: 6.2340, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },
  { name: "Ondo 132/33kV S/S", city: "Ondo", state: "Ondo", latitude: 7.0932, longitude: 4.8357, voltage_class: "132/33kV", tcn_region: "BENIN", station_type: "distribution", disco: "BEDC", band: "C", area_type: "semi-urban" },

  // ── PORT HARCOURT REGION ─────────────────────────────────
  { name: "Afam IV-VI 330kV T/S", city: "Oyigbo", state: "Rivers", latitude: 4.8734, longitude: 7.1513, voltage_class: "330kV", tcn_region: "PORT_HARCOURT", station_type: "generation", disco: "PHED", band: "A", area_type: "industrial" },
  { name: "Alaoji GS 330/132kV T/S", city: "Aba", state: "Abia", latitude: 5.1196, longitude: 7.3656, voltage_class: "330/132kV", tcn_region: "PORT_HARCOURT", station_type: "generation", disco: "EEDC", band: "A", area_type: "industrial" },
  { name: "Adiabor 330/132kV T/S", city: "Calabar", state: "Cross River", latitude: 4.9603, longitude: 8.3369, voltage_class: "330/132kV", tcn_region: "PORT_HARCOURT", station_type: "transmission", disco: "PHED", band: "B", area_type: "urban" },
  { name: "Odukpani 330/132kV T/S", city: "Odukpani", state: "Cross River", latitude: 5.1667, longitude: 8.3333, voltage_class: "330/132kV", tcn_region: "PORT_HARCOURT", station_type: "generation", disco: "PHED", band: "A", area_type: "industrial" },
  { name: "Ikot Ekpene 330/132kV T/S", city: "Ikot Ekpene", state: "Akwa Ibom", latitude: 5.1791, longitude: 7.7115, voltage_class: "330/132kV", tcn_region: "PORT_HARCOURT", station_type: "transmission", disco: "PHED", band: "C", area_type: "semi-urban" },
  { name: "PH Main 132/33kV S/S", city: "Port Harcourt", state: "Rivers", latitude: 4.7765, longitude: 7.0134, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "urban" },
  { name: "PH Town 132/33kV S/S", city: "Port Harcourt", state: "Rivers", latitude: 4.7738, longitude: 7.0093, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "urban" },
  { name: "Elelenwon 132/33kV S/S", city: "Port Harcourt", state: "Rivers", latitude: 4.8547, longitude: 7.0357, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "urban" },
  { name: "Rumuosi 132/33kV S/S", city: "Port Harcourt", state: "Rivers", latitude: 4.8630, longitude: 6.9910, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "urban" },
  { name: "Yenagoa 132/33kV S/S", city: "Yenagoa", state: "Bayelsa", latitude: 4.9267, longitude: 6.2676, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "C", area_type: "urban" },
  { name: "Ahoada 132/33kV S/S", city: "Ahoada", state: "Rivers", latitude: 5.0762, longitude: 6.6449, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "D", area_type: "semi-urban" },
  { name: "Afam I-III 132/33kV S/S", city: "Oyigbo", state: "Rivers", latitude: 4.8744, longitude: 7.1523, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "industrial" },
  { name: "Alaoji 132/33kV S/S", city: "Aba", state: "Abia", latitude: 5.1206, longitude: 7.3666, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Aba 132/33kV S/S", city: "Aba", state: "Abia", latitude: 5.1066, longitude: 7.3665, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Umuahia 132/33kV S/S", city: "Umuahia", state: "Abia", latitude: 5.5247, longitude: 7.4943, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "EEDC", band: "C", area_type: "urban" },
  { name: "Owerri 132/33kV S/S", city: "Owerri", state: "Imo", latitude: 5.4836, longitude: 7.0335, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Calabar 132/33kV S/S", city: "Calabar", state: "Cross River", latitude: 4.9517, longitude: 8.3220, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "urban" },
  { name: "Itu 132/33kV S/S", city: "Itu", state: "Akwa Ibom", latitude: 5.2064, longitude: 7.9834, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "D", area_type: "semi-urban" },
  { name: "Uyo 132kV S/S", city: "Uyo", state: "Akwa Ibom", latitude: 5.0377, longitude: 7.9128, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "B", area_type: "urban" },
  { name: "Eket 132/33kV S/S", city: "Eket", state: "Akwa Ibom", latitude: 4.6427, longitude: 7.9195, voltage_class: "132/33kV", tcn_region: "PORT_HARCOURT", station_type: "distribution", disco: "PHED", band: "C", area_type: "semi-urban" },

  // ── ENUGU REGION ─────────────────────────────────────────
  { name: "Enugu 330/132kV T/S", city: "Enugu", state: "Enugu", latitude: 6.4412, longitude: 7.4943, voltage_class: "330/132kV", tcn_region: "ENUGU", station_type: "transmission", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Ugwuaji 330/132kV T/S", city: "Enugu", state: "Enugu", latitude: 6.3940, longitude: 7.5020, voltage_class: "330/132kV", tcn_region: "ENUGU", station_type: "transmission", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Onitsha 330/132kV T/S", city: "Onitsha", state: "Anambra", latitude: 6.1314, longitude: 6.7872, voltage_class: "330/132kV", tcn_region: "ENUGU", station_type: "transmission", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Asaba 330/132kV T/S", city: "Asaba", state: "Delta", latitude: 6.1978, longitude: 6.7252, voltage_class: "330/132kV", tcn_region: "ENUGU", station_type: "transmission", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Makurdi 330/132kV T/S", city: "Makurdi", state: "Benue", latitude: 7.7427, longitude: 8.5073, voltage_class: "330/132kV", tcn_region: "ENUGU", station_type: "transmission", disco: "BEDC", band: "C", area_type: "urban" },
  { name: "New Haven 132/33kV S/S", city: "Enugu", state: "Enugu", latitude: 6.4530, longitude: 7.5100, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Nkalagu 132/33kV S/S", city: "Nkalagu", state: "Ebonyi", latitude: 6.4217, longitude: 7.9250, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "D", area_type: "semi-urban" },
  { name: "Abakaliki 132/33kV S/S", city: "Abakaliki", state: "Ebonyi", latitude: 6.3249, longitude: 8.1137, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "C", area_type: "urban" },
  { name: "Nsukka 132/33kV S/S", city: "Nsukka", state: "Enugu", latitude: 6.8580, longitude: 7.3942, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "C", area_type: "semi-urban" },
  { name: "Onitsha 132/33kV S/S", city: "Onitsha", state: "Anambra", latitude: 6.1324, longitude: 6.7882, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Awka 132/33kV S/S", city: "Awka", state: "Anambra", latitude: 6.2103, longitude: 7.0726, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "B", area_type: "urban" },
  { name: "Oji River 132/66/33kV S/S", city: "Oji River", state: "Enugu", latitude: 6.2583, longitude: 7.0117, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "EEDC", band: "D", area_type: "semi-urban" },
  { name: "Asaba 132/33kV S/S", city: "Asaba", state: "Delta", latitude: 6.1988, longitude: 6.7262, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "BEDC", band: "B", area_type: "urban" },
  { name: "Agbor 132/33kV S/S", city: "Agbor", state: "Delta", latitude: 6.2570, longitude: 6.1988, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },
  { name: "Apir 132/33kV S/S", city: "Makurdi", state: "Benue", latitude: 7.7340, longitude: 8.5450, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "BEDC", band: "C", area_type: "urban" },
  { name: "Yandev 132/33kV S/S", city: "Gboko", state: "Benue", latitude: 7.3227, longitude: 8.9738, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },
  { name: "Otukpo 132/33kV S/S", city: "Otukpo", state: "Benue", latitude: 7.1913, longitude: 8.1338, voltage_class: "132/33kV", tcn_region: "ENUGU", station_type: "distribution", disco: "BEDC", band: "D", area_type: "semi-urban" },

  // ── KADUNA REGION ────────────────────────────────────────
  { name: "Mando 330/132kV T/S", city: "Kaduna", state: "Kaduna", latitude: 10.5649, longitude: 7.4275, voltage_class: "330/132kV", tcn_region: "KADUNA", station_type: "transmission", disco: "KAEDCO", band: "B", area_type: "urban" },
  { name: "Birnin Kebbi 330kV T/S", city: "Birnin Kebbi", state: "Kebbi", latitude: 12.4539, longitude: 4.1975, voltage_class: "330kV", tcn_region: "KADUNA", station_type: "transmission", disco: "KAEDCO", band: "D", area_type: "semi-urban" },
  { name: "Kaduna Town 132/33kV S/S", city: "Kaduna", state: "Kaduna", latitude: 10.5222, longitude: 7.4383, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KAEDCO", band: "B", area_type: "urban" },
  { name: "Zaria 132/33kV S/S", city: "Zaria", state: "Kaduna", latitude: 11.0801, longitude: 7.7106, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KAEDCO", band: "C", area_type: "urban" },
  { name: "Gusau 132/33kV S/S", city: "Gusau", state: "Zamfara", latitude: 12.1704, longitude: 6.6640, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KAEDCO", band: "D", area_type: "semi-urban" },
  { name: "Talata-Mafara 132/33kV S/S", city: "Talata Mafara", state: "Zamfara", latitude: 12.5683, longitude: 6.0618, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KAEDCO", band: "D", area_type: "semi-urban" },
  { name: "Funtua 132/33kV S/S", city: "Funtua", state: "Katsina", latitude: 11.5223, longitude: 7.3167, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KEDCO", band: "D", area_type: "semi-urban" },
  { name: "Birnin Kebbi 132kV S/S", city: "Birnin Kebbi", state: "Kebbi", latitude: 12.4549, longitude: 4.1985, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KAEDCO", band: "D", area_type: "semi-urban" },
  { name: "Sokoto 132kV S/S", city: "Sokoto", state: "Sokoto", latitude: 13.0607, longitude: 5.2414, voltage_class: "132/33kV", tcn_region: "KADUNA", station_type: "distribution", disco: "KAEDCO", band: "D", area_type: "urban" },

  // ── SHIRORO REGION ───────────────────────────────────────
  { name: "Shiroro 330kV T/S", city: "Shiroro", state: "Niger", latitude: 9.9680, longitude: 6.8340, voltage_class: "330kV", tcn_region: "SHIRORO", station_type: "generation", disco: "AEDC", band: "A", area_type: "industrial" },
  { name: "Jebba 330kV T/S", city: "Jebba", state: "Niger", latitude: 9.1220, longitude: 4.8160, voltage_class: "330kV", tcn_region: "SHIRORO", station_type: "generation", disco: "IBEDC", band: "A", area_type: "industrial" },
  { name: "Kainji 330kV PS", city: "New Bussa", state: "Niger", latitude: 9.8600, longitude: 4.6310, voltage_class: "330kV", tcn_region: "SHIRORO", station_type: "generation", disco: "AEDC", band: "A", area_type: "industrial" },
  { name: "Shiroro 132kV S/S", city: "Shiroro", state: "Niger", latitude: 9.9690, longitude: 6.8350, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "AEDC", band: "C", area_type: "semi-urban" },
  { name: "Minna 132kV S/S", city: "Minna", state: "Niger", latitude: 9.6139, longitude: 6.5568, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "AEDC", band: "C", area_type: "urban" },
  { name: "Jebba 132kV S/S", city: "Jebba", state: "Niger", latitude: 9.1230, longitude: 4.8170, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "IBEDC", band: "D", area_type: "semi-urban" },
  { name: "Bida 132kV S/S", city: "Bida", state: "Niger", latitude: 9.0835, longitude: 6.0095, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "AEDC", band: "D", area_type: "semi-urban" },
  { name: "Kontagora 132kV S/S", city: "Kontagora", state: "Niger", latitude: 10.4034, longitude: 5.4693, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "AEDC", band: "D", area_type: "semi-urban" },
  { name: "Tegina 132kV S/S", city: "Tegina", state: "Niger", latitude: 10.0723, longitude: 6.1906, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "AEDC", band: "D", area_type: "semi-urban" },
  { name: "Yauri 132kV S/S", city: "Yauri", state: "Kebbi", latitude: 10.7806, longitude: 4.7683, voltage_class: "132/33kV", tcn_region: "SHIRORO", station_type: "distribution", disco: "KAEDCO", band: "D", area_type: "semi-urban" },

  // ── BAUCHI REGION ────────────────────────────────────────
  { name: "Gombe 330/132kV T/S", city: "Gombe", state: "Gombe", latitude: 10.2897, longitude: 11.1684, voltage_class: "330/132kV", tcn_region: "BAUCHI", station_type: "transmission", disco: "YEDC", band: "C", area_type: "urban" },
  { name: "Jos 330/132kV T/S", city: "Jos", state: "Plateau", latitude: 9.8965, longitude: 8.8583, voltage_class: "330/132kV", tcn_region: "BAUCHI", station_type: "transmission", disco: "JED", band: "B", area_type: "urban" },
  { name: "Yola 330/132kV T/S", city: "Yola", state: "Adamawa", latitude: 9.2035, longitude: 12.4954, voltage_class: "330/132kV", tcn_region: "BAUCHI", station_type: "transmission", disco: "YEDC", band: "C", area_type: "urban" },
  { name: "Gombe 132/33kV S/S", city: "Gombe", state: "Gombe", latitude: 10.2907, longitude: 11.1694, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "C", area_type: "urban" },
  { name: "Ashaka 132/33kV S/S", city: "Ashaka", state: "Gombe", latitude: 10.9167, longitude: 11.4333, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "D", area_type: "industrial" },
  { name: "Potiskum 132/33kV S/S", city: "Potiskum", state: "Yobe", latitude: 11.7121, longitude: 11.0780, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "D", area_type: "semi-urban" },
  { name: "Biu 132/33kV S/S", city: "Biu", state: "Borno", latitude: 10.6106, longitude: 12.1953, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "D", area_type: "semi-urban" },
  { name: "Jos 132/33kV S/S", city: "Jos", state: "Plateau", latitude: 9.8975, longitude: 8.8593, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "JED", band: "B", area_type: "urban" },
  { name: "Makeri 132/33kV S/S", city: "Jos", state: "Plateau", latitude: 9.8800, longitude: 8.8600, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "JED", band: "C", area_type: "urban" },
  { name: "Pankshin 132/33kV S/S", city: "Pankshin", state: "Plateau", latitude: 9.3360, longitude: 9.4313, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "JED", band: "D", area_type: "semi-urban" },
  { name: "Kafanchan 132/33kV S/S", city: "Kafanchan", state: "Kaduna", latitude: 9.5842, longitude: 8.3072, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "KAEDCO", band: "D", area_type: "semi-urban" },
  { name: "Bauchi 132/33kV S/S", city: "Bauchi", state: "Bauchi", latitude: 10.3158, longitude: 9.8442, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "C", area_type: "urban" },
  { name: "Yola 132/33kV S/S", city: "Yola", state: "Adamawa", latitude: 9.2045, longitude: 12.4964, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "C", area_type: "urban" },
  { name: "Jalingo 132/33kV S/S", city: "Jalingo", state: "Taraba", latitude: 8.8933, longitude: 11.3645, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "D", area_type: "semi-urban" },
  { name: "Maiduguri 132/33kV S/S", city: "Maiduguri", state: "Borno", latitude: 11.8311, longitude: 13.1510, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "C", area_type: "urban" },
  { name: "Damboa 132/33kV S/S", city: "Damboa", state: "Borno", latitude: 11.1561, longitude: 12.7567, voltage_class: "132/33kV", tcn_region: "BAUCHI", station_type: "distribution", disco: "YEDC", band: "D", area_type: "semi-urban" },

  // ── ABUJA REGION ─────────────────────────────────────────
  { name: "Katampe 330/132kV T/S", city: "Abuja", state: "FCT", latitude: 9.0948, longitude: 7.4608, voltage_class: "330/132kV", tcn_region: "ABUJA", station_type: "transmission", disco: "AEDC", band: "A", area_type: "urban" },
  { name: "Gwagwalada 330/132kV T/S", city: "Gwagwalada", state: "FCT", latitude: 8.9433, longitude: 7.0783, voltage_class: "330/132kV", tcn_region: "ABUJA", station_type: "transmission", disco: "AEDC", band: "B", area_type: "urban" },
  { name: "Ajaokuta 330kV T/S", city: "Ajaokuta", state: "Kogi", latitude: 7.5553, longitude: 6.6640, voltage_class: "330kV", tcn_region: "ABUJA", station_type: "transmission", disco: "AEDC", band: "B", area_type: "industrial" },
  { name: "Lokoja 330kV T/S", city: "Lokoja", state: "Kogi", latitude: 7.7969, longitude: 6.7406, voltage_class: "330kV", tcn_region: "ABUJA", station_type: "transmission", disco: "AEDC", band: "C", area_type: "urban" },
  { name: "Geregu I 330kV T/S", city: "Ajaokuta", state: "Kogi", latitude: 7.5440, longitude: 6.6500, voltage_class: "330kV", tcn_region: "ABUJA", station_type: "generation", disco: "AEDC", band: "A", area_type: "industrial" },
  { name: "Geregu II 330kV T/S", city: "Ajaokuta", state: "Kogi", latitude: 7.5450, longitude: 6.6510, voltage_class: "330kV", tcn_region: "ABUJA", station_type: "generation", disco: "AEDC", band: "A", area_type: "industrial" },
  { name: "Katampe 132/33kV S/S", city: "Abuja", state: "FCT", latitude: 9.0958, longitude: 7.4618, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "A", area_type: "urban" },
  { name: "Kukwaba 132/33kV S/S", city: "Abuja", state: "FCT", latitude: 9.0576, longitude: 7.4656, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "A", area_type: "urban" },
  { name: "Central Area 132/33kV S/S", city: "Abuja", state: "FCT", latitude: 9.0579, longitude: 7.4951, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "A", area_type: "urban" },
  { name: "Kubwa 132/33kV S/S", city: "Abuja", state: "FCT", latitude: 9.1572, longitude: 7.3295, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "B", area_type: "urban" },
  { name: "Suleja 132/33kV S/S", city: "Suleja", state: "Niger", latitude: 9.1806, longitude: 7.1797, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "C", area_type: "urban" },
  { name: "Keffi 132/33kV S/S", city: "Keffi", state: "Nasarawa", latitude: 8.8467, longitude: 7.8739, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "D", area_type: "semi-urban" },
  { name: "Apo 132/33kV S/S", city: "Abuja", state: "FCT", latitude: 9.0000, longitude: 7.5140, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "A", area_type: "urban" },
  { name: "Karu 132/33kV S/S", city: "Karu", state: "Nasarawa", latitude: 9.0216, longitude: 7.5727, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "B", area_type: "urban" },
  { name: "Akwanga 132/33kV S/S", city: "Akwanga", state: "Nasarawa", latitude: 8.9076, longitude: 8.3894, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "D", area_type: "semi-urban" },
  { name: "Gwagwalada 132/33kV S/S", city: "Gwagwalada", state: "FCT", latitude: 8.9443, longitude: 7.0793, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "B", area_type: "urban" },
  { name: "Ajaokuta 132/33kV S/S", city: "Ajaokuta", state: "Kogi", latitude: 7.5563, longitude: 6.6650, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "C", area_type: "semi-urban" },
  { name: "Okene 132/33kV S/S", city: "Okene", state: "Kogi", latitude: 7.5510, longitude: 6.2352, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "C", area_type: "semi-urban" },
  { name: "Lokoja 132/33kV S/S", city: "Lokoja", state: "Kogi", latitude: 7.7979, longitude: 6.7416, voltage_class: "132/33kV", tcn_region: "ABUJA", station_type: "distribution", disco: "AEDC", band: "C", area_type: "urban" },
];

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const authError = requireCronSecret(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Delete all existing nodes
    const { count: deleted } = await supabase
      .from("nodes")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

    console.log(`Deleted ${deleted} existing nodes`);

    // Step 2: Also clean up related data
    await supabase.from("reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("grid_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ai_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 3: Insert all TCN stations
    const insertData = TCN_STATIONS.map((s) => ({
      name: s.name,
      city: s.city,
      state: s.state,
      latitude: s.latitude,
      longitude: s.longitude,
      voltage_class: s.voltage_class,
      tcn_region: s.tcn_region,
      station_type: s.station_type,
      disco: s.disco,
      band: s.band,
      area_type: s.area_type,
      status: "POWER_AVAILABLE",
      severity: "LOW",
      confidence: 50,
      tariff_per_kwh: s.band === "A" ? 68 : s.band === "B" ? 62 : s.band === "C" ? 50 : 36,
      avg_supply_hours: s.band === "A" ? 20 : s.band === "B" ? 16 : s.band === "C" ? 12 : 8,
    }));

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      const { error } = await supabase.from("nodes").insert(batch);
      if (error) {
        console.error(`Batch insert error at ${i}:`, error);
        throw error;
      }
      inserted += batch.length;
    }

    // Step 4: Update grid_status
    const totalNodes = insertData.length;
    const { data: existingGrid } = await supabase
      .from("grid_status")
      .select("id")
      .limit(1)
      .single();

    if (existingGrid) {
      await supabase
        .from("grid_status")
        .update({
          status: "GRID_STABLE",
          total_nodes: totalNodes,
          powered_nodes: totalNodes,
          outage_nodes: 0,
          intermittent_nodes: 0,
        })
        .eq("id", existingGrid.id);
    }

    // Count by type
    const transmissionCount = TCN_STATIONS.filter(s => s.station_type === "transmission").length;
    const distributionCount = TCN_STATIONS.filter(s => s.station_type === "distribution").length;
    const generationCount = TCN_STATIONS.filter(s => s.station_type === "generation").length;

    const regionCounts: Record<string, number> = {};
    TCN_STATIONS.forEach(s => {
      regionCounts[s.tcn_region] = (regionCounts[s.tcn_region] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        success: true,
        deleted_old_nodes: deleted,
        inserted_stations: inserted,
        breakdown: {
          transmission_stations: transmissionCount,
          distribution_substations: distributionCount,
          generation_stations: generationCount,
          by_region: regionCounts,
        },
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
