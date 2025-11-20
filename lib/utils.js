import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Yup from "yup";
import moment from "moment";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getLoginValidationSchema = (t) =>
  Yup.object({
    email: Yup.string().email().required(t("email_is_required_key")),
    password: Yup.string().required(t("Password_is_required_key")),
  });

export function transformVehiclesToTree(data = []) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const groups = new Map();

  for (const item of data) {
    const groupId = item.departmentId || "ungrouped";
    const groupName = item.departmentName?.trim() || "Unassigned";

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        groupId,
        label: groupName,
        status: "group",
        count: 0,
        children: [],
      });
    }

    const group = groups.get(groupId);

    group.children.push({
      ...item,
      status: "vehicle",
    });
    group.count++;
  }

  return Array.from(groups.values());
}

export const getNodeId = (node) => node.SerialNumber || node.groupId;

export function buildNodeMap(nodes = []) {
  const map = new Map();
  const stack = nodes.map((node) => ({ node, parentId: null }));

  while (stack.length) {
    const { node, parentId } = stack.pop();
    const nodeId = getNodeId(node);
    map.set(nodeId, { node, parentId });

    if (node.children?.length) {
      for (const child of node.children) {
        stack.push({ node: child, parentId: nodeId });
      }
    }
  }

  return map;
}

export function flattenTree(nodes, expanded, level = 0) {
  const result = [];
  for (const node of nodes) {
    const nodeId = getNodeId(node);
    result.push({ ...node, level });
    if (node.children && expanded.has(nodeId)) {
      result.push(...flattenTree(node.children, expanded, level + 1));
    }
  }

  return result;
}

export const isDateExpired = (info) => {
  if (!info?.RecordDateTime) return true;
  const recordDate = moment(info.RecordDateTime);
  return moment().diff(recordDate, "hours") > 24;
};

const calcTimeDiff = (date) => {
  if (!date) return 0;
  const a = new Date(moment(date).parseZone().utc());
  const b = new Date();
  const diffMs = b.getTime() - a.getTime();
  return diffMs / (1000 * 60 * 60); // convert to hours
};

export const CalcVehicleStatus = (info) => {
  if (!info) return 5;
  if (isDateExpired(info)) return 5;

  const { IsFuelCutOff, IsPowerCutOff, EngineStatus, Speed } = info;
  const duration = calcTimeDiff(info.RecordDateTime);
  // Power/Fuel checks
  if (IsFuelCutOff) return 203; // Invalid location
  if (IsPowerCutOff) return 5;

  // Engine ON
  if (EngineStatus) {
    if (Speed > 120) return 101; // Over speeding
    if (Speed > 5) return 1; // Running
    return 2; // Idling
  }

  // Engine OFF
  if (!EngineStatus) {
    // if (Speed > 0) return 300; // Moving with engine off

    if (duration > 4 && duration < 48) {
      return 204; // Sleep mode
    }

    return 0; // Stopped
  }

  return 5; // Offline
};
