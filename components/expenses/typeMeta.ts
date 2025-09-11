// components/expenses/typeMeta.ts
export type ExpenseType = "labor" | "material" | "fuel" | "other";

export type Expense = {
    id: string;
    title: string;
    amount: number;
    type: ExpenseType;
    jobNote?: string;
    qtyNote?: string;
    workDate?: string;
};

export const typeMeta: Record<
    ExpenseType,
    { label: string; color: string; icon: string }
> = {
    labor: { label: "ค่าแรง", color: "#2E7D32", icon: "account-hard-hat" },
    material: { label: "ค่าวัสดุ", color: "#F57C00", icon: "seed-outline" },
    fuel: { label: "ค่าน้ำมัน", color: "#1976D2", icon: "gas-station-outline" },
    other: { label: "ค่าอื่นๆ", color: "#6D4C41", icon: "tools" },
};
