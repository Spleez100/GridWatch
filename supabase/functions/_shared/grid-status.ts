import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type GridStatusValue =
  | "GRID_STABLE"
  | "GRID_FLUCTUATING"
  | "PARTIAL_OUTAGE"
  | "GRID_COLLAPSE";

/**
 * Recalculates national grid status from node counts and persists to grid_status.
 * Shared by report-power, ai-ingest, and cleanup-old-data.
 */
export async function recalculateGridStatus(
  supabase: SupabaseClient,
): Promise<GridStatusValue> {
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

  const total = totalNodes ?? 1;
  const outageRatio = (outageNodes ?? 0) / total;

  let gridStatus: GridStatusValue = "GRID_STABLE";
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

  return gridStatus;
}
