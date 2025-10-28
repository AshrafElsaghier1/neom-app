import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Yup from "yup";

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

export const getNodeId = (node) => node._id || node.groupId;

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
