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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 10mm 12mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', 'Tahoma', sans-serif !important;
      letter-spacing: 0px !important;
      word-spacing: 0px !important;
    }

    body {
      font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', 'Tahoma', sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
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
      font-size: 11.5px;
      margin-bottom: 20px;
      table-layout: fixed;
    }

    th {
      background-color: #0f766e !important;
      color: #ffffff !important;
      font-weight: 600;
      text-align: left;
      padding: 8px 6px;
      border: 1px solid #0d9488;
      line-height: 1.5;
    }

    td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      word-break: break-word;
      overflow-wrap: break-word;
      line-height: 1.6;
    }

    .cell-line {
      display: block;
      margin: 0;
      padding: 1px 0;
      line-height: 1.6;
      word-break: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }

    .cell-line-empty {
      height: 6px;
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
        background: #fff !important;
        padding: 0 !important;
      }
      .report-wrapper {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong style="font-size: 14px; color: #0f172a;">ระบบออกรายงานเอกสาร (${schoolName})</strong>
      <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">
        💡 <b>คำแนะนำ:</b> แนะนำให้กดปุ่ม <b>"บันทึกเป็น PDF"</b> แล้วเลือก <i>Destination เป็น Save as PDF</i> สระและวรรณยุกต์ภาษาไทยจะคมชัด 100% ตัวหนังสือไม่ทับซ้อน
      </div>
    </div>
    <div class="btn-actions">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️</span> บันทึกเป็น PDF / พิมพ์ (แนะนำ คมชัด 100%)
      </button>
      <button class="btn-download" id="btn-download-pdf">
        <span>📥</span> ดาวน์โหลดทันที (.pdf)
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
              let cellContent = '-';
              if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                if (typeof rawVal === 'string') {
                  const lines = rawVal.split('\n');
                  cellContent = lines.map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return '<div class="cell-line-empty"></div>';
                    return `<div class="cell-line">${line}</div>`;
                  }).join('');
                } else {
                  cellContent = String(rawVal);
                }
              }
              return `
                <td style="text-align: ${c.align || 'left'};">
                  ${cellContent}
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
    // Direct PDF download via html2pdf with font loading guarantee
    document.getElementById('btn-download-pdf').addEventListener('click', async function() {
      const btn = this;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>⏳</span> กำลังเตรียมแบบอักษรและจัดทำ PDF...';
      btn.disabled = true;

      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
        await new Promise(r => setTimeout(r, 300));

        const element = document.getElementById('report-content');
        const filename = '${title.replace(/[\\/\\\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf';
        const opt = {
          margin:       [8, 8, 10, 8],
          filename:     filename,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { 
            scale: 2.2, 
            useCORS: true, 
            logging: false,
            letterRendering: false,
            scrollY: 0,
            scrollX: 0
          },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        await html2pdf().set(opt).from(element).save();
        btn.innerHTML = '<span>✅</span> ดาวน์โหลดสำเร็จ!';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 2500);
      } catch (err) {
        console.error('PDF download error:', err);
        window.print();
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// ========================================================================
// Specialized PDF Generator for Daily Medications Report (A4 Portrait)
// Matches the exact school document format:
// | ลำดับ | ชื่อ - นามสกุล | ชื่อเล่น | ชื่อยา | วิธีใช้ |
// with line-by-line alignment for multiple medications and zero font distortion.
// ========================================================================

export interface DailyMedicationPdfStudent {
  id?: string;
  studentCode?: string;
  prefix?: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  grade?: string;
  classroom?: string;
  gender?: 'ชาย' | 'หญิง' | string;
  dailyMedications: {
    id?: string;
    medicineName: string;
    dosage: string;
    timing: string;
    storage?: string;
    notes?: string;
  }[];
}

export interface DailyMedicationsPdfConfig {
  title: string; // e.g. "รายชื่อยาประจำตัวนักเรียนหอชาย"
  schoolName?: string;
  students: DailyMedicationPdfStudent[];
  emptyRowsCount?: number; // Blank rows at the bottom like in school paperwork
  showSignature?: boolean;
  signatureTitle?: string;
  reportDate?: string;
  autoPrint?: boolean;
  autoDownload?: boolean;
}

export const exportDailyMedicationsPDF = (config: DailyMedicationsPdfConfig) => {
  const {
    title = 'รายชื่อยาประจำตัวนักเรียนหอชาย',
    schoolName = 'โรงเรียนศึกษาพิเศษชัยนาท',
    students = [],
    emptyRowsCount = 4,
    showSignature = true,
    signatureTitle = 'ผู้ดูแลหอนอน / เจ้าหน้าที่ห้องพยาบาล',
    autoPrint = false,
    autoDownload = false
  } = config;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('กรุณาอนุญาตการเปิดหน้าต่างใหม่ (Pop-up) เพื่อพิมพ์หรือดาวน์โหลดเอกสาร PDF');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 10mm 12mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', 'Tahoma', sans-serif !important;
      font-size: 13px;
      line-height: 1.5;
      color: #000000;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
      letter-spacing: 0px !important;
      word-spacing: 0px !important;
    }

    .no-print-bar {
      background: #ffffff;
      padding: 14px 24px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .no-print-bar .title-box {
      display: flex;
      flex-direction: column;
    }

    .no-print-bar .title-text {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .no-print-bar .subtitle-text {
      font-size: 12px;
      color: #334155;
      margin-top: 3px;
    }

    .btn-actions {
      display: flex;
      gap: 10px;
    }

    .btn-print {
      background: #0f766e;
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }

    .btn-print:hover {
      background: #115e59;
    }

    .btn-download {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .btn-download:hover {
      background: #0369a1;
    }

    .doc-page {
      max-width: 794px; /* A4 width at 96 DPI */
      margin: 18px auto;
      background: #ffffff;
      padding: 24px 28px 30px 28px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      border-radius: 4px;
      box-sizing: border-box;
    }

    .doc-title-container {
      text-align: center;
      margin-bottom: 16px;
    }

    .doc-title {
      font-size: 18px;
      font-weight: 700;
      color: #000000;
      margin: 0;
      padding: 0;
      line-height: 1.4;
    }

    /* Strict School/Government Table Format */
    table.med-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      font-size: 12.5px;
      line-height: 1.5;
      table-layout: fixed;
    }

    table.med-table th {
      border: 1px solid #000000;
      background-color: #ffffff;
      color: #000000;
      font-weight: 700;
      padding: 6px 4px;
      text-align: center;
      vertical-align: middle;
      line-height: 1.4;
      font-size: 13px;
    }

    table.med-table td.col-idx {
      width: 6%;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: top;
      padding: 6px 4px;
      font-weight: 500;
      box-sizing: border-box;
    }

    table.med-table td.col-name {
      width: 24%;
      border: 1px solid #000000;
      vertical-align: top;
      padding: 6px 8px;
      word-break: break-word;
      box-sizing: border-box;
    }

    table.med-table td.col-class {
      width: 10%;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: top;
      padding: 6px 4px;
      word-break: break-word;
      font-weight: 500;
      box-sizing: border-box;
    }

    table.med-table td.col-nick {
      width: 10%;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: top;
      padding: 6px 4px;
      word-break: break-word;
      box-sizing: border-box;
    }

    table.med-table td.col-med-group {
      width: 50%;
      border: 1px solid #000000;
      vertical-align: top;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box;
    }

    /* Inner paired medication table for pixel-perfect line-by-line alignment */
    table.inner-med-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 0;
      padding: 0;
      table-layout: fixed;
      box-sizing: border-box;
    }

    table.inner-med-table tr:not(:last-child) td {
      border-bottom: 1px solid #000000;
    }

    table.inner-med-table td.cell-med-name {
      width: 50%;
      border-top: none;
      border-bottom: none;
      border-left: none;
      border-right: none;
      padding: 5px 7px;
      vertical-align: top;
      line-height: 1.5;
      word-break: break-word;
      font-size: 12px;
      box-sizing: border-box;
    }

    table.inner-med-table td.cell-med-usage {
      width: 50%;
      border-top: none;
      border-bottom: none;
      border-right: none;
      border-left: 1px solid #000000;
      padding: 5px 7px;
      vertical-align: top;
      line-height: 1.5;
      word-break: break-word;
      font-size: 12px;
      box-sizing: border-box;
    }

    /* Empty rows for manual handwritten notes at the end */
    table.med-table tr.empty-row td {
      border: 1px solid #000000;
      height: 28px;
      padding: 3px;
    }

    .signature-area {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }

    .signature-card {
      text-align: center;
      width: 270px;
      font-size: 12.5px;
      line-height: 1.6;
    }

    .sig-dots {
      border-bottom: 1px dotted #475569;
      height: 38px;
      margin-bottom: 6px;
    }

    /* Browser Print Mode: clean 100% white background, no grey blocks */
    @media print {
      .no-print-bar, #export-status-banner {
        display: none !important;
      }
      html, body {
        background: #ffffff !important;
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .doc-page {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      table.med-table {
        page-break-inside: auto;
        width: 100% !important;
      }
      table.med-table thead {
        display: table-header-group !important; /* Repeats table header on every page */
      }
      table.med-table tr {
        page-break-inside: avoid !important;
      }
    }

    /* Dedicated clean styling active strictly while saving PDF */
    body.is-exporting-pdf {
      background: #ffffff !important;
      background-color: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body.is-exporting-pdf .no-print-bar,
    body.is-exporting-pdf #export-status-banner {
      display: none !important;
    }

    body.is-exporting-pdf .doc-page {
      box-shadow: none !important;
      padding: 0 4px !important;
      margin: 0 !important;
      width: 680px !important;
      max-width: 680px !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div class="title-box">
      <span class="title-text">📄 ${title}</span>
      <span class="subtitle-text">
        💡 <b>เคล็ดลับ:</b> ทั้งปุ่มดาวน์โหลดไฟล์ .pdf โดยตรง และปุ่มบันทึกเป็น PDF ถูกปรับแต่งให้พอดีหน้ากระดาษ A4 สระภาษาไทยคมชัด 100% ไม่ตกขอบ
      </span>
    </div>
    <div class="btn-actions">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️</span> บันทึกเป็น PDF / พิมพ์
      </button>
      <button class="btn-download" id="btn-download-pdf">
        <span>📥</span> ดาวน์โหลดไฟล์ .pdf โดยตรง
      </button>
    </div>
  </div>

  <div id="export-status-banner" style="display: none; padding: 10px 18px; margin: 12px auto; max-width: 794px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center;"></div>

  <div class="doc-page" id="report-content">
    <div class="doc-title-container">
      <h1 class="doc-title">${title}</h1>
    </div>

    <table class="med-table">
      <thead>
        <tr>
          <th style="width: 6%;">ลำดับ</th>
          <th style="width: 24%;">ชื่อ - นามสกุล</th>
          <th style="width: 10%;">ระดับชั้น</th>
          <th style="width: 10%;">ชื่อเล่น</th>
          <th style="width: 25%;">ชื่อยา</th>
          <th style="width: 25%;">วิธีใช้</th>
        </tr>
      </thead>
      <tbody>
        ${students.length === 0 ? `
          <tr>
            <td colspan="6" style="border: 1px solid #000; text-align: center; padding: 25px; color: #64748b;">
              ไม่พบข้อมูลนักเรียนที่กินยาประจำตัว
            </td>
          </tr>
        ` : students.map((student, sIdx) => {
          const fullName = `${student.prefix || ''}${student.firstName} ${student.lastName}`.trim();
          const nickname = student.nickname || '-';
          const gradeClass = student.classroom || student.grade || '-';
          const meds = student.dailyMedications || [];

          if (meds.length === 0) {
            return `
              <tr>
                <td class="col-idx">${sIdx + 1}</td>
                <td class="col-name">${fullName}</td>
                <td class="col-class">${gradeClass}</td>
                <td class="col-nick">${nickname}</td>
                <td style="border: 1px solid #000; text-align: center; padding: 6px;">-</td>
                <td style="border: 1px solid #000; text-align: center; padding: 6px;">-</td>
              </tr>
            `;
          }

          // Each medication is aligned on its exact horizontal row with its corresponding dosage and timing
          return `
            <tr>
              <td class="col-idx">${sIdx + 1}</td>
              <td class="col-name">${fullName}</td>
              <td class="col-class">${gradeClass}</td>
              <td class="col-nick">${nickname}</td>
              <td class="col-med-group" colspan="2">
                <table class="inner-med-table">
                  <tbody>
                    ${meds.map((m) => {
                      const usageParts = [m.dosage, m.timing].filter(Boolean);
                      let usageText = usageParts.join(' ');
                      if (m.notes) {
                        usageText += ` (${m.notes})`;
                      }

                      return `
                        <tr>
                          <td class="cell-med-name">
                            ${m.medicineName}
                          </td>
                          <td class="cell-med-usage">
                            ${usageText || '-'}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </td>
            </tr>
          `;
        }).join('')}

        ${emptyRowsCount > 0 ? Array.from({ length: emptyRowsCount }).map(() => `
          <tr class="empty-row">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `).join('') : ''}
      </tbody>
    </table>

    ${showSignature ? `
    <div class="signature-area">
      <div class="signature-card">
        <div class="sig-dots"></div>
        <div>(...............................................................)</div>
        <div style="margin-top: 4px; font-weight: 500;">${signatureTitle}</div>
        <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">
          ${schoolName}
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <script>
    async function executeDirectPdfDownload(isAuto) {
      const btn = document.getElementById('btn-download-pdf');
      const originalText = btn ? btn.innerHTML : '';
      if (btn) {
        btn.innerHTML = '<span>⏳</span> กำลังจัดหน้ากระดาษ A4 และสร้าง PDF...';
        btn.disabled = true;
      }

      const statusBox = document.getElementById('export-status-banner');
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = '#e0f2fe';
        statusBox.style.color = '#0369a1';
        statusBox.style.border = '1px solid #7dd3fc';
        statusBox.innerHTML = '⏳ <b>กำลังจัดระยะขอบและสร้างไฟล์ PDF...</b> ระบบกำลังปรับขนาดตารางให้พอดีหน้ากระดาษ A4 ไม่หลุดกรอบ';
      }

      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
        await new Promise(r => setTimeout(r, 400));

        // Always scroll to top to prevent scroll offsets in canvas render
        window.scrollTo(0, 0);

        // Apply clean export mode: 750px fixed width, 0 margin, 0 padding, no shadow
        document.body.classList.add('is-exporting-pdf');
        await new Promise(r => setTimeout(r, 150));

        const element = document.getElementById('report-content');
        if (!element) return;

        const filename = '${title.replace(/[\\/\\\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf';
        
        // Exact 10mm margins on A4 portrait
        // Page width: 210mm. 10mm left + 10mm right = 190mm printable width.
        // The 750px container fits 190mm with zero clipping and zero overflow.
        const opt = {
          margin:       [10, 10, 12, 10], // [top, left, bottom, right] in mm
          filename:     filename,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { 
            scale: 2.5, 
            useCORS: true, 
            logging: false,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff'
          },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(opt).from(element).save();

        if (btn) {
          btn.innerHTML = '<span>✅</span> ดาวน์โหลด PDF เรียบร้อย!';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 3500);
        }

        if (statusBox) {
          statusBox.style.background = '#dcfce7';
          statusBox.style.color = '#15803d';
          statusBox.style.border = '1px solid #86efac';
          statusBox.innerHTML = '✅ <b>ดาวน์โหลดไฟล์ PDF สำเร็จแล้ว!</b> ตารางพอดีหน้ากระดาษ A4 สวยงาม ไม่หลุดกรอบ';
          setTimeout(() => {
            statusBox.style.display = 'none';
          }, 4500);
        }
      } catch (err) {
        console.error('PDF export error:', err);
        if (btn) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
        if (statusBox) {
          statusBox.style.background = '#fee2e2';
          statusBox.style.color = '#b91c1c';
          statusBox.style.border = '1px solid #fca5a5';
          statusBox.innerHTML = '⚠️ เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กำลังเปิดหน้าต่างพิมพ์ให้แทน...';
        }
        window.print();
      } finally {
        document.body.classList.remove('is-exporting-pdf');
      }
    }

    // Manual click on Download PDF
    document.getElementById('btn-download-pdf').addEventListener('click', function() {
      executeDirectPdfDownload(false);
    });

    // Auto download if requested
    ${autoDownload ? `
      window.addEventListener('load', async () => {
        if (document.fonts) {
          await document.fonts.ready;
        }
        setTimeout(() => {
          executeDirectPdfDownload(true);
        }, 500);
      });
    ` : ''}

    // Auto print trigger if requested
    ${autoPrint ? `
      window.addEventListener('load', async () => {
        if (document.fonts) {
          await document.fonts.ready;
        }
        setTimeout(() => {
          window.print();
        }, 500);
      });
    ` : ''}
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

