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
import { useVehicleStore } from "@/store/useVehicleStore";
import VirtualTreeItem from "./VirtualTreeItem";
import {
  buildNodeMap,
  flattenTree,
  getNodeId,
  transformVehiclesToTree,
} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function VehicleTree() {
  const [treeData, setTreeData] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [userCollapsed, setUserCollapsed] = useState(new Set());
  const [search, setSearch] = useState("");

  const [nodeMap, setNodeMap] = useState(new Map());

  const {
    fetchVehicles,
    closeSocket,

    vehicles,
    loading,
  } = useVehicleStore();

  /* ---------------- Init: Fetch + Socket ---------------- */

  useEffect(() => {
    const init = async () => {
      await fetchVehicles(true);
    };

    init();

    return () => {
      closeSocket(); // cleanup
    };
  }, []);

  useEffect(() => {
    if (vehicles?.length) {
      const tree = transformVehiclesToTree(vehicles);
      setTreeData(tree);
      setNodeMap(buildNodeMap(tree));
    }
  }, [vehicles]);

  /* ---------------- Filtered Tree + group IDs (search-only) ---------------- */
  const { filteredTree, allGroupIds } = useMemo(() => {
    if (!treeData.length) return { filteredTree: [], allGroupIds: new Set() };

    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return { filteredTree: treeData, allGroupIds: new Set() };

    const filterTree = (nodes) =>
      nodes
        .map((node) => {
          const vehicle = node.originalData || node;
          const make = vehicle.make?.toLowerCase() || "";
          const serial = vehicle?.SerialNumber?.toLowerCase() || "";

          const isMatch =
            make.includes(searchTerm) || serial.includes(searchTerm);

          if (node.children?.length) {
            const filteredChildren = filterTree(node.children);
            const matchOrChildren = isMatch || filteredChildren.length > 0;

            if (matchOrChildren) {
              return {
                ...node,
                count: filteredChildren.length,
                children: filteredChildren,
              };
            }
            return null;
          }

          return isMatch ? node : null;
        })
        .filter(Boolean);

    const ft = filterTree(treeData);

    // collect group ids present in filtered tree
    const groupIds = new Set();
    const collect = (nodes) => {
      for (const n of nodes) {
        if (n.children?.length) {
          groupIds.add(getNodeId(n));
          collect(n.children);
        }
      }
    };
    collect(ft);

    return { filteredTree: ft, allGroupIds: groupIds };
  }, [treeData, search]);

  useEffect(() => {
    const term = search.trim();
    if (!term) return;
    if (!allGroupIds || allGroupIds.size === 0) return;

    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of allGroupIds) {
        // Skip those the user intentionally collapsed
        if (!userCollapsed.has(id)) next.add(id);
      }
      return next;
    });
    // we DO NOT clear userCollapsed here; user's manual choices persist
  }, [allGroupIds, search, userCollapsed]);

  /* ---------------- Flatten final visible list using current expanded ---------------- */
  const flatData = useMemo(() => {
    if (!treeData.length) return [];

    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return flattenTree(treeData, expanded);

    // use filteredTree but respect expanded state so user toggles apply
    return flattenTree(filteredTree, expanded);
  }, [treeData, expanded, search, filteredTree]);
  const visibleVehicleIds = useMemo(() => {
    return flatData
      .filter((n) => !n.children?.length) // only vehicles (leaf nodes)
      .map(getNodeId);
  }, [flatData]);

  /* ---------------- Virtualizer ---------------- */
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: flatData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 55,
    overscan: 15,
  });

  /* ---------------- Expand / Collapse ---------------- */
  const toggleExpand = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const wasOpen = next.has(id);
      if (wasOpen) {
        // user collapsed -> remember the choice
        next.delete(id);
        setUserCollapsed((prevC) => {
          const s = new Set(prevC);
          s.add(id);
          return s;
        });
      } else {
        // user opened -> remove from userCollapsed
        next.add(id);
        setUserCollapsed((prevC) => {
          const s = new Set(prevC);
          s.delete(id);
          return s;
        });
      }
      return next;
    });
  }, []);

  /* ---------------- Checkbox Logic ---------------- */
  const getAllDescendants = useCallback(
    (id) => {
      const node = nodeMap.get(id)?.node;
      if (!node?.children?.length) return [];
      const result = [];
      const stack = [...node.children];
      while (stack.length) {
        const child = stack.pop();
        const childId = getNodeId(child);
        result.push(childId);
        if (child.children?.length) stack.push(...child.children);
      }
      return result;
    },
    [nodeMap]
  );

  const toggleCheck = useCallback(
    (id, isChecked) => {
      const node = nodeMap.get(id)?.node;
      if (!node) return;
      const newChecked = new Set(checked);
      if (node.children?.length) {
        const allChildIds = getAllDescendants(id);
        if (isChecked) allChildIds.forEach((cid) => newChecked.add(cid));
        else allChildIds.forEach((cid) => newChecked.delete(cid));
      } else {
        isChecked ? newChecked.add(id) : newChecked.delete(id);
      }
      setChecked(newChecked);
    },
    [checked, nodeMap, getAllDescendants]
  );

  const getIndeterminateState = useCallback(
    (node) => {
      if (!node.children?.length) return false;
      const allChildIds = getAllDescendants(getNodeId(node));
      const total = allChildIds.length;
      const selected = allChildIds.filter((id) => checked.has(id)).length;
      return selected > 0 && selected < total;
    },
    [checked, getAllDescendants]
  );

  /* ---------------- Select All ---------------- */
  const allVehicleIds = useMemo(
    () =>
      Array.from(nodeMap.values())
        .map((v) => v.node)
        .filter((n) => !n.children?.length)
        .map(getNodeId),
    [nodeMap]
  );

  const allSelected = search.trim()
    ? visibleVehicleIds.length > 0 &&
      visibleVehicleIds.every((id) => checked.has(id))
    : allVehicleIds.length > 0 && allVehicleIds.every((id) => checked.has(id));
  const selectAll = useCallback(() => {
    setChecked((prev) => {
      const next = new Set(prev);
      const idsToSelect = search.trim() ? visibleVehicleIds : allVehicleIds;
      idsToSelect.forEach((id) => next.add(id));
      return next;
    });
  }, [allVehicleIds, visibleVehicleIds, search]);
  const clearSelection = useCallback(() => {
    setChecked((prev) => {
      if (!search.trim()) return new Set(); // clear all
      const next = new Set(prev);
      visibleVehicleIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [search, visibleVehicleIds]);
  /* ---------------- Render ---------------- */
  return (
    <>
      <div className="text-sm text-muted-foreground mb-2">
        {/* {checked.size} selected / {flatData.length} visible */}
        {checked.size} selected total / {flatData.length} visible
      </div>

      {/* Search Bar */}
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
          There is no data to show
        </div>
      ) : (
        <div
          ref={parentRef}
          className="max-h-[65vh] overflow-y-auto overflow-x-hidden rounded-lg border"
        >
          {/* Select All */}
          <label
            htmlFor="select-all"
            className="flex items-center gap-2 sticky top-0 z-30 p-3 bg-sidebar/50 backdrop-blur-md border-b border-border cursor-pointer"
          >
            <Checkbox
              checked={
                allSelected ? true : checked.size > 0 ? "indeterminate" : false
              }
              onCheckedChange={(value) => {
                if (value) selectAll();
                else clearSelection();
              }}
              id="select-all"
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </label>

          {/* Virtual list */}
          <div className="p-3">
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
                  ? getAllDescendants(nodeId).every((cid) => checked.has(cid))
                  : checked.has(nodeId);
                const isIndeterminate = getIndeterminateState(node);
                const isExpanded = expanded.has(nodeId);

                return (
                  <div
                    key={nodeId}
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
