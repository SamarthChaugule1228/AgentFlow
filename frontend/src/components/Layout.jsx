import { ClipboardList, FileText, LayoutDashboard, LogOut, Settings, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'My profile', icon: UserRound },
  { to: '/history', label: 'Form history', icon: ClipboardList },
];

export default function Layout() {
  return <div className="min-h-screen bg-[#f7f8f5] text-[#193026]">
    <aside className="fixed inset-y-0 flex w-64 flex-col border-r border-[#e5e9e2] bg-white px-4 py-6">
      <div className="mb-10 flex items-center gap-2 px-2 text-xl font-bold tracking-[-1px]"><span className="grid size-8 place-items-center rounded-lg bg-[#183126] text-[#b9f0d1]"><FileText size={17}/></span>Agent<span className="text-[#3d9b69]">Flow</span></div>
      <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8a998e]">Workspace</p>
      <nav className="mt-3 space-y-1">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[#e8f5ed] text-[#26764f]' : 'text-[#66776d] hover:bg-[#f4f7f3]'}`}><Icon size={17}/>{label}</NavLink>)}</nav>
      <div className="mt-auto rounded-xl bg-[#193126] p-4 text-white"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><span className="size-2 rounded-full bg-[#65d794]"/> Extension status</div><p className="text-[11px] leading-5 text-[#c2d6ca]">Connect the Chrome extension to fill approved answers in your browser.</p><button className="mt-3 text-xs font-semibold text-[#91e2b5]">View setup guide →</button></div>
      <button className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-[#78877e]"><Settings size={16}/> Settings</button><button className="flex items-center gap-3 px-3 py-2 text-sm text-[#78877e]"><LogOut size={16}/> Sign out</button>
    </aside><main className="ml-64 min-h-screen"><header className="flex h-20 items-center justify-between border-b border-[#e5e9e2] bg-white px-9"><div><p className="text-xs text-[#7c8b81]">Good morning</p><h1 className="text-base font-bold">Your application workspace</h1></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-[#eff8f2] px-3 py-1.5 text-xs font-semibold text-[#31865a] sm:block">● Private & approval-first</span><span className="grid size-9 place-items-center rounded-full bg-[#ddecdf] text-xs font-bold text-[#326048]">AS</span></div></header><Outlet/></main>
  </div>;
}
