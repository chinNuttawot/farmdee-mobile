export const money = (n?: number) =>
    (n ?? 0).toLocaleString("th-TH", { style: "currency", currency: "THB" });
