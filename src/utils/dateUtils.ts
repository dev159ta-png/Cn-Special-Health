/**
 * Thai Date & Time formatting utilities for School Infirmary System
 * Formats dates into Thai Buddhist Era (พ.ศ.) with Thai days and months
 * Example: "วัน พฤ. ที่ 3 ก.ย. พ.ศ. 2569" or "วันพฤหัสบดีที่ 3 กันยายน พ.ศ. 2569"
 */

export const THAI_DAYS_FULL = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

export const THAI_DAYS_SHORT = [
  'วัน อา.',
  'วัน จ.',
  'วัน อ.',
  'วัน พ.',
  'วัน พฤ.',
  'วัน ศ.',
  'วัน ส.'
];

export const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.'
];

interface ParseResult {
  year: number; // Gregorian year for Date calculation
  beYear: number; // Buddhist Era year
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0-6 (0 = Sunday)
  isValid: boolean;
}

/**
 * Parse a date string or Date object into components
 */
export function parseDateComponents(dateInput: string | Date | undefined | null): ParseResult | null {
  if (!dateInput) return null;

  try {
    let year: number;
    let month: number;
    let day: number;

    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return null;
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    } else if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed) return null;

      // Check YYYY-MM-DD format (standard ISO)
      if (trimmed.includes('-')) {
        const parts = trimmed.split('T')[0].split('-');
        if (parts.length >= 3) {
          let y = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
          
          if (y > 2400) {
            // Already BE year
            year = y - 543;
          } else {
            year = y;
          }
        } else {
          return null;
        }
      } else if (trimmed.includes('/')) {
        // DD/MM/YYYY or YYYY/MM/DD
        const parts = trimmed.split('/');
        if (parts.length >= 3) {
          if (parts[0].length === 4) {
            let y = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
            year = y > 2400 ? y - 543 : y;
          } else {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            let y = parseInt(parts[2], 10);
            year = y > 2400 ? y - 543 : y;
          }
        } else {
          return null;
        }
      } else {
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) return null;
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }
    } else {
      return null;
    }

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Calculate day of week using Gregorian date
    const gregDate = new Date(year, month - 1, day);
    const dayOfWeek = gregDate.getDay();
    const beYear = year < 2400 ? year + 543 : year;

    return {
      year,
      beYear,
      month,
      day,
      dayOfWeek,
      isValid: true
    };
  } catch {
    return null;
  }
}

export interface ThaiDateOptions {
  dayFormat?: 'full' | 'short' | 'none'; // 'วันพฤหัสบดี' | 'วัน พฤ.' | none
  monthFormat?: 'short' | 'full'; // 'ก.ย.' | 'กันยายน'
  showPreposition?: boolean; // include 'ที่' (e.g. ที่ 3)
  showBEPrefix?: boolean; // 'ปี พ.ศ. 2569' vs '2569'
  showMonthPrefix?: boolean; // 'เดือน กันยายน' vs 'กันยายน'
  time?: string; // Optional time string e.g. "14:30" or "14:30 น."
  includeTimeIfPresent?: boolean;
}

/**
 * Standard Thai date format matching user request:
 * "วัน จันทร์ -อาทิตย์ ที่ 1 -31 เดือน มกราคม -ธันวาคม ปี พ.ศ. 2569"
 * Example: "วันพฤหัสบดี ที่ 3 เดือน กันยายน ปี พ.ศ. 2569"
 */
export function formatThaiDate(
  dateInput: string | Date | undefined | null,
  options: ThaiDateOptions = {}
): string {
  const parsed = parseDateComponents(dateInput);
  if (!parsed) return typeof dateInput === 'string' && dateInput ? dateInput : '-';

  const {
    dayFormat = 'full', // 'วันพฤหัสบดี', 'วันจันทร์', ฯลฯ
    monthFormat = 'full', // 'มกราคม', 'กุมภาพันธ์', ฯลฯ
    showPreposition = true, // 'ที่ 1 - 31'
    showBEPrefix = true, // 'ปี พ.ศ. 2569'
    showMonthPrefix = true, // 'เดือน กันยายน'
    time,
    includeTimeIfPresent = true
  } = options;

  let dayPart = '';
  if (dayFormat === 'full') {
    dayPart = `${THAI_DAYS_FULL[parsed.dayOfWeek]} `;
  } else if (dayFormat === 'short') {
    dayPart = `${THAI_DAYS_SHORT[parsed.dayOfWeek]} `;
  }

  const prepPart = showPreposition ? 'ที่ ' : '';
  const monthName = monthFormat === 'full' 
    ? THAI_MONTHS_FULL[parsed.month - 1] 
    : THAI_MONTHS_SHORT[parsed.month - 1];

  const monthPart = showMonthPrefix ? `เดือน ${monthName} ` : `${monthName} `;
  const yearPart = showBEPrefix ? `ปี พ.ศ. ${parsed.beYear}` : `${parsed.beYear}`;

  let result = `${dayPart}${prepPart}${parsed.day} ${monthPart}${yearPart}`;

  let finalTime = time;
  if (!finalTime && includeTimeIfPresent) {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      const hours = dateInput.getHours();
      const minutes = dateInput.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        finalTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    } else if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const timePart = dateInput.split('T')[1]?.slice(0, 5);
      if (timePart && timePart !== '00:00') {
        finalTime = timePart;
      }
    }
  }

  if (finalTime) {
    const cleanTime = finalTime.endsWith('น.') ? finalTime : `${finalTime} น.`;
    result += ` เวลา ${cleanTime}`;
  }

  return result;
}

/**
 * Format date in full formal style: "วันพฤหัสบดี ที่ 3 เดือน กันยายน ปี พ.ศ. 2569"
 */
export function formatThaiDateFull(dateInput: string | Date | undefined | null, time?: string): string {
  return formatThaiDate(dateInput, {
    dayFormat: 'full',
    monthFormat: 'full',
    showPreposition: true,
    showMonthPrefix: true,
    showBEPrefix: true,
    time
  });
}

/**
 * Format date in user requested pattern: "วัน จันทร์ - อาทิตย์ ที่ 1 - 31 เดือน มกราคม - ธันวาคม ปี พ.ศ. 2569"
 */
export function formatThaiDatePattern(dateInput: string | Date | undefined | null, time?: string): string {
  return formatThaiDate(dateInput, {
    dayFormat: 'full',
    monthFormat: 'full',
    showPreposition: true,
    showMonthPrefix: true,
    showBEPrefix: true,
    time
  });
}

/**
 * Format compact Thai date with day, date, full month, and BE year: "วันพฤหัสบดี ที่ 3 เดือน กันยายน ปี พ.ศ. 2569"
 */
export function formatThaiDateCompact(dateInput: string | Date | undefined | null): string {
  const parsed = parseDateComponents(dateInput);
  if (!parsed) return typeof dateInput === 'string' && dateInput ? dateInput : '-';
  return `${THAI_DAYS_FULL[parsed.dayOfWeek]} ที่ ${parsed.day} เดือน ${THAI_MONTHS_FULL[parsed.month - 1]} ปี พ.ศ. ${parsed.beYear}`;
}

/**
 * Format expiry date: e.g. "วันพฤหัสบดี ที่ 30 เดือน กันยายน ปี พ.ศ. 2569"
 */
export function formatThaiExpiryDate(dateInput: string | undefined | null): string {
  return formatThaiDateCompact(dateInput);
}

/**
 * Get current date formatted in Thai pattern
 */
export function getTodayThaiDate(): string {
  return formatThaiDatePattern(new Date());
}

/**
 * Convert ISO string (e.g. 2026-09-03) to BE Year representation
 */
export function getThaiYear(dateInput: string | Date = new Date()): number {
  const parsed = parseDateComponents(dateInput);
  return parsed ? parsed.beYear : 2569;
}

/**
 * Format date as DD/MM/YYYY in Buddhist Era (e.g. 03/09/2569)
 */
export function formatThaiDateNumeric(dateInput: string | Date | undefined | null): string {
  const parsed = parseDateComponents(dateInput);
  if (!parsed) return typeof dateInput === 'string' && dateInput ? dateInput : '-';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}/${parsed.beYear}`;
}
