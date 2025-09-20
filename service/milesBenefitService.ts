// service/milesBenefitService.ts
export type MilesTier = {
    min: number;          // ไมล์ต่ำสุด (รวม)
    max: number;          // ไมล์สูงสุด (รวม)
    priceTHB: number;     // ราคา/ไมล์ (บาท)
  };
  
  export type MilesBenefitResponse = {
    title: string;
    notes: string[];
    oneWay: MilesTier[];
    roundTrip: MilesTier[];
  };
  
  // ✅ Mock API: ใส่ setTimeout ให้เหมือน call network จริง
  export async function fetchMilesBenefit(): Promise<MilesBenefitResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "เกณฑ์การใช้ไมล์",
          notes: [
            "ไมล์ที่สูงกว่า 500 ไมล์ ถือเป็นเที่ยวบินระยะไกล",
            "เกณฑ์นี้ใช้เฉพาะเส้นทางในประเทศ",
          ],
          oneWay: [
            { min: 4501, max: 4900, priceTHB: 5500 },
            { min: 4001, max: 4500, priceTHB: 5000 },
            { min: 3501, max: 4000, priceTHB: 4000 },
            { min: 3001, max: 3500, priceTHB: 3000 },
            { min: 0,    max: 3000, priceTHB: 1    },
          ],
          roundTrip: [
            { min: 4501, max: 4900, priceTHB: 6000 },
            { min: 4001, max: 4500, priceTHB: 5000 },
            { min: 3501, max: 4000, priceTHB: 4000 },
            { min: 3001, max: 3500, priceTHB: 3000 },
            { min: 0,    max: 3000, priceTHB: 1    },
          ],
        });
      }, 600); // ช้า 0.6s
    });
  }
  