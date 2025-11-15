import { Checkbox } from "@/components/ui/checkbox";
import { cn, getNodeId } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";
import React from "react";
const VirtualTreeItem = React.memo(
  ({
    node,
    isChecked,
    isExpanded,
    isIndeterminate,
    onToggleCheck,
    onToggleExpand,
  }) => {
    const hasChildren = !!node.children?.length;
    const nodeId = getNodeId(node);
    const speed = node.Speed;
    const vehicleMake = node.make;
    const vehicleSerial = node.SerialNumber;
    const vehStatusCode = node.vehStatusCode;

    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border border-border/60 hover:bg-accent/30",
          "px-3 py-2 transition-colors cursor-pointer   shadow-sm"
        )}
        onClick={() =>
          hasChildren
            ? onToggleExpand(nodeId)
            : onToggleCheck(nodeId, !isChecked)
        }
        style={{ marginLeft: `${node.level * 15}px` }}
      >
        {/* Expand / Collapse */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(nodeId);
            }}
            className="flex h-5 w-5 items-center justify-center rounded  "
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Checkbox */}
        <Checkbox
          checked={isIndeterminate ? "indeterminate" : isChecked}
          onCheckedChange={(value) => onToggleCheck(nodeId, value === true)}
          onClick={(e) => e.stopPropagation()}
          className="scale-90"
        />

        <div className="flex items-center gap-2 truncate">
          <mark className="truncate text-sm font-medium text-foreground bg-transparent">
            {node.label}
          </mark>
          {hasChildren && (
            <span className="text-xs text-muted-foreground">
              ({node.count})
            </span>
          )}
        </div>

        {!hasChildren && (
          <div className="flex items-center gap-2 w-full max-w-full overflow-hidden">
            <span className="shadow-2xl">
              <img
                src={`/assets/images/cars/${vehStatusCode}.png`}
                alt="car-status"
              />
            </span>
            <mark className="text-muted-foreground text-xs truncate flex-1 min-w-0 flex flex-col bg-transparent">
              <span> {vehicleMake}</span>
              <span> {vehicleSerial}</span>
            </mark>
            <span className="text-xs px-2 py-1 bg-accent rounded-md shrink-0 select-none shadow-sm">
              {speed ? speed.toFixed(1) : 0} km/h
            </span>
          </div>
        )}
      </div>
    );
  }
);

export default VirtualTreeItem;
