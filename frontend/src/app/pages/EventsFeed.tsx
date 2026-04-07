import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Calendar, MapPin, Users, Filter, X, Plus, Clock } from 'lucide-react';
import { GarageEvent, GARAGES, GARAGE_NAMES, FLOOR_NAMES, formatDate, formatTime } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { getEvents } from '../api/events';

const CATEGORY_COLORS: Record<string, string> = {
  Band: '#FFC904',
  Dance: '#A855F7',
  Acapella: '#22C55E',
  DJ: '#3B82F6',
  Comedy: '#F97316',
  'Frat/Sorority': '#EC4899',
  Poetry: '#14B8A6',
  Other: '#8A8A9A',
};

function EventCard({ event, onClick }: { event: GarageEvent; onClick: () => void }) {
  const catColor = CATEGORY_COLORS[event.category] || '#8A8A9A';
  return (
    <div
      onClick={onClick}
      className="group bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={event.coverImage}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md"
            style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}
          >
            {event.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs px-2 py-1 rounded-full">
            <Users className="w-3 h-3" />
            {event.attendees}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: event.orgColor }}>
              {event.orgName[0]}
            </div>
            <span className="text-white/80 text-xs font-medium">{event.orgName}</span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="text-[#FAFAFA] font-bold mb-2 leading-tight group-hover:text-[#FFC904] transition-colors" style={{ fontSize: '0.95rem' }}>
          {event.title}
        </h3>
        <p className="text-[#8A8A9A] text-xs mb-3 line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#8A8A9A]">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(event.date)} · {formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A9A]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{GARAGE_NAMES[event.garageId as keyof typeof GARAGE_NAMES]} · {FLOOR_NAMES[event.floor]}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#8A8A9A]" />
            <span className="text-[#8A8A9A] text-xs">
              {Math.round((new Date(event.date).getTime() - new Date('2026-04-06').getTime()) / (1000 * 60 * 60 * 24))}d away
            </span>
          </div>
          <span className="text-[#FFC904] text-xs font-semibold">View details →</span>
        </div>
      </div>
    </div>
  );
}

export default function EventsFeed() {
  const navigate = useNavigate();
  const { accountType } = useApp();
  const [events, setEvents] = useState<GarageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGarage, setSelectedGarage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const eventRows = await getEvents();
      setEvents(eventRows);
      setLoading(false);
    })();
  }, []);

  const filtered = events.filter(ev => {
    const matchSearch = !search || ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.orgName.toLowerCase().includes(search.toLowerCase());
    const matchGarage = !selectedGarage || ev.garageId === selectedGarage;
    const matchCategory = !selectedCategory || ev.category === selectedCategory;
    return matchSearch && matchGarage && matchCategory;
  });

  const clearFilters = () => {
    setSelectedGarage(null);
    setSelectedCategory(null);
  };

  const hasFilters = selectedGarage || selectedCategory;

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Campus Events</p>
          <h1
            className="text-[#FAFAFA] uppercase mb-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}
          >
            {accountType === 'fan' ? 'Discover Events' : 'Campus Events'}
          </h1>
          <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-1" />
          <p className="text-[#8A8A9A] text-sm mt-2">
            {filtered.length} upcoming events across UCF garages
          </p>
        </div>
        {accountType === 'member' && (
          <button
            onClick={() => navigate('/events/create')}
            className="flex items-center gap-2 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Post Event
          </button>
        )}
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 bg-[#111113] border border-white/[0.06] rounded-xl px-4 py-2.5 focus-within:border-[#FFC904]/30 transition-colors">
          <Search className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, organizations..."
            className="bg-transparent text-[#FAFAFA] placeholder:text-[#8A8A9A] outline-none flex-1 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#8A8A9A] hover:text-[#FAFAFA]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            hasFilters ? 'border-[#FFC904]/40 bg-[#FFC904]/[0.06] text-[#FFC904]' : 'border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/[0.15]'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter
          {hasFilters && <span className="w-4 h-4 rounded-full bg-[#FFC904] text-[#09090B] text-[10px] flex items-center justify-center font-bold">
            {[selectedGarage, selectedCategory].filter(Boolean).length}
          </span>}
        </button>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="mb-5 p-4 bg-[#111113] border border-white/[0.06] rounded-xl">
          <div className="mb-3">
            <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">By Garage</p>
            <div className="flex flex-wrap gap-2">
              {GARAGES.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGarage(selectedGarage === g ? null : g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedGarage === g
                      ? 'bg-[#FFC904] text-[#09090B] border-[#FFC904]'
                      : 'border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20'
                  }`}
                >
                  Garage {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">By Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedCategory === cat
                      ? 'text-[#09090B] border-transparent'
                      : 'border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20'
                  }`}
                  style={selectedCategory === cat ? { background: CATEGORY_COLORS[cat], color: '#09090B' } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-[#EF4444] text-xs hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Events grid */}
      {loading && <p className="text-[#8A8A9A] text-sm mb-4">Loading events...</p>}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1F] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#2A2A2F]" />
          </div>
          <h3 className="text-[#FAFAFA] font-bold mb-2">No events found</h3>
          <p className="text-[#8A8A9A] text-sm">Try adjusting your search or filters</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-[#FFC904] text-sm font-semibold hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={() => navigate(`/events/${ev.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}