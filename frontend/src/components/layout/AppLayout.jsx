import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AppLayout: The global shell for the authenticated application.
 * Manages the persistent sidebar navigation and mounts the current active route into the main content area.
 */
export const AppLayout = () => {
    const location = useLocation();
    const { user, token, logout } = useAuth();

    // THE ROUTE GUARD:
    // If the user has no token, immediately bounce them back to the login page.
    // 'replace' ensures they can't use the browser's "Back" button to bypass this.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const navItems = [
        { name: 'Monitoring', path: '/dashboard', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Incidents', path: '/incidents', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    // Fallback avatar generation if the user has not uploaded a profile picture
    const userInitial = user?.full_name
        ? user.full_name.charAt(0).toUpperCase()
        : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

    return (
        <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans">
            <div className="w-64 bg-[#0a0a0c] border-r border-slate-700/60 flex-col justify-between hidden md:flex shrink-0">
                <div>
                    <div className="flex items-center justify-center py-8">
                        <img
                            src="/favicon.png"
                            alt="Tirith"
                            className="w-14 h-14 drop-shadow-[0_0_10px_rgba(176,180,163,0.3)]"
                        />
                    </div>

                    <nav className="px-4 space-y-2 mt-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname.includes(item.path);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-base font-medium cursor-pointer ${isActive
                                        ? 'bg-[#cda434]/10 text-[#cda434] border border-[#cda434]/30'
                                        : 'text-[#B0B4A3] hover:text-slate-100 hover:bg-[#1e232b]'
                                        }`}
                                >
                                    <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.5} d={item.icon} />
                                    </svg>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-700/60 flex items-center justify-between">
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-2 py-2 -ml-2 rounded-md transition-colors hover:bg-[#1e232b] group flex-1 min-w-0 cursor-pointer"
                        title="Profile"
                    >
                        <div className="w-9 h-9 rounded-full bg-[#B0B4A3] flex items-center justify-center text-[#0a0a0c] font-bold text-sm shrink-0 overflow-hidden border border-slate-500 shadow-md">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                                {user?.full_name || "Mellon"}
                            </span>
                            <span className="text-xs text-slate-400 truncate">
                                {user?.email || "Loading..."}
                            </span>
                        </div>
                    </Link>

                    <button
                        onClick={logout}
                        className="flex items-center justify-center p-2 text-[#B0B4A3] hover:text-red-400 hover:bg-red-900/20 rounded-md transition-all border border-transparent hover:border-red-900/50 focus:outline-none shrink-0 ml-2 cursor-pointer"
                        title="Sign Out"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex flex-col bg-[#111318]">
                <main className="flex-1 p-6 lg:p-8 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};