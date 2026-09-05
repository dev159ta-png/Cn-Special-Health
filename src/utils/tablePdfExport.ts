// Utility for generating and printing/saving Table Reports as PDF with full Thai typography support

export interface PdfColumn {
  header: string;
  key: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  schoolName?: string;
  reportDate?: string;
  columns: PdfColumn[];
  rows: Record<string, any>[];
  summaryStats?: { label: string; value: string | number }[];
  signatureTitle?: string;
}

export const exportTableAsPDF = (options: PdfReportOptions) => {
  const {
    title,
    subtitle = 'ระบบบริหารจัดการห้องพยาบาลโรงเรียนสำหรับนักเรียนพิการ',
    schoolName = 'ศูนย์การศึกษาพิเศษ ประจำจังหวัดชัยนาท',
    reportDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    columns,
    rows,
    summaryStats = [],
    signatureTitle = 'พยาบาลวิชาชีพ / เจ้าหน้าที่ห้องพยาบาล'
  } = options;

  // Build full HTML printable document with proper Thai fonts, table border, headers, page breaks
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาตการเปิดหน้าต่างใหม่ (Pop-up) เพื่อดาวน์โหลด/พิมพ์เอกสาร PDF');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${schoolName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    
    @page {
      size: A4 landscape;
      margin: 12mm 10mm 15mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
      font-size: 13px;
      line-height: 1.4;
      color: #1e293b;
      background: #fff;
      margin: 0;
      padding: 15px;
    }

    .header-container {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 12px;
    }

    .school-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f766e;
      margin: 0;
    }

    .report-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 4px 0;
    }

    .report-meta {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }

    .stats-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 11px;
    }

    .stat-item {
      display: flex;
      gap: 4px;
    }

    .stat-label {
      color: #64748b;
    }

    .stat-value {
      font-weight: 700;
      color: #0f172a;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 20px;
    }

    th {
      background-color: #0f766e !important;
      color: #ffffff !important;
      font-weight: 600;
      text-align: left;
      padding: 8px 6px;
      border: 1px solid #0d9488;
    }

    td {
      padding: 6px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background-color: #f8fafc !important;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .badge-rose {
      background: #ffe4e6 !important;
      color: #9f1239 !important;
      border: 1px solid #fecdd3;
    }

    .badge-amber {
      background: #fef3c7 !important;
      color: #92400e !important;
      border: 1px solid #fde68a;
    }

    .badge-emerald {
      background: #d1fae5 !important;
      color: #065f46 !important;
      border: 1px solid #a7f3d0;
    }

    .badge-purple {
      background: #f3e8ff !important;
      color: #6b21a8 !important;
      border: 1px solid #e9d5ff;
    }

    .footer-signature {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      width: 240px;
      font-size: 12px;
    }

    .signature-line {
      border-bottom: 1px dotted #64748b;
      height: 45px;
      margin-bottom: 6px;
    }

    .no-print-bar {
      background: #f1f5f9;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #cbd5e1;
    }

    .btn-print {
      background: #0f766e;
      color: white;
      border: none;
      padding: 8px 16px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-print:hover {
      background: #115e59;
    }

    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>ตัวอย่างเอกสารรายงานสำหรับบันทึกเป็น PDF หรือสั่งพิมพ์</strong>
      <div style="font-size: 11px; color: #64748b;">กดปุ่ม "พิมพ์ / บันทึกเป็น PDF" ด้านขวา หรือใช้คำสั่งลัด Ctrl+P (Cmd+P) แล้วเลือก Destination เป็น "Save as PDF"</div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF (Save as PDF)</button>
  </div>

  <div class="header-container">
    <div class="school-name">${schoolName}</div>
    <div class="report-title">${title}</div>
    <div class="report-meta">${subtitle} | ข้อมูล ณ วันที่ ${reportDate} | รวมทั้งสิ้น ${rows.length} รายการ</div>
  </div>

  ${summaryStats.length > 0 ? `
  <div class="stats-bar">
    ${summaryStats.map(s => `
      <div class="stat-item">
        <span class="stat-label">${s.label}:</span>
        <span class="stat-value">${s.value}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">ลำดับ</th>
        ${columns.map(c => `
          <th style="${c.width ? `width: ${c.width};` : ''} text-align: ${c.align || 'left'};">
            ${c.header}
          </th>
        `).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.length === 0 ? `
        <tr>
          <td colspan="${columns.length + 1}" style="text-align: center; padding: 20px; color: #94a3b8;">
            ไม่พบข้อมูลตรงตามเงื่อนไข
          </td>
        </tr>
      ` : rows.map((row, idx) => `
        <tr>
          <td style="text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
          ${columns.map(c => `
            <td style="text-align: ${c.align || 'left'};">
              ${row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : '-'}
            </td>
          `).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-signature">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div>(...............................................................)</div>
      <div style="margin-top: 3px; font-weight: 500;">${signatureTitle}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">ผู้รับรองและจัดทำรายงาน</div>
    </div>
  </div>

  <script>
    // Auto trigger print dialog after page renders
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
