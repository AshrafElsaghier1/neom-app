// "use client";
// import React, {
//   useState,
//   useEffect,
//   useMemo,
//   useRef,
//   useCallback,
// } from "react";
// import { useVirtualizer } from "@tanstack/react-virtual";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useVehicleStore } from "@/store/useVehicleStore";
// import VirtualTreeItem from "./VirtualTreeItem";
// import {
//   buildNodeMap,
//   flattenTree,
//   getNodeId,
//   transformVehiclesToTree,
// } from "@/lib/utils";
// import { Input } from "@/components/ui/input";
// import { Search } from "lucide-react";

// export default function VehicleTree({ statusFilter }) {
//   const [treeData, setTreeData] = useState([]);
//   const [checked, setChecked] = useState(new Set());
//   const [expanded, setExpanded] = useState(new Set());
//   const [userCollapsed, setUserCollapsed] = useState(new Set());
//   const [search, setSearch] = useState("");
//   const [nodeMap, setNodeMap] = useState(new Map());

//   const { fetchVehicles, closeSocket, vehicles, loading } = useVehicleStore();

//   useEffect(() => {
//     fetchVehicles(true);
//     return () => closeSocket();
//   }, []);

//   // 🟡 Apply status filter here
//   useEffect(() => {
//     if (vehicles?.length) {
//       let filteredVehicles = vehicles;
//       if (statusFilter && statusFilter !== "all") {
//         filteredVehicles = vehicles.filter(
//           (v) => v.vehStatusCode == statusFilter
//         );
//       }
//       const tree = transformVehiclesToTree(filteredVehicles);

//       setTreeData(tree);
//       setNodeMap(buildNodeMap(tree));
//     }
//   }, [vehicles, statusFilter]);

//   /* ---------------- Search Filter ---------------- */
//   const { filteredTree, allGroupIds } = useMemo(() => {
//     if (!treeData.length) return { filteredTree: [], allGroupIds: new Set() };
//     const searchTerm = search.trim().toLowerCase();
//     if (!searchTerm) return { filteredTree: treeData, allGroupIds: new Set() };

//     const filterTree = (nodes) =>
//       nodes
//         .map((node) => {
//           const vehicle = node.originalData || node;
//           const make = vehicle.make?.toLowerCase() || "";
//           const serial = vehicle.SerialNumber?.toLowerCase() || "";
//           const isMatch =
//             node.label?.toLowerCase().includes(searchTerm) ||
//             make.includes(searchTerm) ||
//             serial.includes(searchTerm);

//           if (node.children?.length) {
//             const children = filterTree(node.children);
//             return isMatch || children.length
//               ? { ...node, children, count: children.length }
//               : null;
//           }
//           return isMatch ? node : null;
//         })
//         .filter(Boolean);

//     const ft = filterTree(treeData);
//     const groupIds = new Set();
//     const collect = (nodes) => {
//       for (const n of nodes) {
//         if (n.children?.length) {
//           groupIds.add(getNodeId(n));
//           collect(n.children);
//         }
//       }
//     };
//     collect(ft);
//     return { filteredTree: ft, allGroupIds: groupIds };
//   }, [treeData, search]);

//   /* ---------------- Expand groups for search results ---------------- */
//   useEffect(() => {
//     if (!search.trim() || !allGroupIds.size) return;
//     setExpanded((prev) => {
//       const next = new Set(prev);
//       for (const id of allGroupIds) {
//         if (!userCollapsed.has(id)) next.add(id);
//       }
//       return next;
//     });
//   }, [allGroupIds, search, userCollapsed]);

//   /* ---------------- Flatten visible data ---------------- */
//   const flatData = useMemo(() => {
//     if (!treeData.length) return [];
//     if (!search.trim()) return flattenTree(treeData, expanded);
//     return flattenTree(filteredTree, expanded);
//   }, [treeData, expanded, search, filteredTree]);

//   const visibleVehicleIds = flatData
//     .filter((n) => !n.children?.length)
//     .map(getNodeId);

//   /* ---------------- Virtualizer ---------------- */
//   const parentRef = useRef(null);
//   const virtualizer = useVirtualizer({
//     count: flatData.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => 55,
//     overscan: 15,
//   });

//   /* ---------------- Expand / Collapse ---------------- */
//   const toggleExpand = useCallback((id) => {
//     setExpanded((prev) => {
//       const next = new Set(prev);
//       const wasOpen = next.has(id);
//       if (wasOpen) {
//         next.delete(id);
//         setUserCollapsed((p) => new Set(p).add(id));
//       } else {
//         next.add(id);
//         setUserCollapsed((p) => {
//           const n = new Set(p);
//           n.delete(id);
//           return n;
//         });
//       }
//       return next;
//     });
//   }, []);

//   /* ---------------- Checkbox Logic ---------------- */
//   const getAllDescendants = useCallback(
//     (id) => {
//       const node = nodeMap.get(id)?.node;
//       if (!node?.children?.length) return [];
//       const result = [];
//       const stack = [...node.children];
//       while (stack.length) {
//         const child = stack.pop();
//         const childId = getNodeId(child);
//         result.push(childId);
//         if (child.children?.length) stack.push(...child.children);
//       }
//       return result;
//     },
//     [nodeMap]
//   );

//   const toggleCheck = useCallback(
//     (id, isChecked) => {
//       const node = nodeMap.get(id)?.node;
//       if (!node) return;
//       const newChecked = new Set(checked);

//       const getVisibleDescendants = (node) => {
//         const result = [];
//         const stack = [...(node.children || [])];
//         while (stack.length) {
//           const child = stack.pop();
//           const childId = getNodeId(child);
//           if (!search.trim() || visibleVehicleIds.includes(childId))
//             result.push(childId);
//           if (child.children?.length) stack.push(...child.children);
//         }
//         return result;
//       };

//       if (node.children?.length) {
//         const targetIds = getVisibleDescendants(node);
//         targetIds.forEach((cid) =>
//           isChecked ? newChecked.add(cid) : newChecked.delete(cid)
//         );
//       } else {
//         isChecked ? newChecked.add(id) : newChecked.delete(id);
//       }
//       setChecked(newChecked);
//     },
//     [checked, nodeMap, search, visibleVehicleIds]
//   );

//   const getIndeterminateState = useCallback(
//     (node) => {
//       if (!node.children?.length) return false;
//       const allIds = getAllDescendants(getNodeId(node));
//       const total = allIds.length;
//       const selected = allIds.filter((id) => checked.has(id)).length;
//       return selected > 0 && selected < total;
//     },
//     [checked, getAllDescendants]
//   );

//   /* ---------------- Select All ---------------- */
//   const allVehicleIds = useMemo(
//     () =>
//       Array.from(nodeMap.values())
//         .map((v) => v.node)
//         .filter((n) => !n.children?.length)
//         .map(getNodeId),
//     [nodeMap]
//   );

//   const allSelected = search.trim()
//     ? visibleVehicleIds.length > 0 &&
//       visibleVehicleIds.every((id) => checked.has(id))
//     : allVehicleIds.length > 0 && allVehicleIds.every((id) => checked.has(id));

//   const selectAll = useCallback(() => {
//     setChecked((prev) => {
//       const next = new Set(prev);
//       const ids = search.trim() ? visibleVehicleIds : allVehicleIds;
//       ids.forEach((id) => next.add(id));
//       return next;
//     });
//   }, [allVehicleIds, visibleVehicleIds, search]);

//   const clearSelection = useCallback(() => {
//     setChecked((prev) => {
//       if (!search.trim()) return new Set();
//       const next = new Set(prev);
//       visibleVehicleIds.forEach((id) => next.delete(id));
//       return next;
//     });
//   }, [search, visibleVehicleIds]);

//   /* ---------------- Render ---------------- */
//   return (
//     <>
//       <div className="text-sm text-muted-foreground mb-2">
//         {checked.size} selected total / {flatData.length} visible
//       </div>

//       <div className="relative w-full my-3">
//         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
//         <Input
//           type="text"
//           placeholder="Search..."
//           className="pl-9"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {loading ? (
//         <div className="p-4 text-muted-foreground text-center">
//           Loading vehicles...
//         </div>
//       ) : !flatData.length ? (
//         <div className="p-4 text-muted-foreground text-center">
//           No data to show
//         </div>
//       ) : (
//         <div
//           ref={parentRef}
//           className="max-h-[65vh] overflow-y-auto overflow-x-hidden rounded-lg border"
//         >
//           <label
//             htmlFor="select-all"
//             className="flex items-center gap-2 sticky top-0 z-30 p-3 bg-sidebar/50 backdrop-blur-md border-b border-border cursor-pointer"
//           >
//             <Checkbox
//               checked={
//                 allSelected ? true : checked.size > 0 ? "indeterminate" : false
//               }
//               onCheckedChange={(value) =>
//                 value ? selectAll() : clearSelection()
//               }
//               id="select-all"
//             />
//             <span className="text-sm text-muted-foreground">Select All</span>
//           </label>

//           <div className="p-3 relative">
//             <div
//               style={{
//                 height: `${virtualizer.getTotalSize()}px`,
//                 position: "relative",
//                 width: "100%",
//               }}
//             >
//               {virtualizer.getVirtualItems().map((v) => {
//                 const node = flatData[v.index];
//                 const nodeId = getNodeId(node);
//                 const isChecked = node.children?.length
//                   ? getAllDescendants(nodeId).every((cid) => checked.has(cid))
//                   : checked.has(nodeId);
//                 const isIndeterminate = getIndeterminateState(node);
//                 const isExpanded = expanded.has(nodeId);

//                 return (
//                   <div
//                     key={nodeId}
//                     style={{
//                       height: `${v.size}px`,
//                       transform: `translateY(${v.start}px)`,
//                     }}
//                     className="absolute top-0 left-0 w-full"
//                   >
//                     <VirtualTreeItem
//                       node={node}
//                       isChecked={isChecked}
//                       isExpanded={isExpanded}
//                       isIndeterminate={isIndeterminate}
//                       onToggleCheck={toggleCheck}
//                       onToggleExpand={toggleExpand}
//                     />
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
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
  const [nodeMap, setNodeMap] = useState(new Map());

  const {
    fetchVehicles,
    closeSocket,
    vehicles: vehicleMap,
    loading,
  } = useVehicleStore();

  // ---------------- Fetch vehicles ----------------
  useEffect(() => {
    fetchVehicles(true);
    return () => closeSocket();
  }, []);

  // ---------------- Build tree from vehicles ----------------
  useEffect(() => {
    const vehiclesArray = Array.from(vehicleMap.values());
    const tree = transformVehiclesToTree(vehiclesArray);
    setTreeData(tree);
    setNodeMap(buildNodeMap(tree));
  }, [vehicleMap]);

  // ---------------- Filter Tree ----------------
  const filterTree = useCallback((nodes, searchTerm, status) => {
    if (!nodes?.length) return [];

    const term = searchTerm?.trim().toLowerCase();

    return nodes
      .map((node) => {
        const vehicle = node.originalData || node;
        let match = true;

        // Status filter
        if (status && status !== "all") {
          match = vehicle.vehStatusCode === status;
        }

        // Search filter
        if (term) {
          const label = node.label?.toLowerCase() || "";
          const make = vehicle.make?.toLowerCase() || "";
          const serial = vehicle.SerialNumber?.toLowerCase() || "";
          match =
            match &&
            (label.includes(term) ||
              make.includes(term) ||
              serial.includes(term));
        }

        // Recurse into children
        const children = node.children?.length
          ? filterTree(node.children, searchTerm, status)
          : [];

        // Include node if match or has matching children
        if (match || children.length)
          return { ...node, children, count: children.length };
        return null;
      })
      .filter(Boolean);
  }, []);

  // ---------------- Filtered Tree ----------------
  const filteredTree = useMemo(
    () => filterTree(treeData, search, statusFilter),
    [treeData, search, statusFilter, filterTree]
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

  // ---------------- Visible vehicle IDs ----------------
  const visibleVehicleIds = useMemo(
    () => flatData.filter((n) => !n.children?.length).map(getNodeId),
    [flatData]
  );

  // ---------------- Virtualizer ----------------
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

  // ---------------- Checkbox Logic ----------------
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

      const getVisibleDescendants = (node) => {
        const result = [];
        const stack = [...(node.children || [])];
        while (stack.length) {
          const child = stack.pop();
          const childId = getNodeId(child);
          if (!search.trim() || visibleVehicleIds.includes(childId))
            result.push(childId);
          if (child.children?.length) stack.push(...child.children);
        }
        return result;
      };

      if (node.children?.length) {
        const targetIds = getVisibleDescendants(node);
        targetIds.forEach((cid) =>
          isChecked ? newChecked.add(cid) : newChecked.delete(cid)
        );
      } else {
        isChecked ? newChecked.add(id) : newChecked.delete(id);
      }

      setChecked(newChecked);
    },
    [checked, nodeMap, search, visibleVehicleIds]
  );

  const getIndeterminateState = useCallback(
    (node) => {
      if (!node.children?.length) return false;
      const allIds = getAllDescendants(getNodeId(node));
      const selectedCount = allIds.filter((id) => checked.has(id)).length;
      return selectedCount > 0 && selectedCount < allIds.length;
    },
    [checked, getAllDescendants]
  );

  // ---------------- Select All / Clear ----------------
  const allVehicleIds = useMemo(
    () =>
      Array.from(nodeMap.values())
        .map((v) => v.node)
        .filter((n) => !n.children?.length)
        .map(getNodeId),
    [nodeMap]
  );

  const allSelected = useMemo(() => {
    const ids = search.trim() ? visibleVehicleIds : allVehicleIds;
    return ids.length > 0 && ids.every((id) => checked.has(id));
  }, [checked, visibleVehicleIds, allVehicleIds, search]);

  const selectAll = useCallback(() => {
    setChecked((prev) => {
      const next = new Set(prev);
      const ids = search.trim() ? visibleVehicleIds : allVehicleIds;
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, [visibleVehicleIds, allVehicleIds, search]);

  const clearSelection = useCallback(() => {
    setChecked((prev) => {
      const next = new Set(prev);
      const ids = search.trim() ? visibleVehicleIds : allVehicleIds;
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, [visibleVehicleIds, allVehicleIds, search]);

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
