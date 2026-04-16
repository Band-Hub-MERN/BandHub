import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, MapPin, Clock, Globe, Lock, Image, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GARAGES, GarageId, GARAGE_NAMES, FLOOR_NAMES, CATEGORIES, TIME_LABELS, TIME_SLOTS, formatTime, Organization } from '../data/mockData';
import { createEvent, getEventById, updateEvent, uploadEventImage } from '../api/events';
import { getOrganizations } from '../api/organization';
import { getApiErrorMessage } from '../api/error-handling';

function toDateInputValue(dateValue: Date): string {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EventCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Band');
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [garage, setGarage] = useState<GarageId>('A');
  const [floor, setFloor] = useState(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      try {
        const orgRows = await getOrganizations();
        setOrganizations(orgRows);
        if (!selectedOrgId && orgRows.length > 0) {
          setSelectedOrgId(orgRows[0].id);
        }
      } catch {
        setOrganizations([]);
        setSelectedOrgId('');
      }
    })();
  }, [selectedOrgId]);

  useEffect(() => {
    if (!isEditMode || !id) {
      return;
    }

    void (async () => {
      try {
        const existingEvent = await getEventById(id);
        if (!existingEvent) {
          return;
        }

        setTitle(existingEvent.title || '');
        setDescription(existingEvent.description || '');
        setCategory(existingEvent.category || 'Band');
        setDate(existingEvent.date || toDateInputValue(new Date()));
        setStartTime(existingEvent.startTime || '19:00');
        setEndTime(existingEvent.endTime || '21:00');
        setGarage((existingEvent.garageId as GarageId) || 'A');
        setFloor(Number(existingEvent.floor) || 1);
        setIsPublic(Boolean(existingEvent.isPublic));
        setCoverImage(existingEvent.coverImage || '');
        setSelectedOrgId(existingEvent.orgId || '');
      } catch {
        toast.error('Unable to load event for editing');
      }
    })();
  }, [id, isEditMode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Event title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!date) e.date = 'Date is required';
    if (startTime >= endTime) e.time = 'End time must be after start time';
    if (!selectedOrgId) e.orgId = 'Select an organization';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        startTime,
        endTime,
        garageId: garage,
        floor,
        isPublic,
        orgId: selectedOrgId,
        coverImage,
      };

      if (isEditMode && id) {
        const { orgId: _orgId, ...updatePayload } = payload;
        await updateEvent(id, updatePayload);
      } else {
        await createEvent(payload);
      }

      toast.success(isEditMode ? 'Event updated successfully!' : 'Event created successfully!', {
        description: `${title} · ${GARAGE_NAMES[garage]} · ${formatTime(startTime)}`,
      });
      navigate('/events');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to create event.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoverImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const uploadedImageUrl = await uploadEventImage(file);
      setCoverImage(uploadedImageUrl);
      toast.success('Cover image uploaded');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to upload image'));
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl border border-white/[0.08] flex items-center justify-center text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20 transition-all flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-0.5">New Event</p>
          <h1
            className="text-[#FAFAFA] uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}
          >
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </h1>
          <div className="w-8 h-0.5 bg-[#FFC904] mt-1.5" />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-[1fr_340px] gap-6 max-w-5xl">
          {/* Left: Main form */}
          <div className="space-y-5">
            {/* Cover image placeholder */}
            <label
              htmlFor="event-cover-upload"
              className="h-48 rounded-2xl border-2 border-dashed border-white/[0.10] flex flex-col items-center justify-center bg-[#111113] hover:border-[#FFC904]/30 hover:bg-[#FFC904]/[0.02] transition-all cursor-pointer group relative overflow-hidden"
            >
              {coverImage ? (
                <img src={coverImage} alt="Event cover" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              <div className={`absolute inset-0 ${coverImage ? 'bg-black/45' : ''}`} />
              <div className="relative z-10 flex flex-col items-center">
                <Image className="w-8 h-8 text-[#2A2A2F] group-hover:text-[#FFC904]/70 transition-colors mb-3" />
                <p className="text-[#8A8A9A] text-sm font-medium">
                  {uploadingImage ? 'Uploading image...' : coverImage ? 'Change cover image' : 'Upload cover image'}
                </p>
                <p className="text-[#8A8A9A] text-xs mt-1">Recommended: 1200×630px (max 5MB)</p>
              </div>
              <input
                id="event-cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageSelect}
                disabled={uploadingImage}
              />
            </label>

            {/* Title */}
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold uppercase tracking-wider mb-2">
                Event Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(ex => ({ ...ex, title: '' })); }}
                placeholder="e.g. Knight Sound Sessions Vol. 4"
                className={`w-full bg-[#1C1C1F] border text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                  errors.title ? 'border-[#EF4444]/40' : 'border-white/[0.08] focus:border-[#FFC904]/40'
                }`}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-[#EF4444] text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3" /> {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold uppercase tracking-wider mb-2">
                Description <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => { setDescription(e.target.value); setErrors(ex => ({ ...ex, description: '' })); }}
                rows={5}
                placeholder="Tell fans what to expect at your event. Include any requirements (UCF ID, BYOB, etc.)"
                className={`w-full bg-[#1C1C1F] border text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${
                  errors.description ? 'border-[#EF4444]/40' : 'border-white/[0.08] focus:border-[#FFC904]/40'
                }`}
              />
              <p className="text-[#8A8A9A] text-xs text-right mt-1">{description.length}/500</p>
              {errors.description && (
                <p className="flex items-center gap-1 text-[#EF4444] text-xs mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.description}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold uppercase tracking-wider mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      category === cat
                        ? 'bg-[#FFC904] text-[#09090B] border-[#FFC904]'
                        : 'border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold uppercase tracking-wider mb-2">
                Date & Time <span className="text-[#EF4444]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <div className="flex items-center gap-2 bg-[#1C1C1F] border border-white/[0.08] rounded-xl px-3 py-3 focus-within:border-[#FFC904]/40 transition-colors">
                    <Calendar className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="bg-transparent text-[#FAFAFA] outline-none text-sm flex-1 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 bg-[#1C1C1F] border border-white/[0.08] rounded-xl px-3 py-3 focus-within:border-[#FFC904]/40 transition-colors">
                    <Clock className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
                    <select
                      value={startTime}
                      onChange={e => { setStartTime(e.target.value); setErrors(ex => ({ ...ex, time: '' })); }}
                      className="bg-transparent text-[#FAFAFA] outline-none text-sm flex-1 appearance-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t} className="bg-[#1C1C1F]">{TIME_LABELS[t]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 bg-[#1C1C1F] border border-white/[0.08] rounded-xl px-3 py-3 focus-within:border-[#FFC904]/40 transition-colors">
                    <Clock className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
                    <select
                      value={endTime}
                      onChange={e => { setEndTime(e.target.value); setErrors(ex => ({ ...ex, time: '' })); }}
                      className="bg-transparent text-[#FAFAFA] outline-none text-sm flex-1 appearance-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t} className="bg-[#1C1C1F]">{TIME_LABELS[t]}</option>)}
                      <option value="24:00" className="bg-[#1C1C1F]">12:00 AM (End)</option>
                    </select>
                  </div>
                </div>
              </div>
              {errors.time && (
                <p className="flex items-center gap-1 text-[#EF4444] text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3" /> {errors.time}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold uppercase tracking-wider mb-2">Event Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    isPublic ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.05]' : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPublic ? 'bg-[#22C55E]/15' : 'bg-[#1C1C1F]'}`}>
                    <Globe className="w-4 h-4" style={{ color: isPublic ? '#22C55E' : '#8A8A9A' }} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isPublic ? 'text-[#FAFAFA]' : 'text-[#8A8A9A]'}`}>Public</p>
                    <p className="text-[#8A8A9A] text-xs">Visible to all fans</p>
                  </div>
                  {isPublic && <Check className="w-4 h-4 text-[#22C55E] ml-auto flex-shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    !isPublic ? 'border-[#FFC904]/30 bg-[#FFC904]/[0.05]' : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!isPublic ? 'bg-[#FFC904]/15' : 'bg-[#1C1C1F]'}`}>
                    <Lock className="w-4 h-4" style={{ color: !isPublic ? '#FFC904' : '#8A8A9A' }} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${!isPublic ? 'text-[#FAFAFA]' : 'text-[#8A8A9A]'}`}>Members Only</p>
                    <p className="text-[#8A8A9A] text-xs">Org members only</p>
                  </div>
                  {!isPublic && <Check className="w-4 h-4 text-[#FFC904] ml-auto flex-shrink-0" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Location + Preview */}
          <div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 mb-4 sticky top-0">
              <h3 className="text-[#FAFAFA] font-bold mb-4">Location</h3>

              {/* Organization */}
              <div className="mb-4">
                <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Organization</label>
                {organizations.length === 0 ? (
                  <div className="bg-[#1C1C1F] border border-white/[0.08] rounded-xl px-3 py-2.5">
                    <p className="text-[#8A8A9A] text-sm">You don't belong to any organization yet.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedOrgId}
                      onChange={e => { setSelectedOrgId(e.target.value); setErrors(ex => ({ ...ex, orgId: '' })); }}
                      className={`w-full appearance-none bg-[#1C1C1F] border text-[#FAFAFA] rounded-xl px-3 py-3 text-sm outline-none transition-colors pr-10 ${
                        errors.orgId ? 'border-[#EF4444]/40' : 'border-white/[0.08] focus:border-[#FFC904]/40'
                      }`}
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id} className="bg-[#1C1C1F]">{org.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8A8A9A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
                {errors.orgId && (
                  <p className="flex items-center gap-1 text-[#EF4444] text-xs mt-1.5">
                    <AlertCircle className="w-3 h-3" /> {errors.orgId}
                  </p>
                )}
              </div>

              {/* Garage */}
              <div className="mb-4">
                <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Garage</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {GARAGES.map(g => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGarage(g)}
                      className={`py-2.5 rounded-xl border font-bold text-sm transition-all ${
                        garage === g
                          ? 'bg-[#FFC904] border-[#FFC904] text-[#09090B]'
                          : 'border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor */}
              <div className="mb-5">
                <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Floor</label>
                <div className="space-y-1.5">
                  {[4, 3, 2, 1].map(f => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => setFloor(f)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                        floor === f
                          ? 'border-[#FFC904]/30 bg-[#FFC904]/[0.05]'
                          : 'border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${floor === f ? 'text-[#FAFAFA]' : 'text-[#8A8A9A]'}`}>Floor {f}</span>
                      <span className="text-[#8A8A9A] text-xs">{FLOOR_NAMES[f]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview card */}
              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-3">Preview</p>
                <div className="bg-[#1C1C1F] rounded-xl p-3.5">
                  <p className="text-[#FAFAFA] font-bold text-sm mb-2">{title || 'Event title...'}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-[#8A8A9A]">
                      <MapPin className="w-3 h-3" />
                      <span>{organizations.find((org) => org.id === selectedOrgId)?.name || 'No organization selected'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8A8A9A]">
                      <Calendar className="w-3 h-3" />
                      <span>{date || 'No date set'} · {TIME_LABELS[startTime]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#8A8A9A]">
                      <MapPin className="w-3 h-3" />
                      <span>{GARAGE_NAMES[garage]} · {FLOOR_NAMES[floor]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {isPublic
                        ? <><Globe className="w-3 h-3 text-[#22C55E]" /><span className="text-[#22C55E]">Public event</span></>
                        : <><Lock className="w-3 h-3 text-[#FFC904]" /><span className="text-[#FFC904]">Members only</span></>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting || uploadingImage || organizations.length === 0 || !selectedOrgId}
                  className="w-full bg-[#FFC904] hover:bg-[#FFD84D] disabled:opacity-60 text-[#09090B] py-3 rounded-xl font-bold text-sm transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#09090B]/30 border-t-[#09090B] rounded-full animate-spin" />
                      {isEditMode ? 'Saving...' : 'Publishing...'}
                    </span>
                  ) : uploadingImage ? 'Uploading image...' : organizations.length === 0 ? 'Join an organization first' : isEditMode ? 'Save Changes' : 'Publish Event'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full border border-white/[0.08] text-[#8A8A9A] hover:text-[#FAFAFA] hover:border-white/20 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}