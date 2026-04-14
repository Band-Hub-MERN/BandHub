import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Share2, Globe, ExternalLink } from 'lucide-react';
import { GARAGE_NAMES, FLOOR_NAMES, formatDate, formatTime } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { deleteEvent, getEventById, getEvents } from '../api/events';
import type { GarageEvent } from '../data/mockData';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getApiErrorMessage } from '../api/error-handling';
import { EventCoverImage } from '../components/ui/EventCoverImage';

const CATEGORY_COLORS: Record<string, string> = {
  Band: '#FFC904', Dance: '#A855F7', Acapella: '#22C55E',
  DJ: '#3B82F6', Comedy: '#F97316', 'Frat/Sorority': '#EC4899',
  Poetry: '#14B8A6', Other: '#8A8A9A',
};

export default function EventDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { accountType } = useApp();
  const [event, setEvent] = useState<GarageEvent | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<GarageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const [eventDetails, allEvents] = await Promise.all([
          getEventById(id),
          getEvents(),
        ]);

        setEvent(eventDetails);
        setRelatedEvents(
          allEvents
            .filter((eventItem) => eventItem.id !== id && eventDetails && eventItem.category === eventDetails.category)
            .slice(0, 3),
        );
      } catch {
        setEvent(null);
        setRelatedEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-[#8A8A9A] text-sm">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#FAFAFA] font-bold mb-2">Event not found</h2>
          <button onClick={() => navigate('/events')} className="text-[#FFC904] hover:underline text-sm">
            ← Back to events
          </button>
        </div>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[event.category] || '#8A8A9A';

  return (
    <div className="min-h-full bg-[#09090B]">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <EventCoverImage
          src={event.coverImage}
          title={event.title}
          category={event.category}
          orgColor={event.orgColor}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/40 to-transparent" />
        {/* Back button */}
        <div className="absolute top-5 left-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-sm hover:bg-black/70 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        {/* Share */}
        <div className="absolute top-5 right-5">
          <button
            onClick={() => { copyToClipboard(window.location.href); toast.success('Link copied!'); }}
            className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-sm hover:bg-black/70 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12 -mt-8 relative">
        <div className="grid grid-cols-[1fr_320px] gap-8">
          {/* Main */}
          <div>
            {/* Category + org */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}
              >
                {event.category}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#09090B]" style={{ background: event.orgColor }}>
                  {event.orgName[0]}
                </div>
                <span className="text-[#8A8A9A] text-sm">{event.orgName}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto text-[#8A8A9A] text-sm">
                <Globe className="w-3.5 h-3.5" />
                Public event
              </div>
            </div>

            {/* Title */}
            <h1 className="text-[#FAFAFA] mb-5" style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {event.title}
            </h1>

            {/* Info row */}
            <div className="grid grid-cols-3 gap-4 mb-7">
              {[
                { icon: Calendar, label: 'Date', value: formatDate(event.date) },
                { icon: Clock, label: 'Time', value: `${formatTime(event.startTime)} – ${formatTime(event.endTime)}` },
                { icon: Users, label: 'Interested', value: `${event.attendees} going` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#111113] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#FFC904]" />
                    <span className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-[#FAFAFA] font-semibold text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-7">
              <h3 className="text-[#FAFAFA] font-bold mb-3">About this event</h3>
              <p className="text-[#8A8A9A] leading-relaxed">{event.description}</p>
            </div>

            {/* Member-only: Private practice info notice */}
            {accountType === 'member' && (
              <div className="bg-[#FFC904]/[0.06] border border-[#FFC904]/20 rounded-2xl p-5 mb-7">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC904]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-[#FFC904]" />
                  </div>
                  <div>
                    <h4 className="text-[#FAFAFA] font-semibold mb-1 text-sm">Practice Session (Member View)</h4>
                    <p className="text-[#8A8A9A] text-sm mb-3">
                      This public event is backed by a private practice session. Only members of {event.orgName} can see the full practice details.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Booking Floor', `Floor ${event.floor}`],
                        ['Setup Time', '30 min before'],
                        ['Load-in', `${formatTime(event.startTime)} – 30 min`],
                        ['Soundcheck', '15 min'],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-[#1C1C1F] rounded-lg px-3 py-2">
                          <p className="text-[#8A8A9A] text-xs">{k}</p>
                          <p className="text-[#FAFAFA] text-xs font-semibold mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Related events */}
            {relatedEvents.length > 0 && (
              <div>
                <h3 className="text-[#FAFAFA] font-bold mb-4">More {event.category} events</h3>
                <div className="space-y-3">
                  {relatedEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="flex items-center gap-4 bg-[#111113] border border-white/[0.06] rounded-xl px-4 py-3 cursor-pointer hover:border-white/[0.12] transition-all group"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <EventCoverImage
                          src={ev.coverImage}
                          title={ev.title}
                          category={ev.category}
                          orgColor={ev.orgColor}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#FAFAFA] font-semibold text-sm truncate group-hover:text-[#FFC904] transition-colors">{ev.title}</p>
                        <p className="text-[#8A8A9A] text-xs mt-0.5">{ev.orgName} · {formatDate(ev.date)}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#2A2A2F] group-hover:text-[#8A8A9A] transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 sticky top-6">
              {/* Location */}
              <div className="mb-5">
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-3">Location</p>
                <div className="bg-[#1C1C1F] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFC904]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#FFC904]" />
                    </div>
                    <div>
                      <p className="text-[#FAFAFA] font-bold text-sm">{GARAGE_NAMES[event.garageId as keyof typeof GARAGE_NAMES]}</p>
                      <p className="text-[#8A8A9A] text-xs mt-0.5">{FLOOR_NAMES[event.floor]}</p>
                      <p className="text-[#8A8A9A] text-xs">Garage {event.garageId} · UCF Campus</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="mb-5">
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Attendance</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-2">
                    {['AB', 'JL', 'SP', 'CM'].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full bg-[#1C1C1F] border-2 border-[#111113] flex items-center justify-center text-[10px] font-bold text-[#8A8A9A]">{i}</div>
                    ))}
                  </div>
                  <span className="text-[#8A8A9A] text-sm">+{event.attendees - 4} going</span>
                </div>
                <div className="bg-[#1C1C1F] rounded-xl h-2 overflow-hidden">
                  <div
                    className="h-full rounded-xl bg-gradient-to-r from-[#FFC904] to-[#FFD84D]"
                    style={{ width: `${Math.min((event.attendees / 300) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[#8A8A9A] text-xs mt-1.5">
                  {event.attendees} of ~300 spots filled
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => toast.success('You\'re going!', { description: `We'll remind you 1h before ${event.title}` })}
                  className="w-full bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl font-bold text-sm transition-all"
                >
                  I'm Going
                </button>
                <button
                  onClick={() => { copyToClipboard(window.location.href); toast.success('Link copied!'); }}
                  className="w-full flex items-center justify-center gap-2 border border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share Event
                </button>
                {accountType === 'member' && (
                  <>
                    <button
                      onClick={() => navigate(`/events/${event.id}/edit`)}
                      className="w-full border border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    >
                      Edit Event
                    </button>
                    <button
                      onClick={() => setConfirmDeleteOpen(true)}
                      className="w-full border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    >
                      Delete Event
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete event"
        danger
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          try {
            if (!event) {
              setConfirmDeleteOpen(false);
              return;
            }
            await deleteEvent(event.id);
            setConfirmDeleteOpen(false);
            toast.success('Event deleted');
            navigate('/events');
          } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Unable to delete event'));
            setConfirmDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}

function copyToClipboard(text: string) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch {
    // silent fail
  }
}
