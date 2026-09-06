// Utility for generating and printing/saving Table Reports as PDF with full Thai typography support

/**
 * Preserves authentic Thai text without injecting artificial zero-width spaces
 * that can disrupt font ligature shaping and combining marks (vowels/tones).
 * Word breaking is handled natively via CSS (word-break: break-word, overflow-wrap: break-word).
 */
export function formatThaiWordBreaks(str: string): string {
  if (!str) return '';
  return str;
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 10mm 12mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body, table, th, td, div, p, span, h1, h2, h3 {
      font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', 'Tahoma', sans-serif !important;
    }

    body {
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
      max-width: 1060px;
      margin: 15px auto;
      background: #fff;
      padding: 24px 28px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      box-sizing: border-box;
    }

    body.is-exporting-pdf {
      background: #ffffff !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    body.is-exporting-pdf .report-wrapper {
      width: 1040px !important;
      max-width: 1040px !important;
      margin: 0 !important;
      padding: 8px 12px !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      border: none !important;
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

    :root {
      --report-table-fz: 14px;
      --report-th-fz: 14.5px;
      --report-line-height: 1.55;
    }

    .school-name {
      font-size: 22px;
      font-weight: 700;
      color: #0f766e;
      margin: 0;
    }

    .report-title {
      font-size: 18.5px;
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
      padding: 9px 14px;
      margin-bottom: 14px;
      font-size: 13px;
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
      font-size: var(--report-table-fz, 14px);
      margin-bottom: 20px;
      table-layout: fixed;
      box-sizing: border-box;
    }

    th {
      background-color: #0f766e !important;
      color: #ffffff !important;
      font-weight: 700;
      text-align: left;
      padding: 9px 8px;
      border: 1px solid #0d9488;
      line-height: 1.4;
      font-size: var(--report-th-fz, 14.5px);
      box-sizing: border-box;
    }

    td {
      padding: 7px 9px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      word-wrap: break-word !important;
      white-space: normal !important;
      line-height: var(--report-line-height, 1.55);
      font-size: var(--report-table-fz, 14px);
      box-sizing: border-box;
      max-width: 100%;
    }

    .cell-line {
      display: block;
      margin: 0;
      padding: 1px 0;
      line-height: var(--report-line-height, 1.55);
      font-size: var(--report-table-fz, 14px);
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      word-wrap: break-word !important;
      white-space: normal !important;
    }

    .cell-line-empty {
      height: 6px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc !important;
    }

    .footer-signature {
      margin-top: 25px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      width: 280px;
      font-size: 13.5px;
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
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
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

    #export-status-banner {
      display: none;
      max-width: 1060px;
      margin: 10px auto;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      text-align: center;
    }

    @media print {
      .no-print-bar, #export-status-banner {
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

    /* Clean styling applied strictly while generating PDF */
    body.is-exporting-pdf {
      background: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    body.is-exporting-pdf .no-print-bar,
    body.is-exporting-pdf #export-status-banner {
      display: none !important;
    }
    body.is-exporting-pdf .report-wrapper {
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 1040px !important;
      max-width: 1040px !important;
      background: #ffffff !important;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong style="font-size: 14px; color: #0f172a;">ระบบออกรายงานเอกสาร (${schoolName})</strong>
      <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">
        💡 <b>คำแนะนำ:</b> สามารถกด <b>"ดาวน์โหลดทันที (.pdf)"</b> หรือกด <b>"บันทึกเป็น PDF / พิมพ์"</b> (เลือก Destination: Save as PDF) เพื่อความคมชัด 100%
      </div>
    </div>
    <div class="btn-actions" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <div class="fs-control-group" style="display: flex; align-items: center; gap: 4px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 8px;">
        <span style="font-size: 12.5px; font-weight: 600; color: #334155; margin-right: 2px;">🔍 ขนาดตัวอักษร:</span>
        <button type="button" class="btn-fs" id="fs-normal" onclick="setFontSizeLevel('normal')" style="padding: 5px 10px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500; color: #475569;">ปกติ (12px)</button>
        <button type="button" class="btn-fs active" id="fs-large" onclick="setFontSizeLevel('large')" style="padding: 5px 10px; border: 1.5px solid #0f766e; background: #0f766e; color: #ffffff; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 700;">ใหญ่ (14px) ★</button>
        <button type="button" class="btn-fs" id="fs-xlarge" onclick="setFontSizeLevel('xlarge')" style="padding: 5px 10px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500; color: #475569;">ใหญ่พิเศษ (16px)</button>
      </div>
      <button class="btn-print" onclick="window.print()">
        <span>🖨️</span> บันทึกเป็น PDF / พิมพ์ (แนะนำ คมชัด 100%)
      </button>
      <button class="btn-download" id="btn-download-pdf">
        <span>📥</span> ดาวน์โหลดทันที (.pdf)
      </button>
    </div>
  </div>

  <div id="export-status-banner"></div>

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
          ${showIndex ? `<th style="width: 5%; text-align: center;">ลำดับ</th>` : ''}
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
                    // Format Thai word breaking with zero-width spaces to prevent table cell overflow
                    const formatted = formatThaiWordBreaks(escapeHtml(line));
                    return `<div class="cell-line">${formatted}</div>`;
                  }).join('');
                } else {
                  cellContent = escapeHtml(String(rawVal));
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
    // Direct PDF download via htmlToImage + jsPDF to preserve 100% Thai font accuracy
    document.getElementById('btn-download-pdf').addEventListener('click', async function() {
      const btn = this;
      const originalText = btn.innerHTML;
      const statusBox = document.getElementById('export-status-banner');

      btn.innerHTML = '<span>⏳</span> กำลังจัดทำ PDF (สระไม่เพี้ยน)...';
      btn.disabled = true;

      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = '#e0f2fe';
        statusBox.style.color = '#0369a1';
        statusBox.style.border = '1px solid #7dd3fc';
        statusBox.innerHTML = '⏳ <b>กำลังจัดทำไฟล์ PDF คุณภาพสูง...</b> รักษาสระและวรรณยุกต์ภาษาไทยให้ถูกต้อง 100%';
      }

      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
        await new Promise(r => setTimeout(r, 400));

        // Always scroll to top to prevent scroll offset issues in canvas capture
        window.scrollTo(0, 0);

        // Apply clean export mode: 1040px fixed width, no shadows
        document.body.classList.add('is-exporting-pdf');
        await new Promise(r => setTimeout(r, 150));

        const element = document.getElementById('report-content');
        const filename = '${title.replace(/[\\/\\\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf';
        
        if (window.htmlToImage && window.jspdf) {
          // Native browser SVG foreignObject rendering preserves Thai combining diacritics perfectly
          const canvas = await window.htmlToImage.toCanvas(element, {
            pixelRatio: 2.2,
            backgroundColor: '#ffffff',
            skipAutoScale: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });

          const pageWidth = 297;
          const pageHeight = 210;
          const margin = 8;
          const usableWidth = pageWidth - (margin * 2);
          const usableHeight = pageHeight - (margin * 2);
          const imgHeight = (canvas.height * usableWidth) / canvas.width;

          if (imgHeight <= usableHeight) {
            pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
          } else {
            let heightLeft = imgHeight;
            let position = margin;
            let page = 1;

            while (heightLeft > 0) {
              if (page > 1) pdf.addPage();
              pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight);
              heightLeft -= usableHeight;
              position -= usableHeight;
              page++;
            }
          }

          pdf.save(filename);

          btn.innerHTML = '<span>✅</span> ดาวน์โหลดสำเร็จ!';
          if (statusBox) {
            statusBox.style.background = '#dcfce7';
            statusBox.style.color = '#15803d';
            statusBox.style.border = '1px solid #86efac';
            statusBox.innerHTML = '✅ <b>ดาวน์โหลดไฟล์ PDF สำเร็จแล้ว!</b> สระ-วรรณยุกต์ถูกต้องสมบูรณ์ ตารางพอดีหน้า A4';
            setTimeout(() => {
              statusBox.style.display = 'none';
            }, 4500);
          }
        } else {
          // Fallback to window.print if scripts fail to load
          window.print();
        }

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 2500);
      } catch (err) {
        console.error('PDF download error:', err);
        if (statusBox) {
          statusBox.style.background = '#fee2e2';
          statusBox.style.color = '#b91c1c';
          statusBox.style.border = '1px solid #fca5a5';
          statusBox.innerHTML = '⚠️ ระบบกำลังเปิดหน้าต่างพิมพ์ (Save as PDF) ให้ท่าน เพื่อความคมชัดสูงสุดและสระไม่เพี้ยน...';
        }
        window.print();
        btn.innerHTML = originalText;
        btn.disabled = false;
      } finally {
        document.body.classList.remove('is-exporting-pdf');
      }
    });

    // Font size switcher handler
    window.setFontSizeLevel = function(level) {
      const root = document.documentElement;
      const bNormal = document.getElementById('fs-normal');
      const bLarge = document.getElementById('fs-large');
      const bXlarge = document.getElementById('fs-xlarge');

      [bNormal, bLarge, bXlarge].forEach(b => {
        if (b) {
          b.style.background = '#ffffff';
          b.style.color = '#475569';
          b.style.border = '1px solid #cbd5e1';
          b.style.fontWeight = '500';
        }
      });

      if (level === 'normal') {
        root.style.setProperty('--report-table-fz', '12px');
        root.style.setProperty('--report-th-fz', '12.5px');
        if (bNormal) {
          bNormal.style.background = '#0f766e';
          bNormal.style.color = '#ffffff';
          bNormal.style.border = '1.5px solid #0f766e';
          bNormal.style.fontWeight = '700';
        }
      } else if (level === 'xlarge') {
        root.style.setProperty('--report-table-fz', '16px');
        root.style.setProperty('--report-th-fz', '16.5px');
        if (bXlarge) {
          bXlarge.style.background = '#0f766e';
          bXlarge.style.color = '#ffffff';
          bXlarge.style.border = '1.5px solid #0f766e';
          bXlarge.style.fontWeight = '700';
        }
      } else {
        // default 'large' (14px)
        root.style.setProperty('--report-table-fz', '14px');
        root.style.setProperty('--report-th-fz', '14.5px');
        if (bLarge) {
          bLarge.style.background = '#0f766e';
          bLarge.style.color = '#ffffff';
          bLarge.style.border = '1.5px solid #0f766e';
          bLarge.style.fontWeight = '700';
        }
      }
    };
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
// | ลำดับ | ชื่อ - นามสกุล | ระดับชั้น | ชื่อเล่น | ชื่อยา | วิธีใช้ |
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
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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

    html, body, table, th, td, div, p, span, h1, h2, h3 {
      font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', 'Tahoma', sans-serif !important;
    }

    body {
      font-size: 13px;
      line-height: 1.5;
      color: #000000;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
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

    :root {
      --med-table-fz: 14px;
      --med-th-fz: 14.5px;
      --med-usage-fz: 13.5px;
      --med-title-fz: 21px;
    }

    .doc-title-container {
      text-align: center;
      margin-bottom: 16px;
    }

    .doc-title {
      font-size: var(--med-title-fz, 21px);
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
      font-size: var(--med-table-fz, 14px);
      line-height: 1.5;
      table-layout: fixed;
      box-sizing: border-box;
    }

    table.med-table th {
      border: 1px solid #000000;
      background-color: #ffffff;
      color: #000000;
      font-weight: 700;
      padding: 7px 5px;
      text-align: center;
      vertical-align: middle;
      line-height: 1.4;
      font-size: var(--med-th-fz, 14.5px);
      box-sizing: border-box;
    }

    table.med-table td.col-idx {
      width: 5%;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: top;
      padding: 6px 4px;
      font-weight: 500;
      box-sizing: border-box;
      font-size: var(--med-table-fz, 14px);
    }

    table.med-table td.col-name {
      width: 24%;
      border: 1px solid #000000;
      vertical-align: top;
      padding: 6px 8px;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      white-space: normal !important;
      box-sizing: border-box;
      line-height: 1.45;
      font-size: var(--med-table-fz, 14px);
    }

    table.med-table td.col-class {
      width: 9%;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: top;
      padding: 6px 4px;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      white-space: normal !important;
      font-weight: 500;
      box-sizing: border-box;
      font-size: var(--med-table-fz, 14px);
    }

    table.med-table td.col-nick {
      width: 8%;
      border: 1px solid #000000;
      text-align: center;
      vertical-align: top;
      padding: 6px 4px;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      white-space: normal !important;
      box-sizing: border-box;
      font-size: var(--med-table-fz, 14px);
    }

    table.med-table td.col-med-group {
      width: 54%;
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
      width: 48%;
      border-top: none;
      border-bottom: none;
      border-left: none;
      border-right: none;
      padding: 6px 7px;
      vertical-align: top;
      line-height: 1.45;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      word-wrap: break-word !important;
      white-space: normal !important;
      font-size: var(--med-table-fz, 14px);
      box-sizing: border-box;
      max-width: 100%;
    }

    table.inner-med-table td.cell-med-usage {
      width: 52%;
      border-top: none;
      border-bottom: none;
      border-right: none;
      border-left: 1px solid #000000;
      padding: 6px 7px;
      vertical-align: top;
      line-height: 1.45;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      word-wrap: break-word !important;
      white-space: normal !important;
      font-size: var(--med-usage-fz, 13.5px);
      box-sizing: border-box;
      max-width: 100%;
      overflow: hidden;
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
      font-size: 13.5px;
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
      padding: 0 !important;
      margin: 0 !important;
      width: 720px !important;
      max-width: 720px !important;
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
    <div class="btn-actions" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <div class="fs-control-group" style="display: flex; align-items: center; gap: 4px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 8px;">
        <span style="font-size: 12.5px; font-weight: 600; color: #334155; margin-right: 2px;">🔍 ขนาดตัวอักษร:</span>
        <button type="button" class="btn-fs" id="fs-med-normal" onclick="setFontSizeLevelMed('normal')" style="padding: 5px 10px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500; color: #475569;">ปกติ (12.5px)</button>
        <button type="button" class="btn-fs active" id="fs-med-large" onclick="setFontSizeLevelMed('large')" style="padding: 5px 10px; border: 1.5px solid #0f766e; background: #0f766e; color: #ffffff; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 700;">ใหญ่ (14px) ★</button>
        <button type="button" class="btn-fs" id="fs-med-xlarge" onclick="setFontSizeLevelMed('xlarge')" style="padding: 5px 10px; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 500; color: #475569;">ใหญ่พิเศษ (16px)</button>
      </div>
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
          <th style="width: 5%;">ลำดับ</th>
          <th style="width: 24%;">ชื่อ - นามสกุล</th>
          <th style="width: 9%;">ระดับชั้น</th>
          <th style="width: 8%;">ชื่อเล่น</th>
          <th style="width: 26%;">ชื่อยา</th>
          <th style="width: 28%;">วิธีใช้</th>
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
          const rawFullName = `${student.prefix || ''}${student.firstName} ${student.lastName}`.trim();
          const fullName = formatThaiWordBreaks(escapeHtml(rawFullName));
          const rawNick = student.nickname || '-';
          const nickname = formatThaiWordBreaks(escapeHtml(rawNick));
          const gradeClass = escapeHtml(student.classroom || student.grade || '-');
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

                      const formattedMedName = formatThaiWordBreaks(escapeHtml(m.medicineName));
                      const formattedUsage = formatThaiWordBreaks(escapeHtml(usageText || '-'));

                      return `
                        <tr>
                          <td class="cell-med-name">
                            ${formattedMedName}
                          </td>
                          <td class="cell-med-usage">
                            ${formattedUsage}
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
        btn.innerHTML = '<span>⏳</span> กำลังสร้าง PDF (สระไม่เพี้ยน)...';
        btn.disabled = true;
      }

      const statusBox = document.getElementById('export-status-banner');
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.style.background = '#e0f2fe';
        statusBox.style.color = '#0369a1';
        statusBox.style.border = '1px solid #7dd3fc';
        statusBox.innerHTML = '⏳ <b>กำลังจัดทำไฟล์ PDF คุณภาพสูง...</b> รักษาสระและวรรณยุกต์ภาษาไทยให้ถูกต้อง 100% ไม่ตกขอบ';
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

        if (window.htmlToImage && window.jspdf) {
          const canvas = await window.htmlToImage.toCanvas(element, {
            pixelRatio: 2.2,
            backgroundColor: '#ffffff',
            skipAutoScale: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 10;
          const usableWidth = pageWidth - (margin * 2); // 190mm
          const usableHeight = pageHeight - (margin * 2); // 277mm
          const imgHeight = (canvas.height * usableWidth) / canvas.width;

          if (imgHeight <= usableHeight) {
            pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight);
          } else {
            let heightLeft = imgHeight;
            let position = margin;
            let page = 1;

            while (heightLeft > 0) {
              if (page > 1) pdf.addPage();
              pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight);
              heightLeft -= usableHeight;
              position -= usableHeight;
              page++;
            }
          }

          pdf.save(filename);

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
            statusBox.innerHTML = '✅ <b>ดาวน์โหลดไฟล์ PDF สำเร็จแล้ว!</b> สระ-วรรณยุกต์ถูกต้องสมบูรณ์ ตารางพอดีหน้า A4 ไม่หลุดกรอบ';
            setTimeout(() => {
              statusBox.style.display = 'none';
            }, 4500);
          }
        } else {
          // Fallback to window.print if scripts fail to load
          window.print();
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
          statusBox.innerHTML = '⚠️ ระบบกำลังเปิดหน้าต่างพิมพ์ (Save as PDF) ให้ท่าน เพื่อความคมชัดสูงสุดและสระไม่เพี้ยน...';
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

    // Font size switcher handler for Daily Medications
    window.setFontSizeLevelMed = function(level) {
      const root = document.documentElement;
      const bNormal = document.getElementById('fs-med-normal');
      const bLarge = document.getElementById('fs-med-large');
      const bXlarge = document.getElementById('fs-med-xlarge');

      [bNormal, bLarge, bXlarge].forEach(b => {
        if (b) {
          b.style.background = '#ffffff';
          b.style.color = '#475569';
          b.style.border = '1px solid #cbd5e1';
          b.style.fontWeight = '500';
        }
      });

      if (level === 'normal') {
        root.style.setProperty('--med-table-fz', '12.5px');
        root.style.setProperty('--med-th-fz', '13px');
        root.style.setProperty('--med-usage-fz', '12px');
        if (bNormal) {
          bNormal.style.background = '#0f766e';
          bNormal.style.color = '#ffffff';
          bNormal.style.border = '1.5px solid #0f766e';
          bNormal.style.fontWeight = '700';
        }
      } else if (level === 'xlarge') {
        root.style.setProperty('--med-table-fz', '16px');
        root.style.setProperty('--med-th-fz', '16.5px');
        root.style.setProperty('--med-usage-fz', '15px');
        if (bXlarge) {
          bXlarge.style.background = '#0f766e';
          bXlarge.style.color = '#ffffff';
          bXlarge.style.border = '1.5px solid #0f766e';
          bXlarge.style.fontWeight = '700';
        }
      } else {
        // default 'large' (14px)
        root.style.setProperty('--med-table-fz', '14px');
        root.style.setProperty('--med-th-fz', '14.5px');
        root.style.setProperty('--med-usage-fz', '13.5px');
        if (bLarge) {
          bLarge.style.background = '#0f766e';
          bLarge.style.color = '#ffffff';
          bLarge.style.border = '1.5px solid #0f766e';
          bLarge.style.fontWeight = '700';
        }
      }
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

