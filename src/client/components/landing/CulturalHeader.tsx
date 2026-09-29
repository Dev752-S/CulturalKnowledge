import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, LogOut, CheckCircle2, Trophy, X } from 'lucide-react';

interface CulturalHeaderProps {
  user: {
    fullName?: string | null;
    teamName?: string | null;
    photoUrl?: string | null;
  } | null;
  onLogout?: () => void;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  score?: number;
  createdAt: string;
}

export default function CulturalHeader({ user, onLogout }: CulturalHeaderProps) {
  const teamName = user?.teamName?.trim() || 'Team Vibes';
  const photoUrl = user?.photoUrl;

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationData[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      try {
        const res = await fetch('/api/v1/notifications');
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setNotificationsList(data.notifications);
        }
      } catch {
        // Ignore network errors
      }
    }
    loadNotifications();
  }, [user]);

  const hasUnread = notificationsList.some((n) => !n.isRead);

  return (
    <header className="w-full h-16 sm:h-[68px] bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#643C28]/10 px-4 sm:px-6 md:px-10 flex items-center justify-between sticky top-0 z-40 transition-all select-none">
      {/* Top-Left Brand */}
      <Link to="/" className="flex items-center text-left group">
        <span className="font-cormorant text-2xl sm:text-[27px] font-semibold tracking-wide text-[#54133F] leading-none group-hover:text-[#7A1C5B] transition-colors">
          Cultural Knowledge
        </span>
      </Link>

      {/* Right-Side Group: Nav Links, Team Area, Bell, and Logout */}
      <div className="flex items-center space-x-3 sm:space-x-6 md:space-x-8">
        {/* Navigation Links: Events | Leaderboard */}
        <nav className="flex items-center text-[#54133F] text-sm sm:text-base font-medium">
          <Link
            to="/events"
            className="hover:text-[#7A1C5B] transition-colors font-cormorant text-base sm:text-lg tracking-wide"
          >
            Events
          </Link>
          <span className="text-[#8A6D65]/40 mx-2 sm:mx-3 text-sm font-light select-none">|</span>
          <Link
            to="/leaderboard"
            className="hover:text-[#7A1C5B] transition-colors font-cormorant text-base sm:text-lg tracking-wide"
          >
            Leaderboard
          </Link>
        </nav>

        {/* Dynamic Authenticated Participant & Team Area */}
        <div className="flex items-center space-x-2.5 pl-1 sm:pl-3 border-l border-[#643C28]/10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={teamName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-[#C58A3A]/40 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#54133F] via-[#6D1B50] to-[#C58A3A] text-[#FFF8EA] flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm">
                {teamName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Team Text Only */}
          <div className="flex items-center text-left max-w-[130px] sm:max-w-[180px] overflow-hidden">
            <div className="flex items-center space-x-1 text-[#54133F]">
              <Users className="w-3.5 h-3.5 text-[#54133F]/75 flex-shrink-0" />
              <span className="text-xs sm:text-[13px] font-semibold truncate tracking-tight text-[#54133F]">
                {teamName}
              </span>
            </div>
          </div>
        </div>

        {/* Far Right Notification Bell with Dropdown Popover */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-1.5 sm:p-2 rounded-full text-[#54133F]/80 hover:text-[#54133F] hover:bg-[#54133F]/5 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E56A21] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#E8DFD8] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#3E231C]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8]">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#E56A21]" />
                  <span className="font-cormorant text-lg font-bold text-[#54133F]">Notifications</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 max-h-72 overflow-y-auto space-y-2.5">
                {notificationsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8A6D65]">
                    No notifications at this time.
                  </div>
                ) : (
                  notificationsList.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl bg-[#FFF8EA] border border-[#E56A21]/20 flex items-start space-x-3 text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#54133F]">{notif.title}</h4>
                        <p className="text-[11px] text-[#633027] mt-0.5 leading-relaxed">{notif.message}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            to="/leaderboard"
                            onClick={() => setShowNotifications(false)}
                            className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#E56A21] hover:underline"
                          >
                            <Trophy className="w-3 h-3" />
                            <span>View Leaderboard</span>
                          </Link>
                          <span className="text-[10px] text-[#8A6D65]">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Graceful Logout Action (Section 61) */}
        {onLogout && (
          <button
            onClick={onLogout}
            type="button"
            aria-label="Logout"
            title="Logout"
            className="p-1.5 sm:p-2 rounded-full text-[#7A4232]/75 hover:text-[#54133F] hover:bg-[#54133F]/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>
    </header>
  );
}
