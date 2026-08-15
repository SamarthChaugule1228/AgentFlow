import { Menu, X, LogOut, Settings, FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/profile', label: 'My Profile', icon: 'UserRound' },
  { to: '/history', label: 'Form History', icon: 'ClipboardList' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const getIcon = (iconName) => {
    const icons = {
      LayoutDashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>,
      UserRound: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
      ClipboardList: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
    };
    const Icon = icons[iconName];
    return Icon ? <Icon /> : null;
  };

  return <div className="flex min-h-screen bg-[#f9faf8] text-[#193026]">
    {/* Mobile Sidebar Overlay */}
    {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)}/>}

    {/* Sidebar */}
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[#e5e9e2] bg-white shadow-lg transition-transform md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-[#e5e9e2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-[#3d9b69] to-[#2c8056]">
              <FileText size={18} className="text-white"/>
            </div>
            <span className="text-lg font-bold tracking-tight">AgentFlow</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={20}/>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-[#8a998e]">Workspace</p>
          <div className="mt-4 space-y-1">
            {links.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[#e8f5ed] text-[#26764f] font-semibold' : 'text-[#66776d] hover:bg-[#f4f7f3]'}`}>
                {getIcon(icon)}
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Extension Status */}
        <div className="border-t border-[#e5e9e2] px-3 py-4">
          <div className="rounded-xl bg-linear-to-br from-[#193126] to-[#1a3a2f] p-4 text-white">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#65d794]"/>
              <span className="text-xs font-semibold">Extension Status</span>
            </div>
            <p className="text-xs leading-5 text-[#a7e9c3]">Connect the Chrome extension to fill approved answers automatically.</p>
            <button className="mt-3 text-xs font-semibold text-[#65d794] hover:text-[#7fe6a9]">View setup →</button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e9e2] px-3 py-3 space-y-1">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#66776d] hover:bg-[#f4f7f3]">
            <Settings size={16}/>
            <span>Settings</span>
          </button>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#66776d] hover:bg-[#f4f7f3]">
            <LogOut size={16}/>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>

    {/* Main Content */}
    <main className="flex min-h-screen flex-1 flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-[#e5e9e2] bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-3 sm:px-5 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden">
            <Menu size={24}/>
          </button>
          <div className="hidden md:block text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998e]">Welcome</p>
            <p className="font-semibold text-[#193026]">Your Application Workspace</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 rounded-full bg-[#e8f5ed] px-3 py-1.5 text-xs font-semibold text-[#2e8657] sm:flex">
              ● Private & Approval-First
            </span>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 rounded-lg hover:bg-[#f4f7f3] px-2 py-1.5">
                <div className="grid size-8 place-items-center rounded-lg bg-[#e8f5ed] text-xs font-bold text-[#3d9b69]">AS</div>
                <ChevronDown size={16} className="text-[#66776d]"/>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg border border-[#e5e9e2] bg-white shadow-lg">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#f4f7f3]">Profile</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#f4f7f3]">Settings</button>
                  <button onClick={handleSignOut} className="w-full px-4 py-2 text-left text-sm hover:bg-[#f4f7f3] border-t border-[#e5e9e2] text-[#b14b48]">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1">
        <Outlet/>
      </div>
    </main>
  </div>;
}
