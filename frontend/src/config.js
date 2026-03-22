/**
 * จุดเดียวสำหรับ React —  override ด้วย .env (REACT_APP_*)
 */
export const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export const MAIN_APP_URL =
  process.env.REACT_APP_MAIN_URL || "http://localhost:3001/";

export const ADMIN_URL =
  process.env.REACT_APP_ADMIN_URL || "http://localhost:3001/admin.html";
