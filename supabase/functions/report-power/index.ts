import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { node_id, report_type, session_id } = await req.json();

    // Validate inputs
    if (!node_id || !report_type || !session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTypes = ["POWER_AVAILABLE", "OUTAGE", "INTERMITTENT"];
    if (!validTypes.includes(report_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid report type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Spam protection: max 3 reports per node per session per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("node_id", node_id)
      .eq("session_id", session_id)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Max 3 reports per hour per node." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate (same session, same node, same type in last 5 min)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: dupCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("node_id", node_id)
      .eq("session_id", session_id)
      .eq("report_type", report_type)
      .gte("created_at", fiveMinAgo);

    if ((dupCount ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: "Duplicate report ignored" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert report
    const { error: insertError } = await supabase.from("reports").insert({
      node_id,
      report_type,
      session_id,
    });

    if (insertError) throw insertError;

    // Aggregate recent reports (last 30 min) to determine node status
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
      const powerCount = reports.filter((r) => r.report_type === "POWER_AVAILABLE").length;

      const outagePercent = outageCount / total;
      const powerPercent = powerCount / total;

      if (outagePercent > 0.7) newStatus = "OUTAGE";
      else if (powerPercent > 0.7) newStatus = "POWER_AVAILABLE";
      else newStatus = "INTERMITTENT";

      confidence = Math.min(100, Math.round(50 + total * 5));
    }

    // Get old status to check for change
    const { data: oldNode } = await supabase
      .from("nodes")
      .select("status, name, city")
      .eq("id", node_id)
      .single();

    // Update node
    const updateData: Record<string, unknown> = {
      status: newStatus,
      confidence,
      report_count: total,
    };

    if (newStatus === "OUTAGE") {
      updateData.last_outage = new Date().toISOString();
    }

    await supabase.from("nodes").update(updateData).eq("id", node_id);

    // Log event if status changed
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

    // Recalculate grid status
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

    // Update grid_status (update the single row)
    const { data: existingGrid } = await supabase
      .from("grid_status")
      .select("id")
      .limit(1)
      .single();

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
      JSON.stringify({ success: true, newStatus, confidence, gridStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
