import { useState, useEffect, createContext, useContext, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  MapPin,
  Cloud,
  Send,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  Edit2,
  Trash2,
  LayoutDashboard,
  Building2,
  Tag,
  Star,
  Settings,
  Car,
  MessageSquare,
  LogOut,
  Search,
  Download,
  CheckCircle2,
  Clock,
  MessageCircle,
  AlertCircle,
  AlertTriangle,
  Smartphone,
  MoreVertical,
  Calendar,
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  UserCheck,
  Utensils,
  Eye,
  EyeOff,
  Flag,
  ShieldAlert,
  FolderOpen,
  ExternalLink
} from "lucide-react";
import { GuestSession, Role } from "./types";
import { cn } from "./lib/utils";
import GuestPortalView from "./components/GuestPortalView";
import {
  ConciergeView,
  RecosAnalyticsView,
  FeedbacksView,
  TransfersView,
  TasksView,
  CmsView,
  StaffRegistryView,
  AlertsControlView,
  GeneralSettingsView,
  AlertsNotificationsForm
} from "./components/BackofficeViews";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar
} from "recharts";

// Passkey configurations for backdoor access (easy to change)
const BACKDOOR_CONFIG = {
  ADMIN_PASSKEY: "ADMIN2025",
  RECOS_PASSKEY: "RECOS2025"
};

// Available tab list setup
const TAB_LIST = [
  "Concierge",
  "Tasks",
  "Alerts & Notifications",
  "Transfers",
  "Hub Directory",
  "Staff Registry",
  "Settings",
  "Recos"
] as const;

type Tab = typeof TAB_LIST[number];

// Permissions mapping
const PERMISSIONS: Record<Exclude<Role, null | "guest">, Tab[]> = {
  staff: ["Tasks"],
  manager: ["Concierge", "Tasks", "Alerts & Notifications", "Transfers"],
  admin: ["Concierge", "Tasks", "Alerts & Notifications", "Transfers", "Hub Directory", "Staff Registry", "Settings"],
  recos: ["Recos"]
};

// Role-based theme configuration icon mapped helpers
const TAB_ICONS: Record<Tab, React.ComponentType<any>> = {
  "Concierge": MessageSquare,
  "Tasks": CheckCircle2,
  "Alerts & Notifications": Bell,
  "Transfers": Car,
  "Hub Directory": FolderOpen,
  "Staff Registry": User,
  "Settings": Settings,
  "Recos": Star
};

// React Context for role management
interface RoleContextType {
  role: Role;
  guestSession: GuestSession | null;
  staffName: string | null;
  setRole: (role: Role) => void;
  setGuestSession: (session: GuestSession | null) => void;
  setStaffName: (name: string | null) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(null);
  const [guestSession, setGuestSessionState] = useState<GuestSession | null>(null);
  const [staffName, setStaffNameState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem("app_role") as Role;
    const storedGuest = localStorage.getItem("app_guest_session");
    const storedStaff = localStorage.getItem("app_staff_name");

    if (storedRole) {
      setRoleState(storedRole);
    }
    if (storedGuest) {
      try {
        setGuestSessionState(JSON.parse(storedGuest));
      } catch (e) {
        console.error("Failed to parse guest session", e);
      }
    }
    if (storedStaff) {
      setStaffNameState(storedStaff);
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem("app_role", newRole);
    } else {
      localStorage.removeItem("app_role");
    }
  };

  const setGuestSession = (session: GuestSession | null) => {
    setGuestSessionState(session);
    if (session) {
      localStorage.setItem("app_guest_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("app_guest_session");
    }
  };

  const setStaffName = (name: string | null) => {
    setStaffNameState(name);
    if (name) {
      localStorage.setItem("app_staff_name", name);
    } else {
      localStorage.removeItem("app_staff_name");
    }
  };

  const logout = () => {
    setRoleState(null);
    setGuestSessionState(null);
    setStaffNameState(null);
    localStorage.removeItem("app_role");
    localStorage.removeItem("app_guest_session");
    localStorage.removeItem("app_staff_name");
  };

  return (
    <RoleContext.Provider value={{ role, guestSession, staffName, setRole, setGuestSession, setStaffName, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

// Inner app that determines which screens to route
function MainApp() {
  const { role } = useRole();

  return (
    <div className={cn(
      "min-h-screen text-[var(--color-accent-light)] flex flex-col font-sans transition-colors duration-300",
      role === null ? "bg-[#000000]" : "bg-[var(--color-primary)]"
    )}>
      <AnimatePresence mode="wait">
        {role === null && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-between p-6 bg-black min-h-screen w-full"
          >
            <CheckInScreen />
          </motion.div>
        )}

        {role === "guest" && (
          <motion.div
            key="guest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <GuestPortal />
          </motion.div>
        )}

        {(role === "staff" || role === "manager" || role === "admin" || role === "recos") && (
          <motion.div
            key="backoffice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex overflow-hidden"
          >
            <BackofficeConsole />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- CHECK IN / LOGIN SCREEN ---
function CheckInScreen() {
  const { setRole, setGuestSession, setStaffName } = useRole();
  const [activeTab, setActiveTab] = useState<"guest">("guest");

  const [logoUrl, setLogoUrl] = useState("");
  const [hotelName, setHotelName] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/sync")
      .then(res => res.json())
      .then(data => {
        if (mounted && data?.success && data?.masterConfig) {
          if (data.masterConfig.logoUrl) {
            setLogoUrl(data.masterConfig.logoUrl);
          }
          if (data.masterConfig.hotelName) {
            setHotelName(data.masterConfig.hotelName);
          }
        }
      })
      .catch(err => console.error("Error fetching sync config on login screen:", err));
    return () => {
      mounted = false;
    };
  }, []);

  // Form states and unified Admin login verification
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCategory, setAdminCategory] = useState<"Staff" | "Admin" | "Back-office" | "Recos">("Admin");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const [guestSalutation, setGuestSalutation] = useState("Mr");
  const [guestRoom, setGuestRoom] = useState("");
  const [guestSurname, setGuestSurname] = useState("");
  const [guestError, setGuestError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  const [forgotMessage, setForgotMessage] = useState("");

  // Clean error messages on modal toggle or category turn
  useEffect(() => {
    setGuestError("");
    setAdminError("");
    setForgotMessage("");
  }, [showAdminModal, adminCategory]);

  // Guest Check-In Submit
  const handleGuestCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError("");

    const parsedRoom = parseInt(guestRoom, 10);
    if (isNaN(parsedRoom)) {
      setGuestError("Please enter a valid room number as an integer.");
      return;
    }

    if (!guestSurname.trim()) {
      setGuestError("Surname is required.");
      return;
    }

    setGuestLoading(true);
    try {
      const response = await fetch("/api/chat/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roomNumber: parsedRoom, 
          surname: guestSurname.trim(),
          salutation: guestSalutation
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setGuestSession({ guestName: data.guestName, roomNumber: data.roomNumber });
        setRole("guest");
      } else {
        setGuestError(data.error || "Failed to complete guest authentication.");
      }
    } catch (err) {
      console.error(err);
      setGuestError("Server or connection error. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  };

  // Unified Admin Login Submit (Staff / Admin / Back-office / Recos)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setForgotMessage("");

    const u = adminUsername.trim();
    const p = adminPassword.trim();

    if (!u || !p) {
      setAdminError("Please enter username and password.");
      return;
    }

    const normalizedU = u.toUpperCase();
    const normalizedP = p.toUpperCase();

    // 1. Direct local credential configurations requested:
    if (adminCategory === "Recos") {
      if (normalizedU === "ADMIN" && normalizedP === "ADMIN2025") {
        setStaffName(u);
        setRole("recos");
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
        return;
      }
    } else {
      // Staff, Admin, Back-office
      if (normalizedU === "ADMIN" && normalizedP === "ADMIN") {
        setStaffName(u);
        if (adminCategory === "Staff") {
          setRole("staff");
        } else if (adminCategory === "Admin") {
          setRole("manager");
        } else if (adminCategory === "Back-office") {
          setRole("admin");
        }
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
        return;
      }
    }

    setAdminLoading(true);
    try {
      // 2. Fallbacks: Backdoor / Passkey overrides first to match role specification
      if (adminCategory === "Back-office") {
        if (p === BACKDOOR_CONFIG.ADMIN_PASSKEY) {
          setStaffName(u);
          setRole("admin");
          setShowAdminModal(false);
          setAdminLoading(false);
          setAdminUsername("");
          setAdminPassword("");
          return;
        }
      } else if (adminCategory === "Recos") {
        if (p.toUpperCase() === "RUAN" || p === BACKDOOR_CONFIG.RECOS_PASSKEY) {
          setStaffName(u);
          setRole("recos");
          setShowAdminModal(false);
          setAdminLoading(false);
          setAdminUsername("");
          setAdminPassword("");
          return;
        }
      }

      // 3. Standard authentication through unified backend
      const response = await fetch("/api/auth/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStaffName(data.username);
        let mappedRole = data.role as any;
        
        if (adminCategory === "Staff") {
          setRole("staff");
        } else if (adminCategory === "Admin") {
          setRole(mappedRole === "admin" ? "admin" : "manager");
        } else if (adminCategory === "Back-office") {
          setRole("admin");
        } else if (adminCategory === "Recos") {
          setRole("recos");
        } else {
          setRole(mappedRole || "staff");
        }
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
      } else {
        // High fidelity fallbacks for standard pre-seeded users:
        if (adminCategory === "Staff" && p === "password789") {
          setStaffName(u);
          setRole("staff");
          setShowAdminModal(false);
          setAdminUsername("");
          setAdminPassword("");
        } else if (adminCategory === "Admin" && (p === "password123" || p === "password456")) {
          setStaffName(u);
          setRole(p === "password456" ? "admin" : "manager");
          setShowAdminModal(false);
          setAdminUsername("");
          setAdminPassword("");
        } else if (adminCategory === "Recos" && p === "passwordabc") {
          setStaffName(u);
          setRole("recos");
          setShowAdminModal(false);
          setAdminUsername("");
          setAdminPassword("");
        } else {
          setAdminError(data.error || "Invalid username or password.");
        }
      }
    } catch (err) {
      console.error("Unified Admin Auth error:", err);
      if (adminCategory === "Staff" && p === "password789") {
        setStaffName(u);
        setRole("staff");
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
      } else if (adminCategory === "Admin" && p === "password123") {
        setStaffName(u);
        setRole("manager");
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
      } else if (adminCategory === "Admin" && p === "password456") {
        setStaffName(u);
        setRole("admin");
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
      } else if (adminCategory === "Recos" && p === "passwordabc") {
        setStaffName(u);
        setRole("recos");
        setShowAdminModal(false);
        setAdminUsername("");
        setAdminPassword("");
      } else {
        setAdminError("Connection error. Please try again.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <>
      {/* Upper centered container */}
      <div className="w-full max-w-[390px] px-6 sm:px-2 flex-1 flex flex-col justify-center items-center space-y-7 my-auto">
        {/* Visual Logo matching the uploaded mockup exactly */}
        <div 
          onClick={() => setActiveTab("guest")}
          className="flex flex-col items-center justify-center space-y-1 mt-4 select-none cursor-pointer group transition-all duration-300"
        >
          <div className="flex items-center justify-center">
            {/* Gold @ concentric spirals or custom uploaded logo */}
            <div className="relative w-[256px] h-[256px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Hotel Logo"
                  className="w-[256px] h-[256px] sm:w-[320px] sm:h-[320px] object-contain drop-shadow-[0_0_8px_rgba(202,164,114,0.3)] group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg viewBox="0 0 100 100" className="w-[256px] h-[256px] sm:w-[320px] sm:h-[320px] text-[#cca472] drop-shadow-[0_0_8px_rgba(202,164,114,0.4)] group-hover:scale-105 transition-transform duration-300">
                  {/* Outer circle */}
                  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="6.5" />
                  {/* Inner ring */}
                  <circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  {/* At text in system sans serif */}
                  <text 
                    x="50" 
                    y="59.5" 
                    textAnchor="middle" 
                    fontSize="33" 
                    fontWeight="900" 
                    fontFamily="system-ui, sans-serif" 
                    fill="currentColor"
                  >
                    @
                  </text>
                </svg>
              )}
            </div>
          </div>

        </div>

        {/* Auth Screens Form Container */}
        <div className="w-full pb-14 sm:pb-20">
          <AnimatePresence mode="wait">
            {activeTab === "guest" && (
              <motion.form
                key="guest"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleGuestCheckin}
                className="space-y-4 w-full"
              >
                <div className="space-y-4 w-full">
                  {/* Salutation + Surname row */}
                  <div className="flex gap-3 w-full">
                    {/* Styled Selector */}
                    <div className="w-[32%] relative">
                      <select
                        value={guestSalutation}
                        onChange={(e) => setGuestSalutation(e.target.value)}
                        className="w-full bg-[#0d0d0d] hover:bg-[#121212] border border-slate-900 text-white placeholder-slate-400 py-3.5 px-4 pr-9 rounded-2xl cursor-pointer focus:outline-none focus:border-[#cca472]/45 text-sm font-semibold selection:bg-slate-800 transition-colors duration-150 appearance-none text-left"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                      </select>
                      {/* Golden Dropdown Arrow */}
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#cca472]">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {/* Surname field (placeholder capitalized "Surname") */}
                    <div className="w-[68%]">
                      <input
                        type="text"
                        placeholder="Surname"
                        value={guestSurname}
                        onChange={(e) => setGuestSurname(e.target.value)}
                        className="w-full bg-[#0d0d0d] hover:bg-[#121212] border border-slate-900 text-white placeholder-stone-600 py-3.5 px-5 rounded-2xl focus:outline-none focus:border-[#cca472]/45 text-sm transition-colors duration-150"
                        required
                      />
                    </div>
                  </div>

                  {/* Room code field (placeholder capitalized "Room Number") */}
                  <div className="w-full">
                    <input
                      type="number"
                      placeholder="Room Number"
                      value={guestRoom}
                      onChange={(e) => setGuestRoom(e.target.value)}
                      className="w-full bg-[#0d0d0d] hover:bg-[#121212] border border-slate-900 text-white placeholder-stone-600 py-3.5 px-5 rounded-2xl focus:outline-none focus:border-[#cca472]/45 text-sm transition-colors duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>
                </div>

                {guestError && (
                  <div className="text-red-400 text-xs flex items-center space-x-1.5 justify-center mt-2.5">
                    <AlertCircle size={14} />
                    <span>{guestError}</span>
                  </div>
                )}

                {/* CHECK IN button styled exactly as in the mockup */}
                <button
                  type="submit"
                  disabled={guestLoading}
                  className="w-full bg-[#cca472] hover:bg-[#d6b384] text-slate-950 font-bold tracking-[0.14em] text-xs py-3.5 px-6 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-3.5 font-sans flex items-center justify-center shadow-lg shadow-[#cca472]/5"
                >
                  {guestLoading ? "CHECKING DESK LOGS..." : "CHECK IN"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Absolute Bottom Navigation Bar - Aligned with modern visual balance */}
      <div className="flex justify-center items-center pt-6 pb-4 w-full max-w-[390px] border-t border-slate-900/40">
        <button
          type="button"
          onClick={() => {
            setShowAdminModal(true);
          }}
          className="text-[11px] sm:text-xs tracking-[0.25em] font-normal uppercase text-[#cca472] hover:text-[#cca472]/85 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer font-sans select-none"
        >
          Admin Login
        </button>
      </div>

      {/* Modern Unified Admin Login Modal Popup */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-stone-900/80 rounded-3xl p-6 shadow-2xl flex flex-col space-y-5"
            >
              {/* Header with Title and custom styled border */}
              <div className="text-center space-y-1 pb-3 border-b border-stone-900/60">
                <h3 className="font-sans font-[900] text-sm uppercase tracking-[0.22em] text-[#cca472]">
                  ADMIN LOGIN
                </h3>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4 pt-1">
                {/* Username & Password */}
                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#cca472]/65 pl-1 font-mono">
                      CREDENTIALS
                    </label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={adminUsername}
                      onChange={(e) => {
                        setAdminUsername(e.target.value);
                        setAdminError("");
                        setForgotMessage("");
                      }}
                      className="w-full bg-[#0d0d0d] hover:bg-[#121212] border border-slate-900 text-white placeholder-stone-600 py-3.5 px-5 rounded-2xl focus:outline-none focus:border-[#cca472]/45 text-sm transition-colors duration-150"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="password"
                      placeholder="Password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setAdminError("");
                        setForgotMessage("");
                      }}
                      className="w-full bg-[#0d0d0d] hover:bg-[#121212] border border-slate-900 text-white placeholder-stone-600 py-3.5 px-5 rounded-2xl focus:outline-none focus:border-[#cca472]/45 text-sm transition-colors duration-150"
                      required
                    />
                  </div>
                </div>

                {/* Tactical Role Segment Picker */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#cca472]/65 pl-1 font-mono">
                    ACCESS ROLE
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#050505] border border-slate-900/80 rounded-xl">
                    {(["Staff", "Admin", "Back-office", "Recos"] as const).map((cat) => {
                      const isActive = adminCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setAdminCategory(cat);
                            setAdminError("");
                            setForgotMessage("");
                          }}
                          className={cn(
                            "py-2 text-[9px] uppercase tracking-wider font-extrabold font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap text-center",
                            isActive 
                              ? "bg-[#cca472] text-slate-950 shadow-md scale-[1.02]" 
                              : "text-slate-400 hover:text-white hover:bg-neutral-900/40"
                          )}
                        >
                          {cat === "Back-office" ? "Office" : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {adminError && (
                  <p className="text-[10px] font-mono font-extrabold text-red-500 text-center uppercase tracking-wider bg-red-950/20 border border-red-900/25 py-2.5 rounded-xl">
                    ⚠️ {adminError}
                  </p>
                )}

                {forgotMessage && (
                  <div className="text-[#cca472] text-[10px] flex items-center justify-center mt-2 font-mono text-center leading-relaxed">
                    <span>{forgotMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-[#cca472] hover:bg-[#d6b384] text-slate-950 font-bold tracking-[0.14em] text-xs py-3.5 px-6 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.98] font-sans flex items-center justify-center uppercase mt-3.5 disabled:opacity-50"
                >
                  {adminLoading ? "Verifying..." : "LOG IN"}
                </button>

                {/* Bottom interactive action triggers */}
                <div className="flex justify-between items-center px-1 pt-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminModal(false);
                      setAdminUsername("");
                      setAdminPassword("");
                      setAdminError("");
                      setForgotMessage("");
                    }}
                    className="text-[10px] uppercase font-bold font-mono tracking-widest text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (adminCategory === "Staff") {
                        setForgotMessage("Please contact the Front Desk Supervisor to retrieve your credentials.");
                      } else if (adminCategory === "Admin") {
                        setForgotMessage("Please contact Sandton General Manager Desk to reset your management credentials.");
                      } else if (adminCategory === "Back-office") {
                        setForgotMessage("Secret password hint: ADMIN2025");
                      } else if (adminCategory === "Recos") {
                        setForgotMessage("Secret password hint: RUAN");
                      }
                    }}
                    className="text-[10px] uppercase font-bold font-mono tracking-widest text-[#cca472]/65 hover:text-[#cca472] transition-colors focus:outline-none cursor-pointer"
                  >
                    Forgot Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- HELPERS ---
function isTimeWithinRange(timeStr: string, openTimeStr: string, closeTimeStr: string): boolean {
  const parseToMinutes = (str: string): number => {
    if (!str || typeof str !== "string") return 0;
    const clean = str.trim().toLowerCase();
    // Check for HH:MM format
    const colonMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (colonMatch) {
      return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
    }
    
    // Check for am/pm format e.g. "6am", "11am", "6pm", "10pm" etc
    const ampmMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (ampmMatch) {
      let hour = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const ampm = ampmMatch[3];
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      return hour * 60 + minutes;
    }
    
    // Just a number e.g. "6" or "18"
    const numberOnly = parseInt(clean, 10);
    if (!isNaN(numberOnly)) {
      return numberOnly * 60;
    }
    return 0;
  };

  try {
    const currentMin = parseToMinutes(timeStr);
    const openMin = parseToMinutes(openTimeStr);
    let closeMin = parseToMinutes(closeTimeStr);

    // If close time is earlier than open time, assume midnight crossing
    if (closeMin < openMin) {
      return currentMin >= openMin || currentMin <= closeMin;
    }
    return currentMin >= openMin && currentMin <= closeMin;
  } catch (e) {
    console.error("Error parsing time range", e);
    return true; // Default to open on error
  }
}

// Custom card wrapper measuring visibility to fire impressions once
function DiscoverRecoCard({ reco, guestSession }: { reco: any; guestSession: any }) {
  const ref = useState<HTMLDivElement | null>(null)[0];
  const cardRef = { current: null as HTMLDivElement | null };
  const [hasFired, setHasFired] = useState(false);

  useEffect(() => {
    if (hasFired || !cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasFired(true);
          fetch("/api/sync/recos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "impression",
              recoId: reco.id,
              guestName: guestSession?.guestName || "Anonymous",
              roomNumber: guestSession?.roomNumber || "0",
              timestamp: new Date().toISOString()
            })
          }).catch(e => console.error("Failed to fire impression:", e));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [reco.id, guestSession, hasFired]);

  const handleCta = () => {
    fetch("/api/sync/recos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "click",
        recoId: reco.id,
        guestName: guestSession?.guestName || "Anonymous",
        roomNumber: guestSession?.roomNumber || "0",
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.error("Failed to fire click:", e));

    if (reco.cta_url) {
      window.open(reco.cta_url, "_blank");
    }
  };

  return (
    <div
      ref={(el) => { cardRef.current = el; }}
      className="bg-black/30 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-[var(--color-accent)]/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {reco.image_url && (
          <div className="h-48 overflow-hidden relative">
            <img
              src={reco.image_url}
              alt={reco.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {reco.is_featured && (
              <span className="absolute top-3 right-3 bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                Featured
              </span>
            )}
          </div>
        )}
        <div className="p-5 space-y-2">
          <h4 className="text-lg font-serif font-semibold text-[var(--color-accent-light)] flex items-center gap-1.5">
            <MapPin size={16} className="text-[var(--color-accent)]" /> {reco.title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">{reco.paragraph}</p>
        </div>
      </div>
      <div className="p-5 pt-0">
        <button
          onClick={handleCta}
          className="w-full text-xs font-semibold tracking-wider uppercase border border-[var(--color-accent)]/80 hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)] py-2 rounded-lg cursor-pointer transition-colors text-center"
        >
          {reco.cta_text || "More Info"}
        </button>
      </div>
    </div>
  );
}

// --- GUEST PORTAL VIEW PORT ---
function GuestPortal() {
  return <GuestPortalView />;
}

function OldGuestPortal() {
  const { guestSession, logout } = useRole();
  const [loading, setLoading] = useState(true);
  const [portTab, setPortTab] = useState<"facilities" | "dining" | "discover" | "shuttle">("facilities");

  // Server state data with matching placeholder fallbacks
  const [masterConfig, setMasterConfig] = useState({
    hotelName: "Sandton Hotel",
    logoUrl: "",
    conciergeKb: "",
    feedbackUrl: "",
    nightshift: false,
    opHoursMorning: "06:00 AM - 11:30 AM",
    opHoursAfternoon: "12:00 PM - 05:00 PM",
    opHoursNight: "06:00 PM - 11:00 PM"
  });

  const [promotions, setPromotions] = useState<any[]>([
    {
      id: "p1",
      title: "Clubhouse Fixture World Cup",
      paragraph: "Join us at the Clubhouse as we bring the atmosphere, the flavour and the big game energy to every South African fixture during the FIFA World Cup 🇿🇦🔥",
      image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80",
      cta_text: "Make a Booking"
    },
    {
      id: "p2",
      title: "Father's Day Spit Braai",
      paragraph: "Celebrate Father’s Day with us with a premium afternoon spit braai experience. Complete with live music and garden playground access for children.",
      image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80",
      cta_text: "Make a Booking"
    }
  ]);

  const [facilities, setFacilities] = useState<any[]>([
    {
      id: "fac1",
      title: "The Sky Pool",
      description: "Heated infinity pool with panoramic Johannesburg city views, open daily.",
      image_url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80",
      category: "Swimming"
    },
    {
      id: "fac2",
      title: "Gym & Fitness Gym",
      description: "State-of-the-art weights, cardio, and personalized training gear open 24/7.",
      image_url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80",
      category: "Fitness"
    },
    {
      id: "fac3",
      title: "Aura Wellness Spa",
      description: "Treat yourself to signature massages and luxury organic skin therapies.",
      image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80",
      category: "Wellness"
    }
  ]);

  const [restaurants, setRestaurants] = useState<any[]>([
    {
      id: "rest1",
      title: "Clubhouse Restaurant & Bar",
      description: "Fine dining overlooking the golf course, with high ceilings and cozy dining lounges.",
      image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
      cta_enabled: true,
      cta_text: "Make a Booking",
      cta_url: "https://www.dineplan.com/restaurants/sandton-hotel-restaurant",
      subsections: [
        {
          id: "sub-1",
          title: "The Clubhouse Lounge",
          description: "Relaxed ambiance with signature cocktails.",
          timings: [
            { id: "t1", name: "Breakfast", openTime: "06:00", closeTime: "11:00" },
            { id: "t2", name: "Dinner", openTime: "18:00", closeTime: "22:00" }
          ]
        },
        {
          id: "sub-2",
          title: "The Cigar Bar",
          description: "A luxury climate-controlled room offering cubans and scotch.",
          timings: [
            { id: "t3", name: "After Hours", openTime: "21:00", closeTime: "02:00" }
          ]
        }
      ]
    }
  ]);

  const [recos, setRecos] = useState<any[]>([
    {
      id: "reco1",
      title: "Nelson Mandela Square",
      paragraph: "Paying homage to one of the world's greatest leaders, with elegant fine dining and premium fashion boutiques.",
      image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80",
      cta_text: "More Info",
      cta_url: "https://www.google.com/maps/search/Nelson+Mandela+Square",
      is_featured: true
    },
    {
      id: "reco2",
      title: "Apartheid Museum",
      paragraph: "A profoundly moving journey through 20th century South Africa. Perfect for history explorers.",
      image_url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80",
      cta_text: "More Info",
      cta_url: "https://www.apartheidmuseum.org/",
      is_featured: true
    }
  ]);

  // Synchronize state from backend
  useEffect(() => {
    let mounted = true;
    const syncData = async () => {
      try {
        const response = await fetch("/api/sync");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch (parseErr) {
          console.warn("[SYNC] Invalid JSON received from /api/sync, fallback to memory", parseErr);
          return;
        }
        if (mounted && json && json.success) {
          if (json.masterConfig) setMasterConfig(json.masterConfig);
          if (json.masterPromotions) setPromotions(json.masterPromotions);
          if (json.masterFacilities) setFacilities(json.masterFacilities);
          if (json.masterRestaurants) setRestaurants(json.masterRestaurants);
          if (json.masterRecos) setRecos(json.masterRecos);
        }
      } catch (err: any) {
        const isNetworkError = err?.name === "TypeError" || 
                               err?.message?.toLowerCase().includes("fetch") || 
                               err?.message?.toLowerCase().includes("network") ||
                               err?.message?.toLowerCase().includes("failed");
        if (isNetworkError) {
          console.warn("[GUEST DATA SYNC WARNING] Transient fetch connectivity warning: retaining local state.");
        } else {
          console.error("Failed to sync guest portal collections:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    syncData();
    return () => { mounted = false; };
  }, []);

  // --- 1. CLOCK & STATUS GENERATORS ---
  const [joburgClock, setJoburgClock] = useState("");
  const [joburgFullTime, setJoburgFullTime] = useState("");
  const [currentShiftOpen, setCurrentShiftOpen] = useState(true);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      try {
        // Format local Johannesburg time
        const formattedTimeString = now.toLocaleTimeString("en-GB", {
          timeZone: "Africa/Johannesburg",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        setJoburgClock(formattedTimeString);

        // Standard HH:MM comparison
        const formattedHM = now.toLocaleTimeString("en-GB", {
          timeZone: "Africa/Johannesburg",
          hour: "2-digit",
          minute: "2-digit"
        });
        setJoburgFullTime(formattedHM);

        // Read Johannesburg hour to set active operational shift
        const formatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Africa/Johannesburg",
          hour: "numeric",
          hour12: false
        });
        const currentHour = parseInt(formatter.format(now), 10);
        
        // Night shift is defined if master setting is TRUE or hours are between 23h00 and 06h00
        const isNight = masterConfig.nightshift || currentHour < 6 || currentHour >= 23;
        setCurrentShiftOpen(!isNight);
      } catch (e) {
        setJoburgClock(now.toTimeString().split(" ")[0]);
        setJoburgFullTime(now.toTimeString().substring(0, 5));
      }
    }, 1000);

    return () => clearInterval(clockTimer);
  }, [masterConfig.nightshift]);

  // --- 2. HERO CAROUSEL AUTO-ROTATION ---
  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    const handleAutoplay = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(handleAutoplay);
  }, [promotions.length]);

  // Swipe gesture capture
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      // Swipe left
      setSlideIdx((prev) => (prev + 1) % promotions.length);
    } else if (diff < -50) {
      // Swipe right
      setSlideIdx((prev) => (prev - 1 + promotions.length) % promotions.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // --- 4. FACILITIES STATE CONTROLLERs ---
  const [selectedFacCategory, setSelectedFacCategory] = useState<"All" | "Wellness" | "Fitness" | "Swimming">("All");

  const filteredFacilities = facilities.filter(fac => {
    if (selectedFacCategory === "All") return true;
    return fac && fac.category && selectedFacCategory && fac.category.toLowerCase() === selectedFacCategory.toLowerCase();
  });

  // --- 5. DINING EXPANSION ---
  const [expandedRestId, setExpandedRestId] = useState<string | null>(null);

  // --- 7. SHUTTLE FORM ---
  const [shuttleFlight, setShuttleFlight] = useState("");
  const [shuttleDateTime, setShuttleDateTime] = useState("");
  const [shuttleRoute, setShuttleRoute] = useState("OR Tambo");
  const [shuttleTravellers, setShuttleTravellers] = useState(1);
  const [shuttleVehicle, setShuttleVehicle] = useState("Standard Sedan");
  const [shuttleSubmitted, setShuttleSubmitted] = useState(false);
  const [shuttleLoading, setShuttleLoading] = useState(false);

  const handleShuttleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shuttleFlight || !shuttleDateTime) return;
    setShuttleLoading(true);

    try {
      const res = await fetch("/api/sync/tasks/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Airport Shuttle",
          room: guestSession?.roomNumber || "N/A",
          informedDept: "Concierge",
          details: {
            flightNumber: shuttleFlight,
            dateTime: shuttleDateTime,
            route: shuttleRoute,
            travellers: shuttleTravellers,
            vehicle: shuttleVehicle
          }
        })
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setShuttleSubmitted(true);
      }
    } catch (err) {
      console.error("Transfers error", err);
    } finally {
      setShuttleLoading(false);
    }
  };

  // --- 8. FEEDBACK FORM ---
  const [feedbackRating, setFeedbackRating] = useState(10);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          text: feedbackText,
          roomNumber: guestSession?.roomNumber || "N/A",
          guestName: guestSession?.guestName || "Anonymous",
          timestamp: new Date().toISOString()
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedbackSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // --- 9. CHAT DRAWER CONTROLLER ---
  const [chatOpen, setChatOpen] = useState(false);
  const [showDressCodeModal, setShowDressCodeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [transferDestination, setTransferDestination] = useState("");
  const [transferTimeType, setTransferTimeType] = useState<"immediate" | "schedule">("immediate");
  const [transferDateTime, setTransferDateTime] = useState("");
  const [chatLogs, setChatLogs] = useState<any[]>(() => [
    {
      role: "assistant",
      content: "Hello " + (guestSession?.guestName || "Blig") + "! Welcome to Sandton Hotel. How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
      senderName: "Guest Assistant"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatAwaitingResponse, setChatAwaitingResponse] = useState(false);

  // Sync existing messages on mount
  useEffect(() => {
    const syncChat = async () => {
      try {
        const response = await fetch("/api/sync");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch (parseErr) {
          console.warn("[SYNC CHAT] Invalid JSON received from /api/sync, fallback to memory", parseErr);
          return;
        }
        if (json && json.success && json.chatMessages && json.chatMessages.length > 0) {
          const guestRoom = String(guestSession?.roomNumber || "0");
          const filtered = json.chatMessages.filter(
            (msg: any) => msg.roomNumber && String(msg.roomNumber) === guestRoom
          );
          if (filtered.length > 0) {
            setChatLogs(filtered);
          } else {
            setChatLogs([
              {
                role: "assistant",
                content: "Hello " + (guestSession?.guestName || "Blig") + "! Welcome to Sandton Hotel. How can I help you today?",
                timestamp: new Date().toLocaleTimeString(),
                senderName: "Guest Assistant",
                roomNumber: guestRoom
              }
            ]);
          }
        }
      } catch (err: any) {
        const isNetworkError = err?.name === "TypeError" || 
                               err?.message?.toLowerCase().includes("fetch") || 
                               err?.message?.toLowerCase().includes("network") ||
                               err?.message?.toLowerCase().includes("failed");
        if (isNetworkError) {
          console.warn("[CHAT SYNC WARNING] Transient fetch connectivity warning: retaining local state.");
        } else {
          console.error("Error reading initial chats:", err);
        }
      }
    };
    syncChat();
  }, []);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatAwaitingResponse) return;

    const query = chatInput.trim();
    setChatInput("");

    // Optimistic User insertion
    const localUserMsg = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
      senderName: guestSession?.guestName || "Guest"
    };

    setChatLogs(prev => [...prev, localUserMsg]);
    setChatAwaitingResponse(true);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: query,
          roomNumber: guestSession?.roomNumber || "0",
          guestName: guestSession?.guestName || "Guest"
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Fetch whole logs inside /api/sync or append synthesized answer
        setTimeout(() => {
          setChatLogs(prev => [...prev, data.aiReply]);
          setChatAwaitingResponse(false);
        }, 800);
      } else {
        setChatAwaitingResponse(false);
      }
    } catch (err) {
      console.error("Failed to post chat answer:", err);
      setChatAwaitingResponse(false);
    }
  };

  const quickQuestions = [
    "What are the pool hours?",
    "What are the spa treatments?",
    "Tell me about the restaurants.",
    "Can I book an airport shuttle?"
  ];

  const handleSendQuickQuestion = async (q: string) => {
    if (chatAwaitingResponse) return;
    setChatAwaitingResponse(true);

    const userMsg = {
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString(),
      senderName: guestSession?.guestName || "Guest"
    };

    setChatLogs(prev => [...prev, userMsg]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: q,
          roomNumber: guestSession?.roomNumber || "0",
          guestName: guestSession?.guestName || "Guest"
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTimeout(() => {
          setChatLogs(prev => [...prev, data.aiReply]);
          setChatAwaitingResponse(false);
        }, 800);
      } else {
        setChatAwaitingResponse(false);
      }
    } catch (err) {
      console.error("Failed to post quick question:", err);
      setChatAwaitingResponse(false);
    }
  };

  const getGreeting = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Johannesburg",
        hour: "numeric",
        hour12: false
      });
      const currentHour = parseInt(formatter.format(new Date()), 10);
      if (currentHour < 12) return "Good morning,";
      if (currentHour < 17) return "Good afternoon,";
      return "Good evening,";
    } catch (e) {
      const hours = new Date().getHours();
      if (hours < 12) return "Good morning,";
      if (hours < 17) return "Good afternoon,";
      return "Good evening,";
    }
  };

  const handleMedicalEmergency = async () => {
    const msg = "🆘 MEDICAL EMERGENCY REQUESTED! Immediate onsite assistance required in Room " + (guestSession?.roomNumber || "N/A") + "!";
    setChatLogs(prev => [...prev, {
      role: "user",
      content: msg,
      timestamp: new Date().toLocaleTimeString(),
      senderName: guestSession?.guestName || "Guest"
    }]);
    setChatAwaitingResponse(true);
    try {
      await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: msg,
          roomNumber: guestSession?.roomNumber || "0",
          guestName: guestSession?.guestName || "Guest"
        })
      });
      
      await fetch("/api/sync/tasks/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "MEDICAL EMERGENCY",
          room: guestSession?.roomNumber || "N/A",
          informedDept: "Concierge",
          details: {
            alert: "Medical Assistance Needed Immediately",
            timestamp: new Date().toISOString()
          }
        })
      });

      setTimeout(() => {
        setChatLogs(prev => [...prev, {
          role: "assistant",
          content: "🚨 Emergency dispatch logs activated! Standby - our management desk and medical associates are marching to Room " + (guestSession?.roomNumber || "N/A") + " straight away.",
          timestamp: new Date().toLocaleTimeString(),
          senderName: "Management Desk"
        }]);
        setChatAwaitingResponse(false);
      }, 850);
    } catch (e) {
      console.error("Emergency sync failed", e);
      setChatAwaitingResponse(false);
    }
  };

  const handleChatWithManager = async () => {
    const msg = "Request connection to the Duty General Manager.";
    setChatLogs(prev => [...prev, {
      role: "user",
      content: msg,
      timestamp: new Date().toLocaleTimeString(),
      senderName: guestSession?.guestName || "Guest"
    }]);
    setChatAwaitingResponse(true);
    try {
      await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: msg,
          roomNumber: guestSession?.roomNumber || "0",
          guestName: guestSession?.guestName || "Guest"
        })
      });

      setTimeout(() => {
        setChatLogs(prev => [...prev, {
          role: "assistant",
          content: "Duty Manager notified. The General Manager is reviewing chat connection logs and will interface directly with Suite Room " + (guestSession?.roomNumber || "N/A") + " shortly.",
          timestamp: new Date().toLocaleTimeString(),
          senderName: "Manager Support"
        }]);
        setChatAwaitingResponse(false);
      }, 850);
    } catch (e) {
      console.error(e);
      setChatAwaitingResponse(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#121212] text-slate-100 flex items-center justify-center font-sans sm:py-6 lg:py-10 overflow-y-auto">
      
      {/* Physical Mockup Device Screen Container */}
      <div className="w-full sm:max-w-[425px] sm:h-[860px] sm:rounded-[48px] sm:border-[10px] sm:border-slate-800/90 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] sm:ring-[1px] sm:ring-slate-700/40 bg-[#161616] flex flex-col font-sans relative overflow-hidden h-screen select-none">
        
        {/* Sticky Header */}
        <header className="bg-black/75 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-md flex-shrink-0">
          <div className="px-4 py-3.5 flex justify-between items-center gap-2">
            
            {/* Logo brand */}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] font-serif text-base font-bold tracking-widest shadow-inner flex-shrink-0">
                S
              </div>
              <div className="truncate">
                <h1 className="text-xs font-serif font-semibold tracking-wider text-[var(--color-accent-light)] uppercase truncate">
                  {masterConfig.hotelName} <span className="text-[var(--color-accent)]">Portal</span>
                </h1>
                <p className="text-[8px] uppercase tracking-widest text-amber-500/80 font-mono">
                  Luxury Companion
                </p>
              </div>
            </div>

            {/* Shift/Clock indicators */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="font-mono text-xs text-white bg-black/40 border border-[#2E3A59]/20 px-2 py-0.5 rounded-md tracking-wider">
                {joburgFullTime || "12:00"}
              </span>
              
              {currentShiftOpen ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Operating Shift Open" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Night Shift Engaged" />
              )}
            </div>

          </div>
        </header>

        {/* Scrollable Container Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin select-text relative">
          
          {/* Welcome guest notification */}
          <div className="flex justify-between items-center bg-black/25 rounded-2xl border border-slate-800/60 p-4 shadow-lg gap-2">
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-[9px] uppercase tracking-widest text-[var(--color-accent)] font-semibold font-sans">
                Active Session
              </h3>
              <h2 className="text-base font-serif text-[var(--color-accent-light)] font-medium truncate">
                Welcome, {guestSession?.guestName}
              </h2>
              <p className="text-[10px] text-slate-400">
                Suite Room {guestSession?.roomNumber}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-300 text-[10px] font-semibold tracking-wider uppercase py-1.5 px-3 rounded-xl cursor-pointer transition-colors flex-shrink-0"
            >
              <LogOut size={11} /> Exit
            </button>
          </div>

          {/* 2. HERO CAROUSEL FOR ANNOUNCEMENTS & EVENTS */}
          <section className="relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/20 shadow-xl bg-black flex-shrink-0">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="h-56 relative"
            >
              <AnimatePresence mode="wait">
                {promotions.map((promo, idx) => {
                  if (idx !== slideIdx) return null;
                  return (
                    <motion.div
                      key={promo.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col justify-end"
                    >
                      {/* Background slide cover image */}
                      <div className="absolute inset-0">
                        <img
                          src={promo.image_url}
                          alt={promo.title}
                          className="w-full h-full object-cover opacity-65"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                      </div>

                      {/* Banner Overlay Info Panel */}
                      <div className="p-4 relative z-10 text-left space-y-1.5">
                        <div className="inline-block bg-[var(--color-accent)] text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow">
                          Announcements
                        </div>
                        <h3 className="text-base md:text-lg font-serif text-[var(--color-accent-light)] leading-tight tracking-wide font-semibold truncate">
                          {promo.title}
                        </h3>
                        <p className="text-[11px] text-slate-300 leading-normal font-light line-clamp-2">
                          {promo.paragraph}
                        </p>
                        {promo.cta_url && (
                          <a
                            href={promo.cta_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block bg-gradient-to-r from-[var(--color-accent)] to-[#a37c1a] hover:opacity-90 text-white font-semibold text-[9px] py-1.5 px-4 rounded-lg uppercase tracking-wider cursor-pointer transition-opacity mt-1.5"
                          >
                            {promo.cta_text || "Book Now"}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Slider Dots indicators */}
              <div className="absolute bottom-3 right-4 flex items-center space-x-1.5 z-20">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideIdx(idx)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300",
                      idx === slideIdx ? "bg-[var(--color-accent)] w-5" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 3. TABS SELECTORS */}
          <section className="space-y-4">
            <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 border border-slate-900 rounded-xl max-w-xl mx-auto shadow-md">
              <button
                onClick={() => setPortTab("facilities")}
                className={cn(
                  "py-2 px-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  portTab === "facilities"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Facilities
              </button>
              <button
                onClick={() => setPortTab("dining")}
                className={cn(
                  "py-2 px-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  portTab === "dining"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Dining
              </button>
              <button
                onClick={() => setPortTab("discover")}
                className={cn(
                  "py-2 px-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  portTab === "discover"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Discover
              </button>
              <button
                onClick={() => setPortTab("shuttle")}
                className={cn(
                  "py-2 px-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center",
                  portTab === "shuttle"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Shuttle
              </button>
            </div>

            <div className="min-h-72">
              <AnimatePresence mode="wait">
                
                {/* --- 4. FACILITIES TAB PANEL --- */}
                {portTab === "facilities" && (
                  <motion.div
                    key="facilities-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5 text-left"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="text-base font-serif font-semibold text-[var(--color-accent-light)]">
                        Premium Amenities
                      </h3>
                      
                      {/* Category quick filters */}
                      <div className="flex flex-wrap gap-1">
                        {(["All", "Wellness", "Fitness", "Swimming"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedFacCategory(cat)}
                            className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full cursor-pointer transition-all",
                              selectedFacCategory === cat
                                ? "bg-[var(--color-accent)] text-white"
                                : "bg-slate-800/65 text-slate-400 hover:text-white"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {filteredFacilities.map((fac) => (
                        <div
                          key={fac.id}
                          className="bg-black/30 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg hover:border-[var(--color-accent)]/20 transition-all"
                        >
                          {fac.image_url && (
                            <div className="h-36 overflow-hidden relative">
                              <img
                                src={fac.image_url}
                                alt={fac.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-2 left-2 bg-black/70 backdrop-blur text-[8px] font-bold text-[var(--color-accent)] uppercase tracking-widest px-2 py-0.5 rounded border border-slate-800">
                                {fac.category}
                              </span>
                            </div>
                          )}
                          <div className="p-4 space-y-1">
                            <h4 className="text-base font-serif font-medium text-[var(--color-accent-light)]">
                              {fac.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-normal font-light">
                              {fac.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* --- 5. DINING TAB PANEL --- */}
                {portTab === "dining" && (
                  <motion.div
                    key="dining-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5 text-left"
                  >
                    <h3 className="text-base font-serif font-semibold text-[var(--color-accent-light)] border-b border-slate-800 pb-2">
                      Luxury Gastronomy
                    </h3>

                    <div className="space-y-5">
                      {restaurants.map((rest) => (
                        <div
                          key={rest.id}
                          className="bg-black/30 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg"
                        >
                          <div className="flex flex-col">
                            {rest.image_url && (
                              <div className="w-full h-36 overflow-hidden">
                                <img
                                  src={rest.image_url}
                                  alt={rest.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <h4 className="text-base font-serif text-[var(--color-accent-light)] font-medium">
                                  {rest.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-normal font-light">
                                  {rest.description}
                                </p>
                              </div>

                              {/* Dining CTA Booking */}
                              <div className="flex items-center justify-between pt-1">
                                {rest.cta_enabled && rest.cta_url && (
                                  <a
                                    href={rest.cta_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-[var(--color-accent)] to-[#a37c1a] hover:opacity-90 text-white font-semibold text-[9px] uppercase py-1.5 px-3.5 rounded-lg tracking-wider cursor-pointer transition-opacity"
                                  >
                                    {rest.cta_text || "Book Dinner"}
                                  </a>
                                )}
                                
                                <button
                                  onClick={() => setExpandedRestId(expandedRestId === rest.id ? null : rest.id)}
                                  className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-0.5 ml-auto cursor-pointer"
                                >
                                  {expandedRestId === rest.id ? "Close" : "Hours"}
                                  <ChevronDown
                                    size={12}
                                    className={cn("transition-transform duration-200", expandedRestId === rest.id ? "rotate-180" : "")}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable subsections & hours timings comparison */}
                          <AnimatePresence>
                            {expandedRestId === rest.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-black/40 border-t border-slate-900"
                              >
                                <div className="p-4 space-y-3">
                                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-accent)] font-sans">
                                    Timings & Venues
                                  </h5>

                                  <div className="grid grid-cols-1 gap-3">
                                    {rest.subsections?.map((sub: any) => (
                                      <div key={sub.id} className="bg-slate-950/40 border border-slate-900 rounded-lg p-3 space-y-2 shadow-inner">
                                        <div className="space-y-0.5">
                                          <h6 className="text-xs font-serif font-medium text-slate-200">
                                            {sub.title}
                                          </h6>
                                          <p className="text-[9px] text-slate-500 font-light">{sub.description}</p>
                                        </div>

                                        <div className="h-[1px] bg-slate-900/60" />

                                        {/* Sub-shift timings with live comparators */}
                                        <div className="space-y-1.5">
                                          {sub.timings?.map((timeSlot: any) => {
                                            const clockToCheck = joburgFullTime || "12:00";
                                            const isOpen = isTimeWithinRange(clockToCheck, timeSlot.openTime, timeSlot.closeTime);

                                            return (
                                              <div
                                                key={timeSlot.id}
                                                className="flex items-center justify-between text-[11px] font-sans bg-black/20 p-1.5 rounded border border-slate-900"
                                              >
                                                <div>
                                                  <span className="font-semibold text-slate-300 mr-1">{timeSlot.name}</span>
                                                  <span className="text-[9px] text-slate-500 font-mono">
                                                    ({timeSlot.openTime}-{timeSlot.closeTime})
                                                  </span>
                                                </div>

                                                {isOpen ? (
                                                  <span className="bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 text-[8px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full">
                                                    Open
                                                  </span>
                                                ) : (
                                                  <span className="bg-red-950/40 border border-red-900/40 text-red-100 text-[8px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full">
                                                    Closed
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* --- 6. DISCOVER JOBURG TAB PANEL --- */}
                {portTab === "discover" && (
                  <motion.div
                    key="discover-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5 text-left"
                  >
                    <div className="border-b border-slate-800 pb-2 space-y-0.5">
                      <h3 className="text-base font-serif font-semibold text-[var(--color-accent-light)]">
                        Discover Johannesburg
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Curated experiences premium-grade verified by Nelson Mandela square.
                      </p>
                    </div>

                    {/* Recommendation Grid */}
                    <div className="grid grid-cols-1 gap-5">
                      {recos.map((reco) => (
                        <DiscoverRecoCard
                          key={reco.id}
                          reco={reco}
                          guestSession={guestSession}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* --- 7. SHUTTLE TAB PANEL --- */}
                {portTab === "shuttle" && (
                  <motion.div
                    key="shuttle-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left max-w-xl mx-auto"
                  >
                    <div className="border-b border-slate-800 pb-2 text-center space-y-0.5">
                      <h3 className="text-base font-serif font-semibold text-[var(--color-accent-light)]">
                        Airport Transit Chauffeur
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Private luxury airport transfer with Sandton professional chauffeurs.
                      </p>
                    </div>

                    {shuttleSubmitted ? (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[var(--color-mid)]/30 border border-[var(--color-accent)]/20 rounded-xl p-6 text-center space-y-3 shadow-lg"
                      >
                        <div className="w-11 h-11 bg-emerald-950/80 border border-emerald-900/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                          <CheckCircle2 size={22} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-serif font-semibold text-[var(--color-accent-light)]">
                            Transfer Request Received
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-normal max-w-sm mx-auto font-light">
                            Our premier concierge is finalizing dispatch logs. We will contact your room instantly.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShuttleSubmitted(false);
                            setShuttleFlight("");
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-[10px] uppercase px-4 py-2 rounded-lg cursor-pointer border border-slate-700 transition-colors"
                        >
                          Schedule Another Ride
                        </button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleShuttleSubmit} className="bg-black/30 border border-slate-800/80 rounded-xl p-4 space-y-3 shadow-lg">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Flight Number
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. SA314"
                              value={shuttleFlight}
                              onChange={(e) => setShuttleFlight(e.target.value)}
                              className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)] text-slate-150 font-mono"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={shuttleDateTime}
                              onChange={(e) => setShuttleDateTime(e.target.value)}
                              className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)] text-slate-150 font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Destination Route
                            </label>
                            <select
                              value={shuttleRoute}
                              onChange={(e) => setShuttleRoute(e.target.value)}
                              className="w-full bg-black/40 border border-slate-800 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)] text-slate-150"
                            >
                              <option value="OR Tambo">OR Tambo (Main)</option>
                              <option value="Lanseria">Lanseria Airport</option>
                              <option value="Private Airstrip">Private Airstrip</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                                Travelers
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={shuttleTravellers}
                                onChange={(e) => setShuttleTravellers(parseInt(e.target.value, 10))}
                                className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)] text-slate-150 font-mono"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                                Vehicle Class
                              </label>
                              <select
                                value={shuttleVehicle}
                                onChange={(e) => setShuttleVehicle(e.target.value)}
                                className="w-full bg-black/40 border border-slate-800 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)] text-slate-150"
                              >
                                <option value="Standard Sedan">Standard Sedan</option>
                                <option value="Executive SUV">Executive SUV</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={shuttleLoading}
                          className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[#a37c1a] hover:opacity-90 active:scale-[0.98] transition-all text-white font-medium py-2.5 rounded-lg text-xs tracking-wider uppercase cursor-pointer mt-1"
                        >
                          {shuttleLoading ? "Scheduling Transfer..." : "Book Mobile Shuttle"}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </section>

          {/* --- 8. FEEDBACK MODULE (RENDERED BELOW TABS) --- */}
          <section className="bg-black/20 border border-slate-800/80 rounded-2xl p-5 space-y-5 text-left max-w-xl mx-auto shadow-xl flex-shrink-0">
            <div className="border-b border-slate-800 pb-2 space-y-0.5">
              <h4 className="text-base font-serif font-semibold text-[var(--color-accent-light)]">
                Portal Rating & Experience
              </h4>
              <p className="text-[10px] text-slate-440">
                How is your stay? Share rating notes to optimize our hospitality.
              </p>
            </div>

            {feedbackSubmitted ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4 space-y-2"
              >
                <div className="w-10 h-10 bg-[var(--color-mid)]/40 border border-[var(--color-accent)]/20 rounded-full flex items-center justify-center text-[var(--color-accent)] mx-auto shadow-inner">
                  <Star size={20} className="fill-[var(--color-accent)]" />
                </div>
                <h5 className="font-serif text-sm text-slate-100">
                  Valuable Feedback Recorded
                </h5>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your premium rating score is saved as {feedbackRating}/10. Thank you.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                
                {/* Premium Vertical-like rating slider with dynamic indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                      Rating Score
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--color-accent)]">
                      {feedbackRating} / 10
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={feedbackRating}
                      onChange={(e) => setFeedbackRating(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                    />
                    
                    {/* Dynamic indicators below range slider */}
                    <div className="flex justify-between px-1 text-[9px] font-mono font-bold text-slate-500 mt-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <span
                          key={num}
                          className={cn(
                            "transition-colors",
                            feedbackRating === num ? "text-[var(--color-accent)]" : ""
                          )}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Textarea review log */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                    Optional Review Note
                  </label>
                  <textarea
                    placeholder="Describe your hospitality experience..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full min-h-20 bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)] text-slate-100 placeholder-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="w-full bg-gradient-to-r from-[var(--color-accent)] to-[#a37c1a] hover:opacity-90 active:scale-[0.98] transition-all text-white font-medium py-2 rounded-lg text-[11px] uppercase tracking-wider cursor-pointer font-sans"
                >
                  {feedbackLoading ? "Submitting..." : "Submit Review Logs"}
                </button>
              </form>
            )}
          </section>

        </div>

        {/* --- 9. Floating chat toggle button inside mockup frame bounds --- */}
        <div className="absolute bottom-5 right-5 z-40 flex-shrink-0">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[#9e731c] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
            title="Chat Support Representative"
          >
            {chatOpen ? <X size={20} /> : <MessageSquare size={20} />}
            {!chatOpen && (
              <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 w-3' h-3' rounded-full border-2 border-[#0B0B13]" style={{ width: '12px', height: '12px' }}></span>
            )}
          </button>
        </div>

        {/* CHAT DRAWER CONCIERGE PANEL inside mockup frame bounds */}
        <AnimatePresence>
          {chatOpen && (
            <>
              {/* Backdrop cover overlay bounded inside phone frame mockup */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setChatOpen(false)}
                className="absolute inset-0 bg-black/75 z-45"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="absolute inset-x-0 bottom-0 bg-[#0C0C14] border-t border-[var(--color-accent)]/30 z-48 h-[27rem] rounded-t-3xl shadow-2xl flex flex-col justify-between overflow-hidden"
              >
                {/* Drawer header */}
                <header className="p-3 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                      <h4 className="text-xs font-serif font-semibold text-slate-100 leading-tight">
                        AI Luxury Concierge
                      </h4>
                      <p className="text-[8px] uppercase font-mono text-[var(--color-accent)] leading-none mt-0.5">
                        Verified Room Associate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[8px] uppercase font-mono text-slate-400 bg-black/45 py-0.5 px-2 rounded-full border border-slate-800">
                      Active
                    </span>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </header>

                {/* Chat Log Canvas */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3.5 flex flex-col bg-slate-950/25 scrollbar-thin">
                  {chatLogs
                    .filter((msg) => !msg.roomNumber || String(msg.roomNumber) === String(guestSession?.roomNumber || "0"))
                    .map((msg, index) => {
                    const isAssistant = msg.role === "assistant";
                    return (
                      <div
                        key={index}
                        className={cn(
                          "max-w-[85%] rounded-2xl p-3 text-[11px] text-left leading-relaxed shadow space-y-0.5",
                          isAssistant
                            ? "bg-[var(--color-mid)] text-slate-200 self-start border border-slate-800/80"
                            : "bg-[var(--color-accent)]/85 text-white self-end"
                        )}
                      >
                        <div className="flex items-center justify-between text-[7px] opacity-75 font-mono uppercase">
                          <span>{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="font-light whitespace-pre-line">{msg.content}</p>
                        {index === 0 && isAssistant && (
                          <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                            <p className="text-[9px] font-semibold text-[var(--color-accent)] uppercase tracking-wider font-sans">
                              Quick questions:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {quickQuestions.map((q, qidx) => (
                                <button
                                  key={qidx}
                                  onClick={() => handleSendQuickQuestion(q)}
                                  className="text-[9px] font-sans tracking-wide text-slate-350 hover:text-white border border-white/10 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/15 bg-white/[0.01] rounded px-2 py-1 transition-all text-left font-light select-none cursor-pointer"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Animated Typing Indicator */}
                  {chatAwaitingResponse && (
                    <div className="bg-[var(--color-mid)] text-slate-200 border border-slate-800/80 max-w-[25%] rounded-2xl p-3 self-start flex space-x-1 items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce"></span>
                    </div>
                  )}
                </div>

                {/* Footer Input Bar & Conditional Nightshift Control */}
                <div className="p-3 bg-slate-900 border-t border-slate-850">
                  {!currentShiftOpen ? (
                    <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-0.5 text-center">
                      <p className="text-[10px] text-amber-400 font-medium">
                        Our service desk is offline. Responding in the morning.
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Emergencies: <span className="text-[var(--color-accent)] font-mono font-bold">+27 11 123 4567</span>
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendChatMessage} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ask our Guest Assistant about spa, pool or checkout..."
                        value={chatInput}
                        disabled={chatAwaitingResponse}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:border-[var(--color-accent)] text-slate-100 placeholder-slate-500"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || chatAwaitingResponse}
                        className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white p-2 rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center shadow flex-shrink-0"
                      >
                        <Send size={13} />
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// --- BACKOFFICE RECOS MANAGER VIEW ---
function SimpleRecosConsole({
  recos,
  recoInteractions,
  onRefresh
}: {
  recos: any[];
  recoInteractions: any[];
  onRefresh: () => void;
}) {
  const [selectedForMetrics, setSelectedForMetrics] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1); // Step 1: Card/Button selection, Step 2: Form
  const [newType, setNewType] = useState<"card" | "button">("card");
  
  // Form fields
  const [title, setTitle] = useState("");
  const [paragraph, setParagraph] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80");
  const [ctaText, setCtaText] = useState("More Info");
  const [ctaUrl, setCtaUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(true);

  const [saving, setSaving] = useState(false);

  // For Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setTitle("");
    setParagraph("");
    setImageUrl("https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80");
    setCtaText("More Info");
    setCtaUrl("");
    setIsFeatured(true);
    setNewType("card");
    setWizardStep(1);
    setEditingId(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (reco: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(reco.title || "");
    setParagraph(reco.paragraph || "");
    setImageUrl(reco.image_url || "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80");
    setCtaText(reco.cta_text || "More Info");
    setCtaUrl(reco.cta_url || "");
    setIsFeatured(reco.is_featured !== false);
    setNewType(reco.type || "card");
    setEditingId(reco.id);
    // Directly go to form
    setWizardStep(2);
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        paragraph,
        image_url: newType === "button" ? "" : imageUrl,
        cta_text: ctaText,
        cta_url: ctaUrl,
        is_featured: isFeatured,
        type: newType
      };

      const url = editingId ? `/api/recos/${editingId}` : "/api/recos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onRefresh();
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this recommendation?")) return;
    try {
      const res = await fetch(`/api/recos/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onRefresh();
        if (selectedForMetrics?.id === id) {
          setSelectedForMetrics(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get metrics for selected recommendation
  const metrics = useMemo(() => {
    if (!selectedForMetrics) return { impressions: 0, opens: 0, clicks: 0, ctr: 0, history: [] };
    const recoId = selectedForMetrics.id;
    const filtered = recoInteractions.filter((ri: any) => String(ri.recoId) === String(recoId));
    
    const impressions = filtered.filter((ri: any) => ri.type === "impression").length;
    const opens = filtered.filter((ri: any) => ri.type === "open").length;
    const clicks = filtered.filter((ri: any) => ri.type === "click" || ri.type === "conversion").length;
    const ctr = opens > 0 ? Math.round((clicks / opens) * 100) : 0;

    // Build log list
    const history = filtered.map((ri: any) => {
      let actionLabel = "Loaded";
      if (ri.type === "open") actionLabel = "Clicked Open Details";
      if (ri.type === "click" || ri.type === "conversion") actionLabel = "Outbound Destination Redirect";
      
      return {
        id: ri.id,
        room: ri.roomNumber || "000",
        guest: ri.guestName || "Guest",
        action: actionLabel,
        time: ri.timestamp ? new Date(ri.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"
      };
    }).reverse().slice(0, 5);

    return { impressions, opens, clicks, ctr, history };
  }, [selectedForMetrics, recoInteractions]);

  return (
    <div className="space-y-6">
      {/* Top action header card */}
      <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-white tracking-wide">
            Discovery Recommendations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build and monitor interactive Card & Button Discovery recommendations served on the guest lobby terminal portal.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#cca472] hover:bg-[#ba9361] text-black font-semibold text-xs px-5 py-3 rounded-xl tracking-wider uppercase flex items-center gap-2 cursor-pointer transition-colors shadow-lg active:scale-95"
        >
          <Plus size={16} /> Add Recommendation
        </button>
      </div>

      {/* Main Grid: Listings Left, Metrics Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RECOMMENDATION LISTINGS (LEFT 7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest pl-1">
            Active Recommendations ({recos.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recos.map((reco) => {
              const isSelected = selectedForMetrics?.id === reco.id;
              const isButton = reco.type === "button";
              
              // Local counts quick lookup
              const localFiltered = recoInteractions.filter((ri: any) => String(ri.recoId) === String(reco.id));
              const localImpressions = localFiltered.filter((ri: any) => ri.type === "impression").length;
              const localOpens = localFiltered.filter((ri: any) => ri.type === "open").length;
              const localClicks = localFiltered.filter((ri: any) => ri.type === "click" || ri.type === "conversion").length;

              return (
                <div
                  key={reco.id}
                  onClick={() => setSelectedForMetrics(reco)}
                  className={cn(
                    "bg-[#131313] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 relative group flex flex-col justify-between h-56",
                    isSelected
                      ? "border-[#cca472] ring-1 ring-[#cca472]/20"
                      : "border-white/[0.04] hover:border-white/10 hover:scale-[1.01]"
                  )}
                >
                  {/* Visual Preview */}
                  <div className="h-24 w-full relative bg-black/40 overflow-hidden flex-shrink-0">
                    {!isButton && reco.image_url ? (
                      <img
                        src={reco.image_url}
                        alt=""
                        className="w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 border-b border-white/5">
                        <span className="text-[10px] font-mono tracking-widest text-[#cca472] uppercase font-bold bg-[#cca472]/10 px-3 py-1.5 rounded-full border border-[#cca472]/20">
                          Button Style
                        </span>
                      </div>
                    )}
                    <span className={cn(
                      "absolute top-3 right-3 text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border text-white backdrop-blur-md",
                      isButton ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400" : "bg-blue-500/15 border-blue-500/20 text-blue-400"
                    )}>
                      {reco.type || "card"}
                    </span>
                  </div>

                  {/* Info section */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-1">
                      <h4 className="text-sm font-serif font-bold text-white tracking-wide truncate group-hover:text-[#cca472] transition-colors">
                        {reco.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed font-light">
                        {reco.paragraph || "No summary specified."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.03] mt-2 h-7">
                      {/* Clicks metrics tracker */}
                      <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                        <span>I: <strong className="text-slate-300">{localImpressions}</strong></span>
                        <span>O: <strong className="text-slate-300">{localOpens}</strong></span>
                        <span>C: <strong className="text-slate-300">{localClicks}</strong></span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEdit(reco, e)}
                          className="p-1.5 text-slate-400 hover:text-[#cca472] hover:bg-white/5 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(reco.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* METRICS VIEW (RIGHT 5 COLS) */}
        <div className="lg:col-span-5">
          {selectedForMetrics ? (
            <div className="bg-[#131313] border border-white/5 rounded-2xl p-6 space-y-6 text-left sticky top-4">
              {/* Header metrics profile */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#cca472] font-semibold bg-[#cca472]/10 px-2.5 py-1 rounded-md border border-[#cca472]/20">
                  {selectedForMetrics.type || "card"} type
                </span>
                <h3 className="text-lg font-serif font-bold text-white tracking-wide pt-1">
                  {selectedForMetrics.title}
                </h3>
              </div>

              {/* Core numbers Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/30 border border-white/[0.03] rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Impressions</span>
                  <div className="text-lg font-serif font-bold text-white">{metrics.impressions}</div>
                </div>
                <div className="bg-black/30 border border-white/[0.03] rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Opens</span>
                  <div className="text-lg font-serif font-bold text-[#cca472]">{metrics.opens}</div>
                </div>
                <div className="bg-black/30 border border-white/[0.03] rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Conversions</span>
                  <div className="text-lg font-serif font-bold text-emerald-400">{metrics.clicks}</div>
                </div>
              </div>

              {/* conversion progress ring/ratio */}
              <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-slate-200">Outbound Conversion Rate</h5>
                  <p className="text-[10px] text-slate-400 font-light">Outbound CTA clicks compared to overall opens.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-serif font-bold text-white">{metrics.ctr}%</div>
                  <span className="text-[9px] font-mono text-slate-400">CTR (Conversion)</span>
                </div>
              </div>

              {/* Real-time Interaction Logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold pl-1">
                  Recent Interactions
                </h4>

                {metrics.history.length > 0 ? (
                  <div className="divide-y divide-white/[0.03] bg-black/10 rounded-xl border border-white/[0.02]">
                    {metrics.history.map((log: any) => (
                      <div key={log.id} className="p-3.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <span>Room {log.room}</span>
                            <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                              {log.guest}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-light">{log.action}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-black/10 border border-white/[0.02] rounded-xl p-6 text-center text-xs text-slate-500">
                    No clicks or open interactions tracked yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#131313]/90 border border-white/[0.03] border-dashed rounded-2xl p-10 text-center h-72 flex flex-col items-center justify-center space-y-2 text-left">
              <Eye className="text-slate-600 animate-pulse" size={28} />
              <h4 className="text-sm font-serif font-bold text-slate-300">Select Recommendation</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans mt-1">
                Click on any recommendation listing to load full real-time telemetry metrics, impressions, opens, second clicks, and guest transit logs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ADD RECOMMENDATION / EDIT MODAL & TYPE WIZARD */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in text-left">
          <div className="bg-[#161616] border border-white/[0.08] rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Title / Description */}
            <div className="space-y-1">
              <h4 className="text-lg font-serif text-[#cca472] font-semibold">
                {editingId ? "Edit Recommendation" : "Add Recommendation"}
              </h4>
              <p className="text-xs text-slate-400 font-sans">
                {editingId
                  ? "Adjust attributes to modify this active discover recommendation."
                  : "Create new local discover recommendation served instantly to portal guests."}
              </p>
            </div>

            {/* WIZARD STEP 1: SELECT CARD OR BUTTON FORMAT */}
            {wizardStep === 1 && !editingId ? (
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Choose Presentation Template Style
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* CARD TYPE OPTION */}
                  <div
                    onClick={() => setNewType("card")}
                    className={cn(
                      "border rounded-2xl p-4 cursor-pointer text-center space-y-3 transition-colors",
                      newType === "card"
                        ? "border-[#cca472] bg-[#cca472]/5"
                        : "border-white/5 bg-black/25 hover:border-white/10"
                    )}
                  >
                    <div className="h-14 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                      <span className="w-8 h-8 rounded-full border border-blue-400/20 bg-blue-400/5 flex items-center justify-center text-blue-400">
                        <Star size={14} />
                      </span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white text-sans">Full-Size Card</h5>
                      <p className="text-[10px] text-slate-500 font-light mt-1 text-sans">
                        High-res image banner displayed in the discovery carousel.
                      </p>
                    </div>
                  </div>

                  {/* BUTTON TYPE OPTION */}
                  <div
                    onClick={() => setNewType("button")}
                    className={cn(
                      "border rounded-2xl p-4 cursor-pointer text-center space-y-3 transition-colors",
                      newType === "button"
                        ? "border-[#cca472] bg-[#cca472]/5"
                        : "border-white/5 bg-black/25 hover:border-white/10"
                    )}
                  >
                    <div className="h-14 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                      <span className="w-8 h-8 rounded-full border border-emerald-400/20 bg-emerald-400/5 flex items-center justify-center text-emerald-400 animate-pulse">
                        <ExternalLink size={14} />
                      </span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white text-sans">Interactive Button</h5>
                      <p className="text-[10px] text-slate-500 font-light mt-1 text-sans">
                        Compact, clean interactive CTA button without images.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setWizardStep(2)}
                  className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-semibold text-xs py-3 rounded-xl uppercase tracking-wider block text-center cursor-pointer transition-colors"
                >
                  Configure Details
                </button>
              </div>
            ) : (
              /* WIZARD STEP 2: FILL UP DETAILS FORM */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-3.5 text-xs">
                  {/* Recommendation Title */}
                  <div className="space-y-1">
                    <label className="font-mono text-slate-400 uppercase text-[9px]">Recommendation Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nelson Mandela Square"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-slate-350 focus:border-[#cca472] outline-none"
                    />
                  </div>

                  {/* Recommendation Description */}
                  <div className="space-y-1">
                    <label className="font-mono text-slate-400 uppercase text-[9px]">Paragraph Summary</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Paying homage to one of the world's greatest leaders, with elegant fine dining..."
                      value={paragraph}
                      onChange={(e) => setParagraph(e.target.value)}
                      className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-slate-350 focus:border-[#cca472] outline-none"
                    />
                  </div>

                  {/* Recommendation Image URL (Only for Card Type!) */}
                  {newType === "card" && (
                    <div className="space-y-1">
                      <label className="font-mono text-slate-400 uppercase text-[9px]">Banner Image URL</label>
                      <input
                        type="text"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-slate-350 focus:border-[#cca472] outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* CTA Button Text */}
                    <div className="space-y-1">
                      <label className="font-mono text-slate-400 uppercase text-[9px]">CTA Link Text</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. More Info"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-slate-350 focus:border-[#cca472] outline-none"
                      />
                    </div>

                    {/* CTA URL */}
                    <div className="space-y-1">
                      <label className="font-mono text-slate-400 uppercase text-[9px]">Outbound CTA URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-slate-350 focus:border-[#cca472] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-semibold text-xs py-3 rounded-xl uppercase tracking-wider text-center cursor-pointer transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#cca472] hover:bg-[#ba9361] text-black font-semibold text-xs py-3 rounded-xl uppercase tracking-wider text-center cursor-pointer transition-colors"
                  >
                    {saving ? "Saving..." : editingId ? "Update Listing" : "Publish Listing"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- BACKOFFICE CONSOLE SHELL ---
function BackofficeConsole() {
  const { role, staffName, logout } = useRole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Concierge");

  // State synchronization baskets loaded from /api/sync
  const [dataLoaded, setDataLoaded] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [recoInteractions, setRecoInteractions] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [recos, setRecos] = useState<any[]>([]);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [chatbotStatus, setChatbotStatus] = useState<Record<string, boolean>>({});
  const [staffList, setStaffList] = useState<any[]>([]);

  // Memoized unread message count (number of rooms with pending user message as the final item)
  const unreadMessagesCount = useMemo(() => {
    if (!chatMessages || !Array.isArray(chatMessages)) return 0;
    const roomState: Record<string, string> = {};
    chatMessages.filter(Boolean).forEach((msg) => {
      const rm = msg.roomNumber;
      if (rm && rm !== "0" && rm !== "N/A") {
        roomState[rm] = msg.role;
      }
    });
    return Object.values(roomState).filter((role) => role === "user").length;
  }, [chatMessages]);

  // Memoized uncompleted central tasks count
  const activeTasksCount = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.filter((t) => t && t.status !== "completed").length;
  }, [tasks]);

  // Task Alert and Chime notifications center state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saveIsLoading, setSaveIsLoading] = useState(false);
  const prevTaskIdsRef = useRef<Set<string> | null>(null);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn("AudioContext not supported by this browser.");
        return;
      }
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Play C5 (523.25Hz) followed by E5 (659.25Hz) & G5 (783.99Hz) for a sweet, clean hotel chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
      
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(783.99, now + 0.24);
      gain3.gain.setValueAtTime(0.15, now + 0.24);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.85);
    } catch (e) {
      console.warn("Chime generation failed", e);
    }
  };

  const syncBackofficeData = async (forceConfigRefresh = false) => {
    try {
      const response = await fetch("/api/sync");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        console.warn("[BACKOFFICE SYNC] Invalid JSON received from /api/sync, fallback to memory", parseErr);
        return;
      }
      if (json && json.success) {
        if (forceConfigRefresh) {
          setConfig(json.masterConfig || {});
        } else {
          setConfig((prev: any) => {
            if (!prev || Object.keys(prev).length === 0) {
              return json.masterConfig || {};
            }
            return prev;
          });
        }
        
        const newTasks = json.tasks || [];
        if (prevTaskIdsRef.current !== null) {
          // Identify newly added tasks
          const newlyAddedTasks = newTasks.filter((t: any) => !prevTaskIdsRef.current!.has(t.id));
          if (newlyAddedTasks.length > 0) {
            // Trigger audio chime alert
            playChime();
            
            // Generate and enqueue floating notification popups
            const newToasts = newlyAddedTasks.map((t: any) => ({
              id: t.id + "-" + Date.now(),
              room: t.room || "N/A",
              title: t.title || "New Service Task",
              dept: t.informedDept || "Concierge",
              createdAt: Date.now()
            }));
            
            setNotifications(prev => [...prev, ...newToasts]);
            
            // Auto hide notifications after 6 seconds
            newToasts.forEach((toast: any) => {
              setTimeout(() => {
                setNotifications(prev => prev.filter(nt => nt.id !== toast.id));
              }, 6000);
            });
          }
        }
        
        // Always store current IDs list
        prevTaskIdsRef.current = new Set(newTasks.map((t: any) => t.id));

        setTasks(newTasks);
        setFeedbacks(json.feedbackLogs || []);
        setChatMessages(json.chatMessages || []);
        setRecoInteractions(json.recoInteractions || []);
        setPromotions(json.masterPromotions || []);
        setFacilities(json.masterFacilities || []);
        setRestaurants(json.masterRestaurants || []);
        setRecos(json.masterRecos || []);
        setEmergencyMode(!!json.emergencyMode);
        setChatbotStatus(json.chatbotStatus || {});
        setStaffList(json.staffLogons || []);
      }
    } catch (e: any) {
      const isNetworkError = e?.name === "TypeError" || 
                             e?.message?.toLowerCase().includes("fetch") || 
                             e?.message?.toLowerCase().includes("network") ||
                             e?.message?.toLowerCase().includes("failed");
      if (isNetworkError) {
        console.warn("[BACKOFFICE SYNC] Transient fetch connectivity warning: retaining local state.");
      } else {
        console.error("Backoffice sync error:", e);
      }
    } finally {
      setDataLoaded(true);
    }
  };

  const handleConfigChange = (updatedFields: any) => {
    setConfig((prev: any) => ({
      ...prev,
      ...updatedFields
    }));
  };

  useEffect(() => {
    syncBackofficeData(true);
    const interval = setInterval(() => {
      syncBackofficeData(false);
    }, 7000); // 7 seconds background sync loop
    return () => clearInterval(interval);
  }, []);

  // Get permitted tabs based on role
  // Fallback to empty if active role does not exist (or has none)
  const isBackofficeRole = role && role !== "guest";
  const userPermittedTabs = isBackofficeRole ? PERMISSIONS[role as Exclude<Role, null | "guest">] : [];

  // Reset tab to first item of permission scope if current layout does not allow it
  useEffect(() => {
    if (userPermittedTabs.length > 0 && !userPermittedTabs.includes(activeTab)) {
      setActiveTab(userPermittedTabs[0]);
    }
  }, [role, userPermittedTabs]);

  const renderTabContent = () => {
    if (!dataLoaded) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 font-mono text-xs text-slate-400">
          <span className="w-6 h-6 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin"></span>
          <span>Synchronizing with Sandton General Server...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "Concierge":
        return (
          <ConciergeView
            tasks={tasks}
            chatMessages={chatMessages}
            chatbotStatus={chatbotStatus}
            staffName={staffName || "Staff Support"}
            onUpdateTasks={setTasks}
            onUpdateChatbot={(room, enabled) => {
              setChatbotStatus(prev => ({ ...prev, [room]: enabled }));
            }}
            onRefresh={syncBackofficeData}
          />
        );
      case "Tasks":
        return <TasksView tasks={tasks} staffName={staffName || "Staff Support"} onRefresh={syncBackofficeData} emergencyMode={emergencyMode} config={config} role={role} />;
      case "Alerts & Notifications":
        return (
          <AlertsNotificationsForm
            config={config}
            onRefresh={() => syncBackofficeData(true)}
            onConfigChange={handleConfigChange}
          />
        );
      case "Transfers":
        return <TransfersView tasks={tasks} role={role} onRefresh={syncBackofficeData} />;
      case "Hub Directory":
        return (
          <CmsView
            promotions={promotions}
            facilities={facilities}
            restaurants={restaurants}
            recos={recos}
            onRefresh={syncBackofficeData}
          />
        );
      case "Staff Registry":
        return <StaffRegistryView staffList={staffList} onRefresh={syncBackofficeData} />;
      case "Settings":
        return (
          <GeneralSettingsView
            config={config}
            tasks={tasks}
            feedbacks={feedbacks}
            chatMessages={chatMessages}
            recoInteractions={recoInteractions}
            onRefresh={() => syncBackofficeData(true)}
            onConfigChange={handleConfigChange}
          />
        );
      case "Recos":
        return (
          <div className="animate-fade-in text-left">
            <SimpleRecosConsole
              recos={recos}
              recoInteractions={recoInteractions}
              onRefresh={syncBackofficeData}
            />
          </div>
        );
      default:
        return (
          <div className="p-4 bg-slate-950/20 text-slate-400 text-xs font-mono">
            Module {activeTab} is not registered in this runtime context.
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d0d] min-h-screen text-slate-100 font-sans selection:bg-[#cca472]/30">
      {/* Top Header Bar */}
      <header className="px-10 py-6 border-b border-white/[0.04] bg-[#0d0d0d] flex justify-between items-center select-none shrink-0">
        <h1 className="font-serif text-[32px] tracking-wide text-[#cca472] font-semibold leading-none">
          {role === "recos"
            ? "RECOS Admin"
            : role === "staff"
            ? "Staff"
            : role === "manager"
            ? "Admin Staff"
            : role === "admin"
            ? "Backoffice"
            : "Backoffice Console"}
        </h1>
        <button
          onClick={() => setShowSaveConfirm(true)}
          className="text-xs font-sans font-bold uppercase tracking-widest text-[#cca472] hover:text-[#e6c687] transition-colors cursor-pointer"
        >
          SAVE CHANGES
        </button>
      </header>

      {/* SAVE CHANGES CONFIRMATION POPUP MODAL */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in" id="save-confirm-popup">
          <div className="bg-[#161616] border border-white/[0.08] rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <h4 className="text-lg font-serif text-[#cca472] font-semibold">
                Save Changes?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Are you sure you want to write and sync all backoffice adjustments and alert settings to the system?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 py-3 px-5 rounded-xl border border-white/[0.06] hover:bg-white/[0.02] text-xs font-semibold cursor-pointer text-zinc-400 hover:text-white transition-all text-center uppercase tracking-wider h-11"
                disabled={saveIsLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setSaveIsLoading(true);
                  try {
                    const res = await fetch("/api/admin/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ section: "config", data: config })
                    });
                    if (res.ok) {
                      playChime();
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setSaveIsLoading(false);
                    setShowSaveConfirm(false);
                  }
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-[#cca472] hover:bg-[#b08e5f] text-[#0d0d0d] text-xs font-bold font-sans transition-all text-center uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 h-11"
                disabled={saveIsLoading}
              >
                {saveIsLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Workspaces */}
      <div className="flex-1 flex overflow-hidden px-10 pb-10 gap-10">
        {/* Docked Left navigation rail */}
        <div className="w-64 flex flex-col justify-between select-none shrink-0 pt-2 pb-1">
          <div className="flex flex-col space-y-6">
            {/* Interactive Navigation menu */}
            <nav className="space-y-3">
              {userPermittedTabs.map((tabName) => {
                const TabIconComponent = TAB_ICONS[tabName];
                const isSelected = activeTab === tabName;

                return (
                  <button
                    key={tabName}
                    onClick={() => setActiveTab(tabName)}
                    className={cn(
                      "w-full flex items-center text-left py-3 px-5 rounded-xl text-sm font-medium transition-all group duration-150 cursor-pointer relative overflow-hidden",
                      isSelected
                        ? "bg-[#cca472] text-[#0d0d0d] font-semibold shadow-md"
                        : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                    )}
                    title={tabName}
                  >
                    <span className={cn(
                      "flex-shrink-0 mr-3.5 transition-colors duration-150 pl-0.5",
                      isSelected ? "text-[#0d0d0d]" : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      <TabIconComponent size={18} />
                    </span>
                    <span className="truncate flex-1 flex justify-between items-center text-left">
                      <span>{tabName}</span>
                      {tabName === "Concierge" && unreadMessagesCount > 0 && (
                        <span 
                          id="sidebar-concierge-badge"
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans animate-pulse mr-1 border shadow-xs",
                            isSelected ? "bg-[#0d0d0d] text-white border-black/10" : "bg-red-600 text-white border-red-700"
                          )}
                        >
                          {unreadMessagesCount}
                        </span>
                      )}
                      {tabName === "Tasks" && activeTasksCount > 0 && (
                        <span 
                          id="sidebar-tasks-badge"
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans animate-pulse mr-1 border shadow-xs",
                            isSelected ? "bg-[#0d0d0d] text-white border-black/10" : "bg-red-600 text-white border-red-700"
                          )}
                        >
                          {activeTasksCount}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer controls region */}
          <div className="pt-4 border-t border-white/[0.03] space-y-3">
            <button
              onClick={logout}
              className="w-full py-2.5 px-5 flex items-center text-left text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl cursor-pointer transition-all leading-none"
            >
              <LogOut size={14} className="flex-shrink-0 mr-3.5 text-red-500" />
              <span>Logout Console</span>
            </button>

            {/* Authenticated context tag */}
            <div className="px-5 py-2.5 bg-white/[0.015] border border-white/[0.03] rounded-2xl flex items-center space-x-3 text-left">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                <User size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-200 truncate leading-none mb-0.5">
                  {staffName || "Staff User"}
                </p>
                <p className="text-[9px] text-[#cca472] font-mono leading-none tracking-wider uppercase font-bold">
                  {role === "staff"
                    ? "Staff"
                    : role === "manager"
                    ? "Admin Staff"
                    : role === "admin"
                    ? "Backoffice"
                    : role === "recos"
                    ? "RECOS Admin"
                    : role || ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Active Content Workplace Container */}
        <div className="flex-1 bg-[#161616] border border-white/[0.04] rounded-[24px] p-8 overflow-y-auto shadow-2xl relative min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating real-time task notifications panel */}
      <div className="fixed top-24 right-5 z-50 flex flex-col gap-3 min-w-[320px] max-w-[380px] pointer-events-none">
        <AnimatePresence>
          {notifications.map((nt) => (
            <motion.div
              key={nt.id}
              initial={{ opacity: 0, x: 80, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-slate-950/95 border-l-4 border-amber-500 hover:border-amber-400 p-4.5 rounded-r-xl shadow-2xl flex items-start gap-4.5 pointer-events-auto border-r border-t border-b border-slate-800/80 text-left transition-all backdrop-blur-md"
            >
              <div className="bg-amber-950/40 border border-amber-900/30 p-2.5 rounded-lg text-amber-400 mt-0.5 flex-shrink-0">
                <Bell size={18} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0 font-sans text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono text-[9px] text-amber-400 font-bold tracking-widest uppercase bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded leading-none">
                    NEW {nt.dept} TASK
                  </span>
                  <span className="font-mono text-[9px] text-slate-300 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded leading-none">
                    Rm {nt.room}
                  </span>
                </div>
                <p className="font-bold text-slate-100 mt-2 pr-2 line-clamp-2 leading-relaxed text-[12px]">{nt.title}</p>
                <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400">
                  <span className="font-mono text-[10px] text-slate-550 border-r border-slate-800 pr-2 leading-none">Sandton Butler Sys</span>
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.filter(p => p.id !== nt.id));
                    }}
                    className="text-slate-400 hover:text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-colors bg-slate-900 hover:bg-slate-800/80 border border-slate-800 px-2 py-1 rounded cursor-pointer font-bold leading-none"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <MainApp />
    </RoleProvider>
  );
}
