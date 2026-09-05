import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicalAppointment } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  CalendarDays, 
  List, 
  Printer, 
  Trash2, 
  Edit3, 
  X, 
  Building2, 
  Stethoscope, 
  FileText,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export const DoctorAppointmentCalendarView: React.FC = () => {
  const { 
    appointments, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    students,
    currentUser 
  } = useApp();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<MedicalAppointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<MedicalAppointment | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printAppointment, setPrintAppointment] = useState<MedicalAppointment | null>(null);

  // Form Fields State
  const [formStudentId, setFormStudentId] = useState('');
  const [formHospital, setFormHospital] = useState('โรงพยาบาลชัยนาทนเรนทร');
  const [formClinic, setFormClinic] = useState('');
  const [formDoctor, setFormDoctor] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState('09:00');
  const [formPurpose, setFormPurpose] = useState('');
  const [formPreparation, setFormPreparation] = useState('');
  const [formStatus, setFormStatus] = useState<MedicalAppointment['status']>('upcoming');
  const [formStatusNote, setFormStatusNote] = useState('');
  const [formAccompanying, setFormAccompanying] = useState('');
  const [formRemindDays, setFormRemindDays] = useState(2);
  const [formNotes, setFormNotes] = useState('');

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiBuddhistYear = year + 543;

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateFilter(null);
  };

  // Open Form for Create
  const handleOpenAddModal = (presetDate?: string) => {
    setEditingAppointment(null);
    setFormStudentId(students[0]?.id || '');
    setFormHospital('โรงพยาบาลชัยนาทนเรนทร');
    setFormClinic('');
    setFormDoctor('');
    setFormDate(presetDate || new Date().toISOString().slice(0, 10));
    setFormTime('09:00');
    setFormPurpose('');
    setFormPreparation('');
    setFormStatus('upcoming');
    setFormStatusNote('');
    setFormAccompanying(currentUser?.name || 'ครูประจำชั้น');
    setFormRemindDays(2);
    setFormNotes('');
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (apt: MedicalAppointment) => {
    setEditingAppointment(apt);
    setFormStudentId(apt.studentId);
    setFormHospital(apt.hospitalName);
    setFormClinic(apt.clinicOrDepartment);
    setFormDoctor(apt.doctorName || '');
    setFormDate(apt.appointmentDate);
    setFormTime(apt.appointmentTime);
    setFormPurpose(apt.purpose);
    setFormPreparation(apt.preparation || '');
    setFormStatus(apt.status);
    setFormStatusNote(apt.statusNote || '');
    setFormAccompanying(apt.accompanyingPerson || '');
    setFormRemindDays(apt.remindDaysBefore || 2);
    setFormNotes(apt.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const selStudent = students.find(s => s.id === formStudentId);
    if (!selStudent) return;

    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        studentId: selStudent.id,
        studentName: `${selStudent.prefix}${selStudent.firstName} ${selStudent.lastName}`,
        nickname: selStudent.nickname,
        studentCode: selStudent.studentCode,
        grade: selStudent.grade,
        classroom: selStudent.classroom,
        hospitalName: formHospital,
        clinicOrDepartment: formClinic,
        doctorName: formDoctor,
        appointmentDate: formDate,
        appointmentTime: formTime,
        purpose: formPurpose,
        preparation: formPreparation,
        status: formStatus,
        statusNote: formStatusNote,
        accompanyingPerson: formAccompanying,
        remindDaysBefore: formRemindDays,
        notes: formNotes
      });
    } else {
      addAppointment({
        studentId: selStudent.id,
        studentName: `${selStudent.prefix}${selStudent.firstName} ${selStudent.lastName}`,
        nickname: selStudent.nickname,
        studentCode: selStudent.studentCode,
        grade: selStudent.grade,
        classroom: selStudent.classroom,
        hospitalName: formHospital,
        clinicOrDepartment: formClinic,
        doctorName: formDoctor,
        appointmentDate: formDate,
        appointmentTime: formTime,
        purpose: formPurpose,
        preparation: formPreparation,
        status: formStatus,
        statusNote: formStatusNote,
        accompanyingPerson: formAccompanying,
        remindDaysBefore: formRemindDays,
        notes: formNotes
      });
    }

    setIsFormOpen(false);
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          apt.studentName.toLowerCase().includes(q) ||
          apt.studentCode.toLowerCase().includes(q) ||
          (apt.nickname && apt.nickname.toLowerCase().includes(q)) ||
          apt.hospitalName.toLowerCase().includes(q) ||
          apt.clinicOrDepartment.toLowerCase().includes(q) ||
          (apt.doctorName && apt.doctorName.toLowerCase().includes(q)) ||
          apt.purpose.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false;
      }

      // Selected date filter
      if (selectedDateFilter && apt.appointmentDate !== selectedDateFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(`${b.appointmentDate} ${b.appointmentTime}`));
  }, [appointments, searchQuery, statusFilter, selectedDateFilter]);

  // Status badges & helpers
  const getStatusBadge = (status: MedicalAppointment['status']) => {
    switch (status) {
      case 'upcoming':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3" /> กำลังจะมาถึง</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> ไปตามนัดแล้ว</span>;
      case 'postponed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3 h-3" /> เลื่อนนัด</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"><X className="w-3 h-3" /> ยกเลิก</span>;
    }
  };

  // Today string
  const todayStr = new Date().toISOString().slice(0, 10);

  // Statistics
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;
  const todayCount = appointments.filter(a => a.appointmentDate === todayStr).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div id="doctor-appointment-calendar-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ปฏิทินนัดพบหมอสำหรับนักเรียน</h1>
              <p className="text-xs text-gray-500">จัดการตารางนัดหมายแพทย์ โรงพยาบาล และการติดตามผลการรักษานักเรียนพิการ</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-white text-teal-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              ปฏิทินรายเดือน
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-teal-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              รายการทั้งหมด
            </button>
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            เพิ่มนัดพบหมอ
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">นัดหมายที่กำลังจะมาถึง</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{upcomingCount} <span className="text-xs font-normal text-gray-400">รายการ</span></p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">มีนัดในวันนี้</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{todayCount} <span className="text-xs font-normal text-gray-400">รายการ</span></p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">ตรวจรักษาเรียบร้อยแล้ว</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{completedCount} <span className="text-xs font-normal text-gray-400">รายการ</span></p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content: Calendar or List */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid Container */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {monthNamesThai[month]} {thaiBuddhistYear}
                </h2>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  วันนี้
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-gray-500">
              <span className="text-red-500">อา.</span>
              <span>จ.</span>
              <span>อ.</span>
              <span>พ.</span>
              <span>พฤ.</span>
              <span>ศ.</span>
              <span className="text-blue-500">ส.</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Previous month padding days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                const prevDay = daysInPrevMonth - firstDayOfMonth + i + 1;
                return (
                  <div 
                    key={`prev-${i}`} 
                    className="h-24 p-1.5 border border-gray-50 bg-gray-50/50 rounded-lg text-gray-300 pointer-events-none"
                  >
                    <span>{prevDay}</span>
                  </div>
                );
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = dayNum.toString().padStart(2, '0');
                const formattedMonth = (month + 1).toString().padStart(2, '0');
                const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

                const isToday = dateKey === todayStr;
                const isSelected = selectedDateFilter === dateKey;

                // Find appointments for this day
                const dayAppointments = appointments.filter(a => a.appointmentDate === dateKey);

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDateFilter(null);
                      } else {
                        setSelectedDateFilter(dateKey);
                      }
                    }}
                    className={`h-24 p-1.5 border rounded-lg transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-200'
                        : isToday
                        ? 'border-blue-400 bg-blue-50/20 font-semibold'
                        : 'border-gray-100 hover:border-teal-300 hover:bg-gray-50/70 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                        isToday 
                          ? 'bg-blue-600 text-white font-bold' 
                          : isSelected 
                          ? 'bg-teal-600 text-white font-bold' 
                          : 'text-gray-700'
                      }`}>
                        {dayNum}
                      </span>
                      {dayAppointments.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-14">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingAppointment(apt);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium ${
                            apt.status === 'upcoming'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : apt.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'postponed'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                          title={`${apt.studentName} (${apt.appointmentTime} น.) - ${apt.hospitalName}`}
                        >
                          {apt.appointmentTime} {apt.nickname ? `(${apt.nickname})` : apt.studentName.split(' ')[1] || apt.studentName}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[9px] text-gray-500 font-medium px-1">
                          +{dayAppointments.length - 2} นัดหมาย
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Day / Upcoming Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {selectedDateFilter ? (
                    <>นัดหมายวันที่ {selectedDateFilter}</>
                  ) : (
                    <>นัดหมายเร็วๆ นี้</>
                  )}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedDateFilter ? 'คลิกที่วันเดิมเพื่อล้างตัวกรอง' : 'ลำดับนัดหมายทางการแพทย์'}
                </p>
              </div>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  แสดงทั้งหมด
                </button>
              )}
            </div>

            {/* List for right column */}
            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">ไม่มีนัดหมายในวันที่เลือก</p>
                  <button
                    onClick={() => handleOpenAddModal(selectedDateFilter || undefined)}
                    className="mt-3 text-xs text-teal-600 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> เพิ่มนัดหมายในวันนี้
                  </button>
                </div>
              ) : (
                filteredAppointments.map(apt => (
                  <div
                    key={apt.id}
                    onClick={() => setViewingAppointment(apt)}
                    className="p-3.5 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-xs bg-gray-50/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-semibold text-gray-900 text-sm group-hover:text-teal-700 transition-colors">
                        {apt.studentName} {apt.nickname && <span className="text-gray-500 font-normal">({apt.nickname})</span>}
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-[11px]">{apt.studentCode}</span>
                      <span>ชั้น {apt.grade} ({apt.classroom})</span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{apt.appointmentDate} เวลา {apt.appointmentTime} น.</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{apt.hospitalName} ({apt.clinicOrDepartment})</span>
                      </div>
                      {apt.doctorName && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Stethoscope className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{apt.doctorName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัสนักเรียน, โรงพยาบาล, อาการ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="upcoming">กำลังจะมาถึง</option>
                  <option value="completed">ไปตามนัดแล้ว</option>
                  <option value="postponed">เลื่อนนัด</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              พบ {filteredAppointments.length} รายการนัดหมาย
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">วัน-เวลานัด</th>
                  <th className="px-4 py-3">นักเรียน</th>
                  <th className="px-4 py-3">โรงพยาบาล / แผนก</th>
                  <th className="px-4 py-3">แพทย์ / วัตถุประสงค์</th>
                  <th className="px-4 py-3">ผู้พาไป</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      ไม่พบนัดหมายทางการแพทย์ตามเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{apt.appointmentDate}</div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {apt.appointmentTime} น.
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {apt.studentName} {apt.nickname && <span className="text-gray-400">({apt.nickname})</span>}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {apt.studentCode} • ชั้น {apt.grade} ({apt.classroom})
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{apt.hospitalName}</div>
                        <div className="text-gray-500 text-[11px]">{apt.clinicOrDepartment}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {apt.doctorName && (
                          <div className="text-purple-700 font-medium text-[11px]">{apt.doctorName}</div>
                        )}
                        <div className="text-gray-700 line-clamp-2">{apt.purpose}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {apt.accompanyingPerson || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPrintAppointment(apt);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="พิมพ์ใบนัดพบแพทย์"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(apt)}
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูลนัดหมาย"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`ยืนยันการลบนัดหมายของ ${apt.studentName} หรือไม่?`)) {
                                deleteAppointment(apt.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบนัดหมาย"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {viewingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="text-xs text-teal-600 font-semibold uppercase tracking-wider">รายละเอียดการนัดพบแพทย์</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{viewingAppointment.studentName}</h3>
                <p className="text-xs text-gray-500">
                  รหัส {viewingAppointment.studentCode} • ชั้น {viewingAppointment.grade} ({viewingAppointment.classroom})
                </p>
              </div>
              <button
                onClick={() => setViewingAppointment(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-gray-400 block mb-0.5">วัน-เวลานัด</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
                    {viewingAppointment.appointmentDate} เวลา {viewingAppointment.appointmentTime} น.
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">สถานะการตรวจ</span>
                  {getStatusBadge(viewingAppointment.status)}
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">สถานพยาบาล / แผนก:</span>
                <p className="font-semibold text-gray-800 text-sm">{viewingAppointment.hospitalName}</p>
                <p className="text-gray-600">{viewingAppointment.clinicOrDepartment}</p>
              </div>

              {viewingAppointment.doctorName && (
                <div>
                  <span className="text-gray-500 font-medium block mb-1">แพทย์ผู้ตรวจ:</span>
                  <p className="font-semibold text-purple-700">{viewingAppointment.doctorName}</p>
                </div>
              )}

              <div>
                <span className="text-gray-500 font-medium block mb-1">วัตถุประสงค์การนัด / รายการตรวจ:</span>
                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-blue-900 leading-relaxed">
                  {viewingAppointment.purpose}
                </div>
              </div>

              {viewingAppointment.preparation && (
                <div>
                  <span className="text-gray-500 font-medium block mb-1">คำแนะนำการเตรียมตัวก่อนตรวจ:</span>
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
                    {viewingAppointment.preparation}
                  </div>
                </div>
              )}

              {viewingAppointment.statusNote && (
                <div>
                  <span className="text-gray-500 font-medium block mb-1">บันทึกผลการตรวจ / ผลการติดตาม:</span>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 leading-relaxed">
                    {viewingAppointment.statusNote}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-gray-600">
                <div>
                  <span className="text-gray-400 block">ผู้ติดตาม / ครูที่พาไป:</span>
                  <span className="font-medium text-gray-800">{viewingAppointment.accompanyingPerson || 'ไม่ระบุ'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">แจ้งเตือนล่วงหน้า:</span>
                  <span className="font-medium text-gray-800">{viewingAppointment.remindDaysBefore || 2} วัน</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setPrintAppointment(viewingAppointment);
                  setViewingAppointment(null);
                  setIsPrintModalOpen(true);
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                พิมพ์ใบนัด
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditModal(viewingAppointment);
                    setViewingAppointment(null);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  แก้ไขข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Appointment Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingAppointment ? 'แก้ไขนัดหมายแพทย์' : 'เพิ่มนัดหมายพบหมอสำหรับนักเรียน'}
                </h3>
                <p className="text-xs text-gray-500">กรอกข้อมูลการนัดตรวจ ติดตามอาการ หรือเปลี่ยนอุปกรณ์ทางการแพทย์</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Select Student */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  นักเรียน <span className="text-red-500">*</span>
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} {s.nickname ? `(${s.nickname})` : ''} (ชั้น {s.grade} {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hospital & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    โรงพยาบาล / สถานพยาบาล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formHospital}
                    onChange={(e) => setFormHospital(e.target.value)}
                    required
                    placeholder="เช่น โรงพยาบาลชัยนาทนเรนทร"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['รพ.ชัยนาทนเรนทร', 'รพ.สวรรค์ประชารักษ์', 'ศูนย์ฟื้นฟูสมรรถภาพ'].map(chip => (
                      <button
                        type="button"
                        key={chip}
                        onClick={() => setFormHospital(chip)}
                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] text-gray-600 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    แผนก / คลินิกเฉพาะทาง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formClinic}
                    onChange={(e) => setFormClinic(e.target.value)}
                    required
                    placeholder="เช่น แผนกประสาทวิทยา, แผนกจักษุ, หูคอจมูก"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Doctor Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  แพทย์ผู้ตรวจ (ถ้าทราบ)
                </label>
                <input
                  type="text"
                  value={formDoctor}
                  onChange={(e) => setFormDoctor(e.target.value)}
                  placeholder="เช่น พญ. พรพิมล เกียรติวิทยา (กุมารแพทย์)"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    วันที่นัดหมาย <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    เวลานัดหมาย <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  วัตถุประสงค์การนัด / อาการที่ต้องติดตาม <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  required
                  rows={2}
                  placeholder="เช่น ตรวจติดตามอาการโรคลมชัก, เปลี่ยนสายให้อาหารทางหน้าท้อง, ตรวจวัดสายตาเพื่อตัดแว่นพิเศษ"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
              </div>

              {/* Preparation */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  คำแนะนำการเตรียมตัวก่อนไปพบแพทย์
                </label>
                <input
                  type="text"
                  value={formPreparation}
                  onChange={(e) => setFormPreparation(e.target.value)}
                  placeholder="เช่น งดอาหารล่วงหน้า 4 ชม., นำเครื่องช่วยฟังและแบตเตอรี่สำรองมาด้วย"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Accompanying & Reminder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    ผู้ติดตาม / ครูที่พาไป
                  </label>
                  <input
                    type="text"
                    value={formAccompanying}
                    onChange={(e) => setFormAccompanying(e.target.value)}
                    placeholder="เช่น ครูประจำชั้น และผู้ปกครอง"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    สถานะการนัด
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="upcoming">กำลังจะมาถึง</option>
                    <option value="completed">ไปตามนัดแล้ว</option>
                    <option value="postponed">เลื่อนนัด</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>
              </div>

              {/* Status Note (especially if completed or postponed) */}
              {(formStatus === 'completed' || formStatus === 'postponed') && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {formStatus === 'completed' ? 'บันทึกผลการตรวจจากแพทย์' : 'สาเหตุการเลื่อนนัด / วันนัดใหม่'}
                  </label>
                  <textarea
                    value={formStatusNote}
                    onChange={(e) => setFormStatusNote(e.target.value)}
                    rows={2}
                    placeholder={formStatus === 'completed' ? 'เช่น ผลตรวจคลื่นสมองปกติ ปรับลดยากันชัก นัดใหม่อีก 3 เดือน' : 'เช่น นักเรียนมีไข้ เลื่อนไปตรวจสัปดาห์หน้า'}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {editingAppointment ? 'บันทึกการแก้ไข' : 'เพิ่มนัดหมาย'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Slip Modal */}
      {isPrintModalOpen && printAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-teal-600" />
                ใบนัดพบแพทย์และเอกสารนำส่งตรวจ
              </h3>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 space-y-4 text-xs text-gray-800">
              <div className="text-center border-b border-gray-200 pb-3">
                <h4 className="font-bold text-sm text-gray-900">เอกสารนัดพบแพทย์สำหรับนักเรียน</h4>
                <p className="text-[11px] text-gray-500">งานห้องพยาบาลและการส่งต่อทางการแพทย์ โรงเรียนการศึกษาพิเศษ</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">ชื่อนักเรียน:</span>
                  <p className="font-bold text-gray-900">{printAppointment.studentName}</p>
                </div>
                <div>
                  <span className="text-gray-500">รหัสนักเรียน / ชั้น:</span>
                  <p className="font-bold text-gray-900">{printAppointment.studentCode} (ชั้น {printAppointment.grade} {printAppointment.classroom})</p>
                </div>
                <div>
                  <span className="text-gray-500">โรงพยาบาล:</span>
                  <p className="font-semibold text-teal-800">{printAppointment.hospitalName}</p>
                </div>
                <div>
                  <span className="text-gray-500">แผนก / คลินิก:</span>
                  <p className="font-semibold text-gray-800">{printAppointment.clinicOrDepartment}</p>
                </div>
                <div>
                  <span className="text-gray-500">วัน-เวลาตรวจ:</span>
                  <p className="font-bold text-blue-700">{printAppointment.appointmentDate} เวลา {printAppointment.appointmentTime} น.</p>
                </div>
                <div>
                  <span className="text-gray-500">แพทย์ผู้นัดตรวจ:</span>
                  <p className="font-medium text-gray-800">{printAppointment.doctorName || 'แพทย์ประจำคลินิก'}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block mb-0.5">วัตถุประสงค์การตรวจ:</span>
                <p className="p-2 bg-white rounded border border-gray-200 font-medium">{printAppointment.purpose}</p>
              </div>

              {printAppointment.preparation && (
                <div>
                  <span className="text-gray-500 block mb-0.5">การเตรียมตัวก่อนพบแพทย์:</span>
                  <p className="p-2 bg-amber-50 text-amber-900 rounded border border-amber-200 font-medium">{printAppointment.preparation}</p>
                </div>
              )}

              <div className="pt-2 flex justify-between text-[11px] text-gray-500 border-t border-gray-200">
                <span>ผู้รับผิดชอบพานักเรียนไป: {printAppointment.accompanyingPerson || '-'}</span>
                <span>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-medium"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                สั่งพิมพ์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
