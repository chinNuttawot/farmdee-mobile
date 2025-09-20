import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { money } from './currency';

export async function makeInvoicePDF({ invoiceNo, clientName, items, subtotal, tax, total }: any) {
  const html = `
  <html><head><meta charset='utf-8' /><style>
  body{font-family:-apple-system, Roboto, Arial; padding:24px}
  h1{font-size:20px} table{width:100%; border-collapse:collapse}
  th,td{border:1px solid #ddd; padding:8px; text-align:left}
  .right{text-align:right}
  </style></head>
  <body>
    <h1>ใบแจ้งหนี้ #${invoiceNo}</h1>
    <p>ลูกค้า: ${clientName}</p>
    <table>
      <thead><tr><th>รายการ</th><th class="right">ราคา</th></tr></thead>
      <tbody>
        ${items.map((it: any) => `<tr><td>${it.label}</td><td class="right">${money(it.total_amount)}</td></tr>`).join('')}
      </tbody>
      <tfoot>
        <tr><td class="right">Subtotal</td><td class="right">${money(subtotal)}</td></tr>
        <tr><td class="right">VAT</td><td class="right">${money(tax)}</td></tr>
        <tr><td class="right"><b>Total</b></td><td class="right"><b>${money(total)}</b></td></tr>
      </tfoot>
    </table>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  const dest = FileSystem.documentDirectory + `invoice_${invoiceNo}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: dest });
  return dest;
}
