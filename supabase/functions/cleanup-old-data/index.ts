import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { recalculateGridStatus } from "../_shared/grid-status.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const authError = requireCronSecret(req);
  if (authError) return authError;

  try {
    const supabase = createServiceClient();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { count: reportsDeleted } = await supabase
      .from("reports")
      .delete({ count: "exact" })
      .lt("created_at", twoDaysAgo);

    const { count: eventsDeleted } = await supabase
      .from("grid_events")
      .delete({ count: "exact" })
      .lt("created_at", twoDaysAgo);

    const { count: aiEventsDeleted } = await supabase
      .from("ai_events")
      .delete({ count: "exact" })
      .lt("created_at", twoDaysAgo);

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: staleNodes } = await supabase
      .from("nodes")
      .select("id, name, city, status, updated_at")
      .in("status", ["OUTAGE", "INTERMITTENT"])
      .lt("updated_at", sixHoursAgo);

    let nodesExpired = 0;

    if (staleNodes?.length) {
      for (const node of staleNodes) {
        const { count: recentReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("node_id", node.id)
          .gte("created_at", sixHoursAgo);

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

        if ((recentReports ?? 0) === 0 && (recentAiEvents ?? 0) === 0) {
          await supabase
            .from("nodes")
            .update({
              status: "POWER_AVAILABLE",
              severity: "LOW",
              confidence: 50,
            })
            .eq("id", node.id);

          await supabase.from("grid_events").insert({
            node_id: node.id,
            event_type: "auto_expired",
            node_name: node.name,
            city: node.city,
          });

          nodesExpired++;
        }
      }

      if (nodesExpired > 0) {
        await recalculateGridStatus(supabase);
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
    return jsonResponse(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Cleanup error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
