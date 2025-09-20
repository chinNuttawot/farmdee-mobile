// lib/constants.ts
import { userService } from "@/service";
import { StatusType } from "./types";

export const STATUS_COLORS: Record<StatusType, string> = {
    ทั้งหมด: "#9C27B0",
    Pending: "#FF8F00",
    InProgress: "#2962FF",
    Done: "#2E7D32",
};

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
