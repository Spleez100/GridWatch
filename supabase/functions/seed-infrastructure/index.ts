import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Generate child infrastructure nodes for a parent station
function generateChildNodes(parent: Node): any[] {
  const children: any[] = [];
  
  // Determine density based on area type and band
  const densityMultiplier = parent.area_type === 'urban' ? 1.5 : parent.area_type === 'semi-urban' ? 1.0 : 0.6;
  const bandMultiplier = parent.band === 'A' ? 1.2 : parent.band === 'E' ? 0.7 : 1.0;
  const baseDensity = densityMultiplier * bandMultiplier;
  
  // 1. Generate 11kV Distribution Feeders (2-6 per station)
  const feederCount = Math.round(2 + Math.random() * 4 * baseDensity);
  const feederNames = [
    'Town Centre', 'Industrial Estate', 'GRA', 'Market Road', 'Airport Road',
    'University', 'Hospital', 'Shopping District', 'Residential Zone', 'Business District'
  ];
  
  for (let i = 0; i < feederCount; i++) {
    const angle = (360 / feederCount) * i;
    const distance = 0.01 + Math.random() * 0.02; // ~1-3km offset
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
    
    // 2. Generate Distribution Transformers per feeder (3-8 per feeder)
    const transformerCount = Math.round(3 + Math.random() * 5 * baseDensity);
    const streetNames = [
      'Allen Avenue', 'Opebi Road', 'Adeniyi Jones', 'Awolowo Way', 'Toyin Street',
      'Montgomery Road', 'Isaac John', 'Admiralty Way', 'Ligali Ayorinde', 'Ozumba Mbadiwe'
    ];
    
    for (let j = 0; j < transformerCount; j++) {
      const tAngle = (360 / transformerCount) * j + Math.random() * 20;
      const tDistance = 0.003 + Math.random() * 0.007; // ~300m-1km from feeder
      const tLat = feederLat + tDistance * Math.cos(tAngle * Math.PI / 180);
      const tLng = feederLng + tDistance * Math.sin(tAngle * Math.PI / 180);
      
      const transformerId = crypto.randomUUID();
      const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
      
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
      
      // 3. Generate Service Areas per transformer (1-3 per transformer)
      const serviceAreaCount = Math.round(1 + Math.random() * 2);
      const areaTypes = ['Estate', 'Plaza', 'Court', 'Gardens', 'Close'];
      
      for (let k = 0; k < serviceAreaCount; k++) {
        const saAngle = (360 / serviceAreaCount) * k;
        const saDistance = 0.001 + Math.random() * 0.002; // ~100-300m
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
        
        // 4. Generate Street Poles per service area (5-15 per service area)
        const poleCount = Math.round(5 + Math.random() * 10 * baseDensity);
        
        for (let p = 0; p < poleCount; p++) {
          const pAngle = Math.random() * 360;
          const pDistance = 0.0002 + Math.random() * 0.0008; // ~20-100m
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Check if already seeded
    const { count } = await supabase
      .from('nodes')
      .select('*', { count: 'exact', head: true })
      .eq('infrastructure_level', 'feeder');

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Infrastructure already seeded',
          existing_feeders: count 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalGenerated = 0;
    const batchSize = 50; // Insert in batches to avoid timeout

    for (const station of parentStations) {
      const children = generateChildNodes(station as Node);
      
      // Insert in batches
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
