"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useVehicleStore } from "@/store/useVehicleStore";
import VirtualTreeItem from "./VirtualTreeItem";
import {
  buildNodeMap,
  flattenTree,
  getNodeId,
  transformVehiclesToTree,
} from "@/lib/utils";

export default function VehicleTree({ statusFilter }) {
  const [treeData, setTreeData] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [userCollapsed, setUserCollapsed] = useState(new Set());
  const [search, setSearch] = useState("");

  const { fetchVehicles, closeSocket, vehicles, loading } = useVehicleStore();

  // ---------------- Fetch vehicles ----------------
  useEffect(() => {
    fetchVehicles(true);
    return () => closeSocket();
  }, []);

  // ---------------- Build tree and nodeMap ----------------
  useEffect(() => {
    const vehiclesArray = Array.from(vehicles.values());
    const tree = transformVehiclesToTree(vehiclesArray);
    setTreeData(tree);
  }, [vehicles]);

  // ---------------- High-Performance Filter Tree ----------------
  const filterTree = useCallback((nodes, searchTerm, status) => {
    if (!nodes?.length) return [];

    const term = searchTerm?.trim().toLowerCase();
    const normalizedStatus = status === "all" ? null : String(status);

    const result = [];

    for (const node of nodes) {
      const vehicle = node.originalData || node;
      let match =
        normalizedStatus === null ||
        String(vehicle.vehStatusCode) === normalizedStatus;

      if (term) {
        const make = vehicle.make || "";
        const serial = vehicle.SerialNumber || "";
        match =
          match &&
          (make.toLowerCase().includes(term) ||
            serial.toLowerCase().includes(term));
      }

      const children = node.children?.length
        ? filterTree(node.children, searchTerm, status)
        : [];

      if (match || children.length) {
        result.push({ ...node, children, count: children.length });
      }
    }

    return result;
  }, []);

  const filteredTree = useMemo(
    () => filterTree(treeData, search, statusFilter),
    [treeData, search, statusFilter, filterTree]
  );

  // ---------------- Build filteredNodeMap for quick access ----------------
  const filteredNodeMap = useMemo(
    () => buildNodeMap(filteredTree),
    [filteredTree]
  );

  // ---------------- Auto expand for search ----------------
  const allGroupIds = useMemo(() => {
    const ids = new Set();
    const collect = (nodes) => {
      for (const n of nodes) {
        if (n.children?.length) {
          ids.add(getNodeId(n));
          collect(n.children);
        }
      }
    };
    collect(filteredTree);
    return ids;
  }, [filteredTree]);

  useEffect(() => {
    if (!search.trim() || !allGroupIds.size) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of allGroupIds) {
        if (!userCollapsed.has(id)) next.add(id);
      }
      return next;
    });
  }, [allGroupIds, search, userCollapsed]);

  // ---------------- Flatten visible tree ----------------
  const flatData = useMemo(
    () => flattenTree(filteredTree, expanded),
    [filteredTree, expanded]
  );

  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: flatData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 55,
    overscan: 15,
  });

  // ---------------- Expand / Collapse ----------------
  const toggleExpand = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const wasOpen = next.has(id);
      if (wasOpen) {
        next.delete(id);
        setUserCollapsed((p) => new Set(p).add(id));
      } else {
        next.add(id);
        setUserCollapsed((p) => {
          const n = new Set(p);
          n.delete(id);
          return n;
        });
      }
      return next;
    });
  }, []);

  // ---------------- Precompute descendant LEAF ids for filtered tree ----------------
  // Map: nodeId -> array of descendant leaf nodeIds (for vehicles only)
  const descendantLeafIdsMap = useMemo(() => {
    const map = new Map();

    // helper: collect leaf ids for a node
    const collectLeafIds = (node) => {
      const stack = [node];
      const leafIds = [];

      while (stack.length) {
        const cur = stack.pop();
        if (!cur) continue;
        if (!cur.children || cur.children.length === 0) {
          leafIds.push(getNodeId(cur));
        } else {
          // push children
          for (let i = 0; i < cur.children.length; i++) {
            stack.push(cur.children[i]);
          }
        }
      }

      return leafIds;
    };

    // walk filteredTree roots and fill map for each node (groups + vehicles)
    const walk = (nodes) => {
      for (const n of nodes) {
        const id = getNodeId(n);
        // store leaf ids for this node
        map.set(id, collectLeafIds(n));

        // recurse children to set map entries for them too
        if (n.children?.length) walk(n.children);
      }
    };

    walk(filteredTree);
    return map;
  }, [filteredTree]);

  // ---------------- Get filtered descendants via precomputed map ----------------
  const getFilteredDescendants = useCallback(
    (id) => {
      const arr = descendantLeafIdsMap.get(id);
      return arr ? arr.slice() : []; // return copy to avoid accidental mutation
    },
    [descendantLeafIdsMap]
  );
  // ---------------- Precompute descendant LEAF ids for filtered tree ----------------
  // Map: nodeId -> array of descendant leaf nodeIds (for vehicles only)

  // ---------------- Checkbox Logic ----------------
  const toggleCheck = useCallback(
    (id, isChecked) => {
      const targetIds = getFilteredDescendants(id);
      setChecked((prev) => {
        const next = new Set(prev);
        targetIds.forEach((cid) => {
          if (isChecked) next.add(cid);
          else next.delete(cid);
        });
        return next;
      });
    },
    [getFilteredDescendants]
  );

  const getIndeterminateState = useCallback(
    (node) => {
      if (!node.children?.length) return false;
      const allIds = getFilteredDescendants(getNodeId(node));
      const selectedCount = allIds.filter((id) => checked.has(id)).length;
      return selectedCount > 0 && selectedCount < allIds.length;
    },
    [checked, getFilteredDescendants]
  );

  // ---------------- Select All / Clear ----------------
  const selectAll = useCallback(() => {
    const allIds = Array.from(filteredNodeMap.values())
      .filter(({ node }) => !node.children?.length)
      .map(({ node }) => getNodeId(node));

    setChecked((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
  }, [filteredNodeMap]);

  const clearSelection = useCallback(() => {
    const allIds = Array.from(filteredNodeMap.values())
      .filter(({ node }) => !node.children?.length)
      .map(({ node }) => getNodeId(node));

    setChecked((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [filteredNodeMap]);

  const allSelected = useMemo(() => {
    const allIds = Array.from(filteredNodeMap.values())
      .filter(({ node }) => !node.children?.length)
      .map(({ node }) => getNodeId(node));
    return allIds.length > 0 && allIds.every((id) => checked.has(id));
  }, [checked, filteredNodeMap]);

  // ---------------- Render ----------------
  return (
    <>
      <div className="text-sm text-muted-foreground mb-2">
        {checked.size} selected total / {flatData.length} visible
      </div>

      <div className="relative w-full my-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="p-4 text-muted-foreground text-center">
          Loading vehicles...
        </div>
      ) : !flatData.length ? (
        <div className="p-4 text-muted-foreground text-center">
          No data to show
        </div>
      ) : (
        <div
          ref={parentRef}
          className="max-h-[65vh] overflow-y-auto overflow-x-hidden rounded-lg border"
        >
          <label
            htmlFor="select-all"
            className="flex items-center gap-2 sticky top-0 z-30 p-3 bg-sidebar/50 backdrop-blur-md border-b border-border cursor-pointer"
          >
            <Checkbox
              checked={
                allSelected ? true : checked.size > 0 ? "indeterminate" : false
              }
              onCheckedChange={(value) =>
                value ? selectAll() : clearSelection()
              }
              id="select-all"
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </label>

          <div className="p-3 relative">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: "relative",
                width: "100%",
              }}
            >
              {virtualizer.getVirtualItems().map((v) => {
                const node = flatData[v.index];
                const nodeId = getNodeId(node);
                const isChecked = node.children?.length
                  ? getFilteredDescendants(nodeId).every((cid) =>
                      checked.has(cid)
                    )
                  : checked.has(nodeId);
                const isIndeterminate = getIndeterminateState(node);
                const isExpanded = expanded.has(nodeId);

                return (
                  <div
                    key={v.key}
                    style={{
                      height: `${v.size}px`,
                      transform: `translateY(${v.start}px)`,
                    }}
                    className="absolute top-0 left-0 w-full"
                  >
                    <VirtualTreeItem
                      node={node}
                      isChecked={isChecked}
                      isExpanded={isExpanded}
                      isIndeterminate={isIndeterminate}
                      onToggleCheck={toggleCheck}
                      onToggleExpand={toggleExpand}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
