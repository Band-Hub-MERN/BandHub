import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, AlertCircle, Info, ChevronDown, RepeatIcon, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  GARAGES, GarageId, GARAGE_NAMES, GARAGE_LOCATIONS,
  FLOOR_NAMES, TIME_SLOTS, TIME_LABELS,
  formatDate
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import type { Booking, Organization } from '../data/mockData';
import { createBooking, deleteBooking, getGarageBookings, getMyBookings } from '../api/bookings';
import { getOrganizations } from '../api/organization';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getApiErrorMessage } from '../api/error-handling';

function getSlotGroups(bookings: Booking[], garageId: string, floor: number, slot: string): string[] {
  return bookings
    .filter(b => b.garageId === garageId && b.floor === floor && b.startTime <= slot && b.endTime > slot)
    .map(b => b.groupName);
}

export default function GarageBooking() {
  const navigate = useNavigate();
  const { accountType, user } = useApp();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedGarage, setSelectedGarage] = useState<GarageId>('A');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [isWeekly, setIsWeekly] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [queryBookingHandled, setQueryBookingHandled] = useState(false);
  const [bookingToCancelId, setBookingToCancelId] = useState<string | null>(null);

  const today = '2026-04-07';
  const bookingIdFromQuery = new URLSearchParams(window.location.search).get('bookingId') || '';

  const applyBookingToEditor = useCallback((booking: Booking) => {
    setSelectedGarage((booking.garageId || 'A') as GarageId);
    setSelectedFloor(Number(booking.floor) || 1);
    setSelectedStart(booking.startTime);

    const endIdx = TIME_SLOTS.indexOf(booking.endTime);
    const selectedEndSlot = endIdx > 0
      ? TIME_SLOTS[endIdx - 1]
      : TIME_SLOTS[TIME_SLOTS.length - 1];
    setSelectedEnd(selectedEndSlot);

    if (booking.orgId) {
      setSelectedOrgId(booking.orgId);
    }

    window.history.replaceState({}, '', '/garages');
  }, []);

  const refreshMyBookings = useCallback(async () => {
    const mine = await getMyBookings();
    setMyBookings(mine);

    if (!queryBookingHandled && bookingIdFromQuery) {
      const targetBooking = mine.find((booking) => booking.id === bookingIdFromQuery);
      if (targetBooking) {
        applyBookingToEditor(targetBooking);
      }
      setQueryBookingHandled(true);
    }
  }, [applyBookingToEditor, bookingIdFromQuery, queryBookingHandled]);

  useEffect(() => {
    if (accountType !== 'member') {
      return;
    }

    void (async () => {
      try {
        const orgRows = await getOrganizations();
        setOrganizations(orgRows);
        if (orgRows.length === 0) {
          setSelectedOrgId('');
          return;
        }

        if (user?.orgId && orgRows.some((org) => org.id === user.orgId)) {
          setSelectedOrgId(user.orgId);
        } else {
          setSelectedOrgId(orgRows[0].id);
        }
      } catch {
        setOrganizations([]);
        setSelectedOrgId('');
      }
    })();
  }, [accountType, user?.orgId]);

  useEffect(() => {
    void (async () => {
      const bookingRows = await getGarageBookings(selectedGarage, today);
      setBookings(bookingRows);
    })();
  }, [selectedGarage, today]);

  useEffect(() => {
    void refreshMyBookings();
  }, [refreshMyBookings]);

  const groupedFloorUsage = useMemo(() => {
    const usage = new Map<number, number>();
    [1, 2, 3, 4].forEach((floor) => {
      const groupCount = new Set(
        bookings
          .filter((booking) => booking.garageId === selectedGarage && booking.floor === floor)
          .map((booking) => booking.groupName)
      ).size;
      usage.set(floor, groupCount);
    });
    return usage;
  }, [bookings, selectedGarage]);

  const handleSlotClick = (slot: string) => {
    const groups = getSlotGroups(bookings, selectedGarage, selectedFloor, slot);
    if (groups.length >= 2) return; // full
    if (!selectedStart) {
      setSelectedStart(slot);
      setSelectedEnd(null);
    } else if (selectedStart === slot) {
      setSelectedStart(null);
      setSelectedEnd(null);
    } else if (!selectedEnd) {
      const startIdx = TIME_SLOTS.indexOf(selectedStart);
      const endIdx = TIME_SLOTS.indexOf(slot);
      if (endIdx > startIdx) {
        setSelectedEnd(slot);
      } else {
        setSelectedStart(slot);
        setSelectedEnd(null);
      }
    } else {
      setSelectedStart(slot);
      setSelectedEnd(null);
    }
  };

  const isInRange = (slot: string) => {
    if (!selectedStart) return false;
    if (!selectedEnd) return slot === selectedStart;
    const startIdx = TIME_SLOTS.indexOf(selectedStart);
    const endIdx = TIME_SLOTS.indexOf(selectedEnd);
    const slotIdx = TIME_SLOTS.indexOf(slot);
    return slotIdx >= startIdx && slotIdx <= endIdx;
  };

  const handleBook = () => {
    if (!selectedStart || !selectedEnd) {
      toast.error('Please select start and end time slots');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedStart || !selectedEnd) {
      return;
    }

    try {
      await createBooking({
        garageId: selectedGarage,
        floor: selectedFloor,
        startTime: selectedStart,
        endTime: endTime || selectedEnd,
        date: today,
        isWeekly,
        orgId: selectedOrgId,
      });

      const bookingRows = await getGarageBookings(selectedGarage, today);
      setBookings(bookingRows);
      await refreshMyBookings();

      setShowConfirm(false);
      setBookingDone(true);
      toast.success(`Booked Garage ${selectedGarage} · Floor ${selectedFloor} · ${TIME_LABELS[selectedStart]}–${TIME_LABELS[selectedEnd]}${isWeekly ? ' (Weekly)' : ''}`, {
        description: formatDate(today),
      });

      setTimeout(() => {
        setBookingDone(false);
        setSelectedStart(null);
        setSelectedEnd(null);
      }, 3000);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to create booking'));
    }
  };

  const endTime = selectedEnd
    ? TIME_SLOTS[TIME_SLOTS.indexOf(selectedEnd) + 1]
    : null;

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
      await Promise.all([
        refreshMyBookings(),
        getGarageBookings(selectedGarage, today).then(setBookings),
      ]);
      toast.success('Booking cancelled');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to cancel booking'));
    }
  };

  // Fan gate — block access entirely
  if (accountType === 'fan') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1C1C1F] border border-white/[0.06] flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-[#8A8A9A]" />
        </div>
        <h2
          className="text-[#FAFAFA] uppercase mb-3"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.04em' }}
        >
          Members Only
        </h2>
        <p className="text-[#8A8A9A] text-sm max-w-sm leading-relaxed mb-2">
          Garage booking and practice session schedules are private to registered members and their organizations.
        </p>
        <p className="text-[#8A8A9A] text-xs max-w-xs leading-relaxed">
          Sign up with a Member account to book practice spaces.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Reserve Your Space</p>
        <h1
          className="text-[#FAFAFA] uppercase mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}
        >
          Garage Booking
        </h1>
        <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-2" />
        <p className="text-[#8A8A9A] text-sm">Reserve practice floors · 6:00 PM – 12:00 AM · Max 2 groups per floor</p>
      </div>

      <div className="flex gap-6">
        {/* Left: Garage + Floor selectors */}
        <div className="w-64 flex-shrink-0">
          {/* Garage selector */}
          <div className="mb-4">
            <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2.5">Select Garage</p>
            <div className="space-y-1.5">
              {GARAGES.map(gId => (
                <button
                  key={gId}
                  onClick={() => { setSelectedGarage(gId); setSelectedStart(null); setSelectedEnd(null); }}
                  className={`w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                    selectedGarage === gId
                      ? 'border-[#FFC904]/40 bg-[#FFC904]/[0.06] text-[#FAFAFA]'
                      : 'border-white/[0.06] bg-[#111113] text-[#8A8A9A] hover:border-white/[0.10] hover:text-[#FAFAFA]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    selectedGarage === gId ? 'bg-[#FFC904] text-[#09090B]' : 'bg-[#1C1C1F] text-[#8A8A9A]'
                  }`}>
                    {gId}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{GARAGE_NAMES[gId]}</p>
                    <p className="text-[10px] text-[#8A8A9A] mt-0.5">{GARAGE_LOCATIONS[gId]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Floor selector */}
          <div>
            <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2.5">Select Floor</p>
            <div className="space-y-1.5">
              {[4, 3, 2, 1].map(floor => {
                const groups = groupedFloorUsage.get(floor) || 0;
                const isFull = groups >= 2;
                return (
                  <button
                    key={floor}
                    onClick={() => { if (!isFull) { setSelectedFloor(floor); setSelectedStart(null); setSelectedEnd(null); }}}
                    disabled={isFull}
                    className={`w-full text-left flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all ${
                      selectedFloor === floor && !isFull
                        ? 'border-[#FFC904]/40 bg-[#FFC904]/[0.06]'
                        : isFull
                        ? 'border-white/[0.04] bg-[#0F0F0F] opacity-50 cursor-not-allowed'
                        : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.10]'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${selectedFloor === floor ? 'text-[#FAFAFA]' : 'text-[#8A8A9A]'}`}>
                        Floor {floor} {floor === 4 ? '🌤️' : ''}
                      </p>
                      <p className="text-[10px] text-[#8A8A9A] mt-0.5">{FLOOR_NAMES[floor]}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${isFull ? 'text-[#EF4444]' : groups === 1 ? 'text-[#FFC904]' : 'text-[#22C55E]'}`}>
                        {2 - groups}/2
                      </div>
                      <p className="text-[#8A8A9A] text-[10px]">open</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Time slots */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider">
                Garage {selectedGarage} · Floor {selectedFloor} · {FLOOR_NAMES[selectedFloor]}
              </p>
              <p className="text-[#FAFAFA] font-bold mt-0.5">{formatDate(today)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-[#8A8A9A]">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#22C55E]/20 border border-[#22C55E]/30" /> Open</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#FFC904]/20 border border-[#FFC904]/30" /> 1 Group</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#EF4444]/20 border border-[#EF4444]/30" /> Full</div>
              </div>
            </div>
          </div>

          {/* Time slot grid */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden mb-4">
            <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
              {TIME_SLOTS.map((slot, i) => {
                const groups = getSlotGroups(bookings, selectedGarage, selectedFloor, slot);
                const isFull = groups.length >= 2;
                const isSelected = isInRange(slot);
                const isStart = slot === selectedStart;
                const isEnd = slot === selectedEnd;

                let bg = 'bg-[#111113] hover:bg-[#141416]';
                let border = '';
                let textColor = 'text-[#FAFAFA]';

                if (isFull) {
                  bg = 'bg-[#EF4444]/[0.05] cursor-not-allowed';
                  textColor = 'text-[#EF4444]/60';
                } else if (isSelected) {
                  bg = 'bg-[#FFC904]/10';
                  border = 'ring-1 ring-[#FFC904]/30';
                } else if (groups.length === 1) {
                  bg = 'bg-[#FFC904]/[0.04] hover:bg-[#FFC904]/[0.08]';
                }

                return (
                  <button
                    key={slot}
                    onClick={() => !isFull && handleSlotClick(slot)}
                    disabled={isFull}
                    className={`relative flex items-center justify-between px-4 py-3.5 transition-all text-left border-b border-white/[0.04] last:border-0 ${bg} ${border} ${i % 2 === 0 ? '' : ''}`}
                  >
                    <div>
                      <p className={`font-semibold text-sm ${isFull ? textColor : isSelected ? 'text-[#FFC904]' : 'text-[#FAFAFA]'}`}>
                        {TIME_LABELS[slot]}
                      </p>
                      {groups.length > 0 && (
                        <p className="text-[10px] text-[#8A8A9A] mt-0.5 truncate max-w-[140px]">
                          {groups.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isFull ? (
                        <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] px-2 py-0.5 rounded-full font-semibold">Full</span>
                      ) : groups.length === 1 ? (
                        <span className="text-[10px] bg-[#FFC904]/10 text-[#FFC904] px-2 py-0.5 rounded-full font-semibold">1 left</span>
                      ) : (
                        <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 rounded-full font-semibold">Open</span>
                      )}
                      {(isStart) && <div className="w-2 h-2 rounded-full bg-[#FFC904]" />}
                      {(isEnd) && <div className="w-2 h-2 rounded-full bg-[#FFC904]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06] rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
            <p className="text-[#8A8A9A] text-xs">Click a start time, then an end time to select your session window.</p>
          </div>
        </div>

        {/* Right: Booking panel */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 sticky top-0">
            <h3 className="text-[#FAFAFA] font-bold mb-4">Booking Summary</h3>

            {/* Session info */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-[#8A8A9A] text-sm">Garage</span>
                <span className="text-[#FAFAFA] font-semibold text-sm">{GARAGE_NAMES[selectedGarage]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-[#8A8A9A] text-sm">Floor</span>
                <span className="text-[#FAFAFA] font-semibold text-sm">Floor {selectedFloor}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-[#8A8A9A] text-sm">Date</span>
                <span className="text-[#FAFAFA] font-semibold text-sm">{formatDate(today)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-[#8A8A9A] text-sm">Start</span>
                <span className={`font-semibold text-sm ${selectedStart ? 'text-[#FFC904]' : 'text-[#2A2A2F]'}`}>
                  {selectedStart ? TIME_LABELS[selectedStart] : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-[#8A8A9A] text-sm">End</span>
                <span className={`font-semibold text-sm ${endTime ? 'text-[#FFC904]' : 'text-[#2A2A2F]'}`}>
                  {endTime ? TIME_LABELS[endTime] ?? '12:00 AM' : '—'}
                </span>
              </div>
            </div>

            {/* Group */}
            <div className="mb-4">
              <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Booking Group</label>
              {organizations.length === 0 ? (
                <div className="bg-[#1C1C1F] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
                  <p className="text-[#8A8A9A] text-sm">You don't belong to any organization yet.</p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedOrgId}
                    onChange={(event) => setSelectedOrgId(event.target.value)}
                    className="w-full appearance-none bg-[#1C1C1F] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] text-sm font-medium outline-none focus:border-[#FFC904]/40"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#8A8A9A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Weekly repeat */}
            <div className="mb-5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setIsWeekly(!isWeekly)}
                  className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${isWeekly ? 'bg-[#FFC904]' : 'bg-[#2A2A2F]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isWeekly ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div>
                  <p className="text-[#FAFAFA] text-sm font-medium flex items-center gap-1.5">
                    <RepeatIcon className="w-3.5 h-3.5 text-[#8A8A9A]" />
                    Weekly repeat
                  </p>
                  <p className="text-[#8A8A9A] text-xs">Same time, every week</p>
                </div>
              </label>
            </div>

            {/* Conflict warning */}
            {selectedStart && getSlotGroups(bookings, selectedGarage, selectedFloor, selectedStart).length >= 2 && (
              <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-3 py-2.5 mb-4 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                This slot is full. Select a different time.
              </div>
            )}

            {/* Success state */}
            {bookingDone && (
              <div className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-3 py-2.5 mb-4 text-xs">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Booking confirmed!
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!selectedStart || !selectedEnd || bookingDone || organizations.length === 0 || !selectedOrgId}
              className="w-full bg-[#FFC904] hover:bg-[#FFD84D] disabled:opacity-40 disabled:cursor-not-allowed text-[#09090B] py-3 rounded-xl font-bold text-sm transition-all"
            >
              {organizations.length === 0
                ? 'Join an organization first'
                : selectedStart && !selectedEnd
                  ? 'Select end time...'
                  : selectedStart && selectedEnd
                    ? 'Confirm Booking'
                    : 'Select time slots'}
            </button>

            <p className="text-[#8A8A9A] text-xs text-center mt-3 leading-relaxed">
              Bookings can be cancelled up to 1 hour before start time
            </p>

            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider">My Bookings</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-[#FFC904] text-[11px] font-semibold hover:underline"
                >
                  Dashboard
                </button>
              </div>
              {myBookings.length === 0 ? (
                <p className="text-[#8A8A9A] text-xs">No bookings yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {myBookings.slice(0, 8).map((booking) => (
                    <div key={booking.id} className="bg-[#1C1C1F] border border-white/[0.06] rounded-xl p-2.5">
                      <button
                        onClick={() => applyBookingToEditor(booking)}
                        className="w-full text-left"
                      >
                        <p className="text-[#FAFAFA] text-xs font-semibold">
                          Garage {booking.garageId} · Floor {booking.floor}
                        </p>
                        <p className="text-[#8A8A9A] text-[11px] mt-0.5">
                          {formatDate(booking.date)} · {TIME_LABELS[booking.startTime]}–{TIME_LABELS[booking.endTime] ?? '12:00 AM'}
                        </p>
                      </button>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => setBookingToCancelId(booking.id)}
                          className="text-[11px] font-semibold text-[#EF4444] hover:underline"
                        >
                          Cancel booking
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-white/[0.10] rounded-2xl p-7 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#FAFAFA] font-bold">Confirm Booking</h3>
              <button onClick={() => setShowConfirm(false)} className="text-[#8A8A9A] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-[#1C1C1F] rounded-xl p-4 mb-5 space-y-2">
              {[
                ['Location', `${GARAGE_NAMES[selectedGarage]} · Floor ${selectedFloor}`],
                ['Floor Type', FLOOR_NAMES[selectedFloor]],
                ['Date', formatDate(today)],
                ['Time', `${selectedStart ? TIME_LABELS[selectedStart] : ''} – ${endTime ? (TIME_LABELS[endTime] ?? '12:00 AM') : ''}`],
                ['Repeat', isWeekly ? 'Every week' : 'One-time'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[#8A8A9A]">{k}</span>
                  <span className="text-[#FAFAFA] font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-white/[0.10] text-[#8A8A9A] py-3 rounded-xl text-sm font-semibold hover:text-[#FAFAFA] hover:border-white/20 transition-all">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl text-sm font-bold transition-all">
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(bookingToCancelId)}
        title="Cancel booking"
        message="Cancel this booking? This will immediately free the slot for others."
        confirmLabel="Cancel booking"
        danger
        onCancel={() => setBookingToCancelId(null)}
        onConfirm={async () => {
          if (!bookingToCancelId) {
            return;
          }
          await handleCancelBooking(bookingToCancelId);
          setBookingToCancelId(null);
        }}
      />
    </div>
  );
}