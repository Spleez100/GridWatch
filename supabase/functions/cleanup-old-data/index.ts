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

    const summary = {
      reports_deleted: reportsDeleted ?? 0,
      grid_events_deleted: eventsDeleted ?? 0,
      ai_events_deleted: aiEventsDeleted ?? 0,
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
