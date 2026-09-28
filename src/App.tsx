import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AirVent,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Columns3,
  DoorOpen,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Map,
  Monitor,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthScreen from '@/components/AuthScreen';

type RoomStatus = 'free' | 'occupied' | 'soon';
type Room = {
  id: string;
  label: string;
  floor: string;
  status: RoomStatus;
  availableFor: string;
  nextClass: string;
  nextClassAt: string;
  capacity: number;
  seats: number;
  features: string[];
  position: string;
};

type Claim = { id: string; room: string; claimed_until: string };

const floors = ['All floors', 'Ground floor', 'Level 1', 'Level 2', 'Level 3'];
const suggestedQueries = [
  'Find an AC room for 6 people for 2 hours',
  'Quiet room on Level 2 with a projector',
  'Show me free rooms near the library',
];

const rooms: Room[] = [
  { id: 'ist-101', label: 'IST 101', floor: 'Ground floor', status: 'free', availableFor: '2h 40m', nextClass: 'Wireless Communication', nextClassAt: '14:30', capacity: 48, seats: 22, features: ['AC', 'Projector', 'Whiteboard'], position: 'col-span-2 row-span-2' },
  { id: 'ist-102', label: 'IST 102', floor: 'Ground floor', status: 'occupied', availableFor: '—', nextClass: 'Computer Networks', nextClassAt: '12:30', capacity: 42, seats: 0, features: ['AC', 'Projector'], position: 'col-span-1 row-span-1' },
  { id: 'ist-103', label: 'IST 103', floor: 'Ground floor', status: 'soon', availableFor: '28m', nextClass: 'VLSI Design', nextClassAt: '11:40', capacity: 36, seats: 5, features: ['AC', 'Whiteboard'], position: 'col-span-1 row-span-1' },
  { id: 'ist-104', label: 'IST 104', floor: 'Ground floor', status: 'free', availableFor: '1h 15m', nextClass: 'Machine Learning', nextClassAt: '13:05', capacity: 30, seats: 16, features: ['Projector', 'Power'], position: 'col-span-1 row-span-1' },
  { id: 'ist-105', label: 'IST 105', floor: 'Ground floor', status: 'free', availableFor: '3h 10m', nextClass: 'Semiconductor Memory', nextClassAt: '15:20', capacity: 54, seats: 31, features: ['AC', 'Projector', 'Power'], position: 'col-span-1 row-span-1' },
  { id: 'ist-201', label: 'IST 201', floor: 'Level 1', status: 'free', availableFor: '1h 50m', nextClass: 'Microprocessors', nextClassAt: '13:40', capacity: 46, seats: 19, features: ['AC', 'Projector'], position: 'col-span-2 row-span-1' },
  { id: 'ist-202', label: 'IST 202', floor: 'Level 1', status: 'occupied', availableFor: '—', nextClass: 'Discrete Mathematics', nextClassAt: '12:30', capacity: 40, seats: 0, features: ['Whiteboard'], position: 'col-span-1 row-span-1' },
  { id: 'ist-301', label: 'IST 301', floor: 'Level 2', status: 'free', availableFor: '4h 05m', nextClass: 'No class scheduled', nextClassAt: '16:30', capacity: 62, seats: 44, features: ['AC', 'Projector', 'Power'], position: 'col-span-2 row-span-2' },
  { id: 'ist-302', label: 'IST 302', floor: 'Level 2', status: 'soon', availableFor: '42m', nextClass: 'Network on Chip', nextClassAt: '11:55', capacity: 32, seats: 3, features: ['AC', 'Whiteboard'], position: 'col-span-1 row-span-1' },
  { id: 'ist-401', label: 'IST 401', floor: 'Level 3', status: 'free', availableFor: '2h 05m', nextClass: 'Community Connect', nextClassAt: '14:00', capacity: 28, seats: 12, features: ['Projector', 'Power'], position: 'col-span-1 row-span-1' },
  { id: 'ist-402', label: 'IST 402', floor: 'Level 3', status: 'occupied', availableFor: '—', nextClass: 'VLSI Laboratory', nextClassAt: '12:30', capacity: 24, seats: 0, features: ['AC', 'Power'], position: 'col-span-1 row-span-1' },
];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function App() {
  const [activeFloor, setActiveFloor] = useState('All floors');
  const [query, setQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room>(rooms[0]);
  const [showFinder, setShowFinder] = useState(false);
  const [claimedRoom, setClaimedRoom] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [liveClaims, setLiveClaims] = useState<Claim[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) return;
    void supabase.from('room_claims').select('id, room, claimed_until').gt('claimed_until', new Date().toISOString()).then(({ data }) => {
      if (data) setLiveClaims(data as Claim[]);
    });
  }, [claimedRoom, session]);

  const filteredRooms = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return rooms.filter((room) => {
      const matchesFloor = activeFloor === 'All floors' || room.floor === activeFloor;
      const matchesSearch = !normalizedQuery || [room.label, room.floor, room.nextClass, ...room.features].join(' ').toLowerCase().includes(normalizedQuery);
      return matchesFloor && matchesSearch;
    });
  }, [activeFloor, query]);

  const liveCountdown = useMemo(() => {
    const [hours, minutes] = selectedRoom.nextClassAt.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() < now) target.setDate(target.getDate() + 1);
    return formatTime(Math.floor((target.getTime() - now) / 1000));
  }, [now, selectedRoom.nextClassAt]);

  const freeRooms = rooms.filter((room) => room.status === 'free').length;
  const claimedRoomRecord = liveClaims.find((claim) => claim.room === selectedRoom.label);

  const todayString = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const userInitials = session?.user?.email ? session.user.email.slice(0, 2).toUpperCase() : 'AK';

  if (authReady && !session) return <AuthScreen />;
  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08100f] text-[#c8f36c]">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-[#c8f36c]/10"><GraduationCap size={28} /></div>
          <p className="text-sm text-[#7f8e87]">Loading your campus...</p>
        </div>
      </main>
    );
  }

  async function claimSelectedRoom() {
    const claimedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    setClaimedRoom(selectedRoom.id);
    const { error } = await supabase.from('room_claims').insert({ room: selectedRoom.label, claimed_until: claimedUntil });
    setClaimMessage(error ? 'Room held on this device for the next hour.' : 'Room claimed for the next hour.');
  }

  function callSquad() {
    const text = `Heading to ${selectedRoom.label}. It is free until ${selectedRoom.nextClassAt}. Come join us.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="min-h-screen bg-[#08100f] text-[#eef4ed] selection:bg-[#c8f36c] selection:text-[#08100f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0b1513] px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8f36c] text-[#08100f]"><GraduationCap size={21} strokeWidth={2.5} /></div>
            <div><p className="text-sm font-semibold tracking-tight">Free Class</p><p className="text-[11px] uppercase tracking-[0.2em] text-[#80908a]">Locator</p></div>
          </div>
          <div className="mt-14 space-y-1">
            <NavItem icon={<LayoutGrid size={18} />} label="Overview" active />
            <NavItem icon={<Map size={18} />} label="Live map" />
            <NavItem icon={<CalendarDays size={18} />} label="Timetables" />
            <NavItem icon={<Users size={18} />} label="My squad" />
          </div>
          <div className="mt-auto rounded-2xl border border-[#c8f36c]/20 bg-[#c8f36c]/[0.06] p-4">
            <div className="mb-4 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c8f36c]/15 text-[#c8f36c]"><Zap size={16} /></span><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c8f36c]">Live sync</span></div>
            <p className="text-sm font-medium">Campus schedules are synced</p><p className="mt-1 text-xs leading-5 text-[#83918b]">Last updated less than a minute ago.</p>
          </div>
          <div className="mt-5 flex items-center gap-3 px-3 text-[#8b9b94]"><Settings2 size={17} /><span className="text-sm">Settings</span></div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#c8f36c] text-[#08100f]"><GraduationCap size={19} /></div><span className="text-sm font-semibold">Free Class Locator</span></div>
            <div className="hidden items-center gap-2 text-sm text-[#8c9b95] lg:flex"><span className="text-[#dce5dc]">Campus /</span> Classroom finder</div>
            <div className="ml-auto flex items-center gap-4"><button className="relative grid h-10 w-10 place-items-center rounded-full border border-white/[0.1] text-[#a5b2ab] transition hover:border-[#c8f36c]/50 hover:text-[#c8f36c]"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ffbf69]" /></button><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d3b58d] text-sm font-bold text-[#241a11]">{userInitials}</div><span className="hidden max-w-[140px] truncate text-sm text-[#c4cec7] sm:inline">{session?.user?.email ?? 'Student'}</span><button onClick={() => void supabase.auth.signOut()} className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.1] text-[#a5b2ab] transition hover:border-red-400/50 hover:text-red-300" title="Sign out"><LogOut size={16} /></button></div></div>
          </header>

          <div className="mt-12 max-w-3xl"><p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c8f36c]"><span className="h-1.5 w-1.5 rounded-full bg-[#c8f36c] shadow-[0_0_10px_#c8f36c]" /> {todayString}</p><h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-[#f3f7f0] sm:text-6xl">Find your next <span className="text-[#c8f36c]">quiet corner.</span></h1><p className="mt-5 max-w-xl text-[15px] leading-7 text-[#8f9e97]">Skip the hallway hunt. See every classroom, every floor, and every free minute across your campus.</p></div>

          <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/[0.11] bg-[#101d1a] p-2 shadow-2xl shadow-black/20 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Sparkles size={19} className="shrink-0 text-[#c8f36c]" /><input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setShowFinder(true)} placeholder="Ask for a room, floor, feature or time..." className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#6f7e76]" /><kbd className="hidden rounded-md border border-white/10 px-2 py-1 text-[10px] text-[#718078] sm:block">⌘ K</kbd></div><button onClick={() => setShowFinder(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#c8f36c] px-5 py-3 text-sm font-bold text-[#08100f] transition hover:bg-[#ddff91]"><Search size={16} /> Find a room</button></div>
          {showFinder && <div className="mt-2 rounded-2xl border border-white/[0.08] bg-[#101d1a] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#74847c]">Try asking</span><button onClick={() => setShowFinder(false)} className="text-[#7d8d85] hover:text-white"><X size={16} /></button></div><div className="flex flex-wrap gap-2">{suggestedQueries.map((suggestion) => <button key={suggestion} onClick={() => { setQuery(suggestion); setShowFinder(false); }} className="rounded-full border border-white/[0.1] px-3 py-2 text-left text-xs text-[#b5c1b9] transition hover:border-[#c8f36c]/40 hover:text-[#c8f36c]">{suggestion}</button>)}</div></div>}

          <div className="mt-11 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Rooms tracked" value="42" icon={<DoorOpen size={17} />} /><Stat label="Free right now" value={String(freeRooms).padStart(2, '0')} icon={<Check size={17} />} accent /><Stat label="Avg. free time" value="2.4h" icon={<Clock3 size={17} />} /><Stat label="Active squads" value="08" icon={<Users size={17} />} /></div>

          <div className="mt-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold tracking-tight">Live floor map</h2><span className="rounded-full bg-[#c8f36c]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#c8f36c]">Realtime</span></div><p className="mt-2 text-sm text-[#7f8e87]">Select a floor to scan available classrooms.</p></div><div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0d1816] p-1">{floors.map((floor) => <button key={floor} onClick={() => setActiveFloor(floor)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${activeFloor === floor ? 'bg-[#eaf4e7] text-[#102018]' : 'text-[#89978f] hover:text-white'}`}>{floor}</button>)}</div></div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="rounded-2xl border border-white/[0.08] bg-[#0c1715] p-4 sm:p-5"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-4 text-[11px] text-[#84928b]"><Legend color="bg-[#c8f36c]" label="Free" /><Legend color="bg-[#ffbf69]" label="Ending soon" /><Legend color="bg-[#273530]" label="Occupied" /></div><div className="flex items-center gap-2 text-[11px] text-[#75847d]"><Columns3 size={15} /> Floor plan</div></div><div className="grid auto-rows-[92px] grid-cols-4 gap-2 sm:auto-rows-[108px] sm:grid-cols-6">{filteredRooms.map((room) => <RoomTile key={room.id} room={room} selected={selectedRoom.id === room.id} claimed={claimedRoom === room.id || liveClaims.some((claim) => claim.room === room.label)} onClick={() => setSelectedRoom(room)} />)}</div>{filteredRooms.length === 0 && <div className="grid min-h-40 place-items-center text-sm text-[#809089]">No rooms match that search. Try a different feature or floor.</div>}<div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-[#718078]"><span>Showing {filteredRooms.length} of 42 rooms</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#c8f36c]" /> Updates automatically</span></div></div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#10201c] p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#83938a]">Selected room</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">{selectedRoom.label}</h3><p className="mt-1 text-sm text-[#8b9a92]">{selectedRoom.floor}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${selectedRoom.status === 'free' ? 'bg-[#c8f36c]/15 text-[#c8f36c]' : selectedRoom.status === 'soon' ? 'bg-[#ffbf69]/15 text-[#ffbf69]' : 'bg-white/[0.08] text-[#93a099]'}`}>{selectedRoom.status === 'free' ? 'Available' : selectedRoom.status === 'soon' ? 'Ending soon' : 'Occupied'}</span></div><div className="my-6 flex items-end justify-between border-y border-white/[0.08] py-5"><div><p className="text-xs text-[#829088]">Next class in</p><p className="mt-1 font-mono text-3xl font-medium tracking-tight text-[#e8f2e4]">{liveCountdown}</p></div><Clock3 className="mb-1 text-[#c8f36c]" size={22} /></div><div className="grid grid-cols-2 gap-3 text-xs"><Detail icon={<Users size={15} />} value={`${selectedRoom.capacity} seats`} /><Detail icon={<Wifi size={15} />} value="Campus Wi-Fi" />{selectedRoom.features.map((feature) => <Detail key={feature} icon={feature === 'AC' ? <AirVent size={15} /> : feature === 'Projector' ? <Monitor size={15} /> : <Zap size={15} />} value={feature} />)}</div><p className="mt-5 text-xs leading-5 text-[#83928a]">Next up: <span className="text-[#c5d0c8]">{selectedRoom.nextClass}</span> at {selectedRoom.nextClassAt}</p><button disabled={selectedRoom.status === 'occupied'} onClick={() => void claimSelectedRoom()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8f36c] py-3 text-sm font-bold text-[#08100f] transition hover:bg-[#ddff91] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-[#718078]">{claimedRoom === selectedRoom.id || claimedRoomRecord ? <><Check size={16} /> Room claimed</> : <><Plus size={16} /> Claim this room</>}</button>{(claimedRoom === selectedRoom.id || claimedRoomRecord) && <button onClick={callSquad} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c8f36c]/30 py-3 text-sm font-semibold text-[#c8f36c] transition hover:bg-[#c8f36c]/10"><Send size={15} /> Call the squad</button>}{claimMessage && <p className="mt-3 text-center text-xs text-[#a1c18f]">{claimMessage}</p>}</div></div>

          <div className="mt-12 border-t border-white/[0.08] pt-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Best matches for you</h2><p className="mt-1 text-sm text-[#7f8e87]">Based on your recent searches and free time.</p></div><button className="flex items-center gap-1 text-sm font-semibold text-[#c8f36c]">View all rooms <ArrowUpRight size={15} /></button></div><div className="mt-5 grid gap-3 md:grid-cols-3">{rooms.filter((room) => room.status === 'free').slice(0, 3).map((room, index) => <button key={room.id} onClick={() => setSelectedRoom(room)} className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0d1816] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c8f36c]/30"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-lg ${index === 0 ? 'bg-[#c8f36c]/15 text-[#c8f36c]' : 'bg-white/[0.06] text-[#9eada4]'}`}><DoorOpen size={18} /></div><div><p className="text-sm font-semibold">{room.label}</p><p className="mt-1 text-xs text-[#7b8b83]">{room.floor} · {room.seats} seats open</p></div></div><ArrowUpRight size={16} className="text-[#65756d] transition group-hover:text-[#c8f36c]" /></button>)}</div></div>
          <footer className="mt-14 flex flex-col justify-between gap-3 border-t border-white/[0.08] py-6 text-xs text-[#65756d] sm:flex-row"><span>Free Class Locator · SRM IST Trichy</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c8f36c]" /> Timetable synced for odd semester 2026–27</span></footer>
        </section>
      </div>
    </main>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) { return <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-white/[0.08] text-[#f1f6ed]' : 'text-[#84938b] hover:bg-white/[0.05] hover:text-white'}`}>{icon}<span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c8f36c]" />}</button>; }
function Stat({ label, value, icon, accent = false }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) { return <div className="rounded-xl border border-white/[0.08] bg-[#0d1816] p-4"><div className={`mb-4 grid h-8 w-8 place-items-center rounded-lg ${accent ? 'bg-[#c8f36c]/15 text-[#c8f36c]' : 'bg-white/[0.06] text-[#8f9e96]'}`}>{icon}</div><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-[#75847c]">{label}</p></div>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>; }
function Detail({ icon, value }: { icon: React.ReactNode; value: string }) { return <span className="flex items-center gap-2 text-[#9dac9f]"><span className="text-[#c8f36c]">{icon}</span>{value}</span>; }
function RoomTile({ room, selected, claimed, onClick }: { room: Room; selected: boolean; claimed: boolean; onClick: () => void }) { const colors = room.status === 'free' ? 'border-[#c8f36c]/25 bg-[#c8f36c]/[0.09] hover:bg-[#c8f36c]/[0.15]' : room.status === 'soon' ? 'border-[#ffbf69]/25 bg-[#ffbf69]/[0.09] hover:bg-[#ffbf69]/[0.15]' : 'border-white/[0.06] bg-[#111f1b] hover:bg-[#162923]'; return <button onClick={onClick} className={`${room.position} ${colors} ${selected ? 'ring-2 ring-[#c8f36c] ring-offset-2 ring-offset-[#0c1715]' : ''} relative flex min-h-0 flex-col justify-between rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5`}><div className="flex items-start justify-between gap-2"><span className={`text-xs font-bold ${room.status === 'free' ? 'text-[#c8f36c]' : room.status === 'soon' ? 'text-[#ffbf69]' : 'text-[#77877e]'}`}>{room.label}</span>{claimed && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#c8f36c] text-[#08100f]"><Check size={12} strokeWidth={3} /></span>}</div><div><p className="truncate text-[11px] text-[#9aa9a0]">{room.status === 'occupied' ? 'In class' : room.status === 'soon' ? `Free for ${room.availableFor}` : `${room.availableFor} available`}</p><p className="mt-1 truncate text-[10px] text-[#6c7b73]">{room.nextClassAt} · {room.capacity} seats</p></div></button>; }

export default App;
