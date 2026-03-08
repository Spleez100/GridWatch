import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Search query groups ──────────────────────────────────────────
// We run 3 random queries per invocation to get broad coverage
const QUERY_GROUPS = {
  twitter_outage: [
    '("no light" OR "light don go" OR "nepa don take light") Nigeria',
    '("no light in" OR "no light since" OR "no light again") site:x.com',
    '("power outage" OR "electricity outage" OR "power failure") Nigeria today',
    '("light no dey" OR "power never come" OR "light never come") Nigeria',
    '("no electricity" OR "blackout") Nigeria today',
  ],
  twitter_restoration: [
    '("light don come" OR "power don restore" OR "electricity restored") Nigeria',
    '("power restored" OR "light is back") Nigeria today',
  ],
  infrastructure: [
    '("transformer blown" OR "transformer blow" OR "transformer spoil") Nigeria',
    '("transformer burnt" OR "transformer fault") Nigeria today',
    '("feeder down" OR "feeder fault" OR "feeder tripped") Nigeria today',
    '("substation failure" OR "substation down") Nigeria electricity',
  ],
  disco_specific: [
    "Eko Electricity EKEDC power outage Lagos today",
    "Ikeja Electric power outage restoration Lagos today",
    "Abuja Electricity AEDC power outage Abuja today",
    "Ibadan Electricity IBEDC power outage today",
    "Enugu Electricity EEDC power outage today",
    "Port Harcourt PHED power outage today",
    "Kaduna Electric power outage today",
    "Kano Electricity KEDCO power outage today",
    "Benin Electricity BEDC power outage today",
    "Jos Electricity JEDC power outage today",
    "Yola Electricity YEDC power outage today",
  ],
  location_specific: [
    "no light in Lagos Surulere Yaba Ajah Lekki Ikeja today",
    "no light in Abuja Wuse Garki Maitama Gwarinpa Kubwa today",
    "no light in Port Harcourt Rumuokoro Aba Uyo today",
    "no light in Ibadan Bodija Ogbomosho Ilorin Osogbo today",
    "no light in Kano Kaduna Jos Maiduguri Bauchi today",
    "no light in Benin Warri Asaba Onitsha Enugu today",
    "no light in Abeokuta Akure Ado-Ekiti Calabar Umuahia today",
  ],
  hashtags: [
    "#LightUp #DarknessInNigeria power outage today",
    "#NoPowerSupply #NEPA Nigeria electricity today",
    "#PowerOutage Nigeria community today",
  ],
  grid_national: [
    "TCN national grid collapse Nigeria today",
    "Transmission Company Nigeria grid failure today",
    "Nigeria national grid system collapse today",
  ],
};

interface ExtractedSignal {
  location: string;
  city: string;
  state: string;
  event_type: "outage_detected" | "power_restored" | "power_fluctuation" | "TRANSFORMER_FAILURE" | "FEEDER_FAILURE" | "INFRASTRUCTURE_FAILURE";
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number;
  snippet: string;
  source_platform: string;
  source_handle: string | null;
  source_url: string | null;
  duration_mentioned: string | null;
  multiple_reports: boolean;
}

// Pick N random queries from across groups
function pickQueries(n: number): string[] {
  const allGroups = Object.values(QUERY_GROUPS);
  const picked: string[] = [];
  const usedGroups = new Set<number>();

  while (picked.length < n && usedGroups.size < allGroups.length) {
    const gi = Math.floor(Math.random() * allGroups.length);
    if (usedGroups.has(gi)) continue;
    usedGroups.add(gi);
    const group = allGroups[gi];
    picked.push(group[Math.floor(Math.random() * group.length)]);
  }
  return picked;
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
    const { data: nodes } = await supabase
      .from("nodes")
      .select("id, name, city, state, status, severity");
    if (!nodes || nodes.length === 0) {
      return new Response(JSON.stringify({ message: "No nodes found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 1: Run 3 Perplexity searches in parallel ──────────
    const queries = pickQueries(3);

    const searchPromises = queries.map(async (query) => {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
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
              content: `You are monitoring Nigerian electricity outages via social media and news. Focus on X (Twitter) posts primarily, also Facebook, Reddit, forums, news comments.

CRITICAL RULES:
- Report ONLY real, current outage or restoration events from the last few hours
- Include specific locations (neighborhoods, areas, cities, states)
- ALWAYS capture the social media handle/username of the person reporting (e.g. @username for Twitter/X, Facebook display name, Reddit username)
- ALWAYS capture the source URL/link if available
- Note if multiple people are reporting the same outage
- Note how long the outage has lasted if mentioned
- Distinguish between outages, restorations, and intermittent supply
- Nigerian slang: "no light"/"light don go"/"nepa don take light" = outage; "light don come" = restoration
- Be factual, include source platform (Twitter/X, Facebook, news, etc.)
- Do NOT report old events as recent. Only include events from the last 24 hours`,
            },
            {
              role: "user",
              content: `Find the latest Nigerian electricity reports from social media and news. Search: ${query}`,
            },
          ],
          search_recency_filter: "day",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Perplexity error for "${query}": ${res.status} ${errText}`);
        return { content: "", citations: [], query };
      }

      const data = await res.json();
      return {
        content: data.choices?.[0]?.message?.content || "",
        citations: data.citations || [],
        query,
      };
    });

    const searchResults = await Promise.all(searchPromises);
    const combinedContent = searchResults
      .filter((r) => r.content.length > 20)
      .map((r) => `--- Search: ${r.query} ---\n${r.content}`)
      .join("\n\n");

    const allCitations = searchResults.flatMap((r) => r.citations);

    if (!combinedContent || combinedContent.length < 30) {
      return new Response(
        JSON.stringify({ message: "No relevant signals found", queries }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: AI extraction with severity classification ─────
    const nodeList = nodes
      .map((n) => `${n.name} (${n.city}, ${n.state})`)
      .join("; ");

    const extractionResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `You are a Nigerian electricity outage signal extraction engine.

KNOWN MONITORING NODES: ${nodeList}

NIGERIAN ELECTRICITY LANGUAGE:
Outage: "no light", "light don go", "nepa don take light", "no power since", "light never come", "power never come", "blackout", "power failure", "grid collapse"
Restoration: "light don come", "power don restore", "electricity restored", "light is back"
Intermittent: "light dey come dey go", "unstable power"
Infrastructure: "transformer blown/blow/spoil/burnt/fault", "feeder down/fault/tripped", "substation failure/down"

EVENT TYPES:
- outage_detected: general power outage
- power_restored: power came back
- power_fluctuation: intermittent/unstable supply
- TRANSFORMER_FAILURE: transformer damaged/blown/burnt — always CRITICAL severity
- FEEDER_FAILURE: feeder tripped/down — always HIGH or CRITICAL severity
- INFRASTRUCTURE_FAILURE: substation or other infrastructure damage — always CRITICAL severity

SEVERITY RULES:
- CRITICAL: infrastructure damage (transformer/feeder/substation), many posts, outage >12 hours, entire community
- HIGH: multiple confirmations, outage 6-12 hours, feeder issues
- MODERATE: single confirmed report, outage <6 hours
- LOW: unconfirmed single mention, vague location

CONFIDENCE RULES:
- Multiple independent reports = higher confidence
- Specific location = higher confidence
- Infrastructure damage mentioned = automatically higher confidence (70+)
- Note source platform (Twitter/X, Facebook, Reddit, news, forum)`,
            },
            {
              role: "user",
              content: `Extract ALL electricity outage/restoration signals from these search results. Be thorough:\n\n${combinedContent}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_signals",
                description:
                  "Report extracted electricity outage/restoration signals from social media monitoring",
                parameters: {
                  type: "object",
                  properties: {
                    signals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          location: {
                            type: "string",
                            description:
                              "Specific area/neighborhood name (e.g. Abule Ijesha, Ajah, Surulere)",
                          },
                          city: { type: "string", description: "City name" },
                          state: {
                            type: "string",
                            description: "Nigerian state",
                          },
                          event_type: {
                            type: "string",
                            enum: [
                              "outage_detected",
                              "power_restored",
                              "power_fluctuation",
                              "TRANSFORMER_FAILURE",
                              "FEEDER_FAILURE",
                              "INFRASTRUCTURE_FAILURE",
                            ],
                          },
                          severity: {
                            type: "string",
                            enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
                          },
                          confidence: {
                            type: "integer",
                            description:
                              "1-100 confidence based on specificity and source count",
                          },
                          snippet: {
                            type: "string",
                            description:
                              "Brief description of what was reported",
                          },
                          source_platform: {
                            type: "string",
                            description:
                              "Platform source: twitter, facebook, reddit, news, forum, unknown",
                          },
                          duration_mentioned: {
                            type: "string",
                            description:
                              "Duration if mentioned (e.g. '2 days', '12 hours'), null if not",
                          },
                          multiple_reports: {
                            type: "boolean",
                            description:
                              "Whether multiple independent reports confirm this",
                          },
                        },
                        required: [
                          "location",
                          "city",
                          "state",
                          "event_type",
                          "severity",
                          "confidence",
                          "snippet",
                          "source_platform",
                          "duration_mentioned",
                          "multiple_reports",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["signals"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "report_signals" },
          },
        }),
      }
    );

    if (!extractionResponse.ok) {
      const errText = await extractionResponse.text();
      throw new Error(
        `AI Gateway error [${extractionResponse.status}]: ${errText}`
      );
    }

    const extractionData = await extractionResponse.json();
    const toolCall =
      extractionData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({
          message: "No signals extracted",
          queries,
          combinedContentLength: combinedContent.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let signals: ExtractedSignal[];
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      signals = parsed.signals || [];
    } catch {
      return new Response(
        JSON.stringify({ message: "Failed to parse extraction", raw: toolCall }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Deduplication against recent ai_events ─────────
    const fifteenMinAgo = new Date(
      Date.now() - 15 * 60 * 1000
    ).toISOString();
    const { data: recentAiEvents } = await supabase
      .from("ai_events")
      .select("location, city, state, event_type, signal_count, id, confidence")
      .gte("created_at", fifteenMinAgo);

    const recentEvents = recentAiEvents || [];

    // ── Step 4: Process each signal ───────────────────────────
    const results: Array<{
      signal: ExtractedSignal;
      matched_node: string | null;
      applied: boolean;
      deduplicated: boolean;
      signal_count: number;
    }> = [];

    for (const signal of signals) {
      // Multi-signal confirmation: check for duplicates in recent window
      const existingDup = recentEvents.find(
        (e) =>
          e.location?.toLowerCase() === signal.location.toLowerCase() &&
          e.city?.toLowerCase() === signal.city.toLowerCase() &&
          e.event_type === signal.event_type
      );

      if (existingDup) {
        // Boost confidence on duplicate — increase signal_count
        const newCount = (existingDup.signal_count || 1) + 1;
        const boostedConfidence = Math.min(
          100,
          (existingDup.confidence || 50) + 8
        );

        // Escalate severity based on signal count
        let escalatedSeverity = signal.severity;
        if (newCount >= 5) escalatedSeverity = "CRITICAL";
        else if (newCount >= 3) escalatedSeverity = "HIGH";

        await supabase
          .from("ai_events")
          .update({
            signal_count: newCount,
            confidence: boostedConfidence,
            severity: escalatedSeverity,
          })
          .eq("id", existingDup.id);

        results.push({
          signal,
          matched_node: null,
          applied: false,
          deduplicated: true,
          signal_count: newCount,
        });
        continue;
      }

      // Fuzzy match to monitoring nodes
      const matchedNode = findBestNodeMatch(signal, nodes);

      // Log ai_event
      await supabase.from("ai_events").insert({
        node_id: matchedNode?.id || null,
        node_name: matchedNode?.name || signal.location,
        city: signal.city,
        state: signal.state,
        location: signal.location,
        event_type: signal.event_type,
        severity: signal.severity,
        source_query: queries.join(" | "),
        source_snippet: signal.snippet,
        source_platform: signal.source_platform,
        confidence: signal.confidence,
        signal_count: signal.multiple_reports ? 2 : 1,
        raw_extraction: signal as unknown as Record<string, unknown>,
      });

      // Only apply to node if confidence > 60
      let applied = false;
      if (matchedNode && signal.confidence > 60) {
        const statusMap: Record<string, string> = {
          outage_detected: "OUTAGE",
          power_restored: "POWER_AVAILABLE",
          power_fluctuation: "INTERMITTENT",
          TRANSFORMER_FAILURE: "OUTAGE",
          FEEDER_FAILURE: "OUTAGE",
          INFRASTRUCTURE_FAILURE: "OUTAGE",
        };
        const newStatus = statusMap[signal.event_type] || "INTERMITTENT";

        if (matchedNode.status !== newStatus) {
          const updateData: Record<string, unknown> = {
            status: newStatus,
            confidence: signal.confidence,
            severity: signal.severity,
          };
          if (newStatus === "OUTAGE") {
            updateData.last_outage = new Date().toISOString();
          }

          await supabase
            .from("nodes")
            .update(updateData)
            .eq("id", matchedNode.id);

          // Log grid event
          await supabase.from("grid_events").insert({
            node_id: matchedNode.id,
            event_type: signal.event_type,
            node_name: matchedNode.name,
            city: matchedNode.city,
          });

          applied = true;
        }
      }

      results.push({
        signal,
        matched_node: matchedNode?.name || null,
        applied,
        deduplicated: false,
        signal_count: signal.multiple_reports ? 2 : 1,
      });
    }

    // ── Step 5: Recalculate grid status ───────────────────────
    const { count: totalNodes } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true });
    const { count: poweredNodes } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })
      .eq("status", "POWER_AVAILABLE");
    const { count: outageNodes } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })
      .eq("status", "OUTAGE");
    const { count: intermittentNodes } = await supabase
      .from("nodes")
      .select("*", { count: "exact", head: true })
      .eq("status", "INTERMITTENT");

    const t = totalNodes ?? 1;
    const outageRatio = (outageNodes ?? 0) / t;
    let gridStatus = "GRID_STABLE";
    if (outageRatio > 0.6) gridStatus = "GRID_COLLAPSE";
    else if (outageRatio > 0.4) gridStatus = "PARTIAL_OUTAGE";
    else if (outageRatio > 0.2) gridStatus = "GRID_FLUCTUATING";

    const { data: existingGrid } = await supabase
      .from("grid_status")
      .select("id")
      .limit(1)
      .single();
    if (existingGrid) {
      await supabase
        .from("grid_status")
        .update({
          status: gridStatus,
          total_nodes: totalNodes ?? 0,
          powered_nodes: poweredNodes ?? 0,
          outage_nodes: outageNodes ?? 0,
          intermittent_nodes: intermittentNodes ?? 0,
        })
        .eq("id", existingGrid.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        queries,
        signals_found: signals.length,
        signals_applied: results.filter((r) => r.applied).length,
        signals_deduplicated: results.filter((r) => r.deduplicated).length,
        citations: allCitations,
        results,
        gridStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI ingest error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ── Node matching logic ────────────────────────────────────────
function findBestNodeMatch(
  signal: ExtractedSignal,
  nodes: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    status: string;
    severity: string;
  }>
): (typeof nodes)[0] | null {
  const loc = signal.location.toLowerCase();
  const city = signal.city.toLowerCase();
  const state = signal.state.toLowerCase();

  // Score each node
  let bestNode: (typeof nodes)[0] | null = null;
  let bestScore = 0;

  for (const node of nodes) {
    let score = 0;
    const nName = node.name.toLowerCase();
    const nCity = node.city.toLowerCase();
    const nState = node.state.toLowerCase();

    // Exact name match
    if (nName === loc) score += 100;
    // Name contains location
    else if (nName.includes(loc) || loc.includes(nName)) score += 70;

    // City match
    if (nCity === city) score += 50;
    else if (nCity.includes(city) || city.includes(nCity)) score += 30;
    // Location matches city
    if (nCity === loc || nCity.includes(loc) || loc.includes(nCity))
      score += 40;

    // State match
    if (nState === state) score += 20;

    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  }

  // Require minimum score to match
  return bestScore >= 40 ? bestNode : null;
}
