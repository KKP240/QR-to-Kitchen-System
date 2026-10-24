const prefix = process.env.TABLE_PREFIX ?? "qrk-";

export const TABLES = {
  menu: `${prefix}Menu`,
  orders: `${prefix}Orders`,
  tables: `${prefix}Tables`,
  connections: `${prefix}Connections`, // เก็บ WebSocket connection ของจอครัว
  users: `${prefix}Users`,
} as const;