import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { recalculateGridStatus } from "../_shared/grid-status.ts";

const VALID_REPORT_TYPES = ["POWER_AVAILABLE", "OUTAGE", "INTERMITTENT"] as const;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = createServiceClient();
    const { node_id, report_type, session_id } = await req.json();

    if (!node_id || !report_type || !session_id) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    if (!VALID_REPORT_TYPES.includes(report_type)) {
      return jsonResponse({ error: "Invalid report type" }, 400);
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("node_id", node_id)
      .eq("session_id", session_id)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return jsonResponse(
        { error: "Rate limit exceeded. Max 3 reports per hour per node." },
        429,
      );
    }

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: dupCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("node_id", node_id)
      .eq("session_id", session_id)
      .eq("report_type", report_type)
      .gte("created_at", fiveMinAgo);

    if ((dupCount ?? 0) > 0) {
      return jsonResponse({ error: "Duplicate report ignored" }, 409);
    }

    const { error: insertError } = await supabase.from("reports").insert({
      node_id,
      report_type,
      session_id,
    });

    if (insertError) throw insertError;

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentReports } = await supabase
      .from("reports")
      .select("report_type")
      .eq("node_id", node_id)
      .gte("created_at", thirtyMinAgo);

    const reports = recentReports ?? [];
    const total = reports.length;

    let newStatus = "INTERMITTENT";
    let confidence = 50;

    if (total > 0) {
      const outageCount = reports.filter((r) => r.report_type === "OUTAGE").length;
      const powerCount = reports.filter(
        (r) => r.report_type === "POWER_AVAILABLE",
      ).length;

      const outagePercent = outageCount / total;
      const powerPercent = powerCount / total;

      if (outagePercent > 0.7) newStatus = "OUTAGE";
      else if (powerPercent > 0.7) newStatus = "POWER_AVAILABLE";
      else newStatus = "INTERMITTENT";

      confidence = Math.min(100, Math.round(50 + total * 5));
    }

    const { data: oldNode } = await supabase
      .from("nodes")
      .select("status, name, city")
      .eq("id", node_id)
      .single();

    const updateData: Record<string, unknown> = {
      status: newStatus,
      confidence,
      report_count: total,
    };

    if (newStatus === "OUTAGE") {
      updateData.last_outage = new Date().toISOString();
    }

    await supabase.from("nodes").update(updateData).eq("id", node_id);

    if (oldNode && oldNode.status !== newStatus) {
      const eventType =
        newStatus === "OUTAGE"
          ? "outage_detected"
          : newStatus === "POWER_AVAILABLE"
            ? "power_restored"
            : "power_fluctuation";

      await supabase.from("grid_events").insert({
        node_id,
        event_type: eventType,
        node_name: oldNode.name,
        city: oldNode.city,
      });
    }

    const gridStatus = await recalculateGridStatus(supabase);

    return jsonResponse({ success: true, newStatus, confidence, gridStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
