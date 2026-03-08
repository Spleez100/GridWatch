import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Nigerian electricity keywords for Perplexity search
const SEARCH_QUERIES = [
  // DisCo-specific queries
  "Eko Electricity EKEDC power outage Lagos today",
  "Ikeja Electric IE power outage restoration Lagos today",
  "Abuja Electricity AEDC power outage today",
  "Ibadan Electricity IBEDC power outage today",
  "Enugu Electricity EEDC power outage today",
  "Port Harcourt Electricity PHED power outage today",
  "Kaduna Electric power outage today",
  "Jos Electricity JEDC power outage today",
  "Kano Electricity KEDCO power outage today",
  "Benin Electricity BEDC power outage today",
  "Yola Electricity YEDC power outage today",
  // Social media / hashtag-style queries
  "#LightUp #DarknessInNigeria Nigeria electricity outage today",
  "#NoPowerSupply #NEPA Nigeria power outage light today",
  "site:twitter.com OR site:x.com Nigeria no light power outage today",
  // Nigerian slang / pidgin queries
  "\"no light\" OR \"light don go\" OR \"nepa don take light\" Nigeria today",
  "\"light don come\" OR \"power don restore\" Nigeria electricity today",
  "\"blackout\" OR \"power failure\" Nigeria electricity today 2026",
  // TCN / national grid queries
  "TCN national grid collapse Nigeria today",
  "Transmission Company Nigeria grid failure power today",
  // Telegram / community signals
  "Nigeria electricity community report outage restoration today",
];

interface ExtractedEvent {
  location: string;
  city: string;
  state: string;
  event_type: "outage_detected" | "power_restored" | "power_fluctuation";
  confidence: number;
  snippet: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all nodes for matching
    const { data: nodes } = await supabase.from("nodes").select("id, name, city, state, status");
    if (!nodes || nodes.length === 0) {
      return new Response(JSON.stringify({ message: "No nodes found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Search with Perplexity for recent Nigerian electricity signals
    const searchQuery = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a Nigerian electricity grid monitoring assistant. Report ONLY real, current outage or restoration events happening TODAY. Include specific locations (areas, cities, states). Be factual and concise.",
          },
          {
            role: "user",
            content: `Search for the latest Nigerian electricity outage and power restoration reports from the last few hours. Focus on: ${searchQuery}. Report specific areas, cities, and whether power is out or restored.`,
          },
        ],
        search_recency_filter: "day",
      }),
    });

    if (!perplexityResponse.ok) {
      const errText = await perplexityResponse.text();
      throw new Error(`Perplexity API error [${perplexityResponse.status}]: ${errText}`);
    }

    const perplexityData = await perplexityResponse.json();
    const searchContent = perplexityData.choices?.[0]?.message?.content || "";
    const citations = perplexityData.citations || [];

    if (!searchContent || searchContent.length < 20) {
      return new Response(JSON.stringify({ message: "No relevant signals found", query: searchQuery }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Use Lovable AI to extract structured events from search results
    const nodeList = nodes.map((n) => `${n.name} (${n.city}, ${n.state})`).join("; ");

    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a data extraction engine for Nigerian electricity grid monitoring. Extract outage/restoration events from text. Match locations to known nodes when possible.

Known monitoring nodes: ${nodeList}

Nigerian electricity slang mappings:
- "no light", "light don go", "nepa don take light", "blackout" = OUTAGE
- "light don come", "power don restore", "electricity restored" = RESTORATION
- "light dey come dey go", "unstable power" = INTERMITTENT`,
          },
          {
            role: "user",
            content: `Extract electricity events from this report. Return structured data:\n\n${searchContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_electricity_events",
              description: "Report extracted electricity outage/restoration events",
              parameters: {
                type: "object",
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string", description: "Area or neighborhood name" },
                        city: { type: "string", description: "City name" },
                        state: { type: "string", description: "Nigerian state" },
                        event_type: {
                          type: "string",
                          enum: ["outage_detected", "power_restored", "power_fluctuation"],
                        },
                        confidence: {
                          type: "integer",
                          description: "Confidence score 1-100 based on source reliability and specificity",
                        },
                        snippet: { type: "string", description: "Brief description of what was reported" },
                      },
                      required: ["location", "city", "state", "event_type", "confidence", "snippet"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["events"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_electricity_events" } },
      }),
    });

    if (!extractionResponse.ok) {
      const errText = await extractionResponse.text();
      throw new Error(`AI Gateway error [${extractionResponse.status}]: ${errText}`);
    }

    const extractionData = await extractionResponse.json();
    const toolCall = extractionData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ message: "No events extracted", searchContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extractedEvents: ExtractedEvent[];
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      extractedEvents = parsed.events || [];
    } catch {
      return new Response(JSON.stringify({ message: "Failed to parse extraction", raw: toolCall }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Match extracted events to nodes and apply updates
    const results: Array<{ event: ExtractedEvent; matched_node: string | null; applied: boolean }> = [];

    for (const event of extractedEvents) {
      // Only act on events with confidence > 60
      if (event.confidence <= 60) {
        results.push({ event, matched_node: null, applied: false });
        continue;
      }

      // Try to match to a node by city or name
      const matchedNode = nodes.find((n) => {
        const eLoc = event.location.toLowerCase();
        const eCity = event.city.toLowerCase();
        const eState = event.state.toLowerCase();
        return (
          n.city.toLowerCase() === eCity ||
          n.name.toLowerCase().includes(eLoc) ||
          n.city.toLowerCase().includes(eLoc) ||
          (n.state.toLowerCase() === eState && n.city.toLowerCase().includes(eCity))
        );
      });

      // Log AI event regardless of match
      await supabase.from("ai_events").insert({
        node_id: matchedNode?.id || null,
        node_name: matchedNode?.name || event.location,
        city: event.city,
        state: event.state,
        event_type: event.event_type,
        source_query: searchQuery,
        source_snippet: event.snippet,
        confidence: event.confidence,
        raw_extraction: event as unknown as Record<string, unknown>,
      });

      if (!matchedNode) {
        results.push({ event, matched_node: null, applied: false });
        continue;
      }

      // Map event_type to node status
      const statusMap: Record<string, string> = {
        outage_detected: "OUTAGE",
        power_restored: "POWER_AVAILABLE",
        power_fluctuation: "INTERMITTENT",
      };
      const newStatus = statusMap[event.event_type] || "INTERMITTENT";

      // Only update if status actually changed
      if (matchedNode.status !== newStatus) {
        const updateData: Record<string, unknown> = {
          status: newStatus,
          confidence: event.confidence,
        };
        if (newStatus === "OUTAGE") {
          updateData.last_outage = new Date().toISOString();
        }

        await supabase.from("nodes").update(updateData).eq("id", matchedNode.id);

        // Log grid event
        await supabase.from("grid_events").insert({
          node_id: matchedNode.id,
          event_type: event.event_type,
          node_name: matchedNode.name,
          city: matchedNode.city,
        });
      }

      results.push({ event, matched_node: matchedNode.name, applied: matchedNode.status !== newStatus });
    }

    // Step 4: Recalculate grid status
    const { count: totalNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true });
    const { count: poweredNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "POWER_AVAILABLE");
    const { count: outageNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "OUTAGE");
    const { count: intermittentNodes } = await supabase.from("nodes").select("*", { count: "exact", head: true }).eq("status", "INTERMITTENT");

    const t = totalNodes ?? 1;
    const outageRatio = (outageNodes ?? 0) / t;
    let gridStatus = "GRID_STABLE";
    if (outageRatio > 0.6) gridStatus = "GRID_COLLAPSE";
    else if (outageRatio > 0.4) gridStatus = "PARTIAL_OUTAGE";
    else if (outageRatio > 0.2) gridStatus = "GRID_FLUCTUATING";

    const { data: existingGrid } = await supabase.from("grid_status").select("id").limit(1).single();
    if (existingGrid) {
      await supabase.from("grid_status").update({
        status: gridStatus,
        total_nodes: totalNodes ?? 0,
        powered_nodes: poweredNodes ?? 0,
        outage_nodes: outageNodes ?? 0,
        intermittent_nodes: intermittentNodes ?? 0,
      }).eq("id", existingGrid.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        query: searchQuery,
        events_found: extractedEvents.length,
        events_applied: results.filter((r) => r.applied).length,
        citations,
        results,
        gridStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI ingest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
