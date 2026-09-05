import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InfirmaryVisit } from '../../types';
import { formatThaiDatePattern, formatThaiDateNumeric } from '../../utils/dateUtils';
import { VisitDetailModal } from './VisitDetailModal';
import { EditVisitModal } from './EditVisitModal';
import { CopyVisitModal } from './CopyVisitModal';
import { StudentIndividualVisitHistoryView } from './StudentIndividualVisitHistoryView';
import { 
  Search, 
  Filter, 
  Printer, 
  FileSpreadsheet, 
  Eye, 
  History, 
  Calendar, 
  Plus, 
  Ambulance, 
  Pill, 
  X,
  Stethoscope,
  HeartPulse,
  UserCheck,
  User,
  Clock,
  ArrowRight,
  ChevronRight,
  FileText,
  Edit,
  Copy,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface VisitHistoryViewProps {
  onNewVisit: (studentId?: string) => void;
  onSelectStudent: (studentId: string) => void;
  initialStudentId?: string;
}

export const VisitHistoryView: React.FC<VisitHistoryViewProps> = ({
  onNewVisit,
  onSelectStudent,
  initialStudentId
}) => {
  const { visits, students, currentUser, updateVisit, deleteVisit } = useApp();

  // Active individual student history mode (Requirement 3, 4, 8)
  const [activeStudentHistoryId, setActiveStudentHistoryId] = useState<string | null>(initialStudentId || null);

  // Selected visit for full detail modal (Requirement 2)
  const [selectedDetailVisit, setSelectedDetailVisit] = useState<InfirmaryVisit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit visit modal state
  const [editingVisit, setEditingVisit] = useState<InfirmaryVisit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Copy visit modal state
  const [copyingVisit, setCopyingVisit] = useState<InfirmaryVisit | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Delete visit confirmation state
  const [deletingVisitId, setDeletingVisitId] = useState<string | null>(null);

  // Slip Modal for printing
  const [selectedSlipVisit, setSelectedSlipVisit] = useState<InfirmaryVisit | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterReferral, setFilterReferral] = useState('all');
  const [filterSymptomStatus, setFilterSymptomStatus] = useState('all');

  // Filtered visits for the main table (sorted newest to oldest)
  const filteredVisits = useMemo(() => {
    return visits
      .filter(v => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (v.studentName || '').toLowerCase().includes(q);
          const matchNick = (v.nickname || '').toLowerCase().includes(q);
          const matchCode = (v.studentCode || '').toLowerCase().includes(q);
          const matchVn = (v.visitNumber || '').toLowerCase().includes(q);
          const matchSym = (v.symptoms || []).some(s => s.toLowerCase().includes(q));
          const matchDetails = (v.symptomDetails || '').toLowerCase().includes(q);
          const matchTreatment = (v.treatments || (v as any).treatment || []).some((t: string) => t.toLowerCase().includes(q));
          const matchMed = (v.dispensedMedicines || []).some(m => m.medicineName.toLowerCase().includes(q));
          const matchAttendant = (v.attendantName || '').toLowerCase().includes(q);
          const matchClass = (v.classroom || '').toLowerCase().includes(q);
          const matchDate = v.visitDate.includes(q) || formatThaiDateNumeric(v.visitDate).includes(q);

          if (!matchName && !matchNick && !matchCode && !matchVn && !matchSym && !matchDetails && !matchTreatment && !matchMed && !matchAttendant && !matchClass && !matchDate) {
            return false;
          }
        }

        if (filterType !== 'all' && v.serviceType !== filterType) return false;
        if (filterOutcome !== 'all' && v.outcome !== filterOutcome) return false;
        if (filterDate && v.visitDate !== filterDate) return false;
        if (filterReferral === 'yes' && !(v.referral || v.outcome === 'ส่งต่อโรงพยาบาล' || v.outcome === 'เรียกรถพยาบาล (1669)')) return false;
        if (filterReferral === 'no' && (v.referral || v.outcome === 'ส่งต่อโรงพยาบาล' || v.outcome === 'เรียกรถพยาบาล (1669)')) return false;
        if (filterSymptomStatus !== 'all' && v.symptomStatus !== filterSymptomStatus) return false;

        return true;
      })
      .sort((a, b) => {
        const dateTimeA = `${a.visitDate} ${a.visitTime}`;
        const dateTimeB = `${b.visitDate} ${b.visitTime}`;
        return dateTimeB.localeCompare(dateTimeA);
      });
  }, [visits, searchQuery, filterType, filterOutcome, filterDate, filterReferral, filterSymptomStatus]);

  // If a student's individual history is selected, render the individual history view (Requirement 4, 7, 8)
  if (activeStudentHistoryId) {
    return (
      <StudentIndividualVisitHistoryView
        studentId={activeStudentHistoryId}
        onBack={() => setActiveStudentHistoryId(null)}
        onNewVisit={(sId) => onNewVisit(sId)}
        onSelectOtherStudent={(sId) => setActiveStudentHistoryId(sId)}
        showBackButton={true}
      />
    );
  }

  // Row click handler (Requirement 2: คลิกเพื่อดูรายละเอียด)
  const handleRowClick = (visit: InfirmaryVisit) => {
    setSelectedDetailVisit(visit);
    setIsDetailModalOpen(true);
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'ส่งต่อโรงพยาบาล':
      case 'เรียกรถพยาบาล (1669)':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ติดต่อผู้ปกครอง':
      case 'กลับบ้าน':
      case 'ผู้ปกครองมารับกลับบ้าน':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'พักห้องพยาบาล':
      case 'สังเกตอาการต่อ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'กลับเข้าชั้นเรียน':
      case 'ดีขึ้น':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* 1. Header with Title & Action */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading font-bold text-xl text-slate-900">
                  รายการรับบริการห้องพยาบาล
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                  {filteredVisits.length} รายการ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ตารางบันทึกการเข้ารับบริการ ข้อมูลสัญญาณชีพ ยาที่ได้รับ และประวัติการรักษาของนักเรียน
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {currentUser.role !== 'teacher' && (
            <button
              onClick={() => onNewVisit()}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-heading font-bold flex items-center space-x-2 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกรับบริการใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          
          {/* Free Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ-นามสกุล, รหัสนักเรียน, เลขที่ VN, อาการสำคัญ, หรือชื่อยา..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full lg:w-auto text-xs">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700"
            >
              <option value="all">ทุกประเภทบริการ</option>
              <option value="จ่ายยา">จ่ายยา</option>
              <option value="ปฐมพยาบาล">ปฐมพยาบาล</option>
              <option value="นอนพักฟื้น">นอนพักฟื้น</option>
              <option value="ทำแผล">ทำแผล</option>
              <option value="ดูแลอุปกรณ์ทางการแพทย์">ดูแลอุปกรณ์การแพทย์</option>
              <option value="ส่งต่อโรงพยาบาล">ส่งต่อโรงพยาบาล</option>
            </select>

            <select
              value={filterSymptomStatus}
              onChange={e => setFilterSymptomStatus(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 font-medium"
            >
              <option value="all">ทุกสถานะเจ็บป่วย</option>
              <option value="กำลังป่วย">🔴 กำลังป่วย (Active)</option>
              <option value="หายแล้ว">🟢 หายแล้ว (Recovered)</option>
              <option value="สบายดี">⚪ สบายดี/ตรวจสุขภาพ</option>
            </select>

            <select
              value={filterOutcome}
              onChange={e => setFilterOutcome(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700"
            >
              <option value="all">ทุกผลการรักษา</option>
              <option value="กลับเข้าชั้นเรียน">กลับเข้าชั้นเรียน</option>
              <option value="พักห้องพยาบาล">พักห้องพยาบาล</option>
              <option value="ติดต่อผู้ปกครอง">ติดต่อผู้ปกครอง</option>
              <option value="ผู้ปกครองมารับกลับบ้าน">กลับบ้าน</option>
              <option value="ส่งต่อโรงพยาบาล">ส่งต่อ รพ.</option>
              <option value="ดีขึ้น">ดีขึ้น</option>
            </select>

            <select
              value={filterReferral}
              onChange={e => setFilterReferral(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700"
            >
              <option value="all">การส่งต่อ (ทั้งหมด)</option>
              <option value="yes">มีการส่งต่อ รพ.</option>
              <option value="no">ไม่มีการส่งต่อ</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              title="กรองตามวันที่มารับบริการ"
              className="rounded-xl border border-slate-300 py-2 px-2 bg-white text-slate-700"
            />
          </div>

        </div>

        {(searchQuery || filterType !== 'all' || filterSymptomStatus !== 'all' || filterOutcome !== 'all' || filterDate || filterReferral !== 'all') && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500">
              พบข้อมูลตรงตามตัวกรอง {filteredVisits.length} รายการ
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterSymptomStatus('all');
                setFilterOutcome('all');
                setFilterDate('');
                setFilterReferral('all');
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* 3. Visits Table (Requirement 1: ตารางการเข้ารับบริการ) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            
            {/* Headers matching Requirement 1:
                - วันที่มารับบริการ
                - เวลา
                - ชื่อ-นามสกุล
                - ชั้น
                - อาการสำคัญ
                - การรักษา / ยาที่ได้รับ / การส่งต่อ
                - ผู้ให้บริการ
                - จัดการ / รายละเอียด
            */}
            <thead className="bg-slate-50/90 text-slate-700 font-heading font-semibold border-b border-slate-200 text-xs">
              <tr>
                <th className="px-3 py-2.5 whitespace-nowrap w-[110px]">วันที่</th>
                <th className="px-2.5 py-2.5 whitespace-nowrap w-[85px]">เวลา</th>
                <th className="px-3 py-2.5 whitespace-nowrap min-w-[170px]">ชื่อ-สกุล</th>
                <th className="px-2 py-2.5 whitespace-nowrap text-center w-[65px]">ชั้น</th>
                <th className="px-3 py-2.5">อาการสำคัญ</th>
                <th className="px-3 py-2.5">การรักษา</th>
                <th className="px-3 py-2.5 whitespace-nowrap w-[130px]">ผู้ให้บริการ</th>
                <th className="px-3 py-2.5 text-right whitespace-nowrap min-w-[155px]">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <History className="w-5 h-5" />
                    </div>
                    <span>ไม่พบรายการการเข้ารับบริการตามเงื่อนไขที่เลือก</span>
                  </td>
                </tr>
              ) : (
                filteredVisits.map(visit => {
                  const student = students.find(s => s.id === visit.studentId);
                  const hasReferral = !!visit.referral || visit.outcome === 'ส่งต่อโรงพยาบาล' || visit.outcome === 'เรียกรถพยาบาล (1669)';

                  return (
                    <tr 
                      key={visit.id} 
                      onClick={() => handleRowClick(visit)}
                      className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      title="คลิกเพื่อดูรายละเอียดการรับบริการฉบับเต็ม"
                    >
                      {/* 1. วันที่ (กระชับ) */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div 
                          className="font-heading font-bold text-slate-900 group-hover:text-teal-900 text-xs"
                          title={formatThaiDatePattern(visit.visitDate)}
                        >
                          {formatThaiDateNumeric(visit.visitDate)}
                        </div>
                        <div className="font-mono text-[10px] text-teal-700 font-semibold">
                          {visit.visitNumber}
                        </div>
                      </td>

                      {/* 2. เวลา */}
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{visit.visitTime} น.</span>
                        </span>
                      </td>

                      {/* 3. ชื่อ-สกุล */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center space-x-2">
                          <img
                            src={student?.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80'}
                            alt={visit.studentName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-slate-900 group-hover:text-teal-700 flex items-center space-x-1">
                              <span className="truncate max-w-[120px]">{student ? `${student.prefix} ${student.firstName} ${student.lastName}` : visit.studentName}</span>
                              {(student?.nickname || visit.nickname) && (
                                <span className="text-[11px] font-normal text-slate-500 flex-shrink-0">
                                  ({student?.nickname || visit.nickname})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                              <span className="font-mono">
                                ID: {student?.studentCode || visit.studentCode}
                              </span>
                              <span>·</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveStudentHistoryId(visit.studentId);
                                }}
                                className="text-teal-600 hover:text-teal-800 font-semibold hover:underline inline-flex items-center"
                                title="ดูประวัติการรักษาของนักเรียนคนนี้"
                              >
                                <span>ดูประวัติ</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. ชั้น */}
                      <td className="px-2 py-2.5 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          {student ? student.classroom : visit.classroom}
                        </span>
                      </td>

                      {/* 5. อาการสำคัญ (กระชับ & ป้องกันข้อความดันตาราง) */}
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-amber-950 text-xs truncate max-w-[200px]" title={(visit.symptoms || []).join(', ')}>
                          {(visit.symptoms || []).join(', ')}
                        </div>
                        {visit.symptomDetails && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={visit.symptomDetails}>
                            {visit.symptomDetails}
                          </div>
                        )}
                        {visit.symptomStatus === 'กำลังป่วย' && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                              <span>กำลังป่วย</span>
                            </span>
                          </div>
                        )}
                        {visit.symptomStatus === 'หายแล้ว' && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span>✓ หายแล้ว</span>
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 whitespace-nowrap">
                          T: {visit.vitals?.temperature || '-'}°C | BP: {visit.vitals?.bloodPressureSys || '-'}/{visit.vitals?.bloodPressureDia || '-'} | O2: {visit.vitals?.oxygenSaturation || '-'}%
                        </div>
                      </td>

                      {/* 6. การรักษา (ย่อหัวข้อ & เนื้อหากระชับ) */}
                      <td className="px-3 py-2.5">
                        <div className="text-slate-800 truncate max-w-[220px] font-medium text-xs" title={(visit.treatments || (visit as any).treatment || []).join(', ')}>
                          {(visit.treatments || (visit as any).treatment || []).join(', ')}
                        </div>

                        {/* ยาที่ได้รับ */}
                        {(visit.dispensedMedicines || []).length > 0 && (
                          <div className="mt-0.5 flex items-center space-x-1 text-teal-700 font-semibold text-[11px] truncate max-w-[220px]" title={(visit.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity} ${m.unit})`).join(', ')}>
                            <Pill className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {(visit.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity} ${m.unit})`).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* การส่งต่อ / Outcome */}
                        <div className="mt-1 flex items-center space-x-1.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getOutcomeBadge(visit.outcome)}`}>
                            {visit.outcome}
                          </span>

                          {hasReferral && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center space-x-0.5">
                              <Ambulance className="w-2.5 h-2.5" />
                              <span>ส่งต่อ รพ.</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. ผู้ให้บริการ */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-xs">
                          {visit.attendantName || 'พว. วันเพ็ญ สุขใจ'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          พยาบาลวิชาชีพ
                        </div>
                      </td>

                      {/* 8. จัดการ */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          
                          {/* Button: ดูรายละเอียด (Requirement 2) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(visit);
                            }}
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-white transition-colors"
                            title="คลิกเพื่อดูรายละเอียดฉบับเต็ม"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Button: คัดลอกประวัติเป็นของวันนี้ (Duplicate to Today) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCopyingVisit(visit);
                              setIsCopyModalOpen(true);
                            }}
                            className="p-1 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors"
                            title="คัดลอกประวัตินี้เป็นของวันนี้"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Button: แก้ไขข้อมูลการรักษา (Edit Visit) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVisit(visit);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                            title="แก้ไขบันทึกการรับบริการ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Button: ดูประวัติการรักษาของนักเรียน (Requirement 3) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStudentHistoryId(visit.studentId);
                            }}
                            className="p-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                            title="ดูประวัติการรักษาของนักเรียนคนนี้"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Button: พิมพ์ Slip */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSlipVisit(visit);
                            }}
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:text-teal-600 transition-colors"
                            title="พิมพ์ใบรับบริการ (Slip)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Button: ลบรายการ (Delete Visit) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingVisitId(visit.id);
                            }}
                            className="p-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="ลบบันทึกการรับบริการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Full Detail Modal (Requirement 2 & 3) */}
      <VisitDetailModal
        visit={selectedDetailVisit}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onViewStudentHistory={(studentId) => {
          setIsDetailModalOpen(false);
          setActiveStudentHistoryId(studentId); // Switch to student's individual history view
        }}
        onPrintSlip={(visit) => {
          setIsDetailModalOpen(false);
          setSelectedSlipVisit(visit);
        }}
        onEdit={(visit) => {
          setIsDetailModalOpen(false);
          setEditingVisit(visit);
          setIsEditModalOpen(true);
        }}
        onCopy={(visit) => {
          setIsDetailModalOpen(false);
          setCopyingVisit(visit);
          setIsCopyModalOpen(true);
        }}
        onDelete={(visitId) => {
          setIsDetailModalOpen(false);
          setDeletingVisitId(visitId);
        }}
      />

      {/* 4.1 Edit Visit Modal */}
      <EditVisitModal
        visit={editingVisit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingVisit(null);
        }}
        onSave={(updatedData) => {
          if (editingVisit) {
            updateVisit(editingVisit.id, updatedData);
          }
        }}
        onDelete={(id) => {
          deleteVisit(id);
        }}
      />

      {/* 4.2 Copy / Duplicate Visit Modal */}
      <CopyVisitModal
        visit={copyingVisit}
        isOpen={isCopyModalOpen}
        onClose={() => {
          setIsCopyModalOpen(false);
          setCopyingVisit(null);
        }}
        onSuccess={() => {
          // Handled inside modal via addVisit
        }}
      />

      {/* 4.3 Delete Visit Confirmation Dialog */}
      {deletingVisitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                ยืนยันการลบบันทึกการรักษา?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                รายการบันทึกนี้จะถูกนำออกจากระบบอย่างถาวร
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVisitId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteVisit(deletingVisitId);
                  setDeletingVisitId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Printable Visit Slip Modal */}
      {selectedSlipVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="px-5 py-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">
                ใบรับรองการรับบริการห้องพยาบาล
              </h3>
              <button 
                onClick={() => setSelectedSlipVisit(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-visit-slip" className="p-6 text-xs text-slate-700 space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="font-heading font-bold text-base text-slate-900">โรงเรียนศึกษาพิเศษชัยนาท</h4>
                <p className="text-[11px] text-slate-500">ใบรับรองการรับบริการห้องพยาบาล (Infirmary Visit Slip)</p>
                <p className="font-mono font-bold text-teal-800 mt-1">เลขที่ VN: {selectedSlipVisit.visitNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">ชื่อนักเรียน: </span>
                  <strong className="text-slate-900">{selectedSlipVisit.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">ระดับชั้น / ห้อง: </span>
                  <strong>ห้อง {selectedSlipVisit.classroom}</strong>
                </div>
                <div>
                  <span className="text-slate-500">วันที่: </span>
                  <strong className="text-slate-900">{formatThaiDatePattern(selectedSlipVisit.visitDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">เวลา: </span>
                  <strong>{selectedSlipVisit.visitTime} น.</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div>
                  <span className="text-slate-500">อาการที่พบ: </span>
                  <strong className="text-slate-900">{(selectedSlipVisit.symptoms || []).join(', ')}</strong>
                </div>
                <div>
                  <span className="text-slate-500">สัญญาณชีพ: </span>
                  <span className="font-mono">
                    T: {selectedSlipVisit.vitals?.temperature || '-'}°C, BP: {selectedSlipVisit.vitals?.bloodPressureSys || '-'}/{selectedSlipVisit.vitals?.bloodPressureDia || '-'}, O2: {selectedSlipVisit.vitals?.oxygenSaturation || '-'}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">การรักษาเบื้องต้น: </span>
                  <span>{(selectedSlipVisit.treatments || (selectedSlipVisit as any).treatment || []).join(', ')}</span>
                </div>
                {(selectedSlipVisit.dispensedMedicines || []).length > 0 && (
                  <div>
                    <span className="text-teal-700 font-bold">ยาที่ได้รับ: </span>
                    <span>
                      {(selectedSlipVisit.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity} ${m.unit}) - ${m.dosage}`).join('; ')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">ผลการตรวจรักษา: </span>
                  <strong className="text-emerald-700">{selectedSlipVisit.outcome}</strong>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-end border-t border-slate-200">
                <div className="text-[11px] text-slate-400">
                  ออกให้ ณ {formatThaiDatePattern(new Date())}
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 pb-1 mb-1">
                    {selectedSlipVisit.attendantName}
                  </div>
                  <span className="text-[10px] text-slate-500">ครูอนามัย / ผู้ตรวจรักษา</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setSelectedSlipVisit(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600"
                >
                  ปิด
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์เอกสาร</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
