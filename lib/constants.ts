// lib/constants.ts
import { StatusType } from "./types";

export const STATUS_COLORS: Record<StatusType, string> = {
    ทั้งหมด: "#9C27B0",
    รอทำ: "#FF8F00",
    กำลังทำ: "#2962FF",
    เสร็จ: "#2E7D32",
};

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export const ASSIGNEE_OPTIONS = ["นาง A", "นาย B", "นาย C", "นาย D"];
