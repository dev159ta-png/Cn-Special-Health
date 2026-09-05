import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatThaiDatePattern, formatThaiDateCompact } from '../../utils/dateUtils';
import { exportTableAsPDF } from '../../utils/tablePdfExport';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Pill, 
  Users, 
  HeartHandshake,
  Table,
  FileDown
} from 'lucide-react';

interface ReportsViewProps {
  initialReportType?: 'visits' | 'dispensing' | 'inventory' | 'student-health';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialReportType = 'visits'
}) => {
  const { visits, medicines, students, dispenseLogs, systemConfig } = useApp();

  const [reportType, setReportType] = useState<string>(initialReportType);

  useEffect(() => {
    if (initialReportType) {
      setReportType(initialReportType);
    }
  }, [initialReportType]);
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [classroom, setClassroom] = useState<string>('all');
  const [disabilityType, setDisabilityType] = useState<string>('all');

  // Filtered Visits for Report
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (startDate && v.visitDate < startDate) return false;
      if (endDate && v.visitDate > endDate) return false;
      if (classroom !== 'all') {
        const student = students.find(s => s.id === v.studentId);
        if (v.classroom !== classroom && (student && student.grade !== classroom && student.classroom !== classroom)) return false;
      }
      if (disabilityType !== 'all') {
        const student = students.find(s => s.id === v.studentId);
        if (!student || !(student.disabilities || []).some(d => d.typeId === disabilityType)) return false;
      }
      return true;
    });
  }, [visits, startDate, endDate, classroom, disabilityType, students]);

  // Filtered Dispense Logs
  const filteredDispenseLogs = useMemo(() => {
    return dispenseLogs.filter(d => {
      if (startDate && d.dispenseDate < startDate) return false;
      if (endDate && d.dispenseDate > endDate) return false;
      return true;
    });
  }, [dispenseLogs, startDate, endDate]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (classroom !== 'all' && s.classroom !== classroom && s.grade !== classroom) return false;
      if (disabilityType !== 'all' && !(s.disabilities || []).some(d => d.typeId === disabilityType)) return false;
      return true;
    });
  }, [students, classroom, disabilityType]);

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV / Excel Export Handler (With UTF-8 BOM for Thai support in Excel)
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM

    if (reportType === 'visits') {
      csvContent += 'เลขที่รับบริการ,วันที่,เวลา,ชื่อนักเรียน,ห้องเรียน,ประเภทบริการ,อาการ,การรักษา,ยาที่ได้รับ,ผลการรักษา,ผู้ให้บริการ\n';
      filteredVisits.forEach(v => {
        const meds = (v.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity} ${m.unit})`).join('; ');
        csvContent += `"${v.visitNumber}","${v.visitDate}","${v.visitTime}","${v.studentName}","${v.classroom}","${v.serviceType}","${(v.symptoms || []).join(', ')}","${(v.treatments || (v as any).treatment || []).join(', ')}","${meds}","${v.outcome}","${v.attendantName}"\n`;
      });
    } else if (reportType === 'dispensing') {
      csvContent += 'วันที่,เวลา,เลขที่รับบริการ,รหัสยา,ชื่อยา,Lot,จำนวนที่จ่าย,หน่วย,คงเหลือก่อน,คงเหลือหลัง,ผู้รับยา,ผู้จ่ายยา\n';
      filteredDispenseLogs.forEach(l => {
        csvContent += `"${l.dispenseDate}","${l.dispenseTime}","${l.visitNumber}","${l.medicineCode}","${l.medicineName}","${l.lotNumber}","${l.quantity}","${l.unit}","${l.stockBefore}","${l.stockAfter}","${l.studentName}","${l.dispenserName}"\n`;
      });
    } else if (reportType === 'inventory') {
      csvContent += 'รหัสยา,ชื่อการค้า,ชื่อสามัญ,หมวดหมู่,รูปแบบ,คงเหลือ,หน่วย,จุดสั่งซื้อขั้นต่ำ,Lot,วันหมดอายุ,ผู้ผลิต\n';
      medicines.forEach(m => {
        csvContent += `"${m.code}","${m.tradeName}","${m.genericName}","${m.category}","${m.dosageForm}","${m.currentStock}","${m.unit}","${m.minimumStock}","${m.lotNumber}","${m.expiryDate}","${m.manufacturer}"\n`;
      });
    } else {
      csvContent += 'รหัสนักเรียน,ชื่อ-นามสกุล,ชื่อเล่น,ชั้น,ห้อง,หมู่เลือด,ประเภทความพิการ,โรคประจำตัว,ประวัติแพ้ยา,เบอร์ผู้ปกครอง\n';
      filteredStudents.forEach(s => {
        const dis = (s.disabilities || []).map(d => d.typeName).join('; ');
        const disNames = (s.chronicDiseases || []).map(c => c.diseaseName).join('; ');
        const alg = (s.drugAllergies || []).map(d => d.drugName).join('; ');
        csvContent += `"${s.studentCode}","${s.prefix}${s.firstName} ${s.lastName}","${s.nickname}","${s.grade}","${s.classroom}","${s.bloodType}","${dis}","${disNames}","${alg}","${s.guardianPhone}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as formatted PDF via exportTableAsPDF
  const handleExportPDF = () => {
    const schoolName = systemConfig?.schoolName || 'โรงเรียนศึกษาพิเศษชัยนาท';
    const schoolLogo = systemConfig?.schoolLogo;

    if (reportType === 'visits') {
      exportTableAsPDF({
        title: `รายงานสรุปการให้บริการห้องพยาบาล`,
        schoolName,
        schoolLogo,
        showIndex: true,
        columns: [
          { header: 'เลขที่ VN', key: 'visitNumber', width: '90px', align: 'center' },
          { header: 'วัน-เวลา', key: 'dateTime', width: '130px', align: 'center' },
          { header: 'ชื่อ-นามสกุลนักเรียน', key: 'studentName', width: '160px', align: 'left' },
          { header: 'ห้อง', key: 'classroom', width: '70px', align: 'center' },
          { header: 'อาการที่พบ', key: 'symptoms', width: '180px', align: 'left' },
          { header: 'การรักษาเบื้องต้น & ยา', key: 'treatment', width: '220px', align: 'left' },
          { header: 'ผลการรักษา', key: 'outcome', width: '100px', align: 'center' },
          { header: 'ผู้ให้บริการ', key: 'attendant', width: '110px', align: 'left' }
        ],
        rows: filteredVisits.map(v => {
          const meds = (v.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity} ${m.unit})`).join(', ');
          const treatText = (v.treatments || (v as any).treatment || []).join(', ');
          return {
            visitNumber: v.visitNumber,
            dateTime: `${formatThaiDatePattern(v.visitDate)}\n${v.visitTime} น.`,
            studentName: `${v.studentName} (${v.nickname || ''})`,
            classroom: v.classroom,
            symptoms: (v.symptoms || []).join(', ') || '-',
            treatment: [treatText, meds ? `ยา: ${meds}` : ''].filter(Boolean).join('\n') || '-',
            outcome: v.outcome,
            attendant: v.attendantName
          };
        }),
        summaryStats: [
          { label: 'จำนวนครั้งที่รับบริการ', value: `${filteredVisits.length} ครั้ง` },
          { label: 'ช่วงวันที่', value: `${formatThaiDateCompact(startDate)} - ${formatThaiDateCompact(endDate)}` }
        ]
      });
    } else if (reportType === 'dispensing') {
      exportTableAsPDF({
        title: `รายงานการจ่ายยาและตัดสต็อกห้องพยาบาล`,
        schoolName,
        schoolLogo,
        showIndex: true,
        columns: [
          { header: 'วัน-เวลา', key: 'dateTime', width: '130px', align: 'center' },
          { header: 'เลขที่ VN', key: 'visitNumber', width: '90px', align: 'center' },
          { header: 'รายการยาที่จ่าย', key: 'medicineName', width: '180px', align: 'left' },
          { header: 'Lot Number', key: 'lotNumber', width: '100px', align: 'center' },
          { header: 'จำนวนที่จ่าย', key: 'quantity', width: '90px', align: 'center' },
          { header: 'คงเหลือหลังจ่าย', key: 'stockAfter', width: '100px', align: 'center' },
          { header: 'ผู้รับยา', key: 'studentName', width: '140px', align: 'left' },
          { header: 'ผู้จ่ายยา', key: 'dispenserName', width: '110px', align: 'left' }
        ],
        rows: filteredDispenseLogs.map(l => ({
          dateTime: `${formatThaiDatePattern(l.dispenseDate)}\n${l.dispenseTime} น.`,
          visitNumber: l.visitNumber,
          medicineName: l.medicineName,
          lotNumber: l.lotNumber || '-',
          quantity: `${l.quantity} ${l.unit}`,
          stockAfter: `${l.stockAfter} ${l.unit}`,
          studentName: l.studentName,
          dispenserName: l.dispenserName
        })),
        summaryStats: [
          { label: 'จำนวนรายการจ่ายยา', value: `${filteredDispenseLogs.length} รายการ` },
          { label: 'ช่วงวันที่', value: `${formatThaiDateCompact(startDate)} - ${formatThaiDateCompact(endDate)}` }
        ]
      });
    } else if (reportType === 'inventory') {
      exportTableAsPDF({
        title: 'รายงานบัญชีคุมยอดคลังยาและเวชภัณฑ์ห้องพยาบาล',
        schoolName,
        schoolLogo,
        showIndex: true,
        columns: [
          { header: 'รหัสยา', key: 'code', width: '80px', align: 'center' },
          { header: 'ชื่อการค้า / ชื่อสามัญ', key: 'names', width: '220px', align: 'left' },
          { header: 'หมวดหมู่', key: 'category', width: '110px', align: 'left' },
          { header: 'คงเหลือ', key: 'stock', width: '90px', align: 'center' },
          { header: 'จุดสั่งซื้อ', key: 'minimumStock', width: '80px', align: 'center' },
          { header: 'Lot No.', key: 'lotNumber', width: '90px', align: 'center' },
          { header: 'วันหมดอายุ', key: 'expiryDate', width: '110px', align: 'center' },
          { header: 'ผู้ผลิต / แหล่งจัดหา', key: 'manufacturer', width: '140px', align: 'left' }
        ],
        rows: medicines.map(m => ({
          code: m.code,
          names: `${m.tradeName}\n(${m.genericName} ${m.strength})`,
          category: m.category,
          stock: `${m.currentStock} ${m.unit}`,
          minimumStock: `${m.minimumStock} ${m.unit}`,
          lotNumber: m.lotNumber || '-',
          expiryDate: formatThaiDateCompact(m.expiryDate),
          manufacturer: m.manufacturer || '-'
        })),
        summaryStats: [
          { label: 'จำนวนรายการยาทั้งหมด', value: `${medicines.length} รายการ` },
          { label: 'ยาคงเหลือต่ำกว่าเกณฑ์', value: `${medicines.filter(m => m.currentStock <= m.minimumStock).length} รายการ` }
        ]
      });
    } else {
      exportTableAsPDF({
        title: 'รายงานทะเบียนประวัติสุขภาพและความพิการของนักเรียน',
        schoolName,
        schoolLogo,
        showIndex: true,
        columns: [
          { header: 'รหัส', key: 'studentCode', width: '70px', align: 'center' },
          { header: 'ชื่อ-นามสกุล (ชื่อเล่น)', key: 'fullName', width: '160px', align: 'left' },
          { header: 'ห้อง', key: 'classroom', width: '70px', align: 'center' },
          { header: 'กรุ๊ปเลือด', key: 'bloodType', width: '60px', align: 'center' },
          { header: 'ประเภทความพิการ', key: 'disability', width: '150px', align: 'left' },
          { header: 'โรคประจำตัว', key: 'diseases', width: '180px', align: 'left' },
          { header: 'ประวัติแพ้ยา / แพ้อาหาร', key: 'allergies', width: '180px', align: 'left' },
          { header: 'เบอร์ผู้ปกครอง', key: 'guardianPhone', width: '100px', align: 'center' }
        ],
        rows: filteredStudents.map(s => {
          const dis = (s.disabilities || []).map(d => d.typeName).join(', ') || '-';
          const disNames = (s.chronicDiseases || []).map(c => c.diseaseName).join(', ') || '-';
          const drugAllergies = (s.drugAllergies || []).map(d => `แพ้ยา: ${d.drugName}`).join('\n');
          const foodAllergies = (s.foodAllergies || []).map(f => `แพ้อาหาร: ${f.foodName}`).join('\n');
          const allAllergies = [drugAllergies, foodAllergies].filter(Boolean).join('\n') || '-';

          return {
            studentCode: s.studentCode,
            fullName: `${s.prefix}${s.firstName} ${s.lastName} (${s.nickname || ''})`,
            classroom: s.classroom,
            bloodType: s.bloodType,
            disability: dis,
            diseases: disNames,
            allergies: allAllergies,
            guardianPhone: s.guardianPhone || '-'
          };
        }),
        summaryStats: [
          { label: 'จำนวนนักเรียนทั้งหมด', value: `${filteredStudents.length} คน` }
        ]
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
              ระบบออกรายงาน & เอกสารราชการ
            </span>
            <span className="text-xs text-slate-500">
              รองรับการพิมพ์และส่งออก PDF / Excel
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-800 mt-1">
            ระบบรายงานสรุปผลและสถิติห้องพยาบาล
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            title="ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูง พร้อมหัวเอกสารราชการและลายเซ็น"
          >
            <FileDown className="w-4 h-4" />
            <span>ดาวน์โหลด PDF (.pdf)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก Excel (.csv)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs overflow-x-auto flex space-x-1 text-xs">
        <button
          onClick={() => setReportType('visits')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            reportType === 'visits' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          1. รายงานการให้บริการห้องพยาบาล
        </button>

        <button
          onClick={() => setReportType('dispensing')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            reportType === 'dispensing' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2. รายงานการจ่ายยาและตัดสต็อก
        </button>

        <button
          onClick={() => setReportType('inventory')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            reportType === 'inventory' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3. รายงานคลังยาและวันหมดอายุ
        </button>

        <button
          onClick={() => setReportType('student-health')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            reportType === 'student-health' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          4. รายงานสรุปสุขภาพนักเรียน
        </button>
      </div>

      {/* Report Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">ถึงวันที่</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">ระดับชั้น/ห้อง</label>
            <select
              value={classroom}
              onChange={e => setClassroom(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white font-semibold"
            >
              <option value="all">ทุกระดับชั้น/ห้อง</option>
              {(systemConfig.classrooms || []).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">ประเภทความพิการ</label>
            <select
              value={disabilityType}
              onChange={e => setDisabilityType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            >
              <option value="all">ทุกประเภท</option>
              {(systemConfig.disabilityCategories || []).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Formatted Printable Document Container */}
      <div 
        id="printable-report-document" 
        className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none"
      >
        {/* Official Header */}
        <div className="text-center border-b-2 border-slate-800 pb-4">
          {systemConfig?.schoolLogo && (
            <div className="flex justify-center mb-2">
              <img 
                src={systemConfig.schoolLogo} 
                alt="School Logo" 
                className="w-16 h-16 object-contain" 
              />
            </div>
          )}
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-600">
            <span>สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)</span>
            <span>•</span>
            <span>{systemConfig?.schoolAffiliation || 'สำนักบริหารงานการศึกษาพิเศษ'}</span>
          </div>
          <h3 className="font-heading font-bold text-xl text-slate-900 mt-1">
            {systemConfig.schoolName}
          </h3>
          <h4 className="font-heading font-semibold text-base text-slate-800 mt-1">
            {reportType === 'visits' && 'รายงานสรุปการให้บริการห้องพยาบาล'}
            {reportType === 'dispensing' && 'รายงานการจ่ายยาและตัดสต็อกยา'}
            {reportType === 'inventory' && 'รายงานบัญชีคุมยอดคลังยาและวันหมดอายุ'}
            {reportType === 'student-health' && 'รายงานทะเบียนประวัติสุขภาพและความพิการของนักเรียน'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลระหว่าง {formatThaiDatePattern(startDate)} ถึง {formatThaiDatePattern(endDate)} | ออกรายงาน ณ {formatThaiDatePattern(new Date())}
          </p>
        </div>

        {/* 1. VISITS REPORT */}
        {reportType === 'visits' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">ลำดับ</th>
                  <th className="p-2 border-r border-slate-300">เลขที่ VN</th>
                  <th className="p-2 border-r border-slate-300">วัน-เวลา</th>
                  <th className="p-2 border-r border-slate-300">ชื่อ-นามสกุลนักเรียน</th>
                  <th className="p-2 border-r border-slate-300">ห้อง</th>
                  <th className="p-2 border-r border-slate-300">อาการที่พบ</th>
                  <th className="p-2 border-r border-slate-300">การรักษาเบื้องต้น & ยา</th>
                  <th className="p-2 border-r border-slate-300">ผลการรักษา</th>
                  <th className="p-2">ผู้ให้บริการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVisits.map((v, i) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">{v.visitNumber}</td>
                    <td className="p-2 border-r border-slate-200">{formatThaiDatePattern(v.visitDate)} ({v.visitTime} น.)</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{v.studentName} ({v.nickname})</td>
                    <td className="p-2 border-r border-slate-200">{v.classroom}</td>
                    <td className="p-2 border-r border-slate-200">{(v.symptoms || []).join(', ')}</td>
                    <td className="p-2 border-r border-slate-200">
                      <div>{(v.treatments || (v as any).treatment || []).join(', ')}</div>
                      {(v.dispensedMedicines || []).length > 0 && (
                        <span className="text-teal-700 text-[11px] block">
                          ยา: {(v.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity})`).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-medium">{v.outcome}</td>
                    <td className="p-2">{v.attendantName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. DISPENSING REPORT */}
        {reportType === 'dispensing' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">ลำดับ</th>
                  <th className="p-2 border-r border-slate-300">วันที่-เวลา</th>
                  <th className="p-2 border-r border-slate-300">เลขที่ VN</th>
                  <th className="p-2 border-r border-slate-300">รายการยาที่จ่าย</th>
                  <th className="p-2 border-r border-slate-300">Lot Number</th>
                  <th className="p-2 border-r border-slate-300">จำนวนที่จ่าย</th>
                  <th className="p-2 border-r border-slate-300">สต็อกคงเหลือ</th>
                  <th className="p-2 border-r border-slate-300">ผู้รับยา</th>
                  <th className="p-2">ผู้จ่ายยา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDispenseLogs.map((l, i) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                    <td className="p-2 border-r border-slate-200">{formatThaiDatePattern(l.dispenseDate)} ({l.dispenseTime} น.)</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">{l.visitNumber}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{l.medicineName}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{l.lotNumber}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-rose-600">{l.quantity} {l.unit}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{l.stockAfter} {l.unit}</td>
                    <td className="p-2 border-r border-slate-200">{l.studentName}</td>
                    <td className="p-2">{l.dispenserName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. INVENTORY REPORT */}
        {reportType === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 text-center w-12">ลำดับ</th>
                  <th className="p-2 border-r border-slate-300">รหัสยา</th>
                  <th className="p-2 border-r border-slate-300">ชื่อการค้า / ชื่อสามัญ</th>
                  <th className="p-2 border-r border-slate-300">หมวดหมู่</th>
                  <th className="p-2 border-r border-slate-300">คงเหลือ</th>
                  <th className="p-2 border-r border-slate-300">ขั้นต่ำ</th>
                  <th className="p-2 border-r border-slate-300">Lot Number</th>
                  <th className="p-2 border-r border-slate-300">วันหมดอายุ</th>
                  <th className="p-2">ผู้ผลิต / แหล่งจัดหา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {medicines.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">{m.code}</td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{m.tradeName}</div>
                      <div className="text-[11px] text-slate-500">{m.genericName} ({m.strength})</div>
                    </td>
                    <td className="p-2 border-r border-slate-200">{m.category}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{m.currentStock} {m.unit}</td>
                    <td className="p-2 border-r border-slate-200">{m.minimumStock} {m.unit}</td>
                    <td className="p-2 border-r border-slate-200 font-mono">{m.lotNumber}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{formatThaiDateCompact(m.expiryDate)}</td>
                    <td className="p-2">{m.manufacturer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. STUDENT HEALTH REPORT */}
        {reportType === 'student-health' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 text-center w-12">ลำดับ</th>
                  <th className="p-2 border-r border-slate-300">รหัส</th>
                  <th className="p-2 border-r border-slate-300">ชื่อ-นามสกุล (ชื่อเล่น)</th>
                  <th className="p-2 border-r border-slate-300">ห้อง</th>
                  <th className="p-2 border-r border-slate-300">กรุ๊ปเลือด</th>
                  <th className="p-2 border-r border-slate-300">ประเภทความพิการ</th>
                  <th className="p-2 border-r border-slate-300">โรคประจำตัว & ปฐมพยาบาล</th>
                  <th className="p-2 border-r border-slate-300">ประวัติแพ้ยา (สำคัญ)</th>
                  <th className="p-2">เบอร์โทรผู้ปกครอง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">{s.studentCode}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{s.prefix}{s.firstName} {s.lastName} ({s.nickname})</td>
                    <td className="p-2 border-r border-slate-200">{s.classroom}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-rose-600">{s.bloodType}</td>
                    <td className="p-2 border-r border-slate-200">
                      {(s.disabilities || []).map(d => d.typeName).join(', ')}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      {(s.chronicDiseases || []).map(c => c.diseaseName).join(', ') || '-'}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-bold text-rose-700">
                      {(s.drugAllergies || []).map(d => `${d.drugName} (${d.severity})`).join(', ') || '-'}
                    </td>
                    <td className="p-2 font-medium">{s.guardianPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures Footer */}
        <div className="pt-12 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="w-48 mx-auto border-b border-slate-400 pb-1 mb-1">
              (นางพยาบาล ใจดีศิษย์)
            </div>
            <p className="text-slate-600">ครูอนามัย / หัวหน้างานพยาบาล</p>
          </div>

          <div>
            <div className="w-48 mx-auto border-b border-slate-400 pb-1 mb-1">
              (นายอภิชาติ การศึกษา)
            </div>
            <p className="text-slate-600">ผู้อำนวยการ{systemConfig?.schoolName || 'โรงเรียนศึกษาพิเศษชัยนาท'}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
