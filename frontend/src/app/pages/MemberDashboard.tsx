import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2, Users, Calendar, Clock, ChevronRight, Plus,
  TrendingUp, ArrowRight, Info, X, MapPin, Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  GARAGES, GarageId, GARAGE_NAMES, GARAGE_LOCATIONS,
  FLOOR_NAMES,
  formatDate, formatTime
} from '../data/mockData';
import type { Booking, GarageEvent, Organization } from '../data/mockData';
import { deleteBooking, getGarageBookings, getMyBookings } from '../api/bookings';
import { getEvents } from '../api/events';
import { getOrganizations } from '../api/organization';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { EventCoverImage } from '../components/ui/EventCoverImage';

const GARAGE_STATUS_COLORS = {
  0: { dot: 'bg-[#22C55E]', label: 'Open', text: 'text-[#22C55E]' },
  1: { dot: 'bg-[#FFC904]', label: 'Active', text: 'text-[#FFC904]' },
  2: { dot: 'bg-[#EF4444]', label: 'Full', text: 'text-[#EF4444]' },
};

function getGarageTopStatusFromOccupancy(occ: Record<number, number>) {
  const maxOcc = Math.max(...Object.values(occ));
  return maxOcc >= 2 ? 2 : maxOcc === 1 ? 1 : 0;
}

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { user, accountType } = useApp();
  const [selectedGarage, setSelectedGarage] = useState<GarageId | null>(null);
  const [showOrgPrompt, setShowOrgPrompt] = useState(true);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<GarageEvent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [garageDayBookings, setGarageDayBookings] = useState<Booking[]>([]);
  const [garageOccupancyMap, setGarageOccupancyMap] = useState<Record<string, Record<number, number>>>({});
  const [bookingToCancelId, setBookingToCancelId] = useState<string | null>(null);
  const activeDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  const isFan = accountType === 'fan';

  const userOrg = user?.orgId
    ? (organizations.find(o => o.id === user.orgId)
      ?? {
        id: user.orgId,
        name: 'My Organization',
        category: 'Other',
        description: 'Connected from your account profile.',
        memberCount: 1,
        members: [],
        color: '#FFC904',
        initials: 'MO',
      })
    : null;
  useEffect(() => {
    void (async () => {
      const [bookingsResponse, eventsResponse, orgsResponse] = await Promise.all([
        getMyBookings(),
        getEvents(),
        getOrganizations(),
      ]);

      setMyBookings(bookingsResponse.slice(0, 3));
      setUpcomingEvents(eventsResponse.slice(0, 3));
      setOrganizations(orgsResponse);
    })();
  }, [activeDate]);

  useEffect(() => {
    void (async () => {
      const occupancyEntries = await Promise.all(
        GARAGES.map(async (garageId) => {
          const garageBookings = await getGarageBookings(garageId, activeDate);
          const occupancy = { 1: 0, 2: 0, 3: 0, 4: 0 };
          garageBookings.forEach((booking) => {
            occupancy[booking.floor as 1 | 2 | 3 | 4] = (occupancy[booking.floor as 1 | 2 | 3 | 4] || 0) + 1;
          });
          return [garageId, occupancy] as const;
        }),
      );

      setGarageOccupancyMap(Object.fromEntries(occupancyEntries));
    })();
  }, [activeDate]);

  useEffect(() => {
    if (!selectedGarage) {
      setGarageDayBookings([]);
      return;
    }

    void (async () => {
      const garageBookings = await getGarageBookings(selectedGarage, activeDate);
      setGarageDayBookings(garageBookings);

      const occupancy = { 1: 0, 2: 0, 3: 0, 4: 0 };
      garageBookings.forEach((booking) => {
        occupancy[booking.floor as 1 | 2 | 3 | 4] = (occupancy[booking.floor as 1 | 2 | 3 | 4] || 0) + 1;
      });

      setGarageOccupancyMap((prev) => ({
        ...prev,
        [selectedGarage]: occupancy,
      }));
    })();
  }, [activeDate, selectedGarage]);

  const selectedOcc = selectedGarage ? garageOccupancyMap[selectedGarage] || { 1: 0, 2: 0, 3: 0, 4: 0 } : null;

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
      const [refreshedMine, refreshedGarage] = await Promise.all([
        getMyBookings(),
        selectedGarage ? getGarageBookings(selectedGarage, activeDate) : Promise.resolve([] as Booking[]),
      ]);

      setMyBookings(refreshedMine.slice(0, 3));
      if (selectedGarage) {
        setGarageDayBookings(refreshedGarage);
        const occupancy = { 1: 0, 2: 0, 3: 0, 4: 0 };
        refreshedGarage.forEach((booking) => {
          occupancy[booking.floor as 1 | 2 | 3 | 4] = (occupancy[booking.floor as 1 | 2 | 3 | 4] || 0) + 1;
        });
        setGarageOccupancyMap((prev) => ({ ...prev, [selectedGarage]: occupancy }));
      }
    } catch {
      // toast is optional here; avoid noisy dashboard updates
    }
  };

  // Fan-safe stats — no booking or practice data
  const fanStats = [
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar, color: '#22C55E', sub: 'next 30 days' },
    { label: 'Active Orgs', value: organizations.length, icon: Users, color: '#A855F7', sub: 'on campus' },
    { label: 'Campus Garages', value: GARAGES.length, icon: Building2, color: '#FFC904', sub: 'available venues' },
  ];

  const memberStats = [
    { label: 'My Bookings', value: myBookings.length, icon: Clock, color: '#FFC904', sub: 'this week' },
    { label: 'Org Members', value: userOrg?.memberCount ?? 0, icon: Users, color: '#A855F7', sub: userOrg?.name ?? 'No org yet' },
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar, color: '#22C55E', sub: 'next 30 days' },
  ];

  const stats = isFan ? fanStats : memberStats;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Welcome */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">{todayLabel}</p>
              <h1
                className="text-[#FAFAFA] uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}
              >
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <div className="w-10 h-0.5 bg-[#FFC904] mt-2" />
            </div>
            {!isFan && (
              <button
                onClick={() => navigate('/garages')}
                className="flex items-center gap-2 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-[0_0_20px_rgba(255,201,4,0.15)]"
              >
                <Plus className="w-4 h-4" />
                Book Space
              </button>
            )}
          </div>
        </div>

        {/* No-org prompt — members only */}
        {!isFan && !userOrg && showOrgPrompt && (
          <div className="relative mb-6 rounded-2xl border border-[#FFC904]/20 bg-[#FFC904]/[0.04] p-5">
            <button
              onClick={() => setShowOrgPrompt(false)}
              className="absolute top-4 right-4 text-[#8A8A9A] hover:text-[#FAFAFA]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFC904]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#FFC904]" />
              </div>
              <div>
                <h4 className="text-[#FAFAFA] font-semibold mb-1">You're not in an organization yet</h4>
                <p className="text-[#8A8A9A] text-sm mb-3">Create or join an org to start booking practice spaces and posting events.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/organization')}
                    className="bg-[#FFC904] text-[#09090B] px-4 py-2 rounded-lg text-xs font-bold transition-all hover:bg-[#FFD84D]"
                  >
                    Create Organization
                  </button>
                  <button
                    onClick={() => navigate('/invites')}
                    className="border border-white/[0.12] text-[#FAFAFA] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-all"
                  >
                    View Invites
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />
                </div>
                <div className="text-[#FAFAFA] font-black mb-0.5" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>{stat.value}</div>
                <p className="text-[#8A8A9A] text-xs font-medium">{stat.label}</p>
                <p className="text-[#8A8A9A] text-xs mt-0.5 opacity-60">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Garage Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#FAFAFA] font-bold" style={{ fontSize: '1rem' }}>
              {isFan ? 'Campus Garages' : 'Practice Garages'}
            </h2>
            {!isFan && (
              <button
                onClick={() => navigate('/garages')}
                className="flex items-center gap-1 text-[#FFC904] text-xs font-semibold hover:underline"
              >
                Book a slot <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {GARAGES.map(gId => {
              const status = getGarageTopStatusFromOccupancy(garageOccupancyMap[gId] || { 1: 0, 2: 0, 3: 0, 4: 0 });
              const statusInfo = GARAGE_STATUS_COLORS[status as 0 | 1 | 2];
              const isSelected = selectedGarage === gId;
              return (
                <button
                  key={gId}
                  onClick={() => setSelectedGarage(isSelected ? null : gId as GarageId)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-[#FFC904]/40 bg-[#FFC904]/[0.06]'
                      : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.12] hover:bg-[#141416]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isSelected ? 'bg-[#FFC904] text-[#09090B]' : 'bg-[#1C1C1F] text-[#FAFAFA]'}`}>
                      {gId}
                    </div>
                    {/* Fans see no occupancy status */}
                    {!isFan && (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        <span className={`text-[10px] font-semibold ${statusInfo.text}`}>{statusInfo.label}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[#FAFAFA] font-semibold text-sm mb-0.5">{GARAGE_NAMES[gId]}</p>
                  <p className="text-[#8A8A9A] text-xs">{GARAGE_LOCATIONS[gId]}</p>
                  {/* Floor dots — members only */}
                  {!isFan && (
                    <>
                      <div className="flex gap-1 mt-3">
                        {[1, 2, 3, 4].map(floor => {
                          const occ = (garageOccupancyMap[gId] || { 1: 0, 2: 0, 3: 0, 4: 0 })[floor];
                          return (
                            <div
                              key={floor}
                              className="h-1 flex-1 rounded-full"
                              style={{ background: occ >= 2 ? '#EF4444' : occ === 1 ? '#FFC904' : '#2A2A2F' }}
                              title={`Floor ${floor}: ${occ}/2 groups`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-[#8A8A9A] text-[10px] mt-1.5">Floors 1–4</p>
                    </>
                  )}
                  {isFan && <p className="text-[#8A8A9A] text-[10px] mt-3">4 floors · UCF Campus</p>}
                </button>
              );
            })}
          </div>
        </div>

        {/* My Bookings — members only */}
        {!isFan && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#FAFAFA] font-bold" style={{ fontSize: '1rem' }}>My Upcoming Bookings</h2>
              <button onClick={() => navigate('/garages')} className="text-[#FFC904] text-xs font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {myBookings.length === 0 ? (
              <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8 text-center">
                <Building2 className="w-8 h-8 text-[#2A2A2F] mx-auto mb-3" />
                <p className="text-[#8A8A9A] text-sm">No bookings yet</p>
                <button onClick={() => navigate('/garages')} className="mt-3 text-[#FFC904] text-xs font-semibold hover:underline">Book your first slot →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {myBookings.map(b => (
                  <div key={b.id} className="bg-[#111113] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-white/[0.10] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-[#FFC904]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#FFC904] font-black text-sm">{b.garageId}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/garages?bookingId=${encodeURIComponent(b.id)}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-[#FAFAFA] font-semibold text-sm">{GARAGE_NAMES[b.garageId as GarageId]}</p>
                        <span className="text-[10px] border border-white/[0.08] text-[#8A8A9A] px-1.5 py-0.5 rounded-md">{FLOOR_NAMES[b.floor]}</span>
                        {b.isWeekly && (
                          <span className="text-[10px] bg-[#FFC904]/10 text-[#FFC904] px-1.5 py-0.5 rounded-md">Weekly</span>
                        )}
                      </div>
                      <p className="text-[#8A8A9A] text-xs mt-0.5">{formatDate(b.date)} · {formatTime(b.startTime)} – {formatTime(b.endTime)}</p>
                    </button>
                    <button
                      onClick={() => setBookingToCancelId(b.id)}
                      className="text-[11px] text-[#EF4444] font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                    <ChevronRight className="w-4 h-4 text-[#2A2A2F]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#FAFAFA] font-bold" style={{ fontSize: '1rem' }}>Upcoming Campus Events</h2>
            <button onClick={() => navigate('/events')} className="text-[#FFC904] text-xs font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map(ev => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="group bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden flex hover:border-white/[0.12] transition-all cursor-pointer"
              >
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                  <EventCoverImage
                    src={ev.coverImage}
                    title={ev.title}
                    category={ev.category}
                    orgColor={ev.orgColor}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.orgColor }} />
                        <span className="text-[10px] text-[#8A8A9A] font-medium">{ev.orgName}</span>
                        <span className="text-[10px] border border-white/[0.08] text-[#8A8A9A] px-1.5 py-0.5 rounded">{ev.category}</span>
                      </div>
                      <p className="text-[#FAFAFA] font-semibold text-sm leading-tight truncate">{ev.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#2A2A2F] group-hover:text-[#8A8A9A] transition-colors flex-shrink-0 mt-1" />
                  </div>
                  <p className="text-[#8A8A9A] text-xs mt-1">
                    {formatDate(ev.date)} · {formatTime(ev.startTime)} · Garage {ev.garageId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedGarage && (
        <div className="w-80 flex-shrink-0 border-l border-white/[0.06] bg-[#0C0C0E] overflow-y-auto">
          <div className="p-5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[#FAFAFA] font-bold">{GARAGE_NAMES[selectedGarage]}</h3>
              <button onClick={() => setSelectedGarage(null)} className="text-[#8A8A9A] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[#8A8A9A] text-xs">
              <MapPin className="w-3 h-3" />
              {GARAGE_LOCATIONS[selectedGarage]}
            </div>
          </div>

          <div className="p-5">
            {/* Fan view — location info only, no session data */}
            {isFan ? (
              <>
                <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-4 mb-4">
                  <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-3">Venue Info</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8A8A9A]">Floors</span>
                      <span className="text-[#FAFAFA] font-semibold">4 floors</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8A8A9A]">Location</span>
                      <span className="text-[#FAFAFA] font-semibold text-right max-w-[160px]">{GARAGE_LOCATIONS[selectedGarage]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8A8A9A]">Hours</span>
                      <span className="text-[#FAFAFA] font-semibold">6 PM – 12 AM</span>
                    </div>
                  </div>
                </div>

                {/* Private sessions lock notice */}
                <div className="flex items-start gap-3 bg-[#1C1C1F] rounded-xl p-4 mb-4">
                  <Lock className="w-4 h-4 text-[#8A8A9A] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#FAFAFA] text-xs font-semibold mb-1">Practice sessions are private</p>
                    <p className="text-[#8A8A9A] text-xs leading-relaxed">Session schedules are only visible to registered members and their organizations.</p>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 bg-[#1C1C1F] rounded-xl p-3">
                  <Info className="w-3.5 h-3.5 text-[#8A8A9A] mt-0.5 flex-shrink-0" />
                  <p className="text-[#8A8A9A] text-xs leading-relaxed">
                    Public events held at this garage will appear in the Events feed.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-3">Floor Availability</p>
                <div className="space-y-2 mb-5">
                  {[1, 2, 3, 4].map(floor => {
                    const occ = selectedOcc?.[floor] ?? 0;
                    const remaining = 2 - occ;
                    const statusColor = occ >= 2 ? '#EF4444' : occ === 1 ? '#FFC904' : '#22C55E';
                    return (
                      <div key={floor} className="bg-[#111113] border border-white/[0.06] rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-[#FAFAFA] text-sm font-semibold">Floor {floor}</p>
                            <p className="text-[#8A8A9A] text-xs">{FLOOR_NAMES[floor]}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm" style={{ color: statusColor }}>{remaining} left</p>
                            <p className="text-[#8A8A9A] text-xs">{occ}/2 groups</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2].map(slot => (
                            <div
                              key={slot}
                              className="h-1.5 flex-1 rounded-full"
                              style={{ background: slot <= occ ? '#EF4444' : '#2A2A2F' }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Today's sessions */}
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-3">Today's Sessions</p>
                <div className="space-y-2 mb-5">
                  {garageDayBookings.length === 0 ? (
                    <p className="text-[#8A8A9A] text-sm text-center py-4">No sessions today</p>
                  ) : (
                    garageDayBookings.map(b => (
                      <div key={b.id} className={`rounded-xl p-3 border ${b.isOwn ? 'border-[#FFC904]/20 bg-[#FFC904]/[0.04]' : 'border-white/[0.06] bg-[#111113]'}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-[#FAFAFA] text-xs font-semibold">{b.groupName}</p>
                          {b.isOwn && <span className="text-[10px] bg-[#FFC904]/10 text-[#FFC904] px-1.5 py-0.5 rounded">Yours</span>}
                        </div>
                        <p className="text-[#8A8A9A] text-xs mt-0.5">Floor {b.floor} · {formatTime(b.startTime)}–{formatTime(b.endTime)}</p>
                        {b.isOwn && !String(b.id).startsWith('event:') && (
                          <div className="flex gap-3 mt-2">
                            <button
                              onClick={() => navigate(`/garages?bookingId=${encodeURIComponent(b.id)}`)}
                              className="text-[11px] text-[#FFC904] font-semibold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setBookingToCancelId(b.id)}
                              className="text-[11px] text-[#EF4444] font-semibold hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => navigate('/garages')}
                  className="w-full bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl font-bold text-sm transition-all"
                >
                  Book This Garage
                </button>

                <div className="mt-3 flex items-start gap-2 bg-[#1C1C1F] rounded-xl p-3">
                  <Info className="w-3.5 h-3.5 text-[#8A8A9A] mt-0.5 flex-shrink-0" />
                  <p className="text-[#8A8A9A] text-xs leading-relaxed">
                    Booking hours: 6:00 PM – 12:00 AM. Max 2 groups per floor. Weekly repeats allowed.
                  </p>
                </div>
              </>
            )}
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
