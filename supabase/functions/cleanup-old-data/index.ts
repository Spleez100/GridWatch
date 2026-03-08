import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Delete old reports (> 24h)
    const { count: reportsDeleted } = await supabase
      .from("reports")
      .delete({ count: "exact" })
      .lt("created_at", oneDayAgo);

    // Delete old grid_events (> 24h)
    const { count: eventsDeleted } = await supabase
      .from("grid_events")
      .delete({ count: "exact" })
      .lt("created_at", oneDayAgo);

    // Delete old ai_events (> 24h)
    const { count: aiEventsDeleted } = await supabase
      .from("ai_events")
      .delete({ count: "exact" })
      .lt("created_at", oneDayAgo);

    // ── Auto-expire stale outages ──────────────────────────────
    // Nodes in OUTAGE or INTERMITTENT for 6+ hours with no recent
    // confirming reports or AI events revert to POWER_AVAILABLE
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    // Get nodes that haven't been updated in 6+ hours and are not POWER_AVAILABLE
    const { data: staleNodes } = await supabase
      .from("nodes")
      .select("id, name, city, status, updated_at")
      .in("status", ["OUTAGE", "INTERMITTENT"])
      .lt("updated_at", sixHoursAgo);

    let nodesExpired = 0;
    if (staleNodes && staleNodes.length > 0) {
      for (const node of staleNodes) {
        // Check for recent reports (last 6h) confirming the outage
        const { count: recentReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("node_id", node.id)
          .gte("created_at", sixHoursAgo);

        // Check for recent AI events (last 6h) for this node
        const { count: recentAiEvents } = await supabase
          .from("ai_events")
          .select("*", { count: "exact", head: true })
          .eq("node_id", node.id)
          .gte("created_at", sixHoursAgo)
          .in("event_type", [
            "outage_detected",
            "TRANSFORMER_FAILURE",
            "FEEDER_FAILURE",
            "INFRASTRUCTURE_FAILURE",
          ]);

        // If no recent confirming signals, revert to POWER_AVAILABLE
        if ((recentReports ?? 0) === 0 && (recentAiEvents ?? 0) === 0) {
          await supabase
            .from("nodes")
            .update({
              status: "POWER_AVAILABLE",
              severity: "LOW",
              confidence: 50,
            })
            .eq("id", node.id);

          // Log the auto-recovery event
          await supabase.from("grid_events").insert({
            node_id: node.id,
            event_type: "auto_expired",
            node_name: node.name,
            city: node.city,
          });

          nodesExpired++;
        }
      }

      // Recalculate grid status after expiring nodes
      if (nodesExpired > 0) {
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
      }
    }

    const summary = {
      reports_deleted: reportsDeleted ?? 0,
      grid_events_deleted: eventsDeleted ?? 0,
      ai_events_deleted: aiEventsDeleted ?? 0,
      nodes_auto_expired: nodesExpired,
      stale_nodes_checked: staleNodes?.length ?? 0,
      cleaned_at: new Date().toISOString(),
    };

    console.log("Cleanup complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
