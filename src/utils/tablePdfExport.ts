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
  schoolLogo?: string;
  reportDate?: string;
  columns: PdfColumn[];
  rows: Record<string, any>[];
  summaryStats?: { label: string; value: string | number }[];
  signatureTitle?: string;
  showIndex?: boolean;
}

export const exportTableAsPDF = (options: PdfReportOptions) => {
  const {
    title,
    schoolName = 'โรงเรียนศึกษาพิเศษชัยนาท',
    schoolLogo,
    columns,
    rows,
    summaryStats = [],
    signatureTitle = 'พยาบาลวิชาชีพ / เจ้าหน้าที่ห้องพยาบาล',
    showIndex = true
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
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
      background: #f8fafc;
      margin: 0;
      padding: 0;
    }

    .report-wrapper {
      max-width: 1100px;
      margin: 15px auto;
      background: #fff;
      padding: 24px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }

    .header-container {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 12px;
    }

    .school-logo-img {
      height: 65px;
      max-width: 150px;
      object-fit: contain;
      margin-bottom: 6px;
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
      margin: 6px 0 0 0;
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
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background-color: #f8fafc !important;
    }

    .footer-signature {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      width: 250px;
      font-size: 12px;
    }

    .signature-line {
      border-bottom: 1px dotted #64748b;
      height: 45px;
      margin-bottom: 6px;
    }

    .no-print-bar {
      background: #ffffff;
      padding: 12px 24px;
      margin: 0 auto 10px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 99;
    }

    .btn-actions {
      display: flex;
      gap: 10px;
    }

    .btn-download {
      background: #0284c7;
      color: white;
      border: none;
      padding: 9px 18px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .btn-download:hover {
      background: #0369a1;
    }

    .btn-print {
      background: #0f766e;
      color: white;
      border: none;
      padding: 9px 18px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .btn-print:hover {
      background: #115e59;
    }

    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        background: #fff;
        padding: 0;
      }
      .report-wrapper {
        box-shadow: none;
        padding: 0;
        margin: 0;
        width: 100%;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong style="font-size: 14px; color: #0f172a;">ระบบออกรายงาน PDF (${schoolName})</strong>
      <div style="font-size: 11px; color: #64748b;">กดปุ่ม "ดาวน์โหลดไฟล์ PDF" เพื่อบันทึกไฟล์ .pdf ลงเครื่อง หรือกด "พิมพ์เอกสาร"</div>
    </div>
    <div class="btn-actions">
      <button class="btn-download" id="btn-download-pdf">
        <span>📥</span> ดาวน์โหลดไฟล์ PDF (.pdf)
      </button>
      <button class="btn-print" onclick="window.print()">
        <span>🖨️</span> พิมพ์เอกสาร (Print / Save as PDF)
      </button>
    </div>
  </div>

  <div class="report-wrapper" id="report-content">
    <div class="header-container">
      ${schoolLogo ? `<div><img src="${schoolLogo}" class="school-logo-img" alt="ตราสัญลักษณ์โรงเรียน" /></div>` : ''}
      <div class="school-name">${schoolName}</div>
      <div class="report-title">${title}</div>
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
          ${showIndex ? `<th style="width: 45px; text-align: center;">ลำดับ</th>` : ''}
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
            <td colspan="${columns.length + (showIndex ? 1 : 0)}" style="text-align: center; padding: 20px; color: #94a3b8;">
              ไม่พบข้อมูลตรงตามเงื่อนไข
            </td>
          </tr>
        ` : rows.map((row, idx) => `
          <tr>
            ${showIndex ? `<td style="text-align: center; font-weight: 600; color: #475569;">${idx + 1}</td>` : ''}
            ${columns.map(c => {
              const rawVal = row[c.key];
              const displayVal = rawVal !== undefined && rawVal !== null && rawVal !== '' 
                ? (typeof rawVal === 'string' ? rawVal.replace(/\n/g, '<br/>') : rawVal) 
                : '-';
              return `
                <td style="text-align: ${c.align || 'left'};">
                  ${displayVal}
                </td>
              `;
            }).join('')}
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
  </div>

  <script>
    // Direct PDF download via html2pdf
    document.getElementById('btn-download-pdf').addEventListener('click', function() {
      const element = document.getElementById('report-content');
      const filename = '${title.replace(/[\\/\\\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf';
      const opt = {
        margin:       [10, 8, 12, 8],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      this.innerHTML = '<span>⏳</span> กำลังจัดทำไฟล์ PDF...';
      this.disabled = true;

      html2pdf().set(opt).from(element).save().then(() => {
        this.innerHTML = '<span>✅</span> ดาวน์โหลดสำเร็จ!';
        setTimeout(() => {
          this.innerHTML = '<span>📥</span> ดาวน์โหลดไฟล์ PDF (.pdf)';
          this.disabled = false;
        }, 2500);
      }).catch(err => {
        console.error('PDF download error:', err);
        window.print();
        this.innerHTML = '<span>📥</span> ดาวน์โหลดไฟล์ PDF (.pdf)';
        this.disabled = false;
      });
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
