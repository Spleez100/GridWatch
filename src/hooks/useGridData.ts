import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbNode = Tables<'nodes'>;
export type DbGridStatus = Tables<'grid_status'>;
export type DbGridEvent = Tables<'grid_events'>;

// Map DB status to UI color
export function statusToColor(status: string): 'green' | 'red' | 'yellow' | 'gray' {
  if (status === 'POWER_AVAILABLE') return 'green';
  if (status === 'OUTAGE') return 'red';
  if (status === 'UNKNOWN') return 'gray';
  return 'yellow';
}

export function bandExpectedHours(band: string): number {
  const map: Record<string, number> = { A: 20, B: 16, C: 12, D: 8, E: 4 };
  return map[band] ?? 0;
}

// Session ID for anonymous reporting
function getSessionId(): string {
  let id = localStorage.getItem('grid_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('grid_session_id', id);
  }
  return id;
}

export function useNodes() {
  const [nodes, setNodes] = useState<DbNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      // Fetch all visible nodes using pagination to bypass 1000-row default limit
      let allNodes: DbNode[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data } = await supabase
          .from('nodes')
          .select('*')
          .eq('is_visible_default', true)
          .range(from, from + pageSize - 1);
        
        if (data && data.length > 0) {
          allNodes = [...allNodes, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setNodes(allNodes);
      setLoading(false);
    };
    fetchNodes();

    // Realtime subscription for visible nodes only
    const channel = supabase
      .channel('nodes-realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'nodes',
        filter: 'is_visible_default=eq.true'
      }, (payload) => {
        setNodes((prev) =>
          prev.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } as DbNode : n))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { nodes, loading };
}

// Hook to fetch child infrastructure nodes for a parent
export function useChildNodes(parentId: string | null) {
  const [children, setChildren] = useState<DbNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parentId) {
      setChildren([]);
      return;
    }

    setLoading(true);
    const fetchChildren = async () => {
      const { data } = await supabase
        .from('nodes')
        .select('*')
        .eq('parent_node_id', parentId)
        .order('infrastructure_level');
      if (data) setChildren(data);
      setLoading(false);
    };
    fetchChildren();
  }, [parentId]);

  return { children, loading };
}

export function useGridStatus() {
  const [gridStatus, setGridStatus] = useState<DbGridStatus | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('grid_status').select('*').limit(1).single();
      if (data) setGridStatus(data);
    };
    fetch();

    const channel = supabase
      .channel('grid-status-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grid_status' }, (payload) => {
        setGridStatus(payload.new as DbGridStatus);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return gridStatus;
}

export function useGridEvents() {
  const [events, setEvents] = useState<DbGridEvent[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('grid_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setEvents(data);
    };
    fetch();

    const channel = supabase
      .channel('grid-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grid_events' }, (payload) => {
        setEvents((prev) => [payload.new as DbGridEvent, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return events;
}

export function useReportPower() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = useCallback(async (nodeId: string, reportType: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('report-power', {
        body: {
          node_id: nodeId,
          report_type: reportType,
          session_id: getSessionId(),
        },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        return false;
      }
      return true;
    } catch (e: any) {
      setError(e.message || 'Failed to submit report');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { report, submitting, error };
}

export function useSearchNodes(nodes: DbNode[]) {
  return useCallback((query: string) => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    
    // Get unique cities/states for city results
    const cityMatches = new Map<string, { lat: number; lng: number }>();
    nodes.forEach((n) => {
      if (n.city.toLowerCase().includes(q) && !cityMatches.has(n.city)) {
        cityMatches.set(n.city, { lat: n.latitude, lng: n.longitude });
      }
      if (n.state.toLowerCase().includes(q) && !cityMatches.has(n.state)) {
        cityMatches.set(n.state, { lat: n.latitude, lng: n.longitude });
      }
    });

    const cityResults = Array.from(cityMatches.entries()).map(([name, coords]) => ({
      type: 'city' as const,
      label: name,
      lat: coords.lat,
      lng: coords.lng,
    }));

    const nodeResults = nodes
      .filter((n) => n.name.toLowerCase().includes(q) || n.disco.toLowerCase().includes(q))
      .slice(0, 6)
      .map((n) => ({
        type: 'node' as const,
        label: `${n.name}, ${n.city}`,
        node: n,
        lat: n.latitude,
        lng: n.longitude,
      }));

    return [...cityResults.slice(0, 4), ...nodeResults];
  }, [nodes]);
}
