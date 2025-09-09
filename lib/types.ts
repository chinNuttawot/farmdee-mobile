// lib/types.ts
export type JobType = "งานไร่" | "งานซ่อม";
export type StatusType = "ทั้งหมด" | "รอทำ" | "กำลังทำ" | "เสร็จ";

export type Task = {
    id: string;
    title: string;
    amount: number;
    status: StatusType;
    color: string;
    startDate: Date;
    endDate: Date;
    jobType?: JobType;
    note?: string;
    tags?: string[];
    progress?: number;
};

export type AssigneeConfig = {
    name: string;
    isDaily: boolean;     // พนักงานรายวัน?
    selected: boolean;
    useDefault: boolean;  // true = ใช้ราคาตามตั้งค่า, false = กำหนดราคาเอง
    pricePerUnit?: string; // ไม่รายวัน
    pricePerHour?: string; // ไม่รายวัน (label แสดงเป็น "ราคาซ่อม / บาท")
    pricePerDay?: string;  // รายวัน
};
