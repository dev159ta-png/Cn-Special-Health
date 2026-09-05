import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { 
  Heart, 
  Activity, 
  AlertOctagon, 
  Pill, 
  Search, 
  Filter, 
  GraduationCap, 
  Eye, 
  Plus, 
  ChevronRight,
  ShieldAlert,
  QrCode,
  CheckCircle2,
  Syringe,
  Scale
} from 'lucide-react';
import { QRCodeModal } from '../common/QRCodeModal';

interface StudentHealthDirectoryViewProps {
  onSelectStudent: (student: Student, initialTab?: string) => void;
  onNewVisit: (studentId?: string) => void;
}

export const StudentHealthDirectoryView: React.FC<StudentHealthDirectoryViewProps> = ({
  onSelectStudent,
  onNewVisit
}) => {
  const { filteredStudentsForUser, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'devices' | 'allergies' | 'chronic' | 'vaccines'>('all');
  const [filterClassroom, setFilterClassroom] = useState('all');
  const [selectedQRStudent, setSelectedQRStudent] = useState<Student | null>(null);

  // Classrooms
  const classrooms = useMemo(() => {
    return Array.from(new Set(filteredStudentsForUser.map(s => s.classroom))).sort();
  }, [filteredStudentsForUser]);

  // Counts
  const totalWithDevices = filteredStudentsForUser.filter(s => s.medicalDevices.length > 0).length;
  const totalWithAllergies = filteredStudentsForUser.filter(s => s.drugAllergies.length > 0 || s.foodAllergies.length > 0).length;
  const totalWithChronic = filteredStudentsForUser.filter(s => s.chronicDiseases.length > 0).length;

  // Filter students
  const displayedStudents = useMemo(() => {
    return filteredStudentsForUser.filter(s => {
      const medicalDevices = s.medicalDevices || [];
      const drugAllergies = s.drugAllergies || [];
      const foodAllergies = s.foodAllergies || [];
      const chronicDiseases = s.chronicDiseases || [];

      if (filterTag === 'devices' && medicalDevices.length === 0) return false;
      if (filterTag === 'allergies' && drugAllergies.length === 0 && foodAllergies.length === 0) return false;
      if (filterTag === 'chronic' && chronicDiseases.length === 0) return false;

      if (filterClassroom !== 'all' && s.classroom !== filterClassroom) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${s.prefix || ''}${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const nick = (s.nickname || '').toLowerCase();
        const code = (s.studentCode || '').toLowerCase();
        const devices = medicalDevices.map(m => (m.deviceType || '').toLowerCase()).join(' ');
        const chronic = chronicDiseases.map(c => (c.diseaseName || '').toLowerCase()).join(' ');
        const allergies = drugAllergies.map(a => (a.drugName || '').toLowerCase()).join(' ');

        if (!fullName.includes(q) && !nick.includes(q) && !code.includes(q) && !devices.includes(q) && !chronic.includes(q) && !allergies.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [filteredStudentsForUser, filterTag, filterClassroom, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>ข้อมูลสุขภาพและเวชระเบียน</span>
              </span>
              <span className="text-xs text-slate-500">
                นักเรียนทั้งหมด {filteredStudentsForUser.length} คน
              </span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-slate-800 mt-1">
              ข้อมูลสุขภาพ & อุปกรณ์ทางการแพทย์ประจำตัว
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ศูนย์รวมเวชระเบียนนักเรียนพิการ ท่อช่วยหายใจ สายให้อาหาร โรคประจำตัว ยาประจำวัน และประวัติวัคซีน
            </p>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterTag('devices')}
              className={`p-3 rounded-2xl border transition-all text-left ${
                filterTag === 'devices' 
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-semibold text-purple-700 block">🩺 อุปกรณ์/สายท่อ</span>
              <span className="font-heading font-bold text-lg text-slate-800">{totalWithDevices} คน</span>
            </button>

            <button
              onClick={() => setFilterTag('allergies')}
              className={`p-3 rounded-2xl border transition-all text-left ${
                filterTag === 'allergies' 
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-semibold text-rose-700 block">🚨 มีประวัติแพ้ยา/อาหาร</span>
              <span className="font-heading font-bold text-lg text-slate-800">{totalWithAllergies} คน</span>
            </button>

            <button
              onClick={() => setFilterTag('chronic')}
              className={`p-3 rounded-2xl border transition-all text-left ${
                filterTag === 'chronic' 
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-semibold text-amber-700 block">💊 โรคประจำตัว</span>
              <span className="font-heading font-bold text-lg text-slate-800">{totalWithChronic} คน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามชื่อนักเรียน, รหัส, โรคประจำตัว, ชนิดอุปกรณ์การแพทย์..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm outline-hidden bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setFilterTag('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTag === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterTag('devices')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTag === 'devices'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              มีอุปกรณ์พิเศษ
            </button>
            <button
              onClick={() => setFilterTag('allergies')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTag === 'allergies'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              แพ้ยา/อาหาร
            </button>
            <button
              onClick={() => setFilterTag('chronic')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterTag === 'chronic'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              โรคประจำตัว
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
          <span>กรองห้องเรียน:</span>
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">ทุกห้องเรียน</option>
            {classrooms.map(c => (
              <option key={c} value={c}>ห้อง {c}</option>
            ))}
          </select>
          <span className="ml-auto font-medium text-slate-600">
            แสดง {displayedStudents.length} คน
          </span>
        </div>
      </div>

      {/* Students Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedStudents.map(student => {
          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.photoUrl}
                      alt={student.firstName}
                      className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-teal-700">
                          {student.studentCode}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          ห้อง {student.classroom}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        {student.prefix}{student.firstName} {student.lastName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        ({student.nickname}) • กรุ๊ป {student.bloodType} • {student.age} ปี
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedQRStudent(student)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                {/* Health details */}
                <div className="mt-4 space-y-2 text-xs">
                  {/* Medical Devices */}
                  {(student.medicalDevices || []).length > 0 ? (
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
                      <strong className="block text-purple-950 font-bold mb-0.5">🩺 อุปกรณ์การแพทย์:</strong>
                      <span>{(student.medicalDevices || []).map(m => m.deviceType).join(', ')}</span>
                    </div>
                  ) : null}

                  {/* Chronic Diseases */}
                  {(student.chronicDiseases || []).length > 0 ? (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      <strong className="block text-amber-950 font-bold mb-0.5">💊 โรคประจำตัว:</strong>
                      <span>{(student.chronicDiseases || []).map(c => c.diseaseName).join(', ')}</span>
                    </div>
                  ) : null}

                  {/* Drug Allergies */}
                  {(student.drugAllergies || []).length > 0 ? (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                      <strong className="block text-rose-950 font-bold mb-0.5">🚨 ประวัติแพ้ยา:</strong>
                      <span>{(student.drugAllergies || []).map(a => `${a.drugName} (${a.severity})`).join(', ')}</span>
                    </div>
                  ) : null}

                  {/* Clean health status if none */}
                  {(student.medicalDevices || []).length === 0 && (student.chronicDiseases || []).length === 0 && (student.drugAllergies || []).length === 0 && (
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-600 text-xs">
                      สุขภาพทั่วไปปกติ ไม่มีอุปกรณ์การแพทย์พิเศษหรือประวัติแพ้ยา
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => onNewVisit(student.id)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>รับบริการ</span>
                </button>

                <button
                  onClick={() => onSelectStudent(student, 'devices')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center space-x-1 transition-colors"
                >
                  <span>เวชระเบียนฉบับเต็ม</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Modal */}
      {selectedQRStudent && (
        <QRCodeModal
          student={selectedQRStudent}
          isOpen={!!selectedQRStudent}
          onClose={() => setSelectedQRStudent(null)}
          onViewEmergency={() => onSelectStudent(selectedQRStudent, 'emergency')}
        />
      )}
    </div>
  );
};
