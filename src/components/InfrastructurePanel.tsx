import { DbNode } from "@/hooks/useGridData";
import { useChildNodes } from "@/hooks/useGridData";
import { X, Loader2, ChevronRight, Zap, Factory, Network } from "lucide-react";

interface Props {
  parentNode: DbNode | null;
  onClose: () => void;
  onSelectChild: (node: DbNode) => void;
}

const levelIcons: Record<string, typeof Zap> = {
  feeder: Network,
  transformer: Zap,
  service_area: Factory,
  pole: Zap,
};

const levelLabels: Record<string, string> = {
  feeder: "11kV Feeder",
  transformer: "Transformer",
  service_area: "Service Area",
  pole: "Street Pole",
};

export default function InfrastructurePanel({
  parentNode,
  onClose,
  onSelectChild,
}: Props) {
  const { children, loading } = useChildNodes(parentNode?.id || null);

  if (!parentNode) return null;

  const grouped = children.reduce(
    (acc, node) => {
      const level = node.infrastructure_level || "unknown";
      if (!acc[level]) acc[level] = [];
      acc[level].push(node);
      return acc;
    },
    {} as Record<string, DbNode[]>,
  );

  const levels = ["feeder", "transformer", "service_area", "pole"].filter(
    (l) => grouped[l]?.length > 0,
  );

  return (
    <div className="absolute left-4 top-20 z-[1100] w-80 glass-card shadow-2xl shadow-black/50">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{parentNode.name}</h3>
          <p className="text-xs text-muted-foreground">Infrastructure Details</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : children.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No child infrastructure found
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {levels.map((level) => {
              const Icon = levelIcons[level] || Zap;
              const nodes = grouped[level];

              return (
                <div key={level} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {levelLabels[level]}
                    </span>
                    <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {nodes.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {nodes.slice(0, 10).map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => onSelectChild(node)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {node.name}
                          </p>
                          {node.feeder_name && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {node.feeder_name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              node.status === "POWER_AVAILABLE"
                                ? "bg-success"
                                : node.status === "OUTAGE"
                                  ? "bg-destructive"
                                  : "bg-warning"
                            }`}
                          />
                          <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}

                    {nodes.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{nodes.length - 10} more {levelLabels[level].toLowerCase()}s
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
