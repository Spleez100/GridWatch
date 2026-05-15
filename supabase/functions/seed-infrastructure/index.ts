import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";

interface Node {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  disco: string;
  band: string;
  area_type: string;
  station_type: string;
  voltage_class: string;
  tcn_region: string;
  infrastructure_level: string;
  parent_node_id?: string;
}

// ══════════════════════════════════════════════════════════════
// City-specific street/area names for realistic naming
// ══════════════════════════════════════════════════════════════
const CITY_STREETS: Record<string, string[]> = {
  "Lagos": ["Allen Avenue", "Opebi Road", "Adeniyi Jones", "Awolowo Way", "Toyin Street", "Admiralty Way", "Ligali Ayorinde", "Ozumba Mbadiwe", "Broad Street", "Marina Road"],
  "Abuja": ["Ahmadu Bello Way", "Herbert Macaulay Way", "Shehu Shagari Way", "Nnamdi Azikiwe Expressway", "Adetokunbo Ademola Crescent", "Constitution Avenue", "Julius Nyerere Crescent", "Muhammadu Buhari Way", "Ladi Kwali Street", "Yakubu Gowon Crescent"],
  "Ibadan": ["Dugbe Road", "Ring Road", "Mokola Hill", "Bodija Road", "Iwo Road", "Oyo Road", "Challenge Road", "Oke-Ado Road", "Sango-Eleyele Road", "University Road"],
  "Kano": ["Murtala Mohammed Way", "Zaria Road", "Ibrahim Taiwo Road", "Bompai Road", "Zoo Road", "Club Road", "Katsina Road", "Audu Bako Way", "Fagge Road", "Sabon Gari Road"],
  "Port Harcourt": ["Aba Road", "Ada George Road", "Peter Odili Road", "Ikwerre Road", "Stadium Road", "Trans Amadi Road", "Rumuola Road", "NTA Road", "Eliozu Road", "East-West Road"],
  "Benin City": ["Akpakpava Road", "Sapele Road", "Airport Road", "Siluko Road", "Uselu-Lagos Road", "New Benin Road", "Ugbowo Road", "Sokponba Road", "Ekenwan Road", "Mission Road"],
  "Enugu": ["Ogui Road", "Agbani Road", "Zik Avenue", "Rangers Avenue", "Okpara Avenue", "Presidential Road", "New Haven Road", "Coal Camp Road", "Chime Avenue", "Abakaliki Road"],
  "Kaduna": ["Ahmadu Bello Way", "Kachia Road", "Ali Akilu Road", "Sultan Road", "Yakubu Gowon Way", "Waff Road", "Rabah Road", "Barnawa Road", "Tafawa Balewa Way", "Independence Way"],
  "Osogbo": ["Gbongan Road", "Oke-Fia Road", "Old Garage Road", "Station Road", "MDS Road", "Ikirun Road", "Ilesa Road", "Ogo-Oluwa Road", "Olaiya Junction Road", "Aregbe Road"],
  "Ilorin": ["Ibrahim Taiwo Road", "Murtala Mohammed Way", "Offa Road", "Ahmadu Bello Avenue", "Sulu Gambari Road", "Stadium Road", "Unity Road", "Fate Road", "Challenge Road", "Geri Alimi Road"],
  "Akure": ["Oyemekun Road", "Alagbaka Road", "Oba Adesida Road", "Oda Road", "Ondo Road", "Igbatoro Road", "Hospital Road", "FUTA Road", "Cathedral Road", "Arakale Road"],
  "Aba": ["Asa Road", "Faulks Road", "Factory Road", "Ikot-Ekpene Road", "Port Harcourt Road", "Azikiwe Road", "Brass Street", "Tenant Road", "Market Road", "Cemetery Road"],
  "Abeokuta": ["Lalubu Street", "Onikolobo Road", "Sapon Road", "Igbein Road", "Adatan Road", "Ibara Road", "Oke-Ilewo Road", "Lantoro Road", "Idi-Aba Road", "Panseke Road"],
  "Warri": ["Effurun Road", "Warri-Sapele Road", "Enerhen Road", "Jakpa Road", "Refinery Road", "Airport Road", "Udu Road", "PTI Road", "NPA Expressway", "Deco Road"],
  "Maiduguri": ["Bama Road", "Dikwa Road", "Shehu Laminu Way", "Kashim Ibrahim Way", "Sir Kashim Ibrahim Road", "Lagos Street", "Jos Road", "Kano Road", "Monday Market Road", "Custom Road"],
  "Jos": ["Ahmadu Bello Way", "Bauchi Road", "Yakubu Gowon Way", "Murtala Mohammed Way", "Tafawa Balewa Street", "Zaria Road", "Old Airport Road", "Rukuba Road", "Dogon Dutse Road", "British-America Road"],
  "Makurdi": ["J.S. Tarka Way", "Old Otukpo Road", "Gboko Road", "Naka Road", "Kashim Ibrahim Road", "Benue Crescent", "David Mark Road", "University Road", "High Level Road", "Wurukum Road"],
  "Calabar": ["Marian Road", "Mary Slessor Avenue", "Ndidem Usang Iso Road", "MCC Road", "Etta Agbor Road", "Atekong Drive", "IBB Way", "Calabar Road", "Goldie Street", "Moore Road"],
  "Uyo": ["Oron Road", "Ikot Ekpene Road", "Abak Road", "Aka Road", "Nwaniba Road", "Wellington Bassey Way", "Ikpa Road", "Udoette Street", "Brook Street", "Barracks Road"],
  "Sokoto": ["Kano Road", "Maiduguri Road", "Gusau Road", "Emir Muhammadu Way", "Shehu Kangiwa Road", "Aliyu Jodi Road", "Sultan Ibrahim Dasuki Road", "Airport Road", "Bypass Road", "Minanata Road"],
  "Owerri": ["Wetheral Road", "Douglas Road", "Okigwe Road", "Port Harcourt Road", "Egbu Road", "Mbaise Road", "Royce Road", "Bank Road", "Tetlow Road", "MCC Road"],
  "Asaba": ["Nnebisi Road", "DLA Road", "Okpanam Road", "Ibusa Road", "Cable Point Road", "Jesus Saves Road", "Dennis Osadebay Way", "Mariam Babangida Way", "Summit Road", "Infant Jesus Road"],
  "Katsina": ["Kano Road", "Dutsin-Ma Road", "Jibia Road", "Kofar Kaura Road", "Nagogo Road", "Ibrahim Babangida Way", "Muhammadu Dikko Road", "GRA Road", "Stadium Road", "Market Road"],
  "Bauchi": ["Jos Road", "Gombe Road", "Maiduguri Road", "Ahmadu Bello Way", "Wunti Road", "Ran Road", "Federal Low Cost Road", "Dass Road", "Tafawa Balewa Road", "Stadium Road"],
  "Gombe": ["Bauchi Road", "Biu Road", "Dukku Road", "Ashaka Road", "Tumfure Road", "Federal Low Cost Road", "Jekada Fari Road", "Pantami Road", "Herwagana Road", "Stadium Road"],
  "Yola": ["Jimeta Road", "Numan Road", "Mubi Road", "Girei Road", "Garoua Road", "Bekaji Road", "Karewa Road", "Modibbo Adama Way", "Hospital Road", "Market Road"],
  "Lafia": ["Makurdi Road", "Jos Road", "Keffi Road", "Shendam Road", "Hospital Road", "Doma Road", "Market Road", "Stadium Road", "GRA Road", "Shabu Road"],
  "Otta": ["Idiroko Road", "Sango-Ota Road", "Ijoko Road", "Lagos-Abeokuta Expressway", "Ifo Road", "Ewupe Road", "Joju Road", "Toll Gate Road", "Ilo-Awela Road", "Onigbedu Road"],
  "Sagamu": ["Akarigbo Road", "Oba Erinwole Road", "Isale-Oko Road", "Ewusi Road", "Makun Road", "Simawa Road", "Ogijo Road", "Iperu Road", "Ikenne Road", "Station Road"],
  "Papalanto": ["Ilaro Road", "Ifo Road", "Owode Road", "Abeokuta Road", "Lagos Road", "Market Road", "Station Road", "School Road", "Hospital Road", "Church Road"],
  "Offa": ["Ilorin Road", "Ojoku Road", "Erin-Ile Road", "Igosun Road", "Ekan-Meje Road", "GRA Road", "Market Road", "Station Road", "Omu-Aran Road", "Oshogbo Road"],
  "Ilesa": ["Oshogbo Road", "Ife Road", "Akure Road", "Imo Road", "Bolorunduro Road", "Irojo Road", "Ayeso Road", "Ilaje Road", "Okesa Road", "Station Road"],
  "Ile-Ife": ["Ondo Road", "Ilesha Road", "Ibadan Road", "Mayfair Road", "Enuwa Road", "Iremo Road", "Lagere Road", "Moore Road", "Sabo Road", "OAU Road"],
  "Iwo": ["Oshogbo Road", "Ibadan Road", "Ejigbo Road", "Oke-Adan Road", "Station Road", "Market Road", "GRA Road", "Hospital Road", "School Road", "Oba Road"],
  "Iseyin": ["Ibadan Road", "Okeho Road", "Saki Road", "Market Road", "Station Road", "GRA Road", "Hospital Road", "Oke-Ogun Road", "Ado-Awaye Road", "School Road"],
  "Ijebu-Ode": ["Ibadan Road", "Epe Road", "Sagamu Road", "Folagbade Road", "Igbeba Road", "Oke-Aje Road", "Imodi Road", "Molipa Road", "Itoro Road", "Station Road"],
  "Ado-Ekiti": ["Iworoko Road", "Ikere Road", "Ijigbo Road", "Ajilosun Road", "Basiri Road", "Fajuyi Road", "Okeyinmi Road", "Bank Road", "Hospital Road", "GRA Road"],
  "Wudil": ["Kano Road", "Garko Road", "Market Road", "Hospital Road", "School Road", "GRA Road", "Station Road", "Emir Palace Road", "Bypass Road", "Old Road"],
  "Daura": ["Katsina Road", "Mai'adua Road", "Market Road", "Hospital Road", "GRA Road", "Station Road", "Emir Palace Road", "School Road", "Bypass Road", "Old Road"],
  "Kankia": ["Katsina Road", "Market Road", "Hospital Road", "School Road", "GRA Road", "Station Road", "Bypass Road", "Old Road", "Emir Palace Road", "Dam Road"],
  "Dutse": ["Kano Road", "Hadejia Road", "Market Road", "Hospital Road", "GRA Road", "Station Road", "School Road", "Emir Palace Road", "Bypass Road", "Old Road"],
  "Hadejia": ["Kano Road", "Dutse Road", "Nguru Road", "Market Road", "Hospital Road", "GRA Road", "Station Road", "Emir Palace Road", "Bypass Road", "Old Road"],
  "Azare": ["Bauchi Road", "Misau Road", "Market Road", "Hospital Road", "GRA Road", "Station Road", "School Road", "Emir Palace Road", "Bypass Road", "Old Road"],
  "Omu-Aran": ["Ilorin Road", "Oshogbo Road", "Offa Road", "Market Road", "Hospital Road", "GRA Road", "Station Road", "School Road", "Bypass Road", "Old Road"],
  "Agbara": ["Lagos Road", "Badagry Expressway", "Industrial Avenue", "Factory Road", "Estate Road", "Market Road", "Station Road", "School Road", "Hospital Road", "GRA Road"],
};

const GENERIC_STREETS = ["Main Street", "Market Road", "Station Road", "Hospital Road", "School Road", "Church Street", "Mosque Road", "Ring Road", "Old Road", "New Road"];

function getStreetsForCity(city: string): string[] {
  if (CITY_STREETS[city]) return CITY_STREETS[city];
  for (const [key, streets] of Object.entries(CITY_STREETS)) {
    if (city.includes(key) || key.includes(city)) return streets;
  }
  return GENERIC_STREETS;
}

function generateChildNodes(parent: Node): any[] {
  const children: any[] = [];
  
  const densityMultiplier = parent.area_type === 'urban' ? 1.5 : parent.area_type === 'semi-urban' ? 1.0 : 0.6;
  const bandMultiplier = parent.band === 'A' ? 1.2 : parent.band === 'E' ? 0.7 : 1.0;
  const baseDensity = densityMultiplier * bandMultiplier;
  
  const feederCount = Math.round(2 + Math.random() * 4 * baseDensity);
  const feederNames = [
    'Town Centre', 'Industrial Estate', 'GRA', 'Market Road', 'Airport Road',
    'University', 'Hospital', 'Shopping District', 'Residential Zone', 'Business District'
  ];
  
  const streetNames = getStreetsForCity(parent.city);
  
  for (let i = 0; i < feederCount; i++) {
    const angle = (360 / feederCount) * i;
    const distance = 0.01 + Math.random() * 0.02;
    const feederLat = parent.latitude + distance * Math.cos(angle * Math.PI / 180);
    const feederLng = parent.longitude + distance * Math.sin(angle * Math.PI / 180);
    
    const feederName = `${feederNames[i % feederNames.length]} Feeder ${i + 1}`;
    
    const feederId = crypto.randomUUID();
    children.push({
      id: feederId,
      parent_node_id: parent.id,
      infrastructure_level: 'feeder',
      name: `${parent.city} ${feederName}`,
      feeder_name: feederName,
      latitude: feederLat,
      longitude: feederLng,
      city: parent.city,
      state: parent.state,
      disco: parent.disco,
      band: parent.band,
      area_type: parent.area_type,
      station_type: 'feeder',
      voltage_class: '11kV',
      tcn_region: parent.tcn_region,
      status: 'POWER_AVAILABLE',
      severity: 'LOW',
      confidence: 40,
      is_visible_default: true,
    });
    
    const transformerCount = Math.round(3 + Math.random() * 5 * baseDensity);
    
    for (let j = 0; j < transformerCount; j++) {
      const tAngle = (360 / transformerCount) * j + Math.random() * 20;
      const tDistance = 0.003 + Math.random() * 0.007;
      const tLat = feederLat + tDistance * Math.cos(tAngle * Math.PI / 180);
      const tLng = feederLng + tDistance * Math.sin(tAngle * Math.PI / 180);
      
      const transformerId = crypto.randomUUID();
      const streetName = streetNames[j % streetNames.length];
      
      children.push({
        id: transformerId,
        parent_node_id: feederId,
        infrastructure_level: 'transformer',
        name: `${streetName} Transformer ${j + 1}`,
        feeder_name: feederName,
        latitude: tLat,
        longitude: tLng,
        city: parent.city,
        state: parent.state,
        disco: parent.disco,
        band: parent.band,
        area_type: parent.area_type,
        station_type: 'transformer',
        voltage_class: '33kV/11kV',
        tcn_region: parent.tcn_region,
        status: 'POWER_AVAILABLE',
        severity: 'LOW',
        confidence: 30,
        is_visible_default: true,
      });
      
      const serviceAreaCount = Math.round(1 + Math.random() * 2);
      const areaTypes = ['Estate', 'Plaza', 'Court', 'Gardens', 'Close'];
      
      for (let k = 0; k < serviceAreaCount; k++) {
        const saAngle = (360 / serviceAreaCount) * k;
        const saDistance = 0.001 + Math.random() * 0.002;
        const saLat = tLat + saDistance * Math.cos(saAngle * Math.PI / 180);
        const saLng = tLng + saDistance * Math.sin(saAngle * Math.PI / 180);
        
        const serviceAreaId = crypto.randomUUID();
        const areaName = `${streetName.split(' ')[0]} ${areaTypes[k % areaTypes.length]}`;
        
        children.push({
          id: serviceAreaId,
          parent_node_id: transformerId,
          infrastructure_level: 'service_area',
          name: areaName,
          feeder_name: feederName,
          latitude: saLat,
          longitude: saLng,
          city: parent.city,
          state: parent.state,
          disco: parent.disco,
          band: parent.band,
          area_type: parent.area_type,
          station_type: 'service_area',
          voltage_class: '415V/230V',
          tcn_region: parent.tcn_region,
          status: 'POWER_AVAILABLE',
          severity: 'LOW',
          confidence: 20,
          is_visible_default: false,
        });
        
        const poleCount = Math.round(5 + Math.random() * 10 * baseDensity);
        
        for (let p = 0; p < poleCount; p++) {
          const pAngle = Math.random() * 360;
          const pDistance = 0.0002 + Math.random() * 0.0008;
          const pLat = saLat + pDistance * Math.cos(pAngle * Math.PI / 180);
          const pLng = saLng + pDistance * Math.sin(pAngle * Math.PI / 180);
          
          children.push({
            id: crypto.randomUUID(),
            parent_node_id: serviceAreaId,
            infrastructure_level: 'pole',
            name: `${areaName} Pole ${p + 1}`,
            feeder_name: feederName,
            latitude: pLat,
            longitude: pLng,
            city: parent.city,
            state: parent.state,
            disco: parent.disco,
            band: parent.band,
            area_type: parent.area_type,
            station_type: 'pole',
            voltage_class: '230V',
            tcn_region: parent.tcn_region,
            status: 'POWER_AVAILABLE',
            severity: 'LOW',
            confidence: 10,
            is_visible_default: false,
          });
        }
      }
    }
  }
  
  return children;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const authError = requireCronSecret(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, delete all existing child infrastructure nodes
    const childLevels = ['pole', 'service_area', 'transformer', 'feeder'];
    for (const level of childLevels) {
      const { error: delErr } = await supabase
        .from('nodes')
        .delete()
        .eq('infrastructure_level', level);
      if (delErr) console.error(`Error deleting ${level}:`, delErr);
    }
    console.log('Cleared existing child infrastructure nodes.');

    // Fetch all parent stations (TCN infrastructure)
    const { data: parentStations, error: fetchError } = await supabase
      .from('nodes')
      .select('*')
      .is('parent_node_id', null)
      .in('infrastructure_level', ['transmission', 'distribution', 'generation']);

    if (fetchError) throw fetchError;
    if (!parentStations || parentStations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No parent stations found to seed infrastructure' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Found ${parentStations.length} parent stations. Generating infrastructure...`);

    let totalGenerated = 0;
    const batchSize = 50;

    for (const station of parentStations) {
      const children = generateChildNodes(station as Node);
      
      for (let i = 0; i < children.length; i += batchSize) {
        const batch = children.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('nodes')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting batch for ${station.name}:`, insertError);
          throw insertError;
        }
        
        totalGenerated += batch.length;
        console.log(`Inserted ${totalGenerated} nodes so far...`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parent_stations: parentStations.length,
        total_infrastructure_nodes: totalGenerated,
        message: `Generated ${totalGenerated} infrastructure nodes for ${parentStations.length} TCN stations`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error seeding infrastructure:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
