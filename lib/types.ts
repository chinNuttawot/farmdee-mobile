// lib/types.ts
export type JobType = "งานไร่" | "งานซ่อม";
export type StatusType = "ทั้งหมด" | "Pending" | "InProgress" | "Done";

export type Task = {
    id: string;
    title: string;
    total_amount: number;
    status: StatusType;
    color: string;
    jobType?: JobType;
    note?: string;
    tags?: string[];
    progress?: number;
    start_date?: string;
    end_date?: string;
    job_type?: string;
};

export type AssigneeConfig = {
    name: string;
    username?: string;
    pay_type?: string;
    useDefault: boolean;  // true = ใช้ราคาตามตั้งค่า, false = กำหนดราคาเอง
    ratePerRai?: string; // ไม่รายวัน
    repairRate?: string; // ไม่รายวัน (label แสดงเป็น "ราคาซ่อม / บาท")
    dailyRate?: string;  // รายวัน
    rate_per_rai?: string;
    repair_rate?: string;
    daily_rate?: string;
    isDaily?: boolean;
    selected?: boolean;
};