export type AccountType = 'member' | 'fan';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  accountType: AccountType;
  bio?: string;
  orgId?: string;     // primary org (kept for compat)
  orgIds?: string[];  // all orgs this user belongs to
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  members: OrgMember[];
  color: string;
  initials: string;
}

export interface Booking {
  id: string;
  garageId: string;
  floor: number;
  startTime: string; // "18:00"
  endTime: string;   // "20:00"
  groupName: string;
  orgId: string;
  date: string; // "2026-04-07"
  isWeekly: boolean;
  isOwn?: boolean;
}

export interface GarageEvent {
  id: string;
  title: string;
  orgName: string;
  orgId: string;
  orgColor: string;
  garageId: string;
  floor: number;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  category: string;
  coverImage: string;
  attendees: number;
  isPublic: boolean;
}

export interface Invite {
  id: string;
  orgName: string;
  orgColor: string;
  sentBy: string;
  sentAt: string;
  role: string;
}

export const GARAGES = ['A', 'B', 'C', 'D', 'H', 'I'] as const;
export type GarageId = typeof GARAGES[number];

export const GARAGE_NAMES: Record<GarageId, string> = {
  A: 'Garage A',
  B: 'Garage B',
  C: 'Garage C',
  D: 'Garage D',
  H: 'Garage H',
  I: 'Garage I',
};

export const GARAGE_LOCATIONS: Record<GarageId, string> = {
  A: 'Near main campus entrance',
  B: 'Near library and RWC',
  C: 'Near Engineering & Research buildings',
  D: 'Near Memory Mall',
  H: 'Near classroom buildings',
  I: 'Near main Lynx Bus stop & performing arts building',
};

export const FLOOR_NAMES: Record<number, string> = {
  1: 'Ground Level',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Rooftop (Open Air)',
};

export const TIME_SLOTS = [
  '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30',
];

export const TIME_LABELS: Record<string, string> = {
  '18:00': '6:00 PM', '18:30': '6:30 PM',
  '19:00': '7:00 PM', '19:30': '7:30 PM',
  '20:00': '8:00 PM', '20:30': '8:30 PM',
  '21:00': '9:00 PM', '21:30': '9:30 PM',
  '22:00': '10:00 PM', '22:30': '10:30 PM',
  '23:00': '11:00 PM', '23:30': '11:30 PM',
};

export const CATEGORIES = ['Band', 'Dance', 'Acapella', 'DJ', 'Frat/Sorority', 'Comedy', 'Poetry', 'Other'];

export const mockOrganizations: Organization[] = [
  {
    id: 'org1',
    name: 'The Riff Kings',
    category: 'Band',
    description: 'Alternative rock band fusing indie vibes with hard-hitting riffs. UCF class of 2027.',
    memberCount: 5,
    color: '#FFC904',
    initials: 'RK',
    members: [
      { id: 'm1', name: 'Alex Rivera', email: 'alex@garagejam.app', avatar: 'AR', role: 'owner', joinedAt: '2025-09-01' },
      { id: 'm2', name: 'Jordan Lee', email: 'jordan@garagejam.app', avatar: 'JL', role: 'admin', joinedAt: '2025-09-05' },
      { id: 'm3', name: 'Sam Patel', email: 'sam@garagejam.app', avatar: 'SP', role: 'member', joinedAt: '2025-09-10' },
      { id: 'm4', name: 'Casey Morgan', email: 'casey@garagejam.app', avatar: 'CM', role: 'member', joinedAt: '2025-10-01' },
      { id: 'm5', name: 'Taylor Kim', email: 'taylor@garagejam.app', avatar: 'TK', role: 'member', joinedAt: '2025-10-15' },
    ],
  },
  {
    id: 'org2',
    name: 'UCF Dance Collective',
    category: 'Dance',
    description: 'Competitive contemporary and hip-hop dance organization. Open to all skill levels.',
    memberCount: 12,
    color: '#A855F7',
    initials: 'DC',
    members: [
      { id: 'm6', name: 'Priya Sharma', email: 'priya@garagejam.app', avatar: 'PS', role: 'owner', joinedAt: '2025-08-20' },
      { id: 'm7', name: 'Marcus Johnson', email: 'marcus@garagejam.app', avatar: 'MJ', role: 'admin', joinedAt: '2025-08-25' },
      { id: 'm8', name: 'Zoe Chen', email: 'zoe@garagejam.app', avatar: 'ZC', role: 'member', joinedAt: '2025-09-03' },
    ],
  },
  {
    id: 'org3',
    name: 'Knight Acapella',
    category: 'Acapella',
    description: 'Award-winning a cappella group representing UCF at regional competitions.',
    memberCount: 8,
    color: '#22C55E',
    initials: 'KA',
    members: [
      { id: 'm9', name: 'Danny Fox', email: 'danny@garagejam.app', avatar: 'DF', role: 'owner', joinedAt: '2025-08-01' },
      { id: 'm10', name: 'Mia Torres', email: 'mia@garagejam.app', avatar: 'MT', role: 'member', joinedAt: '2025-08-15' },
    ],
  },
];

export const mockUser: User = {
  id: 'user1',
  name: 'Alex Rivera',
  email: 'alex@garagejam.app',
  avatar: 'AR',
  accountType: 'member',
  orgId: 'org1',
  orgIds: ['org1', 'org2'],
};

export const mockFanUser: User = {
  id: 'fan1',
  name: 'Jordan Smith',
  email: 'jordan.smith@garagejam.app',
  avatar: 'JS',
  accountType: 'fan',
};

export const mockBookings: Booking[] = [
  { id: 'b1', garageId: 'A', floor: 2, startTime: '19:00', endTime: '21:00', groupName: 'The Riff Kings', orgId: 'org1', date: '2026-04-07', isWeekly: true, isOwn: true },
  { id: 'b2', garageId: 'A', floor: 2, startTime: '21:00', endTime: '23:00', groupName: 'UCF Dance Collective', orgId: 'org2', date: '2026-04-07', isWeekly: false },
  { id: 'b3', garageId: 'B', floor: 1, startTime: '18:00', endTime: '20:00', groupName: 'Knight Acapella', orgId: 'org3', date: '2026-04-07', isWeekly: false },
  { id: 'b4', garageId: 'B', floor: 3, startTime: '20:00', endTime: '22:00', groupName: 'The Riff Kings', orgId: 'org1', date: '2026-04-08', isWeekly: true, isOwn: true },
  { id: 'b5', garageId: 'C', floor: 4, startTime: '21:00', endTime: '23:30', groupName: 'UCF Dance Collective', orgId: 'org2', date: '2026-04-09', isWeekly: false },
  { id: 'b6', garageId: 'D', floor: 1, startTime: '18:30', endTime: '20:30', groupName: 'Alpha DJ Squad', orgId: 'org4', date: '2026-04-07', isWeekly: false },
  { id: 'b7', garageId: 'H', floor: 2, startTime: '19:00', endTime: '21:00', groupName: 'Knight Acapella', orgId: 'org3', date: '2026-04-10', isWeekly: true },
  { id: 'b8', garageId: 'I', floor: 3, startTime: '20:00', endTime: '22:30', groupName: 'The Riff Kings', orgId: 'org1', date: '2026-04-11', isWeekly: false, isOwn: true },
];

export const mockEvents: GarageEvent[] = [
  {
    id: 'ev1',
    title: 'Knight Sound Sessions Vol. 3',
    orgName: 'The Riff Kings',
    orgId: 'org1',
    orgColor: '#FFC904',
    garageId: 'A',
    floor: 4,
    date: '2026-04-12',
    startTime: '19:00',
    endTime: '22:00',
    description: 'Our biggest rooftop session yet. Expect raw indie rock, crowd singalongs, and a special surprise opener. BYOB (Bring Your Own Blanket). All UCF students welcome.',
    category: 'Band',
    coverImage: 'https://images.unsplash.com/photo-1770135157327-c31539ed8190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwYmFuZCUyMG11c2ljJTIwcGVyZm9ybWFuY2UlMjBzdGFnZXxlbnwxfHx8fDE3NzU0NDMwNTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 134,
    isPublic: true,
  },
  {
    id: 'ev2',
    title: 'Break the Floor: Spring Showcase',
    orgName: 'UCF Dance Collective',
    orgId: 'org2',
    orgColor: '#A855F7',
    garageId: 'C',
    floor: 4,
    date: '2026-04-15',
    startTime: '20:00',
    endTime: '23:00',
    description: 'Annual spring dance showcase featuring contemporary, hip-hop, and fusion styles. Come watch the best dancers on campus compete for the Collective Cup trophy.',
    category: 'Dance',
    coverImage: 'https://images.unsplash.com/photo-1717871057601-dfdb0519fdfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYW5jZSUyMGNsdWIlMjBwZXJmb3JtYW5jZSUyMHVuaXZlcnNpdHklMjBzdHVkZW50c3xlbnwxfHx8fDE3NzU0NDMxOTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 89,
    isPublic: true,
  },
  {
    id: 'ev3',
    title: 'Harmonize: Acapella Night',
    orgName: 'Knight Acapella',
    orgId: 'org3',
    orgColor: '#22C55E',
    garageId: 'H',
    floor: 3,
    date: '2026-04-18',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Eight voices, zero instruments, pure magic. Knight Acapella brings their award-winning setlist to Garage H. This is their first public performance of the semester.',
    category: 'Acapella',
    coverImage: 'https://images.unsplash.com/photo-1709090083073-d130ac28cc19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGJhbmQlMjBwZXJmb3JtYW5jZSUyMHN0YWdlJTIwbGlnaHRzfGVufDF8fHx8MTc3NTQ0MzE5MHww&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 62,
    isPublic: true,
  },
  {
    id: 'ev4',
    title: 'Rooftop Rave: EDM & Chill',
    orgName: 'Alpha DJ Squad',
    orgId: 'org4',
    orgColor: '#3B82F6',
    garageId: 'B',
    floor: 4,
    date: '2026-04-19',
    startTime: '21:00',
    endTime: '24:00',
    description: 'Garage B rooftop transforms into UCF\'s favorite open-air dancefloor. Multiple DJ sets, curated playlists, and the best views of campus. Free for all UCF students.',
    category: 'DJ',
    coverImage: 'https://images.unsplash.com/photo-1769971818183-cc9e7a3cfb64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwZXZlbnQlMjBjcm93ZCUyMGxpZ2h0cyUyMHN0YWdlJTIwbmlnaHR8ZW58MXx8fHwxNzc1NDQzMTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 201,
    isPublic: true,
  },
  {
    id: 'ev5',
    title: 'Unplugged: Acoustic Friday',
    orgName: 'The Riff Kings',
    orgId: 'org1',
    orgColor: '#FFC904',
    garageId: 'D',
    floor: 2,
    date: '2026-04-24',
    startTime: '18:00',
    endTime: '20:00',
    description: 'A stripped-down acoustic set in an intimate garage setting. Perfect for a Friday wind-down. Seats are limited — first come, first served.',
    category: 'Band',
    coverImage: 'https://images.unsplash.com/photo-1649910855313-8cb8e2e6af9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJhZ2UlMjBiYW5kJTIwcmVoZWFyc2FsJTIwZGFyayUyMG1vb2R5fGVufDF8fHx8MTc3NTQ0MzE4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 47,
    isPublic: true,
  },
  {
    id: 'ev6',
    title: 'Spring Comedy Jam',
    orgName: 'Knights of Comedy',
    orgId: 'org5',
    orgColor: '#F97316',
    garageId: 'I',
    floor: 1,
    date: '2026-04-26',
    startTime: '20:00',
    endTime: '22:30',
    description: 'UCF\'s best stand-up comedians battle it out for laughs. Five acts, one winner, unlimited cringe. Adults-only material. UCF ID required.',
    category: 'Comedy',
    coverImage: 'https://images.unsplash.com/photo-1735713212111-e39b9cbcdbea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbmlnaHQlMjBldmVudCUyMGNvbmNlcnR8ZW58MXx8fHwxNzc1NDQzMDYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 78,
    isPublic: true,
  },
];

export const mockInvites: Invite[] = [
  { id: 'inv1', orgName: 'UCF Dance Collective', orgColor: '#A855F7', sentBy: 'Priya Sharma', sentAt: '2 hours ago', role: 'Member' },
  { id: 'inv2', orgName: 'Knight Acapella', orgColor: '#22C55E', sentBy: 'Danny Fox', sentAt: '1 day ago', role: 'Admin' },
];

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatTime = (timeStr: string): string => {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

export const getGarageOccupancy = (garageId: string, date: string = '2026-04-07'): Record<number, number> => {
  const result: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  mockBookings.filter(b => b.garageId === garageId && b.date === date).forEach(b => {
    result[b.floor] = (result[b.floor] || 0) + 1;
  });
  return result;
};