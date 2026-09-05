import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Medicine } from '../../types';
import { formatThaiDatePattern, formatThaiDateCompact } from '../../utils/dateUtils';
import { 
  Pill, 
  Search, 
  Plus, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  PackagePlus, 
  History, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Clock,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface PharmacyViewProps {
  initialSubTab?: 'medicine-list' | 'restock' | 'dispense-history' | 'low-stock' | 'expiring' | 'expired';
}

export const PharmacyView: React.FC<PharmacyViewProps> = ({
  initialSubTab = 'medicine-list'
}) => {
  const { 
    medicines, 
    dispenseLogs, 
    restockMedicine, 
    addMedicine, 
    updateMedicine, 
    deleteMedicine, 
    currentUser,
    systemConfig 
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modals
  const [showRestockModal, setShowRestockModal] = useState(initialSubTab === 'restock');
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  useEffect(() => {
    if (initialSubTab === 'restock') {
      setActiveTab('medicine-list');
      setShowRestockModal(true);
    } else if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Restock form state
  const [selectedRestockMedId, setSelectedRestockMedId] = useState<string>(medicines[0]?.id || '');
  const [restockQty, setRestockQty] = useState<number>(50);
  const [restockLot, setRestockLot] = useState<string>(`LOT-${new Date().getFullYear()}-0${Math.floor(1 + Math.random() * 9)}`);
  const [restockExp, setRestockExp] = useState<string>('2027-12-31');
  const [restockNote, setRestockNote] = useState<string>('รับยาจัดสรรตามงบประมาณ สพฐ.');

  // Med Add/Edit form state
  const [medCode, setMedCode] = useState('');
  const [genericName, setGenericName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [category, setCategory] = useState('ยาสามัญประจำบ้าน');
  const [dosageForm, setDosageForm] = useState<Medicine['dosageForm']>('เม็ด');
  const [strength, setStrength] = useState('');
  const [dosageInstruction, setDosageInstruction] = useState('');
  const [unit, setUnit] = useState('เม็ด');
  const [minStock, setMinStock] = useState(20);
  const [currStock, setCurrStock] = useState(100);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [manufactureDate, setManufactureDate] = useState('2025-01-01');
  const [lotNumber, setLotNumber] = useState('LOT-2025-01');
  const [manufacturer, setManufacturer] = useState('องค์การเภสัชกรรม (GPO)');

  const canManage = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Filter medicines by tab and search
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      // Tab filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(m.expiryDate);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (activeTab === 'low-stock') {
        if (m.currentStock > m.minimumStock) return false;
      } else if (activeTab === 'expiring') {
        if (diffDays <= 0 || diffDays > 90) return false;
      } else if (activeTab === 'expired') {
        if (diffDays > 0) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCode = m.code.toLowerCase().includes(q);
        const matchTrade = m.tradeName.toLowerCase().includes(q);
        const matchGen = m.genericName.toLowerCase().includes(q);
        if (!matchCode && !matchTrade && !matchGen) return false;
      }

      // Category filter
      if (filterCategory !== 'all' && m.category !== filterCategory) return false;

      return true;
    });
  }, [medicines, activeTab, searchQuery, filterCategory]);

  const openNewMedModal = () => {
    setEditingMed(null);
    setMedCode(`MED-00${medicines.length + 1}`);
    setGenericName('');
    setTradeName('');
    setCategory('ยาสามัญประจำบ้าน');
    setDosageForm('เม็ด');
    setStrength('500 mg');
    setDosageInstruction('1 เม็ด หลังอาหารทันที');
    setUnit('เม็ด');
    setMinStock(20);
    setCurrStock(50);
    setExpiryDate('2027-12-31');
    setLotNumber(`LOT-${new Date().getFullYear()}-0${medicines.length + 1}`);
    setManufacturer('องค์การเภสัชกรรม (GPO)');
    setShowMedModal(true);
  };

  const openEditMedModal = (m: Medicine) => {
    setEditingMed(m);
    setMedCode(m.code);
    setGenericName(m.genericName);
    setTradeName(m.tradeName);
    setCategory(m.category);
    setDosageForm(m.dosageForm);
    setStrength(m.strength);
    setDosageInstruction(m.dosageInstruction);
    setUnit(m.unit);
    setMinStock(m.minimumStock);
    setCurrStock(m.currentStock);
    setExpiryDate(m.expiryDate);
    setLotNumber(m.lotNumber);
    setManufacturer(m.manufacturer);
    setShowMedModal(true);
  };

  const handleSaveMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMed) {
      updateMedicine(editingMed.id, {
        code: medCode,
        genericName,
        tradeName,
        category,
        dosageForm,
        strength,
        dosageInstruction,
        unit,
        minimumStock: minStock,
        currentStock: currStock,
        expiryDate,
        manufactureDate,
        lotNumber,
        manufacturer
      });
    } else {
      addMedicine({
        code: medCode,
        genericName,
        tradeName,
        category,
        dosageForm,
        strength,
        dosageInstruction,
        unit,
        minimumStock: minStock,
        currentStock: currStock,
        expiryDate,
        manufactureDate,
        receivedDate: new Date().toISOString().slice(0, 10),
        lotNumber,
        manufacturer
      });
    }
    setShowMedModal(false);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockMedId || restockQty <= 0) return;
    restockMedicine(selectedRestockMedId, restockQty, restockLot, restockExp, restockNote);
    setShowRestockModal(false);
    setRestockQty(50);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading font-bold text-xl text-slate-800">
              ระบบคลังยาและเวชภัณฑ์ (Pharmacy & Inventory)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {medicines.length} รายการ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการรายการยา ควบคุมสต็อก แจ้งเตือนวันหมดอายุ และบันทึกประวัติการจ่ายยา
          </p>
        </div>

        {canManage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRestockModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ รับยาเข้าคลัง</span>
            </button>

            <button
              onClick={openNewMedModal}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มรายการยาใหม่</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs overflow-x-auto flex space-x-1 text-xs">
        <button
          onClick={() => setActiveTab('medicine-list')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'medicine-list'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>รายการยาทั้งหมด ({medicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('low-stock')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'low-stock'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>ยาใกล้หมดสต็อก</span>
        </button>

        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'expiring'
              ? 'bg-yellow-600 text-white shadow-xs font-bold'
              : 'text-yellow-800 hover:bg-yellow-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ยาใกล้หมดอายุ (ภายใน 90 วัน)</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'expired'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>ยาหมดอายุ (ระงับการจ่าย)</span>
        </button>

        <button
          onClick={() => setActiveTab('dispense-history')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'dispense-history'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติการจ่ายยา & ตัดสต็อก ({dispenseLogs.length})</span>
        </button>
      </div>

      {/* VIEW 1: Medicine Inventory Table */}
      {activeTab !== 'dispense-history' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสยา, ชื่อการค้า หรือชื่อสามัญทางยา..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-teal-500"
              />
            </div>

            <div className="w-full md:w-56 text-xs">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 bg-white text-slate-700"
              >
                <option value="all">ทุกหมวดหมู่ยา</option>
                {(systemConfig.medicineCategories || []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-heading font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">รหัส / ชื่อยา</th>
                    <th className="px-4 py-3">หมวดหมู่ / รูปแบบ</th>
                    <th className="px-4 py-3">คงเหลือ / ขั้นต่ำ</th>
                    <th className="px-4 py-3">Lot / วันหมดอายุ</th>
                    <th className="px-4 py-3">สถานะคลัง</th>
                    <th className="px-4 py-3">วิธีใช้</th>
                    {canManage && <th className="px-4 py-3 text-right">การกระทำ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        ไม่พบข้อมูลยาตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map(med => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const exp = new Date(med.expiryDate);
                      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const isExpired = diffDays <= 0;
                      const isExpiring = diffDays > 0 && diffDays <= 90;
                      const isLow = med.currentStock <= med.minimumStock;

                      return (
                        <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 text-sm">{med.tradeName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {med.code} • {med.genericName} ({med.strength})
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-800 font-medium">{med.category}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {med.dosageForm}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-base text-slate-900">
                              {med.currentStock} <span className="text-xs font-normal text-slate-500">{med.unit}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              จุดสั่งซื้อขั้นต่ำ: {med.minimumStock} {med.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`font-semibold ${isExpired ? 'text-rose-600' : isExpiring ? 'text-amber-600' : 'text-slate-800'}`}>
                              {formatThaiDateCompact(med.expiryDate)}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Lot: {med.lotNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            {isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                หมดอายุ (ห้ามจ่าย)
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                สต็อกใกล้หมด
                              </span>
                            ) : isExpiring ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                ใกล้หมดอายุ ({diffDays} วัน)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ปกติ
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[180px] truncate text-[11px] text-slate-600">
                            {med.dosageInstruction}
                          </td>
                          {canManage && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedRestockMedId(med.id);
                                    setShowRestockModal(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                                  title="เติมสต็อกยา"
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditMedModal(med)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  title="แก้ไขข้อมูลยา"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                {currentUser.role === 'admin' && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`ลบรายการยา "${med.tradeName}" หรือไม่?`)) {
                                        deleteMedicine(med.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                                    title="ลบ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: Dispense History Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-800">
              ประวัติการจ่ายยาและตัดสต็อกอัตโนมัติทั้งหมด (Audit Logs)
            </h3>
            <span className="text-xs text-slate-500">
              สะสม {dispenseLogs.length} รายการตัดสต็อก
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-heading font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">วันที่ / เวลา</th>
                  <th className="px-4 py-3">เลขที่ VN</th>
                  <th className="px-4 py-3">ยาที่จ่าย</th>
                  <th className="px-4 py-3">จำนวนที่จ่าย</th>
                  <th className="px-4 py-3">คงเหลือก่อน / หลัง</th>
                  <th className="px-4 py-3">ผู้รับยา (นักเรียน)</th>
                  <th className="px-4 py-3">ผู้จ่ายยา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispenseLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      ยังไม่มีประวัติการจ่ายยา
                    </td>
                  </tr>
                ) : (
                  dispenseLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{formatThaiDatePattern(log.dispenseDate)}</div>
                        <span className="text-[10px] text-slate-400">{log.dispenseTime} น.</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">
                        {log.visitNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{log.medicineName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">Lot: {log.lotNumber}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600">
                        -{log.quantity} {log.unit}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {log.stockBefore} → <strong className="text-teal-700">{log.stockAfter}</strong>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {log.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {log.dispenserName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Restock Medicine */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="px-5 py-4 bg-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PackagePlus className="w-5 h-5 text-blue-200" />
                <h3 className="font-heading font-bold text-base">รับยาเข้าคลัง (Restock Inventory)</h3>
              </div>
              <button 
                onClick={() => setShowRestockModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เลือกรายการยา *</label>
                <select
                  value={selectedRestockMedId}
                  onChange={e => setSelectedRestockMedId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white font-semibold"
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.tradeName} ({m.genericName}) - สต็อกปัจจุบัน: {m.currentStock} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">จำนวนที่รับเข้า *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={e => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-teal-700 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={restockLot}
                    onChange={e => setRestockLot(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันหมดอายุ *</label>
                  <input
                    type="date"
                    required
                    value={restockExp}
                    onChange={e => setRestockExp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ที่มา / บันทึกรับยา</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={e => setRestockNote(e.target.value)}
                  placeholder="เช่น งบจัดสรร สพฐ. ปีงบประมาณ 2568"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกรับยาเข้าสต็อก</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Medicine */}
      {showMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8 animate-in fade-in">
            <div className="px-5 py-4 bg-teal-700 text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-base">
                {editingMed ? 'แก้ไขข้อมูลยาและเวชภัณฑ์' : 'เพิ่มรายการยาใหม่ในคลัง'}
              </h3>
              <button onClick={() => setShowMedModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMed} className="p-6 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รหัสยา *</label>
                  <input
                    type="text"
                    required
                    value={medCode}
                    onChange={e => setMedCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หมวดหมู่ยา *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2"
                  >
                    {(systemConfig.medicineCategories || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อทางการค้า (Trade Name) *</label>
                  <input
                    type="text"
                    required
                    value={tradeName}
                    onChange={e => setTradeName(e.target.value)}
                    placeholder="เช่น Sara Syrup, Tiffy"
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อสามัญทางยา (Generic Name) *</label>
                  <input
                    type="text"
                    required
                    value={genericName}
                    onChange={e => setGenericName(e.target.value)}
                    placeholder="เช่น Paracetamol, Amoxicillin"
                    className="w-full rounded-xl border border-slate-300 p-2 font-semibold text-teal-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รูปแบบยา</label>
                  <select
                    value={dosageForm}
                    onChange={e => setDosageForm(e.target.value as Medicine['dosageForm'])}
                    className="w-full rounded-xl border border-slate-300 p-2"
                  >
                    <option value="เม็ด">เม็ด</option>
                    <option value="น้ำ">น้ำ</option>
                    <option value="ครีม/ขี้ผึ้ง">ครีม/ขี้ผึ้ง</option>
                    <option value="สเปรย์/พ่น">สเปรย์/พ่น</option>
                    <option value="อุปกรณ์/เวชภัณฑ์">อุปกรณ์/เวชภัณฑ์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ความแรง (Strength)</label>
                  <input
                    type="text"
                    value={strength}
                    onChange={e => setStrength(e.target.value)}
                    placeholder="500 mg"
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="เม็ด / ขวด / หลอด"
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จำนวนสต็อกปัจจุบัน</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currStock}
                    onChange={e => setCurrStock(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จุดสั่งซื้อขั้นต่ำ (Min Stock)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={minStock}
                    onChange={e => setMinStock(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={lotNumber}
                    onChange={e => setLotNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันหมดอายุ *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">วิธีใช้มาตรฐาน</label>
                <input
                  type="text"
                  value={dosageInstruction}
                  onChange={e => setDosageInstruction(e.target.value)}
                  placeholder="เช่น 1 เม็ด หลังอาหารทันที ทุก 4-6 ชั่วโมง"
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ผู้ผลิต / ผู้จัดจำหน่าย</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={e => setManufacturer(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMed ? 'บันทึกการแก้ไข' : 'เพิ่มรายการยา'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
