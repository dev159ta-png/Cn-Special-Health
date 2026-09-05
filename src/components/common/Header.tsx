import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatThaiDateCompact, formatThaiDatePattern } from '../../utils/dateUtils';
import { 
  Bell, 
  ShieldAlert, 
  User as UserIcon, 
  Menu, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  LogOut,
  Hospital,
  AlertOctagon,
  HeartPulse,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Cloud,
  CloudCheck,
  Loader2,
  LogIn
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (tabId: string, subTab?: string, param?: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onNavigate,
  isSidebarCollapsed = false,
  onToggleCollapse 
}) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    medicines,
    lowStockMedicinesCount, 
    expiringMedicinesCount,
    expiredMedicinesCount,
    systemConfig,
    firebaseUser,
    isFirebaseConnected,
    isSyncing,
    syncError,
    loginWithGoogle,
    logoutFirebase,
    syncAllToFirebase
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      await syncAllToFirebase();
      setSyncFeedback('ซิงค์ข้อมูลสำเร็จ!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      setSyncFeedback(err.message || 'ซิงค์ไม่สำเร็จ');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Critical alerts
  const alertMedicines = medicines.filter(m => {
    const isLow = m.currentStock <= m.minimumStock;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(m.expiryDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return isLow || diffDays <= 90;
  });

  const totalAlerts = lowStockMedicinesCount + expiringMedicinesCount + expiredMedicinesCount;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center space-x-3">
          {/* Mobile Sidebar Toggle */}
          <button
            id="btn-mobile-sidebar-toggle"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            aria-label="เปิดเมนูนำทาง"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Sidebar Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              id="btn-desktop-sidebar-toggle"
              onClick={onToggleCollapse}
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isSidebarCollapsed 
                  ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100 shadow-2xs' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={isSidebarCollapsed ? 'ขยายแถบเมนูด้านซ้ายกลับมา (คลิกเพื่อแสดงเมนู)' : 'หุบแถบเมนูไปด้านซ้าย เพื่อเพิ่มพื้นที่การทำงาน'}
              aria-label={isSidebarCollapsed ? 'ขยายเมนู' : 'หุบเมนู'}
            >
              {isSidebarCollapsed ? (
                <>
                  <ChevronRight className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-heading font-bold text-teal-800">แสดงเมนู</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-heading font-medium text-slate-600">หุบเมนู</span>
                </>
              )}
            </button>
          )}

          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm ring-2 ring-teal-100">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-slate-800 text-lg leading-tight tracking-tight">
                  ระบบห้องพยาบาลโรงเรียนสำหรับนักเรียนพิการ
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  สพฐ. / การศึกษาพิเศษ
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:flex items-center space-x-2">
                <span>{systemConfig.schoolName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-teal-700 font-medium">🗓️ {formatThaiDatePattern(new Date())}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Notifications, User Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Emergency Quick Access Button */}
          <button
            id="btn-quick-emergency"
            onClick={() => onNavigate('emergency')}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all animate-pulse hover:animate-none"
            title="ค้นหาข้อมูลฉุกเฉินนักเรียนทันที"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span className="font-semibold">ข้อมูลฉุกเฉินด่วน</span>
          </button>

          {/* New Visit Quick Button (For Nurses/Admins) */}
          {currentUser.role !== 'teacher' && (
            <button
              id="btn-quick-new-visit"
              onClick={() => onNavigate('infirmary', 'new-visit')}
              className="hidden md:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
            >
              <Hospital className="w-4 h-4" />
              <span>+ บันทึกรับบริการ</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-teal-500"
              aria-label="การแจ้งเตือนคลังยา"
            >
              <Bell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {totalAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-heading font-semibold text-sm text-slate-800">
                      แจ้งเตือนคลังยา ({alertMedicines.length})
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {alertMedicines.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p>คลังยาอยู่ในเกณฑ์ปกติ ไม่มีรายการใกล้หมดหรือหมดอายุ</p>
                    </div>
                  ) : (
                    alertMedicines.map(m => {
                      const isExpired = new Date(m.expiryDate).getTime() < new Date().getTime();
                      const isLow = m.currentStock <= m.minimumStock;
                      return (
                        <div 
                          key={m.id} 
                          className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => {
                            onNavigate('pharmacy', 'medicine-list');
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-slate-800">{m.tradeName}</span>
                            {isExpired ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold">
                                หมดอายุ
                              </span>
                            ) : isLow ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-medium">
                                ใกล้หมด
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 font-medium">
                                ใกล้หมดอายุ
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-slate-500">
                            <span>คงเหลือ: {m.currentStock} {m.unit} (ขั้นต่ำ {m.minimumStock})</span>
                            <span>หมดอายุ: {formatThaiDateCompact(m.expiryDate)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center bg-slate-50">
                  <button
                    onClick={() => {
                      onNavigate('pharmacy', 'medicine-list');
                      setShowNotifications(false);
                    }}
                    className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                  >
                    ดูรายการคลังยาทั้งหมด →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Firebase Cloud Real-time Status */}
          <div className="flex items-center">
            {firebaseUser ? (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || isManualSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title={`เชื่อมต่อ Firebase สำเร็จ: ${firebaseUser.email} (คลิกเพื่อซิงค์ข้อมูลล่าสุด)`}
              >
                {isSyncing || isManualSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <CloudCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span className="hidden sm:inline">Firebase Real-time</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            ) : (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="คลิกเพื่อเข้าสู่ระบบด้วย Google และเปิดการซิงค์ข้อมูล รูปภาพ และไฟล์ PDF แบบ Real-time"
              >
                <Cloud className="w-3.5 h-3.5 text-teal-100" />
                <span className="hidden sm:inline">เชื่อมต่อ Firebase Real-time</span>
                <span className="sm:hidden">Firebase</span>
              </button>
            )}
          </div>

          {/* Role & User Selector */}
          <div className="relative">
            <button
              id="btn-user-menu"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300"
              />
              <div className="text-left hidden xl:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    currentUser.role === 'admin' ? 'bg-purple-500' :
                    currentUser.role === 'nurse' ? 'bg-teal-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-[11px] text-slate-500">
                    {currentUser.role === 'admin' ? 'Admin' :
                     currentUser.role === 'nurse' ? 'ครูอนามัย' : 
                     `ครูประจำชั้น (${currentUser.assignedClassroom || 'ทั่วไป'})`}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.roleTitle}</p>
                  {currentUser.assignedClassroom && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                      ดูแลห้อง: {currentUser.assignedClassroom}
                    </span>
                  )}
                </div>

                {/* Firebase Connection Card */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5 text-teal-600" />
                      <span>Firebase Realtime Cloud</span>
                    </span>
                    {firebaseUser && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        เชื่อมต่อแล้ว
                      </span>
                    )}
                  </div>

                  {firebaseUser ? (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-600 truncate">
                        บัญชี: <span className="font-semibold text-slate-800">{firebaseUser.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleManualSync}
                          disabled={isManualSyncing || isSyncing}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-[11px] flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isManualSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>กำลังซิงค์...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              <span>ซิงค์ขึ้น Cloud ทันที</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={logoutFirebase}
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-200 text-slate-600 text-[11px] transition-colors cursor-pointer"
                          title="ออกจากระบบ Firebase"
                        >
                          <LogOut className="w-3 h-3" />
                        </button>
                      </div>
                      {syncFeedback && (
                        <div className="text-[10px] text-teal-700 font-semibold text-center mt-1">
                          {syncFeedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] text-slate-500 mb-2">
                        เข้าสู่ระบบด้วย Google เพื่อซิงค์ข้อมูลและเอกสาร PDF/รูปภาพแบบ Real-time
                      </p>
                      <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="w-full py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>เข้าสู่ระบบด้วย Google</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-3 py-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    <span>สลับบทบาทผู้ใช้เพื่อทดสอบ</span>
                    <RefreshCw className="w-3 h-3" />
                  </div>
                  <div className="space-y-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          u.id === currentUser.id 
                            ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            u.role === 'admin' ? 'bg-purple-500' :
                            u.role === 'nurse' ? 'bg-teal-500' : 'bg-blue-500'
                          }`} />
                          <span className="truncate">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                          {u.role === 'admin' ? 'Admin' : u.role === 'nurse' ? 'พยาบาล' : u.assignedClassroom || 'ครู'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                  <button
                    onClick={() => {
                      onNavigate('users');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center space-x-2"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>จัดการบัญชีผู้ใช้งาน</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
