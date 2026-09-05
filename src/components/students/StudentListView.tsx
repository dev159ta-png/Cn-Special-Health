import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  QrCode, 
  ShieldAlert, 
  Heart, 
  Phone, 
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { QRCodeModal } from '../common/QRCodeModal';
import { StudentAvatar } from '../common/StudentAvatar';

interface StudentListViewProps {
  onSelectStudent: (student: Student, initialTab?: string) => void;
  onAddNewStudent: () => void;
  onEditStudent: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  onSelectStudent,
  onAddNewStudent,
  onEditStudent
}) => {
  const { filteredStudentsForUser, deleteStudent, currentUser, systemConfig } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterDisability, setFilterDisability] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Unified classroom/grade options
  const unifiedClassroomOptions = useMemo(() => {
    const fromConfig = (systemConfig.classrooms || []).map(c => c.name);
    const fromStudents = filteredStudentsForUser.map(s => s.classroom).filter(Boolean);
    return Array.from(new Set([...fromConfig, ...fromStudents]));
  }, [systemConfig.classrooms, filteredStudentsForUser]);

  // QR Modal state
  const [selectedQRStudent, setSelectedQRStudent] = useState<Student | null>(null);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'nurse';
  const isAdmin = currentUser.role === 'admin';

  // Filtering
  const filteredStudents = useMemo(() => {
    return filteredStudentsForUser.filter(s => {
      // Search
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const fullName = `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase();
        const code = s.studentCode.toLowerCase();
        const nick = s.nickname.toLowerCase();
        const nid = s.nationalId.toLowerCase();
        if (!fullName.includes(query) && !code.includes(query) && !nick.includes(query) && !nid.includes(query)) {
          return false;
        }
      }

      // Unified Grade / Classroom matching
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom && s.grade !== filterClassroom) {
        return false;
      }
      if (filterGender !== 'all' && s.gender !== filterGender) return false;
      if (filterDisability !== 'all' && !(s.disabilities || []).some(d => d.typeId === filterDisability)) return false;

      return true;
    });
  }, [filteredStudentsForUser, searchQuery, filterClassroom, filterGender, filterDisability]);

  const handleDelete = (s: Student) => {
    if (window.confirm(`ยืนยันการลบข้อมูลนักเรียน "${s.prefix} ${s.firstName} ${s.lastName}" หรือไม่?`)) {
      deleteStudent(s.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-bold text-xl text-slate-800">
              ทะเบียนข้อมูลนักเรียนพิการ
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {filteredStudents.length} คน
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.role === 'teacher' 
              ? `แสดงเฉพาะนักเรียนในห้องเรียน ${currentUser.assignedClassroom || 'ที่รับผิดชอบ'}`
              : 'ศูนย์ข้อมูลนักเรียนพิการ ทะเบียนประวัติ ข้อมูลสุขภาพ และบัตรฉุกเฉินประจำตัว'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add Student button */}
          {canManage && (
            <button
              onClick={onAddNewStudent}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มข้อมูลนักเรียน</span>
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-600'
              }`}
            >
              การ์ด
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-600'
              }`}
            >
              ตาราง
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ, นามสกุล, ชื่อเล่น, รหัสนักเรียน, หรือเลขบัตร ปชช. ..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto text-xs">
            <select
              value={filterClassroom}
              onChange={e => setFilterClassroom(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-teal-500 font-semibold"
            >
              <option value="all">ทุกระดับชั้น/ห้อง</option>
              {unifiedClassroomOptions.map(roomName => (
                <option key={roomName} value={roomName}>{roomName}</option>
              ))}
            </select>

            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-teal-500"
            >
              <option value="all">ทุกเพศ</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>

            <select
              value={filterDisability}
              onChange={e => setFilterDisability(e.target.value)}
              className="rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-teal-500"
            >
              <option value="all">ทุกประเภทความพิการ</option>
              {(systemConfig.disabilityCategories || []).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-sm">ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const hasAllergy = (student.drugAllergies || []).length > 0;
              const hasDevices = (student.medicalDevices || []).length > 0;
              const hasSeizureOrCritical = (student.chronicDiseases || []).some(c => 
                c.diseaseName.includes('ชัก') || c.diseaseName.includes('หอบหืด')
              );

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top / Badges */}
                    <div className="p-4 pb-3 border-b border-slate-100 flex items-start space-x-3.5">
                      <StudentAvatar
                        src={student.photoUrl}
                        gender={student.gender}
                        name={student.firstName}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-teal-700">
                            {student.studentCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            ห้อง {student.classroom}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-base text-slate-900 truncate">
                          {student.prefix} {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          ชื่อเล่น: <strong className="text-slate-700">{student.nickname}</strong> • อายุ {student.age} ปี • เลือดกรุ๊ป {student.bloodType}
                        </p>
                      </div>
                    </div>

                    {/* Disability & Health Badges */}
                    <div className="p-4 py-3 space-y-2 text-xs">
                      {/* Disabilities list */}
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 block mb-1">ความพิการ:</span>
                        <div className="flex flex-wrap gap-1">
                          {(student.disabilities || []).map(d => (
                            <span 
                              key={d.typeId}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-100"
                            >
                              {d.typeName}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Health Warning Alerts */}
                      <div className="space-y-1 pt-1">
                        {hasAllergy && (
                          <div className="flex items-center space-x-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <span className="text-xs">🔴</span>
                            <span className="font-bold truncate">
                              แพ้ยา: {(student.drugAllergies || []).map(a => a.drugName).join(', ')}
                            </span>
                          </div>
                        )}

                        {(student.foodAllergies || []).length > 0 && (
                          <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <span className="text-xs">⚠️</span>
                            <span className="font-medium truncate">
                              แพ้อาหาร: {(student.foodAllergies || []).map(a => a.foodName).join(', ')}
                            </span>
                          </div>
                        )}

                        {hasDevices && (
                          <div className="flex items-center space-x-1.5 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                            <Activity className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-medium truncate">
                              ท่อ/อุปกรณ์: {(student.medicalDevices || []).map(m => m.deviceType).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Guardian contact */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>ผู้ปกครอง: {student.guardianName} ({student.guardianRelationship})</span>
                        <a 
                          href={`tel:${student.guardianPhone}`}
                          className="text-teal-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{student.guardianPhone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <button
                      onClick={() => onSelectStudent(student, 'health')}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center space-x-1 shadow-2xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ข้อมูลสุขภาพ</span>
                    </button>

                    <button
                      onClick={() => onSelectStudent(student, 'emergency')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center space-x-1 shadow-2xs transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>ฉุกเฉิน</span>
                    </button>

                    <button
                      onClick={() => setSelectedQRStudent(student)}
                      className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="QR Code ประจำตัว"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {canManage && (
                      <button
                        onClick={() => onEditStudent(student)}
                        className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(student)}
                        className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                        title="ลบข้อมูลนักเรียน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-heading font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">รหัส / นักเรียน</th>
                  <th className="px-4 py-3">ระดับชั้น / ห้อง</th>
                  <th className="px-4 py-3">ความพิการ</th>
                  <th className="px-4 py-3">โรคประจำตัว & แพ้ยา</th>
                  <th className="px-4 py-3">อุปกรณ์ทางการแพทย์</th>
                  <th className="px-4 py-3">เบอร์โทรฉุกเฉิน</th>
                  <th className="px-4 py-3 text-right">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <StudentAvatar
                          src={student.photoUrl}
                          gender={student.gender}
                          name={student.firstName}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {student.prefix} {student.firstName} {student.lastName} ({student.nickname})
                          </div>
                          <div className="text-[11px] font-mono text-teal-700">
                            {student.studentCode} • เลือดกรุ๊ป {student.bloodType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {student.grade} ({student.classroom})
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="truncate text-slate-800 font-medium">
                        {(student.disabilities || []).map(d => d.typeName).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(student.drugAllergies || []).length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 block w-fit mb-1">
                          แพ้ยา: {(student.drugAllergies || []).map(d => d.drugName).join(', ')}
                        </span>
                      )}
                      {(student.chronicDiseases || []).length > 0 && (
                        <span className="text-slate-600 block text-[11px]">
                          โรค: {(student.chronicDiseases || []).map(c => c.diseaseName).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(student.medicalDevices || []).length > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                          {(student.medicalDevices || []).map(m => m.deviceType).join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{student.guardianPhone}</div>
                      <div className="text-[10px] text-slate-400">{student.guardianName} ({student.guardianRelationship})</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectStudent(student, 'health')}
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                          title="ดูข้อมูลสุขภาพ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedQRStudent(student)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQRStudent && (
        <QRCodeModal
          student={selectedQRStudent}
          isOpen={true}
          onClose={() => setSelectedQRStudent(null)}
          onViewEmergency={id => {
            setSelectedQRStudent(null);
            const st = filteredStudents.find(x => x.id === id);
            if (st) onSelectStudent(st, 'emergency');
          }}
        />
      )}
    </div>
  );
};
