import { useState, useEffect, useMemo, useRef } from "react";
import {
  User,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Plus,
  Search,
  Download,
  Smartphone,
  Bell,
  ShieldAlert,
  Flag,
  UserCheck,
  Building2,
  Tag,
  Star,
  Settings,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  Copy,
  Upload,
  Check,
  FileText,
  Globe,
  Database,
  ArrowUp,
  ArrowDown
} from "lucide-react";
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
import { generateSpecPDF } from "../utils/pdfGenerator";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// --- LIVE COMPONENT TO DISPLAY ELAPSED MINUTES ---
function MinutesElapsed({ createdAt }: { createdAt: number }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diffMs = Date.now() - createdAt;
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      if (mins < 60) {
        setElapsed(`${mins}m ago`);
      } else {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        setElapsed(`${hrs}h ${remMins}m ago`);
      }
    };
    update();
    const interval = setInterval(update, 30000); // 30s updates
    return () => clearInterval(interval);
  }, [createdAt]);

  return <span className="text-[11px] font-mono font-medium text-amber-500/90">{elapsed}</span>;
}

// --- 1. CONCIERGE VIEW HUB ---
export function ConciergeView({
  tasks,
  chatMessages,
  chatbotStatus,
  staffName,
  onUpdateTasks,
  onUpdateChatbot,
  onRefresh
}: {
  tasks: any[];
  chatMessages: any[];
  chatbotStatus: Record<string, boolean>;
  staffName: string;
  onUpdateTasks: (updatedTasks: any[]) => void;
  onUpdateChatbot: (room: string, enabled: boolean) => void;
  onRefresh: () => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [staffReplyText, setStaffReplyText] = useState("");
  const [taskDeptFilter, setTaskDeptFilter] = useState("All");
  const [conciergeSubTab, setConciergeSubTab] = useState<"chat" | "tasks">("chat");
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  // Memoized uncompleted central tasks count
  const activeTasksCount = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.filter((t) => t && t.status !== "completed").length;
  }, [tasks]);

  // Dynamic grouping and sorting of active rooms from chat logs
  const activeRooms = useMemo(() => {
    const roomsMap: Record<string, { roomNumber: string; guestName: string; lastMessage: any; lastMsgUnix: number }> = {};
    
    // Sort chronologically first to ensure latter messages overwrite earlier stubs
    chatMessages.forEach((msg) => {
      const room = msg.roomNumber;
      if (!room || room === "0" || room === "N/A") return;

      if (!roomsMap[room]) {
        roomsMap[room] = {
          roomNumber: room,
          guestName: "Guest",
          lastMessage: msg,
          lastMsgUnix: Date.now()
        };
      }
      
      if (msg.role === "user" && msg.senderName) {
        roomsMap[room].guestName = msg.senderName;
      }
      roomsMap[room].lastMessage = msg;
    });

    return Object.values(roomsMap).sort((a, b) => {
      // Just fallback sorting
      return b.roomNumber.localeCompare(a.roomNumber);
    });
  }, [chatMessages]);

  // Set default selected room on load if none selected
  useEffect(() => {
    if (!selectedRoom && activeRooms.length > 0) {
      setSelectedRoom(activeRooms[0].roomNumber);
    }
  }, [activeRooms, selectedRoom]);

  // Filter messages for selected room
  const selectedRoomMessages = useMemo(() => {
    if (!selectedRoom) return [];
    return chatMessages.filter((m) => m.roomNumber === selectedRoom);
  }, [chatMessages, selectedRoom]);

  // Handle staff direct reply
  const handleSendStaffReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffReplyText.trim() || !selectedRoom) return;

    try {
      const res = await fetch("/api/chat/staff-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: staffReplyText.trim(),
          roomNumber: selectedRoom,
          staffName: staffName || "Staff Support"
        })
      });
      if (res.ok) {
        setStaffReplyText("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Chatbot state toggle
  const handleToggleBot = async (room: string) => {
    const currentStatus = chatbotStatus[room] !== false; // defaults to true
    const nextStatus = !currentStatus;
    try {
      const res = await fetch("/api/chatbot/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber: room, enabled: nextStatus })
      });
      if (res.ok) {
        onUpdateChatbot(room, nextStatus);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Claim Task operation
  const handleClaimTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/sync/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          actionedAt: Date.now(),
          claimedBy: staffName || "Staff Support"
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Task operation
  const handleCompleteTask = async (taskId: string, resolutionNote?: string) => {
    try {
      const res = await fetch(`/api/sync/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completedAt: Date.now(),
          completedBy: staffName || "Staff Support",
          resolutionNote: resolutionNote || "Attended to"
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [conversionNotification, setConversionNotification] = useState<string | null>(null);

  const handleConvertMessageToTask = async (msg: any) => {
    try {
      const titleText = msg.content.length > 50 
        ? msg.content.substring(0, 47) + "..." 
        : msg.content;
      
      const res = await fetch("/api/sync/tasks/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Guest Request: "${titleText}"`,
          room: selectedRoom || "N/A",
          informedDept: "Concierge",
          details: {
            convertedFromMessage: true,
            msgContent: msg.content,
            sender: msg.senderName || "Guest",
            timestamp: msg.timestamp || new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        setConversionNotification(`Created central task from Rm ${selectedRoom || "Guest"} message successfully!`);
        onRefresh();
        setTimeout(() => {
          setConversionNotification(null);
        }, 5000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setConversionNotification(`Failed to convert message: ${errData.error || "Server error"}`);
      }
    } catch (err) {
      console.error("Error converting message to task:", err);
      setConversionNotification("Error connecting to server to convert message.");
    }
  };

  const departments = ["Housekeeping", "Concierge", "Spa", "F&B", "HOD"];
  const botEnabled = selectedRoom ? chatbotStatus[selectedRoom] !== false : true;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CLIENT CHAT SUPERVISOR PANE */}
          <div className="lg:col-span-4 bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
                <User size={16} /> Guest chats
              </h4>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono uppercase font-bold animate-pulse">
                live feed
              </span>
            </div>

            {/* Scrollable list of active rooms */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {activeRooms.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-mono">No active room conversations.</div>
              ) : (
                activeRooms.map((room) => {
                  const isActive = selectedRoom === room.roomNumber;
                  return (
                    <div
                      key={room.roomNumber}
                      onClick={() => setSelectedRoom(room.roomNumber)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isActive
                          ? "bg-[var(--color-mid)]/40 border-[var(--color-accent)] shadow-md animate-none"
                          : "bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-800/20"
                      }`}
                      id={`room-row-${room.roomNumber}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-100 font-mono">Room {room.roomNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono italic">{room.lastMessage.timestamp}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[11px] text-slate-300 truncate max-w-[150px] font-sans">
                          <span className="font-semibold text-amber-500/90">{room.guestName}:</span> {room.lastMessage.content}
                        </p>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                            chatbotStatus[room.roomNumber] !== false
                              ? "bg-amber-950/45 text-amber-400 border-amber-800/40"
                              : "bg-blue-950/45 text-blue-400 border-blue-800/40"
                          }`}
                        >
                          {chatbotStatus[room.roomNumber] !== false ? "AI Bot ON" : "Staff Direct"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIVE TRANSCRIPT PANE */}
          <div className="lg:col-span-8">
            {selectedRoom ? (
              <div className="bg-[#0c0d12]/50 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4" id="selected-room-transcript">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#E6C687] font-mono uppercase tracking-wider">
                      Room {selectedRoom} Conversation Transcript
                    </span>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Active Guest: {activeRooms.find((r) => r.roomNumber === selectedRoom)?.guestName || "Authenticated Guest"}
                    </p>
                  </div>

                  {/* Chatbot Toggle Switch */}
                  <div className="flex items-center space-x-2 bg-black/45 px-3 py-1.5 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Chatbot AI</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBot(selectedRoom)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                        botEnabled ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                      }`}
                      id={`chatbot-toggle-${selectedRoom}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          botEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {conversionNotification && (
                  <div className="bg-emerald-950/40 border border-emerald-800/80 text-emerald-400 text-xs py-2 px-3 rounded-lg flex justify-between items-center animate-fade-in font-mono shadow-inner">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      {conversionNotification}
                    </span>
                    <button onClick={() => setConversionNotification(null)} className="text-[10px] text-emerald-500 hover:text-emerald-300 font-black ml-2 cursor-pointer">✕</button>
                  </div>
                )}

                {/* Scrolling transcript rows */}
                <div className="h-[320px] overflow-y-auto space-y-3.5 pr-1 text-xs scrollbar-thin">
                  {selectedRoomMessages.map((m, idx) => {
                    const isGuest = m.role === "user";
                    const isAI = m.role === "assistant";
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl max-w-[85%] ${
                          isGuest
                            ? "bg-emerald-950/25 text-emerald-100 border border-emerald-900/30 mr-auto"
                            : isAI
                            ? "bg-amber-950/25 text-amber-100 border border-amber-900/30 ml-auto"
                            : "bg-blue-950/25 text-blue-100 border border-blue-900/30 ml-auto"
                        }`}
                      >
                        <div className="flex justify-between items-center gap-4 text-[9px] font-mono text-slate-400 pb-0.5 border-b border-white/5 mb-1 select-none">
                          <span className="font-bold">{m.senderName}</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span>{m.timestamp}</span>
                            {isGuest && (
                              <button
                                onClick={() => handleConvertMessageToTask(m)}
                                className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[8.5px] font-sans font-bold uppercase transition scale-95 hover:scale-100 active:scale-90 cursor-pointer duration-100 leading-none flex items-center"
                                title="Convert this guest request to a central service task"
                              >
                                + Task
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="font-sans leading-relaxed text-[11px] whitespace-pre-line">{m.content}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Reply block if bot is OFF */}
                {!botEnabled ? (
                  <form onSubmit={handleSendStaffReply} className="flex gap-2 pt-2 border-t border-slate-800/40">
                    <input
                      type="text"
                      placeholder="Type official desk response directly to guest room..."
                      value={staffReplyText}
                      onChange={(e) => setStaffReplyText(e.target.value)}
                      className="flex-1 bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400 text-slate-200 placeholder-slate-600 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!staffReplyText.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40 transition-colors cursor-pointer shadow"
                    >
                      Reply
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-2 bg-amber-950/15 border border-amber-900/20 text-amber-500/80 rounded-md text-[10px] font-mono leading-relaxed uppercase tracking-wider">
                    🤖 AI BOT HANDLER IN SESSION. TURN OFF TO TAKE CONTROL.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/30 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs font-mono">
                Select a guest chat connection from the left to monitor live logs and intervene.
              </div>
            )}
          </div>
        </div>
      {false && (
        <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-800 gap-2">
            <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> Central service task board
            </h4>

            {/* Department filter */}
            <div className="flex items-center space-x-2 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
              <span className="text-[10px] font-mono text-slate-500">Dept:</span>
              <select
                value={taskDeptFilter}
                onChange={(e) => setTaskDeptFilter(e.target.value)}
                className="bg-transparent text-xs text-amber-400 focus:outline-none font-mono cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800" id="task-columns">
            {/* COLUMN 1: RECEIVED */}
            <div className="flex flex-col space-y-2 md:pr-4">
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold pb-1.5 border-b border-slate-800/60 text-center">
                <span className="flex items-center gap-1.5 text-amber-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  📌 Received
                </span>
                <span className="bg-slate-800 text-slate-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {tasks.filter((t) => t.status === "received" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter)).length}
                </span>
              </div>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.status === "received" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
                  .map((t) => (
                    <div key={t.id} className="bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 p-3 rounded-lg flex flex-col space-y-2 leading-snug">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-amber-400 font-mono bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded">Rm {t.room}</span>
                        <div className="flex items-center gap-1.5">
                          <MinutesElapsed createdAt={t.createdAt} />
                          <button
                            onClick={() => {
                              const textStr = `*Task Alert [Room ${t.room}]:* "${t.title}" (${t.informedDept}). Status is: ${t.status.toUpperCase()}.`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textStr)}`, "_blank");
                            }}
                            className="text-[8px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 font-mono px-1 py-0.5 rounded transition-colors scale-95 uppercase font-bold"
                            title="Dispatch task description to WhatsApp"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-100">{t.title}</p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/30">
                        <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded uppercase font-mono tracking-wider leading-none">
                          {t.informedDept}
                        </span>
                        <button
                          onClick={() => {
                            const rawRequest = t.details?.note || t.title;
                            const cleanReq = typeof rawRequest === "string" 
                              ? rawRequest.replace(/^Guest Request:\s*/i, "").replace(/^"|"(?=\s*$)/g, "").trim() 
                              : rawRequest;
                            const textStr = `[Room ${t.room}] - ${cleanReq}`;
                            navigator.clipboard.writeText(textStr)
                              .then(() => console.log("[WA-COPY] Task copied to clipboard"))
                              .catch(err => console.error("Clipboard copy failed", err));
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textStr)}`, "_blank");
                            handleClaimTask(t.id);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-[13px] font-extrabold px-4.5 py-2 rounded-xl cursor-pointer transition-all uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                          title="Open WhatsApp with task details and mark task as active in-progress"
                        >
                          Copy to Whatsapp
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="flex flex-col space-y-2 md:px-4">
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold pb-1.5 border-b border-slate-800/60 text-center col-title">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  ⏳ In Progress
                </span>
                <span className="bg-amber-950/60 text-amber-400 border border-amber-900/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {tasks.filter((t) => t.status === "in_progress" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter)).length}
                </span>
              </div>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.status === "in_progress" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
                  .map((t) => (
                    <div key={t.id} className="bg-slate-950/60 border border-amber-500/20 p-3 rounded-lg flex flex-col space-y-2 leading-snug">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-amber-400 font-mono bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded">Rm {t.room}</span>
                        <div className="flex items-center gap-1.5">
                          <MinutesElapsed createdAt={t.createdAt} />
                          <button
                            onClick={() => {
                              const textStr = `*Task Alert [Room ${t.room}]:* "${t.title}" (${t.informedDept}). Status is: ${t.status.toUpperCase()}. Claimed by: ${t.claimedBy || "Staff"}.`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textStr)}`, "_blank");
                            }}
                            className="text-[8px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 font-mono px-1 py-0.5 rounded transition-colors scale-95 uppercase font-bold"
                            title="Dispatch task description to WhatsApp"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-100">{t.title}</p>
                      {t.claimedBy && (
                        <p className="text-[10px] text-slate-400 italic">Attended by {t.claimedBy}</p>
                      )}

                      {resolvingTaskId === t.id ? (
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                          <label className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-bold block">
                            Resolution Note *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. attended by John"
                            required
                            value={resolutionNoteInput}
                            onChange={(e) => setResolutionNoteInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setResolvingTaskId(null);
                                setResolutionNoteInput("");
                              }}
                              className="px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-400 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={!resolutionNoteInput.trim()}
                              onClick={() => {
                                handleCompleteTask(t.id, resolutionNoteInput);
                                setResolvingTaskId(null);
                                setResolutionNoteInput("");
                              }}
                              className="px-2.5 py-1 rounded text-[10px] uppercase font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-800/30">
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded uppercase font-mono tracking-wider leading-none">
                            {t.informedDept}
                          </span>
                          <button
                            onClick={() => {
                              setResolvingTaskId(t.id);
                              setResolutionNoteInput("");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded cursor-pointer transition-colors uppercase tracking-wider"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* COLUMN 3: COMPLETED */}
            <div className="flex flex-col space-y-2 md:pl-4">
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold pb-1.5 border-b border-slate-800/60 text-center col-title text-emerald-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ✅ Completed
                </span>
                <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {tasks.filter((t) => t.status === "completed" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter)).length}
                </span>
              </div>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {tasks
                  .filter((t) => t.status === "completed" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
                  .map((t) => (
                    <div key={t.id} className="bg-slate-950/40 border border-emerald-500/10 p-3 rounded-lg flex flex-col space-y-1.5 leading-snug opacity-75">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-slate-300 font-mono bg-slate-800/30 border border-slate-700/30 px-1.5 py-0.5 rounded">Rm {t.room}</span>
                        <span className="text-[9px] text-emerald-400 font-mono uppercase bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.2 rounded">Done</span>
                      </div>
                      <p className="text-xs text-slate-300 line-through">{t.title}</p>
                      
                      {/* AUDIT TIMESTAMPS ROW */}
                      <div className="pt-2 mt-1 border-t border-slate-800/40 space-y-0.5 text-[9px] font-mono text-slate-400">
                        <p>Created: {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {t.actionedAt && (
                          <p>Attended: {new Date(t.actionedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {t.claimedBy || "desk"}</p>
                        )}
                        {t.completedAt && (
                          <p>Completed: {new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {t.completedBy || "desk"}</p>
                        )}
                        {t.resolutionNote && (
                          <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1 bg-emerald-950/20 border border-emerald-900/30 p-1 rounded">Resol: {t.resolutionNote}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- 2. RECOMMENDATIONS ANALYTICS DASHBOARD ---
export function RecosAnalyticsView({
  recoInteractions,
  recos
}: {
  recoInteractions: any[];
  recos: any[];
}) {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  // Filter logs by date range inputs
  const filteredLogs = useMemo(() => {
    const fromTime = new Date(dateFrom).getTime();
    const toTime = new Date(dateTo).getTime();
    return recoInteractions.filter((item) => {
      const ts = new Date(item.timestamp).getTime();
      return ts >= fromTime && ts <= toTime;
    });
  }, [recoInteractions, dateFrom, dateTo]);

  // Totals calculations
  const totalImpressions = filteredLogs.filter((l) => l.type === "impression").length;
  const totalClicks = filteredLogs.filter((l) => l.type === "click").length;
  const totalConfirmed = filteredLogs.filter((l) => l.type === "confirmed").length;
  const totalImageClicks = filteredLogs.filter((l) => l.type === "image_click" || l.type === "image-click").length;
  const conversionRate = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0";

  // Recharts structured mapping data
  const chartData = useMemo(() => {
    return recos.map((reco) => {
      const imps = filteredLogs.filter((l) => l.recoId === reco.id && l.type === "impression").length;
      const clicks = filteredLogs.filter((l) => l.recoId === reco.id && l.type === "click").length;
      const imgClicks = filteredLogs.filter((l) => l.recoId === reco.id && (l.type === "image_click" || l.type === "image-click")).length;
      return {
        name: reco.title.split(":")[1]?.trim() || reco.title,
        Impressions: imps,
        Clicks: clicks,
        "Image Clicks": imgClicks
      };
    });
  }, [recos, filteredLogs]);

  // Client-side CSV download compiler
  const handleCsvExport = () => {
    let csvStr = "Title,Impressions,Clicks,Image Clicks,Conversion Rate %\n";
    chartData.forEach((row) => {
      const rate = row.Impressions > 0 ? ((row.Clicks / row.Impressions) * 100).toFixed(1) + "%" : "0%";
      csvStr += `"${row.name}",${row.Impressions},${row.Clicks},${row["Image Clicks"]},${rate}\n`;
    });
    const encoded = encodeURI("data:text/csv;charset=utf-8," + csvStr);
    const a = document.createElement("a");
    a.href = encoded;
    a.download = `recos-analytics-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Filters Banner */}
      <div className="bg-black/35 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3 text-xs w-full sm:w-auto">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-mono text-slate-500">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:border-amber-400 text-xs text-center"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-mono text-slate-500">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:border-amber-400 text-xs text-center"
            />
          </div>
        </div>

        <button
          onClick={handleCsvExport}
          className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 cursor-pointer shadow transition-all duration-200"
        >
          <Download size={14} /> Export CSV Report
        </button>
      </div>

      {/* Metrics Carousel of Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-950/65 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-1 shadow-sm text-center">
          <span className="text-[10px] font-mono text-slate-500">Total impressions</span>
          <p className="text-2xl font-serif text-slate-100 font-bold">{totalImpressions}</p>
        </div>
        <div className="bg-slate-950/65 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-1 shadow-sm text-center">
          <span className="text-[10px] font-mono text-slate-500">Recommendation clicks</span>
          <p className="text-2xl font-serif text-amber-400 font-bold">{totalClicks}</p>
        </div>
        <div className="bg-slate-950/65 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-1 shadow-sm text-center">
          <span className="text-[10px] font-mono text-slate-500">Image clicks</span>
          <p className="text-2xl font-serif text-teal-400 font-bold">{totalImageClicks}</p>
        </div>
        <div className="bg-slate-950/65 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-1 shadow-sm text-center">
          <span className="text-[10px] font-mono text-slate-500">Cta bookings confirmed</span>
          <p className="text-2xl font-serif text-emerald-400 font-bold">{totalConfirmed}</p>
        </div>
        <div className="bg-slate-950/65 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-1 shadow-sm text-center">
          <span className="text-[10px] font-mono text-slate-500">General click-through</span>
          <p className="text-2xl font-serif text-blue-400 font-bold">{conversionRate}%</p>
        </div>
      </div>

      {/* Side-by-Side BarChart visualization */}
      <div className="bg-black/20 border border-slate-800 rounded-xl p-6">
        <h4 className="text-xs tracking-wider text-slate-400 font-mono font-bold pb-3 border-b border-slate-800/50 mb-5">
          📈 Recommendations engagement: Impressions, Clicks & Image Clicks
        </h4>
        <div className="w-full h-[320px] text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
              <XAxis dataKey="name" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar dataKey="Impressions" fill="#64748B" barSize={18} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Clicks" fill="#F59E0B" barSize={18} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Image Clicks" fill="#14B8A6" barSize={18} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- 3. FEEDBACK LOGS TABLE ---
export function FeedbacksView({ feedbacks }: { feedbacks: any[] }) {
  const [ratingFilter, setRatingFilter] = useState("All");

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (ratingFilter === "All") return true;
      if (ratingFilter === "Low") return f.rating < 5;
      if (ratingFilter === "High") return f.rating >= 7;
      return true;
    });
  }, [feedbacks, ratingFilter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
          <Smartphone size={16} /> Guest experience feedback submissions
        </h4>

        <div className="flex items-center space-x-2 bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-1">
          <span className="text-[10px] font-mono text-slate-500">Filter:</span>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-transparent text-xs text-amber-400 focus:outline-none font-mono cursor-pointer"
          >
            <option value="All">All Feedback</option>
            <option value="High">Satisfactory (7+★)</option>
            <option value="Low">Low Rating (&lt;5★)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-black/25 border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4">Room</th>
              <th className="py-3 px-4">Guest Name</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4">Message / Comment Text Excerpt</th>
              <th className="py-3 px-4 text-center">Flag</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-sans">
            {filteredFeedbacks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center font-mono text-slate-500 text-xs">
                  No experience feedback logs matching conditions found.
                </td>
              </tr>
            ) : (
              filteredFeedbacks.map((f) => {
                const isLow = f.rating < 5;
                const isHigh = f.rating >= 7;

                return (
                  <tr key={f.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">Rm {f.roomNumber || "000"}</td>
                    <td className="py-3 px-4 text-slate-100">{f.guestName || "Anonymous"}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold font-mono ${
                          isHigh
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/30"
                            : isLow
                            ? "bg-red-950/40 text-red-400 border-red-800/30"
                            : "bg-amber-950/40 text-amber-400 border-amber-800/30"
                        }`}
                      >
                        {f.rating} / 10
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[320px] truncate" title={f.text}>
                      "{f.text}"
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <div className="flex justify-center">
                          <Flag size={14} className="text-red-500 animate-pulse" />
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[10px]">
                      {new Date(f.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 4. AIRPORT TRANSFERS / SHUTTLE TABLE (Manager Exclusive Controls) ---
export function TransfersView({
  tasks,
  role,
  onRefresh
}: {
  tasks: any[];
  role: string | null;
  onRefresh: () => void;
}) {
  const isManagerOrAdmin = role === "manager" || role === "admin" || role === "recos";

  // Filter shuttle tasks
  const shuttleTasks = useMemo(() => {
    return tasks.filter((t) => t && typeof t.title === "string" && (t.title.toLowerCase().includes("shuttle") || t.title.toLowerCase().includes("transfer")));
  }, [tasks]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/sync/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-slate-800">
        <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
          <ShieldAlert size={16} /> Luxury shuttle fleet & airport transfers
        </h4>
      </div>

      <div className="overflow-x-auto bg-black/25 border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-mono text-[10px] tracking-wider">
              <th className="py-3 px-4">Room</th>
              <th className="py-3 px-4">Flight Details</th>
              <th className="py-3 px-4">Route</th>
              <th className="py-3 px-4 text-center">Travellers</th>
              <th className="py-3 px-4">Vehicle Tier</th>
              <th className="py-3 px-4">Schedule Date/Time</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-sans">
            {shuttleTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center font-mono text-slate-500 text-xs">
                  No executive shuttle bookings recorded yet.
                </td>
              </tr>
            ) : (
              shuttleTasks.map((t) => {
                const details = t.details || {};
                return (
                  <tr key={t.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">Rm {t.room}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{details.flightNumber || "N/A"}</td>
                    <td className="py-3 px-4 font-mono">{details.route || "OR Tambo"}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">{details.travellers || "1"} pax</td>
                    <td className="py-3 px-4 text-slate-100">{details.vehicle || "Executive Sedan"}</td>
                    <td className="py-3 px-4 font-mono string-date">{new Date(details.dateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-3 px-4 text-center">
                      {isManagerOrAdmin ? (
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-amber-400 focus:outline-none cursor-pointer"
                        >
                          <option value="received">Pending</option>
                          <option value="in_progress">Confirmed</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            t.status === "completed"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                              : t.status === "in_progress"
                              ? "bg-amber-950/40 text-amber-400 border border-amber-800/30"
                              : "bg-slate-950/40 text-slate-400 border border-slate-800/30"
                          }`}
                        >
                          {t.status === "completed" ? "Done" : t.status === "in_progress" ? "Confirmed" : "Pending"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 4.5. GUEST TASKS KANBAN BOARD SYSTEM ---
export function TasksView({
  tasks,
  staffName,
  onRefresh,
  emergencyMode,
  config,
  role
}: {
  tasks: any[];
  staffName: string;
  onRefresh: () => void;
  emergencyMode?: boolean;
  config?: any;
  role?: string | null;
}) {
  const [taskDeptFilter, setTaskDeptFilter] = useState("All");
  const departments = ["Housekeeping", "Concierge", "Spa", "F&B", "HOD"];
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");

  // Local state for date specific export log
  const getTodayString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [dateFrom, setDateFrom] = useState(getTodayString(-7));
  const [dateTo, setDateTo] = useState(getTodayString(0));

  const filteredTasksForExport = useMemo(() => {
    if (!tasks) return [];
    const startTimestamp = new Date(dateFrom + "T00:00:00").getTime();
    const endTimestamp = new Date(dateTo + "T23:59:59").getTime();
    return tasks.filter(t => {
      const ts = t.createdAt || 0;
      return ts >= startTimestamp && ts <= endTimestamp;
    });
  }, [tasks, dateFrom, dateTo]);

  const downloadCsv = () => {
    const headers = ["Task Id", "Room", "Title", "Department", "Status", "Created at", "Actioned at", "Claimed by", "Completed at", "Completed by", "Resolution note"];
    const rows = filteredTasksForExport.map(t => [
      t.id,
      t.room || "",
      t.title || "",
      t.informedDept || "",
      t.status || "",
      t.createdAt ? new Date(t.createdAt).toISOString() : "",
      t.actionedAt ? new Date(t.actionedAt).toISOString() : "",
      t.claimedBy || "",
      t.completedAt ? new Date(t.completedAt).toISOString() : "",
      t.completedBy || "",
      t.resolutionNote || ""
    ]);
    
    const csvString = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sandton_tasks_log_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate PDF report.");
      return;
    }
    
    const tableRows = filteredTasksForExport.map(t => `
      <tr style="border-bottom: 1px solid #cbd5e0; font-size: 11px;">
        <td style="padding: 10px 8px; font-family: monospace; color: #4a5568;">${t.id.slice(0, 8)}</td>
        <td style="padding: 10px 8px; font-weight: bold; color: #1a202c;">Rm ${t.room}</td>
        <td style="padding: 10px 8px; color: #2d3748;">${t.title}</td>
        <td style="padding: 10px 8px; font-size: 10px; font-weight: bold; font-family: monospace;">${t.informedDept}</td>
        <td style="padding: 10px 8px;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background-color: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0;">
            ${t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : ""}
          </span>
        </td>
        <td style="padding: 10px 8px; font-size: 10px; color: #718096; line-height: 1.4;">
          Created: ${t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}<br/>
          Done: ${t.completedAt ? new Date(t.completedAt).toLocaleString() : "-"}
        </td>
        <td style="padding: 10px 8px; color: #10b981; font-weight: bold; font-family: monospace; font-size: 11px;">${t.resolutionNote || "-"}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <html>
        <head>
          <title>Sandton Hotel Backoffice - Central Service Tasks Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #2d3748; padding: 40px; margin: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 22px; font-weight: bold; letter-spacing: -0.5px; color: #1a202c; }
            .meta { font-size: 11px; color: #4a5568; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f7fafc; border-bottom: 2px solid #cbd5e0; padding: 10px 8px; font-size: 10px; letter-spacing: 0.5px; text-align: left; color: #4a5568; }
            .footer { margin-top: 50px; font-size: 10px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Sandton backoffice task audit report</div>
              <div class="meta" style="margin-top: 5px;">
                Property: <strong>Sandton Hotel</strong> | Status: Active Operations Record
              </div>
            </div>
            <div class="meta" style="text-align: right;">
              Export Date: ${new Date().toLocaleString()}<br/>
              Report Range: <strong>${dateFrom}</strong> to <strong>${dateTo}</strong> <br/>
              Matches Found: <strong>${filteredTasksForExport.length} tasks</strong>
            </div>
          </div>
          
          <h3 style="font-size: 13px; margin-bottom: 10px; font-weight: 700; border-left: 3px solid #3182ce; padding-left: 8px;">Filtered guest service actions</h3>
          <table>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Room</th>
                <th>Service requested</th>
                <th>Department</th>
                <th>Status</th>
                <th>Timeline trace</th>
                <th>Resolution status / note</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || `<tr><td colspan="7" style="padding: 40px; text-align: center; color: #a0aec0; font-family: monospace; font-size: 12px; font-style: italic;">No service tasks found within selected range.</td></tr>`}
            </tbody>
          </table>
          
          <div class="footer">
            Sandton Backoffice Management Core System • Private & Confidential Internal Property Records
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Claim Task operation
  const handleClaimTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/sync/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          actionedAt: Date.now(),
          claimedBy: staffName || "Staff Support"
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Task operation
  const handleCompleteTask = async (taskId: string, resolutionNote?: string) => {
    try {
      const res = await fetch(`/api/sync/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completedAt: Date.now(),
          completedBy: staffName || "Staff Support",
          resolutionNote: resolutionNote || "Attended to"
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-black/30 border border-slate-800 rounded-xl p-6 flex flex-col space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800 gap-3">
        <div className="space-y-0.5">
          <h4 className="font-serif text-base tracking-wider text-amber-400 font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} /> Guest service tasks kanban
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Real-time operative board for room service, amenities & concierge dispatches
          </p>
        </div>

        {/* Department filter */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 tracking-wider font-bold">Department:</span>
          <select
            value={taskDeptFilter}
            onChange={(e) => setTaskDeptFilter(e.target.value)}
            className="bg-transparent text-xs text-amber-400 focus:outline-none font-mono font-bold cursor-pointer pr-1"
          >
            <option value="All" className="bg-slate-950 text-slate-300">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept} className="bg-slate-950 text-slate-300">
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {emergencyMode && (
        <div className="bg-red-950/45 border border-red-800/80 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-inner" id="tasks-emergency-banner">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-500/50 flex items-center justify-center text-lg shrink-0 animate-bounce">
              🚨
            </div>
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest font-mono">
                  ACTIVE CENTRAL HOTEL EMERGENCY PROTOCOL IN EFFECT
                </h4>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-3xl">
                The backoffice is currently operating under the central broadcast protocol. Emergency channels are broadcast to guest panels. Please verify security parameters, ensure critical tasks are prioritized, and coordinate directly with local emergency teams. Use the central validation panel at the top of the console to stand down the alarm.
              </p>
            </div>
          </div>
          <div className="text-[10px] bg-red-950/60 font-mono text-red-400 border border-red-900/40 px-3 py-2 rounded-lg max-w-xs shrink-0 select-none text-center">
            ⚠️ DEACTIVATION SECURED: Enter name & confirm escalation in the banner at the top of this page to deactivate.
          </div>
        </div>
      )}

      {/* Task Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-800" id="tasks-kanban-columns">
        {/* COLUMN 1: RECEIVED */}
        <div className="flex flex-col space-y-3 bg-slate-950/20 p-4 rounded-xl lg:pr-4">
          <div className="flex justify-between items-center text-[12px] text-slate-300 tracking-widest font-mono font-bold pb-2 border-b border-slate-800 text-center">
            <span className="flex items-center gap-1.5 text-amber-500 font-sans tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              📌 Received
            </span>
            <span className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded-full font-bold font-mono">
              {tasks.filter((t) => t.status === "received" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter)).length}
            </span>
          </div>
          <div className="space-y-3 min-h-[420px] max-h-[550px] overflow-y-auto pr-1">
            {tasks
              .filter((t) => t.status === "received" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
              .length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 font-mono italic">No pending tasks.</div>
              ) : (
                tasks
                  .filter((t) => t.status === "received" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
                  .map((t) => (
                    <div key={t.id} className="bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 hover:border-slate-700 p-3.5 rounded-lg flex flex-col space-y-2.5 leading-snug transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-amber-500 font-mono bg-amber-955/40 border border-amber-900/30 px-2 py-0.5 rounded">Rm {t.room}</span>
                        <div className="flex items-center gap-1.5">
                          <MinutesElapsed createdAt={t.createdAt} />
                          <button
                            onClick={() => {
                              const textStr = `*Task Alert [Room ${t.room}]:* "${t.title}" (${t.informedDept}). Status is: RECEIVED.`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textStr)}`, "_blank");
                            }}
                            className="text-[8px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 font-mono px-1 py-0.5 rounded transition-colors scale-95 font-bold cursor-pointer"
                            title="Dispatch task description to WhatsApp"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 font-sans tracking-wide leading-relaxed">{t.title}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                        <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono tracking-wider leading-none">
                          {t.informedDept}
                        </span>
                        <button
                          onClick={() => {
                            const rawRequest = t.details?.note || t.title;
                            const cleanReq = typeof rawRequest === "string" 
                              ? rawRequest.replace(/^Guest Request:\s*/i, "").replace(/^"|"(?=\s*$)/g, "").trim() 
                              : rawRequest;
                            const textStr = `[Room ${t.room}] - ${cleanReq}`;
                            navigator.clipboard.writeText(textStr)
                              .then(() => console.log("[WA-COPY] Task copied to clipboard"))
                              .catch(err => console.error("Clipboard copy failed", err));
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textStr)}`, "_blank");
                            handleClaimTask(t.id);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-[13px] font-extrabold px-4.5 py-2 rounded-xl cursor-pointer transition-all tracking-wider shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                          title="Open WhatsApp with task details and mark task as active in-progress"
                        >
                          Copy to Whatsapp
                        </button>
                      </div>
                    </div>
                  ))
              )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS */}
        <div className="flex flex-col space-y-3 bg-slate-950/20 p-4 rounded-xl lg:px-6">
          <div className="flex justify-between items-center text-[12px] text-slate-300 tracking-widest font-mono font-bold pb-2 border-b border-slate-800 text-center col-title">
            <span className="flex items-center gap-1.5 text-blue-400 font-sans tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              ⏳ In progress
            </span>
            <span className="bg-blue-950 text-blue-400 border border-blue-900/30 text-xs px-2 py-0.5 rounded-full font-bold font-mono">
              {tasks.filter((t) => t.status === "in_progress" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter)).length}
            </span>
          </div>
          <div className="space-y-3 min-h-[420px] max-h-[550px] overflow-y-auto pr-1">
            {tasks
              .filter((t) => t.status === "in_progress" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
              .length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 font-mono italic">No tasks in progress.</div>
              ) : (
                tasks
                  .filter((t) => t.status === "in_progress" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
                  .map((t) => (
                    <div key={t.id} className="bg-slate-900/80 border border-amber-500/10 p-3.5 rounded-lg flex flex-col space-y-2.5 leading-snug transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-amber-500 font-mono bg-amber-955/40 border border-amber-900/30 px-2 py-0.5 rounded">Rm {t.room}</span>
                        <div className="flex items-center gap-1.5">
                          <MinutesElapsed createdAt={t.createdAt} />
                          <button
                            onClick={() => {
                              const textStr = `*Task Alert [Room ${t.room}]:* "${t.title}" (${t.informedDept}). Status is: IN PROGRESS. Claimed by: ${t.claimedBy || "Staff"}.`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textStr)}`, "_blank");
                            }}
                            className="text-[8px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 font-mono px-1 py-0.5 rounded transition-colors scale-95 font-bold cursor-pointer"
                            title="Dispatch task description to WhatsApp"
                          >
                            WA
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 font-sans tracking-wide leading-relaxed">{t.title}</p>
                      {t.claimedBy && (
                        <p className="text-[10px] text-slate-400 italic">Attended by {t.claimedBy}</p>
                      )}

                      {resolvingTaskId === t.id ? (
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                          <label className="text-[10px] font-mono text-emerald-400 tracking-wider font-bold block">
                            Resolution note *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. attended by John"
                            required
                            value={resolutionNoteInput}
                            onChange={(e) => setResolutionNoteInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setResolvingTaskId(null);
                                setResolutionNoteInput("");
                              }}
                              className="px-2 py-1 rounded text-[10px] font-bold text-slate-400 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={!resolutionNoteInput.trim()}
                              onClick={() => {
                                handleCompleteTask(t.id, resolutionNoteInput);
                                setResolvingTaskId(null);
                                setResolutionNoteInput("");
                              }}
                              className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded font-mono tracking-wider leading-none font-sans">
                            {t.informedDept}
                          </span>
                          <button
                            onClick={() => {
                              setResolvingTaskId(t.id);
                              setResolutionNoteInput("");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] tracking-wider font-bold px-3 py-1 rounded cursor-pointer transition-all shadow-sm active:scale-95"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              )}
          </div>
        </div>

        {/* COLUMN 3: COMPLETED */}
        <div className="flex flex-col space-y-3 bg-slate-950/20 p-4 rounded-xl lg:pl-6">
          <div className="flex justify-between items-center text-[12px] text-slate-300 tracking-widest font-mono font-bold pb-2 border-b border-slate-800 text-center col-title text-emerald-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-sans tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ✅ Completed
            </span>
            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 text-xs px-2 py-0.5 rounded-full font-bold font-mono">
              {tasks.filter((t) => t.status === "completed" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter)).length}
            </span>
          </div>
          <div className="space-y-3 min-h-[420px] max-h-[550px] overflow-y-auto pr-1">
            {tasks
              .filter((t) => t.status === "completed" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
              .length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 font-mono italic">No completed tasks yet.</div>
              ) : (
                tasks
                  .filter((t) => t.status === "completed" && (taskDeptFilter === "All" || t.informedDept === taskDeptFilter))
                  .map((t) => (
                    <div key={t.id} className="bg-slate-900/40 border border-emerald-500/10 p-3.5 rounded-lg flex flex-col space-y-2 leading-snug opacity-80 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-slate-400 font-mono bg-slate-800/20 border border-slate-800 px-2 py-0.5 rounded">Rm {t.room}</span>
                        <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/15 border border-emerald-900/20 px-1.5 py-0.5 rounded">Done</span>
                      </div>
                      <p className="text-xs text-slate-400 line-through font-sans leading-relaxed">{t.title}</p>
                      
                      {/* AUDIT TIMESTAMPS ROW */}
                      <div className="pt-2 mt-1 border-t border-slate-800/40 space-y-0.5 text-[9px] font-mono text-slate-400">
                        <p>Created: {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {t.actionedAt && (
                          <p>Attended: {new Date(t.actionedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {t.claimedBy || "desk"}</p>
                        )}
                        {t.completedAt && (
                          <p>Completed: {new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {t.completedBy || "desk"}</p>
                        )}
                        {t.resolutionNote && (
                          <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1 bg-emerald-950/20 border border-emerald-900/30 p-1 rounded">Resol: {t.resolutionNote}</p>
                        )}
                      </div>
                    </div>
                  ))
              )}
          </div>
        </div>
      </div>

      {/* Local Date-Specific Task Log Export Area */}
      {role !== "staff" && (
        <div className="bg-black/35 border border-slate-800 rounded-xl p-6 mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800 gap-3">
            <div className="space-y-0.5 text-left">
              <h4 className="font-serif text-base tracking-wider text-amber-500 font-semibold flex items-center gap-2">
                <Calendar size={18} /> Download date-specific task log
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Select date range to compile and extract direct operational task records in PDF or CSV formats
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadCsv}
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-bold transition scale-95 hover:scale-100 flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} /> Extract CSV log
              </button>
              <button
                onClick={downloadPdf}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold transition scale-95 hover:scale-100 flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} /> Compile PDF log
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5 bg-slate-950/20 p-4 rounded-lg border border-slate-900 text-left">
              <label className="font-mono text-slate-400 text-[10px] font-bold tracking-wider">Date from (UTC)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
            <div className="flex flex-col space-y-1.5 bg-slate-950/20 p-4 rounded-lg border border-slate-900 text-left">
              <label className="font-mono text-slate-400 text-[10px] font-bold tracking-wider">Date to (UTC)</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
          </div>

          {/* Mini Preview Summary */}
          <div className="text-[10px] font-mono text-slate-500 text-right">
            Total task entries matching criteria: <span className="text-amber-400 font-bold">{filteredTasksForExport.length} entries</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- BULK UPLOAD SCHEMAS & TEMPLATES ---
const PROMO_TEMPLATE = [
  {
    "title": "Sunset Rooftop Champagne Tasting",
    "paragraph": "Unwind with our curated flight of premium local Cap Classique champagnes, paired with artisanal oysters and high-altitude Johannesburg skylines.",
    "image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80",
    "cta_text": "Book Cocktail Lounge",
    "cta_url": "https://www.sandtonhotel.com/rooftop"
  }
];

const FACILITY_TEMPLATE = [
  {
    "title": "Zen Hydrotherapy Gardens",
    "description": "Temperature-controlled thermal mineral spa pools, deep forest steam rooms, and relaxing sound baths for full muscle recovery.",
    "category": "Wellness",
    "image_url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80"
  },
  {
    "title": "Executive Squash Courts",
    "description": "Double high-ceiling modern squash courts equipped with pro-grade rackets and booking availability for private lessons.",
    "category": "Fitness",
    "image_url": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80"
  }
];

const RESTAURANT_TEMPLATE = [
  {
    "title": "The Amber Greenhouse",
    "description": "Botanical-inspired glasshouse offering garden-to-table culinary creations, rare fine wines, and signature slow-cooked meats.",
    "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
    "cta_enabled": true,
    "cta_text": "Reserve Glasshouse Table",
    "cta_url": "https://www.sandtonhotel.com/amber",
    "subsections": [
      {
        "title": "Daily Service Hours",
        "timings": [
          { "name": "Breakfast Tier", "openTime": "06:30", "closeTime": "10:30" },
          { "name": "Sunset Dining", "openTime": "18:00", "closeTime": "22:30" }
        ]
      }
    ]
  }
];

const RECO_TEMPLATE = [
  {
    "title": "Pilanesberg Wildlife Safari Guided Tour",
    "paragraph": "Embark on an exclusive day-trip game drive through an ancient volcanic crater hosting the Big Five, just a two-hour luxury transfer from Sandton.",
    "image_url": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80",
    "cta_text": "Schedule Private Safari",
    "cta_url": "https://www.apartheidmuseum.org/",
    "is_featured": true
  }
];

// --- 5. CMS EDITING TABS (Promotions, Facilities, Restaurants) ---
export function CmsView({
  promotions,
  facilities,
  restaurants,
  recos = [],
  initialSubTab,
  allowRecosSubTab = false,
  onRefresh
}: {
  promotions: any[];
  facilities: any[];
  restaurants: any[];
  recos?: any[];
  initialSubTab?: "promotions" | "facilities" | "restaurants" | "recos" | "bulk_upload";
  allowRecosSubTab?: boolean;
  onRefresh: () => void;
}) {
  const [subTab, setSubTab] = useState<"promotions" | "facilities" | "restaurants" | "recos" | "bulk_upload">(((initialSubTab === "recos" && !allowRecosSubTab) ? "promotions" : initialSubTab) || "promotions");

  useEffect(() => {
    if (initialSubTab) {
      setSubTab((initialSubTab === "recos" && !allowRecosSubTab) ? "promotions" : initialSubTab);
    }
  }, [initialSubTab, allowRecosSubTab]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  // Custom Delete Confirm Dialog state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; title: string } | null>(null);

  // Bulk Upload Panel states (File oriented)
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUrl, setBulkUrl] = useState("");
  const [bulkOverwriteConfirm, setBulkOverwriteConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [bulkIsLoading, setBulkIsLoading] = useState(false);
  const [bulkUrlIsLoading, setBulkUrlIsLoading] = useState(false);

  // Form states
  const [promoTitle, setPromoTitle] = useState("");
  const [promoParagraph, setPromoParagraph] = useState("");
  const [promoImage, setPromoImage] = useState("");
  const [promoCtaText, setPromoCtaText] = useState("");
  const [promoCtaUrl, setPromoCtaUrl] = useState("");

  const [facTitle, setFacTitle] = useState("");
  const [facDesc, setFacDesc] = useState("");
  const [facCategory, setFacCategory] = useState("General");
  const [facImage, setFacImage] = useState("");

  const [restTitle, setRestTitle] = useState("");
  const [restDesc, setRestDesc] = useState("");
  const [restImage, setRestImage] = useState("");
  const [restCtaEnabled, setRestCtaEnabled] = useState(false);
  const [restCtaText, setRestCtaText] = useState("");
  const [restCtaUrl, setRestCtaUrl] = useState("");

  // Recos state
  const [recoTitle, setRecoTitle] = useState("");
  const [recoParagraph, setRecoParagraph] = useState("");
  const [recoImage, setRecoImage] = useState("");
  const [recoCtaText, setRecoCtaText] = useState("");
  const [recoCtaUrl, setRecoCtaUrl] = useState("");
  const [recoIsFeatured, setRecoIsFeatured] = useState(true);

  // Subsections form (Nested list builder)
  const [subSections, setSubSections] = useState<any[]>([]);

  // Open modal for adding/editing
  const handleOpenModal = (item?: any) => {
    setEditItem(item || null);
    if (subTab === "promotions") {
      setPromoTitle(item ? item.title : "");
      setPromoParagraph(item ? item.paragraph : "");
      setPromoImage(item ? item.image_url : "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80");
      setPromoCtaText(item ? item.cta_text : "Discover More");
      setPromoCtaUrl(item ? item.cta_url : "");
    } else if (subTab === "facilities") {
      setFacTitle(item ? item.title : "");
      setFacDesc(item ? item.description : "");
      setFacCategory(item ? item.category : "General");
      setFacImage(item ? item.image_url : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80");
    } else if (subTab === "restaurants") {
      setRestTitle(item ? item.title : "");
      setRestDesc(item ? item.description : "");
      setRestImage(item ? item.image_url : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80");
      setRestCtaEnabled(item ? !!item.cta_enabled : false);
      setRestCtaText(item ? item.cta_text : "Book A Table");
      setRestCtaUrl(item ? item.cta_url : "");
      setSubSections(item && item.subsections ? JSON.parse(JSON.stringify(item.subsections)) : [
        { title: "Weekly Timings", timings: [{ name: "Lunch Hours", openTime: "12:00", closeTime: "15:00" }] }
      ]);
    } else if (subTab === "recos") {
      setRecoTitle(item ? item.title : "");
      setRecoParagraph(item ? item.paragraph : "");
      setRecoImage(item ? item.image_url : "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80");
      setRecoCtaText(item ? item.cta_text : "More Info");
      setRecoCtaUrl(item ? item.cta_url : "");
      setRecoIsFeatured(item ? !!item.is_featured : true);
    }
    setShowModal(true);
  };

  // Submit operations (supports both Create and Update editing methods)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = `/api/${subTab}${editItem ? `/${editItem.id}` : ""}`;
    const method = editItem ? "PUT" : "POST";
    
    let payload: any = {};
    if (subTab === "promotions") {
      payload = { title: promoTitle, paragraph: promoParagraph, image_url: promoImage, cta_text: promoCtaText, cta_url: promoCtaUrl };
    } else if (subTab === "facilities") {
      payload = { title: facTitle, description: facDesc, category: facCategory, image_url: facImage };
    } else if (subTab === "restaurants") {
      payload = { title: restTitle, description: restDesc, image_url: restImage, cta_enabled: restCtaEnabled, cta_text: restCtaText, cta_url: restCtaUrl, subsections: subSections };
    } else if (subTab === "recos") {
      payload = { title: recoTitle, paragraph: recoParagraph, image_url: recoImage, cta_text: recoCtaText, cta_url: recoCtaUrl, is_featured: recoIsFeatured };
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initiate custom popup delete confirm channel
  const handleDeleteClick = (itemId: string, itemTitle: string) => {
    setDeleteConfirmItem({ id: itemId, title: itemTitle });
  };

  // Reorder/move recommendation cards
  const handleMove = async (id: string, direction: "up" | "down") => {
    try {
      const res = await fetch(`/api/recos/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to reorder recommendation:", err);
    }
  };

  // Execute actual CMS absolute deletion backend request
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await fetch(`/api/${subTab}/${deleteConfirmItem.id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Subsections helpers
  const handleAddSubsection = () => {
    setSubSections([...subSections, { title: "New Subsection", timings: [{ name: "Opening Hours", openTime: "08:00", closeTime: "22:00" }] }]);
  };

  const handleUpdateSubsectionTitle = (subIdx: number, title: string) => {
    const updated = [...subSections];
    updated[subIdx].title = title;
    setSubSections(updated);
  };

  const handleAddTiming = (subIdx: number) => {
    const updated = [...subSections];
    updated[subIdx].timings.push({ name: "Detail Hours", openTime: "09:00", closeTime: "21:00" });
    setSubSections(updated);
  };

  const handleUpdateTiming = (subIdx: number, timingIdx: number, field: string, value: string) => {
    const updated = [...subSections];
    updated[subIdx].timings[timingIdx][field] = value;
    setSubSections(updated);
  };

  const handleRemoveTiming = (subIdx: number, timingIdx: number) => {
    const updated = [...subSections];
    updated[subIdx].timings.splice(timingIdx, 1);
    setSubSections(updated);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs line */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1.5 pb-2">
        <button
          onClick={() => setSubTab("promotions")}
          className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-medium tracking-wide transition-all cursor-pointer ${
            subTab === "promotions"
              ? "bg-amber-500 text-slate-950 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          id="promo-cms-tab"
        >
          Promotions (Slides)
        </button>
        <button
          onClick={() => setSubTab("facilities")}
          className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-medium tracking-wide transition-all cursor-pointer ${
            subTab === "facilities"
              ? "bg-amber-500 text-slate-950 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          id="fac-cms-tab"
        >
          Facilities (Explorer)
        </button>
        <button
          onClick={() => setSubTab("restaurants")}
          className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-medium tracking-wide transition-all cursor-pointer ${
            subTab === "restaurants"
              ? "bg-amber-500 text-slate-950 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          id="rest-cms-tab"
        >
          Restaurants (Dining Hub)
        </button>
        {(allowRecosSubTab || subTab === "recos") && (
          <button
            onClick={() => setSubTab("recos")}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-medium tracking-wide transition-all cursor-pointer ${
              subTab === "recos"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            id="reco-cms-tab"
          >
            Joburg Recommendations (Discovery)
          </button>
        )}
        <button
          onClick={() => setSubTab("bulk_upload")}
          className={`py-1.5 px-3.5 rounded-lg text-xs font-mono font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === "bulk_upload"
              ? "bg-amber-500 text-slate-950 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          id="bulk-upload-cms-tab"
        >
          <Upload size={11} /> Bulk Upload & Guide
        </button>
      </div>

      <div className="flex justify-between items-center bg-slate-950/20 p-4 border border-slate-800 rounded-xl">
        <div>
          <h4 className="text-sm font-semibold capitalize text-slate-100">
            {subTab === "bulk_upload" ? "Dynamic Knowledge Base Bulk Upload" : `${subTab} Administration`}
          </h4>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            {subTab === "bulk_upload"
              ? "Instantly ingest large structured JSON assets, or browse the interactive guest front-end data schemas."
              : "Edit, add, or absolute-delete content assets instantly connected overlay components."}
          </p>
        </div>
        {subTab !== "bulk_upload" && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-sm"
            id="btn-cms-create"
          >
            <Plus size={14} /> Add New Listing
          </button>
        )}
      </div>

      {/* Grid of Listings */}
      {subTab !== "bulk_upload" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="cms-items-grid">
          {subTab === "promotions" &&
            promotions.map((p) => (
              <div key={p.id} className="bg-black/35 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between p-4 space-y-3">
                <div className="space-y-2">
                  <img src={p.image_url} alt="" className="w-full h-32 object-cover rounded" />
                  <h5 className="font-bold text-slate-100 text-sm font-sans">{p.title}</h5>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{p.paragraph}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                  <span className="text-[10px] font-mono text-amber-500">{p.cta_text}</span>
                  <div className="flex space-x-1.5">
                    <button onClick={() => handleOpenModal(p)} className="p-1 px-2 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-400/40 rounded transition-all cursor-pointer">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteClick(p.id, p.title)} className="p-1 px-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-400/40 rounded transition-all cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {subTab === "facilities" &&
            facilities.map((f) => (
              <div key={f.id} className="bg-black/35 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between p-4 space-y-3">
                <div className="space-y-2">
                  <img src={f.image_url} alt="" className="w-full h-32 object-cover rounded" />
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-slate-100 text-sm font-sans">{f.title}</h5>
                    <span className="text-[9px] bg-slate-800/80 text-amber-400 border border-slate-700 font-mono px-2 py-0.5 rounded-full uppercase">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{f.description}</p>
                </div>
                <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-800/40">
                  <button onClick={() => handleOpenModal(f)} className="p-1 px-2 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-400/40 rounded transition-all cursor-pointer">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteClick(f.id, f.title)} className="p-1 px-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-400/40 rounded transition-all cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

          {subTab === "restaurants" &&
            restaurants.map((r) => (
              <div key={r.id} className="bg-black/35 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between p-4 space-y-3">
                <div className="space-y-2">
                  <img src={r.image_url} alt="" className="w-full h-32 object-cover rounded" />
                  <h5 className="font-bold text-slate-100 text-sm font-sans">{r.title}</h5>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{r.description}</p>
                  {r.subsections && (
                    <div className="p-2 bg-slate-950/40 border border-slate-800/40 rounded space-y-1 mt-2">
                      {r.subsections.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className="text-[10px] font-mono">
                          <p className="font-bold text-amber-500 uppercase">{sub.title}</p>
                          {sub.timings?.map((time: any, tIdx: number) => (
                            <p key={tIdx} className="text-slate-400">{time.name}: {time.openTime} - {time.closeTime}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-800/40">
                  <button onClick={() => handleOpenModal(r)} className="p-1 px-2 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-400/40 rounded transition-all cursor-pointer">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteClick(r.id, r.title)} className="p-1 px-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-400/40 rounded transition-all cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

          {subTab === "recos" &&
            recos.map((reco: any, idx: number) => (
              <div key={reco.id} className="bg-black/35 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between p-4 space-y-3">
                <div className="space-y-2">
                  <img src={reco.image_url} alt="" className="w-full h-32 object-cover rounded" />
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-slate-100 text-sm font-sans">{reco.title}</h5>
                    {reco.is_featured && (
                      <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-900/40 font-mono px-2 py-0.5 rounded-full uppercase">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{reco.paragraph}</p>
                  {reco.cta_url && (
                    <div className="text-[10px] text-slate-400 truncate">
                      <span className="font-bold text-slate-500 font-mono">LINK: </span>
                      <a href={reco.cta_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">{reco.cta_url}</a>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                  <span className="text-[10px] font-mono text-amber-500">{reco.cta_text || "More Info"}</span>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleMove(reco.id, "up")}
                      disabled={idx === 0}
                      className="p-1 px-2 text-slate-400 hover:text-[#cca472] border border-slate-800 hover:border-[#cca472]/40 rounded transition-all cursor-pointer disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:border-slate-800"
                      title="Move Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMove(reco.id, "down")}
                      disabled={idx === recos.length - 1}
                      className="p-1 px-2 text-slate-400 hover:text-[#cca472] border border-slate-800 hover:border-[#cca472]/40 rounded transition-all cursor-pointer disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:border-slate-800"
                      title="Move Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button onClick={() => handleOpenModal(reco)} className="p-1 px-2 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-400/40 rounded transition-all cursor-pointer">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteClick(reco.id, reco.title)} className="p-1 px-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-400/40 rounded transition-all cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* BULK UPLOAD SUB VIEW & GUIDE */}
      {subTab === "bulk_upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-sans text-slate-300" id="bulk-upload-dashboard">
          {/* Left column: Controls */}
          <div className="lg:col-span-5 bg-black/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <h5 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#E6C687] font-serif tracking-wide pb-1 border-b border-slate-800">
              Bulk Knowledge Loader
            </h5>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
              Upload a hotel brochure, restaurant menu, guest services catalog, or operations list (PDF, DOC/DOCX, or TXT format). 
              Our service parses the content using Google Gemini AI, extracts promotions, facilities, and restaurants, and automatically synchronises them.
            </p>

            {/* DOWNLOAD TEMPLATE PDF CARD */}
            <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-medium text-[11px] font-mono">
                <FileText size={14} className="text-amber-400 shrink-0" />
                <span>AI Ingestion Specification Template</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Get an official PDF guide showing required fields, category criteria, and a ready-to-test sample brochure text. Download, edit, and re-upload to test!
              </p>
              <button
                type="button"
                onClick={() => generateSpecPDF()}
                className="w-full bg-slate-900/60 hover:bg-slate-850 text-amber-400 border border-amber-500/30 hover:border-amber-400 font-mono text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download size={11} /> DOWNLOAD DESIGN GUIDELINE PDF
              </button>
            </div>

            {/* OPTION A: WEB URL DEEP INGEST */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-slate-400 text-amber-400/80 font-bold">Option A: Extract From Website URL</label>
                <span className="text-[9px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">AI Web Sync</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="url"
                  placeholder="e.g. https://lhorizonestate.com/dining"
                  value={bulkUrl}
                  onChange={(e) => {
                    setBulkUrl(e.target.value);
                    setBulkError(null);
                    setBulkSuccess(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pr-28 font-mono text-[11px] placeholder-slate-650 text-amber-100 focus:border-amber-400 focus:ring-0 outline-none transition-all"
                />
                <button
                  type="button"
                  disabled={bulkUrlIsLoading || bulkIsLoading || !bulkUrl.trim() || !bulkUrl.startsWith('http')}
                  onClick={async () => {
                    if (!bulkUrl.trim()) return;
                    if (!bulkUrl.startsWith("http")) {
                      setBulkError("Your URL must be fully-qualified and start with http:// or https://");
                      return;
                    }
                    if (!bulkOverwriteConfirm) {
                      setBulkError("Your explicit overwrite confirmation checkbox is strictly required to run bulk ingestion.");
                      return;
                    }

                    setBulkUrlIsLoading(true);
                    setBulkError(null);
                    setBulkSuccess(null);

                    try {
                      const res = await fetch("/api/admin/bulk-upload-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          url: bulkUrl.trim(),
                          overwrite: bulkOverwriteConfirm
                        })
                      });

                      const val = await res.json();
                      if (!res.ok || !val.success) {
                        throw new Error(val.error || "Failed web crawling and synchronisation.");
                      }

                      setBulkSuccess(
                        `Web sync completed! Extracted and synced: ${val.extractedCount.promotions} promotions, ${val.extractedCount.facilities} facilities, and ${val.extractedCount.restaurants} restaurants onto live directories.`
                      );
                      setBulkUrl("");
                      setBulkOverwriteConfirm(false);
                      onRefresh();
                    } catch (err: any) {
                      setBulkError(err.message || "An exception occurred during web crawling verification.");
                    } finally {
                      setBulkUrlIsLoading(false);
                    }
                  }}
                  className="absolute right-1 text-slate-350 hover:text-amber-400 disabled:opacity-40 font-mono text-[9px] h-7 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
                >
                  {bulkUrlIsLoading ? (
                    <>
                      <RefreshCw size={10} className="animate-spin text-amber-500" />
                      <span>CRAWLING...</span>
                    </>
                  ) : (
                    <>
                      <Globe size={10} />
                      <span>INGEST URL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic">Provide a public URL of a spa page, dining menu, or hotel brochure.</p>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-slate-800/80 grow" />
              <span className="font-mono text-[9px] text-slate-500 uppercase">OR</span>
              <div className="h-px bg-slate-800/80 grow" />
            </div>

            {/* DRAG AND DROP ZONE */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-slate-400 text-amber-400/80 font-bold">Option B: Select Document File</label>
              
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
                      setBulkFile(file);
                      setBulkError(null);
                      setBulkSuccess(null);
                    } else {
                      setBulkError("Unsupported file format. Please upload a PDF, DOC, DOCX, or TXT file.");
                    }
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isDragging 
                    ? "border-amber-400 bg-amber-500/10" 
                    : bulkFile
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                }`}
                onClick={() => document.getElementById("bulk-file-input")?.click()}
              >
                <input
                  type="file"
                  id="bulk-file-input"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBulkFile(e.target.files[0]);
                      setBulkError(null);
                      setBulkSuccess(null);
                    }
                  }}
                />

                {bulkFile ? (
                  <>
                    <FileText size={28} className="text-emerald-400 animate-pulse" />
                    <p className="font-semibold text-slate-200 max-w-[200px] truncate">{bulkFile.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(bulkFile.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-slate-500" />
                    <p className="font-semibold text-slate-300">Drag & drop your brochure here</p>
                    <p className="text-[10px] text-slate-500 font-mono">or click to browse local files</p>
                    <p className="text-[9px] text-amber-500/70 select-none bg-amber-950/10 border border-amber-900/20 px-2 py-0.5 rounded mt-1 font-mono uppercase">
                      Supports PDF, DOCX, DOC, TXT
                    </p>
                  </>
                )}
              </div>

              {bulkFile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBulkFile(null);
                      setBulkError(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-red-400 underline font-mono cursor-pointer transition-colors"
                  >
                    Clear Selected File
                  </button>
                </div>
              )}
            </div>

            {/* OVERWRITE DIRECTIVE & CONFIRMATION CHECKBOX */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="bulk-overwrite-confirm"
                  checked={bulkOverwriteConfirm}
                  onChange={(e) => {
                    setBulkOverwriteConfirm(e.target.checked);
                    setBulkError(null);
                  }}
                  className="mt-0.5 rounded border-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 w-3.5 h-3.5 cursor-pointer"
                />
                <label 
                  htmlFor="bulk-overwrite-confirm" 
                  className="font-mono text-[10px] text-slate-300 leading-normal select-none cursor-pointer"
                >
                  I confirm and authorize the AI to <span className="text-amber-400 font-bold underline">completely overwrite</span> all current Promotions, Facilities Explorer, and Restaurant locations inside the live directory.
                </label>
              </div>
            </div>

            {bulkError && (
              <div className="p-3 bg-red-950/35 border border-red-900/35 rounded-lg flex items-start gap-2 text-red-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span className="font-mono text-[10px] leading-relaxed">{bulkError}</span>
              </div>
            )}

            {bulkSuccess && (
              <div className="p-3 bg-emerald-950/35 border border-emerald-900/35 rounded-lg flex items-start gap-2 text-emerald-200">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-mono text-[10px] font-bold block mb-1">Upload Successful!</span>
                  <span className="font-mono text-[10px] leading-relaxed">{bulkSuccess}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={bulkIsLoading || !bulkFile}
              onClick={async () => {
                if (!bulkFile) return;
                if (!bulkOverwriteConfirm) {
                  setBulkError("Your explicit overwrite confirmation checkbox is strictly required to run bulk ingestion.");
                  return;
                }

                setBulkIsLoading(true);
                setBulkError(null);
                setBulkSuccess(null);

                try {
                  const reader = new FileReader();
                  
                  const fileDataPromise = new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
                    reader.onload = () => {
                      const result = reader.result as string;
                      const commaIndex = result.indexOf(",");
                      const base64 = result.substring(commaIndex + 1);
                      let mimeType = bulkFile.type;
                      
                      if (!mimeType) {
                        const ext = bulkFile.name.split('.').pop()?.toLowerCase();
                        if (ext === 'pdf') mimeType = 'application/pdf';
                        else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        else if (ext === 'doc') mimeType = 'application/msword';
                        else mimeType = 'text/plain';
                      }
                      
                      resolve({ base64, mimeType });
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(bulkFile);
                  });

                  const fileObj = await fileDataPromise;

                  const res = await fetch("/api/admin/bulk-upload-document", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fileData: fileObj.base64,
                      fileType: fileObj.mimeType,
                      fileName: bulkFile.name,
                      overwrite: bulkOverwriteConfirm
                    })
                  });

                  const val = await res.json();
                  if (!res.ok || !val.success) {
                    throw new Error(val.error || "Failed brochure bulk synchronisation.");
                  }

                  setBulkSuccess(
                    `Inflow completed successfully! Extracted and synced onto live hotel structures: ${val.extractedCount.promotions} promotions, ${val.extractedCount.facilities} facilities, and ${val.extractedCount.restaurants} restaurants.`
                  );
                  setBulkFile(null);
                  setBulkOverwriteConfirm(false);
                  onRefresh();
                } catch (err: any) {
                  setBulkError(err.message || "An exception occurred during verification.");
                } finally {
                  setBulkIsLoading(false);
                }
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-[#E6C687] text-slate-950 hover:bg-opacity-90 font-serif font-bold tracking-widest py-2.5 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 animate-pulse"
            >
              {bulkIsLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-slate-950" />
                  <span>AI EXTRACTING DOCUMENT...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>EXTRACT & OVERWRITE DIRECTORY</span>
                </>
              )}
            </button>
          </div>

          {/* Right column: Interactive Guide & Live Stats */}
          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4 font-sans">
            <h5 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#E6C687] font-serif tracking-wide pb-1 border-b border-slate-800 flex items-center justify-between">
              <span>Directory Ingestion Guidelines</span>
              <span className="font-mono text-[9px] text-slate-400 border border-slate-800 px-2 py-0.5 rounded uppercase font-normal">Active Count</span>
            </h5>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To guarantee optimal AI parsing, ensure your uploaded directory brochure PDF or document lists services with these key sections:
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/25 border border-slate-800/60 rounded-lg p-3 text-center">
                <span className="text-base block mb-0.5">🎨</span>
                <span className="text-[10px] text-slate-400 block font-mono">Promotions</span>
                <span className="text-sm font-bold text-amber-500 block mt-0.5">{promotions.length} active</span>
              </div>
              <div className="bg-black/25 border border-slate-800/60 rounded-lg p-3 text-center">
                <span className="text-base block mb-0.5">🏋️‍♂️</span>
                <span className="text-[10px] text-slate-400 block font-mono">Facilities</span>
                <span className="text-sm font-bold text-amber-500 block mt-0.5">{facilities.length} active</span>
              </div>
              <div className="bg-black/25 border border-slate-800/60 rounded-lg p-3 text-center">
                <span className="text-base block mb-0.5">🍽️</span>
                <span className="text-[10px] text-slate-400 block font-mono">Restaurants</span>
                <span className="text-sm font-bold text-amber-500 block mt-0.5">{restaurants.length} active</span>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2" id="schema-guide-accordion">
              <div className="p-3 bg-black/20 border border-slate-800/80 rounded-xl transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <span className="text-base">📅</span>
                  <span>Promotions Extractor</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The model extracts special spa experiences, dining events, pool package discounts or active packages. It formulates title copy, description copy, CTA labels, and locates realistic high-quality backdrop photos.
                </p>
              </div>

              <div className="p-3 bg-black/20 border border-slate-800/80 rounded-xl transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <span className="text-base">🏨</span>
                  <span>Facilities Extractor</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The model extracts physical rooms, lounge chambers, squash courts or business centers, matching them to three sub-tabs: <strong>Wellness</strong>, <strong>Fitness</strong>, or <strong>General</strong>.
                </p>
              </div>

              <div className="p-3 bg-black/20 border border-slate-800/80 rounded-xl transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <span className="text-base">🍲</span>
                  <span>Restaurants & Dining Timings</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  The model maps complete dining spots, cuisines, and operating hours (including separate breakfast, lunch, or dinner slot timings in standard HH:MM format).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM POPUP DELETE CONFIRM OVERLAY */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-confirm-popup">
          <div className="bg-[#0F172A] border border-red-500/30 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
            <button
              onClick={() => setDeleteConfirmItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-950/40 border border-red-900/40 text-red-400 mx-auto mb-4 scale-110">
              <Trash2 size={20} />
            </div>

            <h4 className="text-base font-serif font-bold text-slate-100 text-center pb-2">
              Absolute Delete Element?
            </h4>
            
            <p className="text-xs text-slate-400 font-normal leading-relaxed text-center mb-5 font-sans">
              Are you sure you want to permanently delete the listing <strong className="text-slate-200">"{deleteConfirmItem.title}"</strong>? This operation cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-mono py-2 rounded-xl text-xs transition-all cursor-pointer text-center font-bold"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-mono py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-lg shadow-red-600/10"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-[rgba(184,134,11,0.25)] w-full max-w-lg rounded-2xl p-6 relative max-h-[85vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h4 className="text-base font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#E6C687] pb-2 border-b border-slate-800 col-title">
              {editItem ? "Edit existing" : "Create new"} {subTab}
            </h4>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-sans">
              {subTab === "promotions" && (
                <>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Promotion Header Title</label>
                    <input type="text" required value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Description Paragraph</label>
                    <textarea rows={3} required value={promoParagraph} onChange={(e) => setPromoParagraph(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Featured Backdrop URL</label>
                    <input type="text" required value={promoImage} onChange={(e) => setPromoImage(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="font-mono text-slate-400">CTA Label Link</label>
                      <input type="text" required value={promoCtaText} onChange={(e) => setPromoCtaText(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-mono text-slate-400">CTA External Destination (HTTP)</label>
                      <input type="text" value={promoCtaUrl} onChange={(e) => setPromoCtaUrl(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                    </div>
                  </div>
                </>
              )}

              {subTab === "facilities" && (
                <>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Facility Title</label>
                    <input type="text" required value={facTitle} onChange={(e) => setFacTitle(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Facility Description Summary</label>
                    <textarea rows={3} required value={facDesc} onChange={(e) => setFacDesc(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="font-mono text-slate-400">Section Group Category</label>
                      <select value={facCategory} onChange={(e) => setFacCategory(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400">
                        <option value="Wellness">Wellness Spa</option>
                        <option value="Fitness">Fitness Gym</option>
                        <option value="General">General / Other</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-mono text-slate-400">Image Asset URL</label>
                      <input type="text" required value={facImage} onChange={(e) => setFacImage(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                    </div>
                  </div>
                </>
              )}

              {subTab === "restaurants" && (
                <>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Dining Establishment Title</label>
                    <input type="text" required value={restTitle} onChange={(e) => setRestTitle(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Epicurean Description Summary</label>
                    <textarea rows={2} required value={restDesc} onChange={(e) => setRestDesc(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Backdrop Media Image URL</label>
                    <input type="text" required value={restImage} onChange={(e) => setRestImage(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center bg-black/30 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setRestCtaEnabled(!restCtaEnabled)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                          restCtaEnabled ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            restCtaEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <label className="font-mono text-[10px] text-slate-300 select-none">CTA Enable</label>
                    </div>
                    <input type="text" placeholder="CTA label" value={restCtaText} onChange={(e) => setRestCtaText(e.target.value)} disabled={!restCtaEnabled} className="bg-slate-900 border border-slate-850 rounded p-1 text-xs focus:border-amber-400 text-slate-300 disabled:opacity-40" />
                    <input type="text" placeholder="CTA URL link" value={restCtaUrl} onChange={(e) => setRestCtaUrl(e.target.value)} disabled={!restCtaEnabled} className="bg-slate-900 border border-slate-850 rounded p-1 text-xs focus:border-amber-400 text-slate-300 disabled:opacity-40" />
                  </div>

                  {/* NESTED SUBSECTIONS TIMINGS BUILDER */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                      <span className="font-mono font-bold text-slate-400">Epicurean Operating Timing Subsections</span>
                      <button type="button" onClick={handleAddSubsection} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1 rounded border border-slate-700 cursor-pointer">
                        Add Section +
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
                      {subSections.map((sub, sIdx) => (
                        <div key={sIdx} className="p-3 bg-black/40 border border-slate-850 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => handleUpdateSubsectionTitle(sIdx, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs p-1 rounded w-1/2"
                              placeholder="Title (e.g., Dinner Timing)"
                            />
                            <button type="button" onClick={() => handleAddTiming(sIdx)} className="text-[10px] text-slate-400 hover:text-amber-400 font-mono">
                              + Timing Row
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {sub.timings?.map((time: any, tIdx: number) => (
                              <div key={tIdx} className="grid grid-cols-4 gap-1.5 items-center">
                                <input
                                  type="text"
                                  value={time.name}
                                  placeholder="e.g. Weekdays"
                                  onChange={(e) => handleUpdateTiming(sIdx, tIdx, "name", e.target.value)}
                                  className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] p-1 rounded"
                                />
                                <input
                                  type="text"
                                  value={time.openTime}
                                  placeholder="08:00"
                                  onChange={(e) => handleUpdateTiming(sIdx, tIdx, "openTime", e.target.value)}
                                  className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] p-1 rounded text-center"
                                />
                                <input
                                  type="text"
                                  value={time.closeTime}
                                  placeholder="22:00"
                                  onChange={(e) => handleUpdateTiming(sIdx, tIdx, "closeTime", e.target.value)}
                                  className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] p-1 rounded text-center"
                                />
                                <button type="button" onClick={() => handleRemoveTiming(sIdx, tIdx)} className="text-red-400 text-center hover:text-red-300 font-mono">
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {subTab === "recos" && (
                <>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Recommendation Title</label>
                    <input type="text" required value={recoTitle} onChange={(e) => setRecoTitle(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Description / Paragraph</label>
                    <textarea rows={3} required value={recoParagraph} onChange={(e) => setRecoParagraph(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-slate-400">Image URL</label>
                    <input type="text" required value={recoImage} onChange={(e) => setRecoImage(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="font-mono text-slate-400">CTA Button Text</label>
                      <input type="text" required value={recoCtaText} onChange={(e) => setRecoCtaText(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="font-mono text-slate-400">CTA External Link (HTTP/Maps)</label>
                      <input type="text" value={recoCtaUrl} onChange={(e) => setRecoCtaUrl(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs focus:border-amber-400" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pt-3">
                    <button
                      type="button"
                      id="reco-is-featured-switch"
                      onClick={() => setRecoIsFeatured(!recoIsFeatured)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                        recoIsFeatured ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          recoIsFeatured ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <label htmlFor="reco-is-featured-switch" className="font-mono text-xs text-slate-300 select-none cursor-pointer">Feature on top recommendation slot</label>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-[#E6C687] text-slate-950 hover:bg-opacity-90 font-serif tracking-widest font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/15"
              >
                SAVE DETAILS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 6. STAFF REGISTRY CREATIVE CRUD ---
export function StaffRegistryView({
  staffList,
  onRefresh
}: {
  staffList: any[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  // Form bindings
  const [sName, setSName] = useState("");
  const [sWhatsapp, setSWhatsapp] = useState("");
  const [sRole, setSRole] = useState("staff");
  const [sUsername, setSUsername] = useState("");
  const [sPassword, setSPassword] = useState("");

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const [clearPassword, setClearPassword] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [clearStatus, setClearStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  const startClearDbFlow = () => {
    if (!clearPassword) {
      setClearStatus({ success: false, message: "Please enter the admin password first." });
      return;
    }
    if (clearPassword !== "ADMIN2025") {
      setClearStatus({ success: false, message: "Incorrect password." });
      return;
    }
    setClearStatus(null);
    setShowConfirmButton(true);
  };

  const handleClearDb = async () => {
    setClearLoading(true);
    setClearStatus(null);
    try {
      const res = await fetch("/api/admin/clear-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clearPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClearStatus({ success: true, message: "Purge complete! All active chats and tasks have been completely cleared." });
        setClearPassword("");
        setShowConfirmButton(false);
        onRefresh();
      } else {
        setClearStatus({ success: false, message: data.error || "Execution failed." });
      }
    } catch (err: any) {
      setClearStatus({ success: false, message: err.message || "Network request failed." });
    } finally {
      setClearLoading(false);
    }
  };

  const handleOpenModal = (item?: any) => {
    setEditItem(item || null);
    setSName(item ? item.name : "");
    setSWhatsapp(item ? item.whatsApp : "");
    setSRole(item ? item.role : "staff");
    setSUsername(item ? item.username : "");
    setSPassword(item ? item.password : "");
    setShowModal(true);
  };

  const togglePasswordReveal = (username: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = `/api/admin/staff${editItem ? `/${editItem.username}` : ""}`;
    const method = editItem ? "PUT" : "POST";
    const payload = { name: sName, whatsApp: sWhatsapp, role: sRole, username: sUsername, password: sPassword };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        onRefresh();
      } else {
        alert(data.error || "Staff authentication logic failure.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (username: string) => {
    if (!window.confirm("Absolute remove this operator from system directory?")) return;
    try {
      const res = await fetch(`/api/admin/staff/${username}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
          <UserCheck size={16} /> Directory staff registry & access credentials
        </h4>

        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus size={14} /> Register Staff
        </button>
      </div>

      <div className="overflow-x-auto bg-black/25 border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-mono text-[10px] tracking-wider">
              <th className="py-3 px-4">Operator full name</th>
              <th className="py-3 px-4">WhatsApp contact</th>
              <th className="py-3 px-4 text-center">System authority</th>
              <th className="py-3 px-4 text-center">Username name</th>
              <th className="py-3 px-4 text-center">Pass credentials</th>
              <th className="py-3 px-4 text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-sans">
            {staffList && Array.isArray(staffList) && staffList.filter(Boolean).map((s, idx) => {
              const rowKey = s.username ? `staff-${s.username}-${idx}` : `staff-fallback-${idx}`;
              return (
                <tr key={rowKey} className="hover:bg-slate-800/10 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-100">{s.name || s.username}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">{s.whatsApp || "(no contact)"}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-slate-800/70 border border-slate-700/60 dark-pill text-[10px] px-2 py-0.5 rounded-full font-mono text-amber-400">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono opacity-80">{s.username}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="font-mono text-slate-400">
                        {revealedPasswords[s.username] ? s.password : "••••••"}
                      </span>
                      <button
                        onClick={() => togglePasswordReveal(s.username)}
                        className="text-slate-500 hover:text-slate-200 cursor-pointer"
                      >
                        {revealedPasswords[s.username] ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleOpenModal(s)} className="p-1 text-slate-400 hover:text-amber-400 border border-slate-800 rounded transition-all cursor-pointer">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(s.username)} className="p-1 text-slate-400 hover:text-red-400 border border-slate-800 rounded transition-all cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-[rgba(184,134,11,0.25)] w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer">
              <X size={18} />
            </button>

            <h4 className="text-base font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#E6C687] pb-2 border-b border-slate-800 uppercase col-title">
              {editItem ? "Edit credentials" : "Enroll operator"}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-sans">
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-slate-400">Full Display Name</label>
                <input type="text" required value={sName} onChange={(e) => setSName(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-slate-400">WhatsApp Cell (+27...)</label>
                <input type="text" value={sWhatsapp} placeholder="+2782..." onChange={(e) => setSWhatsapp(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 font-mono text-[11px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-mono text-slate-400">System Role</label>
                  <select value={sRole} onChange={(e) => setSRole(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 text-xs">
                    <option value="staff">Staff Desk</option>
                    <option value="manager">duty Manager</option>
                    <option value="admin">Super Admin</option>
                    <option value="recos">recommendations</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-mono text-slate-400">Username Code</label>
                  <input type="text" required disabled={!!editItem} value={sUsername} onChange={(e) => setSUsername(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 disabled:opacity-50 font-mono" />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-slate-400">Account passkey password</label>
                <input type="password" required value={sPassword} onChange={(e) => setSPassword(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 font-mono" />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-[#E6C687] text-slate-950 font-serif tracking-widest font-bold py-2 rounded-xl transition-all cursor-pointer shadow"
              >
                SAVE IN REGISTER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Database Purge Cleanup Tool */}
      <div className="bg-rose-950/10 border border-rose-900/35 rounded-xl p-4 mt-6 text-left space-y-3">
        <div className="space-y-0.5">
          <h5 className="font-serif font-bold text-xs text-rose-400 uppercase tracking-wider">
            Database Cleanse & Purge System
          </h5>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Wipe all concierge chats and staff tasks to start from scratch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="password"
            value={clearPassword}
            onChange={(e) => setClearPassword(e.target.value)}
            placeholder="Enter password..."
            className="bg-black/40 border border-slate-800 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-sans max-w-xs"
          />
          {!showConfirmButton ? (
            <button
              type="button"
              onClick={startClearDbFlow}
              className="bg-rose-900/80 hover:bg-rose-805 text-rose-100 font-mono text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-lg transition-all border border-rose-800/40 cursor-pointer"
            >
              Wipe Concierge Chats & Tasks
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearDb}
                disabled={clearLoading}
                className="bg-red-650 hover:bg-red-600 text-white font-mono text-[10px] uppercase tracking-wider font-extrabold px-4 py-2 rounded-lg transition-all border border-red-500 cursor-pointer animate-pulse"
              >
                {clearLoading ? "Purging..." : "⚠️ CONFIRM DELETE (IRREVERSIBLE)"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmButton(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] px-3 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {clearStatus && (
          <p className={`text-[10px] font-mono ${clearStatus.success ? "text-emerald-400" : "text-rose-400"}`}>
            {clearStatus.message}
          </p>
        )}
      </div>
    </div>
  );
}

// --- 7. ALERTS CONTROL ROOM & EMERGENCY BROADCASTER ---
export function AlertsControlView({
  emergencyMode,
  config,
  onRefresh
}: {
  emergencyMode: boolean;
  config: any;
  onRefresh: () => void;
}) {
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientsList, setRecipientsList] = useState<string[]>([
    "Sibusiso Zulu (Duty Manager) - +27821234567",
    "Sandton Fire Response Hub - +27113755911",
    "Security Dispatch Desk - Rm 101"
  ]);

  const handleToggleEmergency = async () => {
    const nextState = !emergencyMode;
    if (!nextState) {
      alert("Emergency deactivation is secured. Please use the central validation banner at the top of the screen (by entering your name and confirming escalation) to securely deactivate the central alarm.");
      return;
    }
    const msg = "ATTENTION! Activating Emergency Mode will trigger notifications to all recipients. Proceed?";
    if (!window.confirm(msg)) return;

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergency: nextState })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientInput.trim()) return;
    setRecipientsList([...recipientsList, recipientInput.trim()]);
    setRecipientInput("");
  };

  const handleRemoveRecipient = (idx: number) => {
    setRecipientsList(recipientsList.filter((_, i) => i !== idx));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT: ALARM STATUS BLOCK */}
      <div className="bg-black/30 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-1.5">
          <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
            <Bell size={16} /> Central alarm dispatcher
          </h4>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Activating sandbox emergency lockdown triggers push notification broadcasts to guests.
          </p>
        </div>

        {/* Big Emergency trigger button */}
        <div className="text-center py-6">
          <button
            onClick={handleToggleEmergency}
            className={`cursor-pointer transition-all duration-300 w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 shadow-xl active:scale-95 ${
              emergencyMode
                ? "bg-red-700/80 border-red-400 text-white shadow-red-500/20 animate-pulse"
                : "bg-slate-900 border-slate-700 hover:border-red-650 hover:bg-red-950/20 text-red-500 shadow-slate-900/10"
            }`}
            id="emergency-broadcast-button"
          >
            <AlertTriangle size={36} className={`${emergencyMode ? "animate-bounce" : ""}`} />
            <span className="text-[10px] font-mono font-bold mt-2.5 tracking-widest leading-none">
              {emergencyMode ? "Alarm active" : "Activate"}
            </span>
          </button>
        </div>
      </div>

      {/* RIGHT: RECIPIENT ALERTS LOGS */}
      <div className="bg-black/30 border border-slate-800 rounded-xl p-6 flex flex-col space-y-4">
        <div>
          <h4 className="font-serif text-xs tracking-wider text-slate-300 font-bold col-title">
            📞 Emergency contact broadcast list
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">These individuals will immediately receive the emergency notification payload.</p>
        </div>

        <form onSubmit={handleAddRecipient} className="flex gap-2">
          <input
            type="text"
            placeholder="Recipient (e.g. Sibusiso Zulu - +2782...)"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-sans"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 shadow"
          >
            Add +
          </button>
        </form>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {recipientsList.map((rec, rIdx) => (
            <div key={rIdx} className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
              <span className="font-sans text-slate-300 font-medium">{rec}</span>
              <button
                onClick={() => handleRemoveRecipient(rIdx)}
                className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 8. GENERAL CONFIG SETTINGS TAB ---
export function GeneralSettingsView({
  config,
  tasks = [],
  feedbacks = [],
  chatMessages = [],
  recoInteractions = [],
  onRefresh,
  onConfigChange
}: {
  config: any;
  tasks?: any[];
  feedbacks?: any[];
  chatMessages?: any[];
  recoInteractions?: any[];
  onRefresh: () => void;
  onConfigChange?: (updatedFields: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);

  // Supabase API Diagnostics State
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    url: string;
    authStatus: string;
    authDetails: string;
    dbStatus: string;
    dbDetails: string;
    postgrestDetails: string;
    details: string;
    error?: string;
  } | null>(null);

  const testSupabaseConnectionAction = async () => {
    setTestLoading(true);
    setTestResult(null);

    const isConfigured = isSupabaseConfigured();
    const targetUrl = import.meta.env.VITE_SUPABASE_URL || "";

    if (!isConfigured) {
      setTestResult({
        success: false,
        url: targetUrl || "Not configured",
        authStatus: "Unconfigured",
        authDetails: "VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY is missing or unresolved.",
        dbStatus: "Unconfigured",
        dbDetails: "No connection attempted.",
        postgrestDetails: "Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on the client environment / .env configuration to engage Supabase.",
        details: "Supabase connection is not initialized. Please verify your environment variables."
      });
      setTestLoading(false);
      return;
    }

    try {
      // 1. GoTrue Handshake (Auth)
      let authSuccess = false;
      let authMessage = "";
      try {
        const { data: authData, error: authError } = await supabase!.auth.getSession();
        if (authError) {
          authSuccess = false;
          authMessage = `Auth Handshake Error: ${authError.message} (status: ${authError.status})`;
        } else {
          authSuccess = true;
          authMessage = "GoTrue API Responsive. Anonymous browser session handshake succeeded!";
        }
      } catch (ae: any) {
        authSuccess = false;
        authMessage = ae?.message || String(ae);
      }

      // 2. Postgrest Database queries Handshake
      let dbSuccess = false;
      let dbMessage = "";
      let postgrestDetails = "";
      try {
        // Query tasks table
        const { data: dbData, error: dbError, status: dbStatus } = await supabase!
          .from("tasks")
          .select("*")
          .limit(1);

        if (dbError) {
          if (dbError.code === "42P01") {
            // relation does not exist is STILL a successful API response (proves credentials and endpoint are working!)
            dbSuccess = true;
            dbMessage = "Postgrest API OK. Connection succeeded, but the 'tasks' table is not present in the schema yet.";
            postgrestDetails = "Your database, Postgrest proxy, and network are perfectly listening and authenticating! However, the 'tasks' table does not exist in your Postgres database schema. This is expected if tables haven't been migrated or created in Supabase yet.";
          } else {
            dbSuccess = false;
            dbMessage = `Failed: ${dbError.message} (Postgres Code: ${dbError.code || "None"})`;
            postgrestDetails = `API answered with HTTP status ${dbStatus}. This suggests a table schema or security rules policy (RLS) restricts access.`;
          }
        } else {
          dbSuccess = true;
          dbMessage = `Succeeded! Retrieved ${dbData?.length ?? 0} data items.`;
          postgrestDetails = "Standard select query executed successfully on the 'tasks' table and returned structured data.";
        }
      } catch (de: any) {
        dbSuccess = false;
        dbMessage = de?.message || String(de);
        postgrestDetails = "Unable to execute lookup on the Postgrest REST endpoint.";
      }

      const overallSuccess = authSuccess || dbSuccess;

      setTestResult({
        success: overallSuccess,
        url: targetUrl,
        authStatus: authSuccess ? "Connected" : "Error",
        authDetails: authMessage,
        dbStatus: dbSuccess ? "Connected" : "Alert",
        dbDetails: dbMessage,
        postgrestDetails,
        details: overallSuccess
          ? "Connection test succeeded! The Supabase endpoint answered our handshakes successfully."
          : "Connection check failed. Please inspect console logs or the specific status indicators below."
      });
    } catch (gErr: any) {
      setTestResult({
        success: false,
        url: targetUrl,
        authStatus: "Error",
        authDetails: "General client Exception",
        dbStatus: "Error",
        dbDetails: "General client Exception",
        postgrestDetails: "An unhandled exception occurred in the client during execution.",
        details: `Handshake crashed: ${gErr.message || gErr}`
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Helper date generators
  const getTodayString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [dateFrom, setDateFrom] = useState(getTodayString(-7));
  const [dateTo, setDateTo] = useState(getTodayString(0));

  const downloadChatLogsCsv = () => {
    const headers = ["Timestamp", "Room Number", "Role", "Sender Name", "Message/Content"];
    const rows = chatMessages.map(msg => [
      msg.timestamp ? (new Date(msg.timestamp).toString() !== "Invalid Date" ? new Date(msg.timestamp).toISOString() : msg.timestamp) : "",
      msg.roomNumber || "",
      msg.role || "",
      msg.senderName || "",
      msg.content || ""
    ]);
    const csvString = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sandton_chat_logs_${getTodayString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadFullBackupJson = () => {
    const backupObj = {
      exportedAt: new Date().toISOString(),
      masterConfig: config,
      tasks,
      feedbacks,
      chatMessages,
      recoInteractions
    };
    const dataStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sandton_master_full_backup_${getTodayString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const startTimestamp = new Date(dateFrom + "T00:00:00").getTime();
    const endTimestamp = new Date(dateTo + "T23:59:59").getTime();
    return tasks.filter(t => {
      const ts = t.createdAt || 0;
      return ts >= startTimestamp && ts <= endTimestamp;
    });
  }, [tasks, dateFrom, dateTo]);

  const handleForceSync = async () => {
    setSyncLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/resync", {
        method: "POST"
      });
      if (res.ok) {
        setSuccessMsg("In-memory state forced synced from Firestore successfully.");
        onRefresh();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const errJson = await res.json();
        setErrorMsg(errJson.error || "Failed to force sync from Firestore.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while connecting to the server.");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setSyncLoading(false);
    }
  };

  const [hotelName, setHotelName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [conciergeKb, setConciergeKb] = useState("");
  const [feedbackUrl, setFeedbackUrl] = useState("");
  const [nightshift, setNightshift] = useState(false);
  const [morningHours, setMorningHours] = useState("");
  const [afternoonHours, setAfternoonHours] = useState("");
  const [nightHours, setNightHours] = useState("");
  const [opHoursLimit, setOpHoursLimit] = useState(false);
  const [opHoursConstraint, setOpHoursConstraint] = useState("");

  const prevConfigRef = useRef<any>(null);

  const changeHotelName = (val: string) => {
    setHotelName(val);
    if (onConfigChange) onConfigChange({ hotelName: val });
  };
  const changeLogoUrl = (val: string) => {
    setLogoUrl(val);
    if (onConfigChange) onConfigChange({ logoUrl: val });
  };
  const changeConciergeKb = (val: string) => {
    setConciergeKb(val);
    if (onConfigChange) onConfigChange({ conciergeKb: val });
  };
  const changeFeedbackUrl = (val: string) => {
    setFeedbackUrl(val);
    if (onConfigChange) onConfigChange({ feedbackUrl: val });
  };
  const changeNightshift = (val: boolean) => {
    setNightshift(val);
    if (onConfigChange) onConfigChange({ nightshift: val });
  };
  const changeMorningHours = (val: string) => {
    setMorningHours(val);
    if (onConfigChange) onConfigChange({ opHoursMorning: val });
  };
  const changeAfternoonHours = (val: string) => {
    setAfternoonHours(val);
    if (onConfigChange) onConfigChange({ opHoursAfternoon: val });
  };
  const changeNightHours = (val: string) => {
    setNightHours(val);
    if (onConfigChange) onConfigChange({ opHoursNight: val });
  };
  const changeOpHoursLimit = (val: boolean) => {
    setOpHoursLimit(val);
    if (onConfigChange) onConfigChange({ opHoursLimitEnabled: val });
  };
  const changeOpHoursConstraint = (val: string) => {
    setOpHoursConstraint(val);
    if (onConfigChange) onConfigChange({ opHoursConstraint: val });
  };

  // Sync state with incoming config values
  useEffect(() => {
    if (config) {
      const prev = prevConfigRef.current;
      if (!prev) {
        setHotelName(config.hotelName || "Sandton Hotel");
        setLogoUrl(config.logoUrl || "");
        setConciergeKb(config.conciergeKb || "");
        setFeedbackUrl(config.feedbackUrl || "");
        setNightshift(!!config.nightshift);
        setMorningHours(config.opHoursMorning || "06:00 - 12:00");
        setAfternoonHours(config.opHoursAfternoon || "12:00 - 18:00");
        setNightHours(config.opHoursNight || "18:00 - 06:00");
        setOpHoursLimit(!!config.opHoursLimitEnabled);
        setOpHoursConstraint(config.opHoursConstraint || "Unlimited");
      } else {
        // Only update local input elements if the fields downloaded from server actually changed compared to prior sync
        if (config.hotelName !== prev.hotelName) {
          setHotelName(config.hotelName || "Sandton Hotel");
        }
        if (config.logoUrl !== prev.logoUrl) {
          setLogoUrl(config.logoUrl || "");
        }
        if (config.conciergeKb !== prev.conciergeKb) {
          setConciergeKb(config.conciergeKb || "");
        }
        if (config.feedbackUrl !== prev.feedbackUrl) {
          setFeedbackUrl(config.feedbackUrl || "");
        }
        if (config.nightshift !== prev.nightshift) {
          setNightshift(!!config.nightshift);
        }
        if (config.opHoursMorning !== prev.opHoursMorning) {
          setMorningHours(config.opHoursMorning || "06:00 - 12:00");
        }
        if (config.opHoursAfternoon !== prev.opHoursAfternoon) {
          setAfternoonHours(config.opHoursAfternoon || "12:00 - 18:00");
        }
        if (config.opHoursNight !== prev.opHoursNight) {
          setNightHours(config.opHoursNight || "18:00 - 06:00");
        }
        if (config.opHoursLimitEnabled !== prev.opHoursLimitEnabled) {
          setOpHoursLimit(!!config.opHoursLimitEnabled);
        }
        if (config.opHoursConstraint !== prev.opHoursConstraint) {
          setOpHoursConstraint(config.opHoursConstraint || "Unlimited");
        }
      }
      prevConfigRef.current = config;
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    const updatedConfig = {
      hotelName,
      logoUrl,
      conciergeKb,
      feedbackUrl,
      nightshift,
      opHoursMorning: morningHours,
      opHoursAfternoon: afternoonHours,
      opHoursNight: nightHours,
      opHoursLimitEnabled: opHoursLimit,
      opHoursConstraint
    };

    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "config", data: updatedConfig })
      });
      if (res.ok) {
        setSuccessMsg("Configuration parameters updated successfully.");
        onRefresh();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    const headers = ["Task ID", "Room", "Title", "Department", "Status", "Created At", "Actioned At", "Claimed By", "Completed At", "Completed By", "Resolution Note"];
    const rows = filteredTasks.map(t => [
      t.id,
      t.room || "",
      t.title || "",
      t.informedDept || "",
      t.status || "",
      t.createdAt ? new Date(t.createdAt).toISOString() : "",
      t.actionedAt ? new Date(t.actionedAt).toISOString() : "",
      t.claimedBy || "",
      t.completedAt ? new Date(t.completedAt).toISOString() : "",
      t.completedBy || "",
      t.resolutionNote || ""
    ]);
    
    const csvString = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");
    
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sandton_tasks_report_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate PDF report.");
      return;
    }
    
    const tableRows = filteredTasks.map(t => `
      <tr style="border-bottom: 1px solid #cbd5e0; font-size: 11px;">
        <td style="padding: 10px 8px; font-family: monospace; color: #4a5568;">${t.id.slice(0, 8)}</td>
        <td style="padding: 10px 8px; font-weight: bold; color: #1a202c;">Rm ${t.room}</td>
        <td style="padding: 10px 8px; color: #2d3748;">${t.title}</td>
        <td style="padding: 10px 8px; text-transform: uppercase; font-size: 10px; font-weight: bold; font-family: monospace;">${t.informedDept}</td>
        <td style="padding: 10px 8px;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background-color: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0;">
            ${t.status.toUpperCase()}
          </span>
        </td>
        <td style="padding: 10px 8px; font-size: 10px; color: #718096; line-height: 1.4;">
          Cr: ${t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}<br/>
          Dn: ${t.completedAt ? new Date(t.completedAt).toLocaleString() : "-"}
        </td>
        <td style="padding: 10px 8px; color: #10b981; font-weight: bold; font-family: monospace; font-size: 11px;">${t.resolutionNote || "-"}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <html>
        <head>
          <title>Sandton Hotel Backoffice - Central Service Tasks Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #2d3748; padding: 40px; margin: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 22px; font-weight: bold; letter-spacing: -0.5px; color: #1a202c; }
            .meta { font-size: 11px; color: #4a5568; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f7fafc; border-bottom: 2px solid #cbd5e0; padding: 10px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; color: #4a5568; }
            .footer { margin-top: 50px; font-size: 10px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SANDTON BACKOFFICE TASK AUDIT REPORT</div>
              <div class="meta" style="margin-top: 5px;">
                Property: <strong>${config?.hotelName || "Sandton Hotel"}</strong> | Status: Active Operations Record
              </div>
            </div>
            <div class="meta" style="text-align: right;">
              Export Date: ${new Date().toLocaleString()}<br/>
              Report Range: <strong>${dateFrom}</strong> to <strong>${dateTo}</strong> <br/>
              Matches Found: <strong>${filteredTasks.length} tasks</strong>
            </div>
          </div>
          
          <h3 style="font-size: 13px; text-transform: uppercase; margin-bottom: 10px; font-weight: 700; border-left: 3px solid #3182ce; padding-left: 8px;">Filtered Guest Service Actions</h3>
          <table>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Room</th>
                <th>Service Requested</th>
                <th>Department</th>
                <th>Status</th>
                <th>Timeline Trace</th>
                <th>Resolution Status / Note</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || `<tr><td colspan="7" style="padding: 40px; text-align: center; color: #a0aec0; font-family: monospace; font-size: 12px; font-style: italic;">No service tasks found within selected range.</td></tr>`}
            </tbody>
          </table>
          
          <div class="footer">
            Sandton Backoffice Management Core System • Private & Confidential Internal Property Records
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      {/* ALERTS & NOTIFICATIONS SYSTEM */}
      <AlertsNotificationsForm config={config} onRefresh={onRefresh} onConfigChange={onConfigChange} />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans">
        <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
          <h4 className="font-serif text-sm tracking-wider text-amber-400 font-semibold flex items-center gap-2">
            <Settings size={16} /> Hotel administration & channels config
          </h4>
          <button
            type="button"
            disabled={loading || syncLoading}
            onClick={handleForceSync}
            className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={11} className={syncLoading ? "animate-spin" : ""} />
            {syncLoading ? "Syncing..." : "Force sync"}
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/25 border border-emerald-900/30 text-emerald-400 font-mono rounded-lg">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/25 border border-rose-900/30 text-rose-400 font-mono rounded-lg">
            ✗ {errorMsg}
          </div>
        )}

        {/* Grid segments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visual Brand Section */}
          <div className="bg-black/25 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <h5 className="font-mono text-amber-400 font-bold tracking-wider text-[10px] pb-2 border-b border-slate-850">
              🎨 Branding & visual assets
            </h5>
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-slate-400">Hotel Property Name</label>
              <input type="text" required value={hotelName} onChange={(e) => changeHotelName(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-slate-400">Master Logo/Branding URL Badge</label>
              <input type="text" value={logoUrl} onChange={(e) => changeLogoUrl(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 font-mono text-[11px]" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-slate-400">Leave a Review Link (Google/TripAdvisor)</label>
              <input type="text" value={feedbackUrl} onChange={(e) => changeFeedbackUrl(e.target.value)} placeholder="e.g. https://g.page/r/your-hotel-review" className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 font-mono text-[11px]" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-slate-400">Guest Assistant Knowledgebase Scope</label>
              <textarea rows={3} value={conciergeKb} onChange={(e) => changeConciergeKb(e.target.value)} placeholder="Type guidelines for the AI..." className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 leading-relaxed font-sans" />
            </div>
          </div>

          {/* Operating & Constraints */}
          <div className="bg-black/25 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <h5 className="font-mono text-amber-400 font-bold tracking-wider text-[10px] pb-2 border-b border-slate-850">
              ⏰ Hours of service & constraints
            </h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[9px] text-slate-500">Morning</label>
                <input type="text" value={morningHours} onChange={(e) => changeMorningHours(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 text-center" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[9px] text-slate-500">Afternoon</label>
                <input type="text" value={afternoonHours} onChange={(e) => changeAfternoonHours(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 text-center" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[9px] text-slate-500">Nightshift Group</label>
                <input type="text" value={nightHours} onChange={(e) => changeNightHours(e.target.value)} className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 text-center" />
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-[#161616]/60 p-4 rounded-xl border border-white/[0.04]">
              <button
                type="button"
                onClick={() => changeNightshift(!nightshift)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                  nightshift ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    nightshift ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="leading-snug select-none text-left">
                <span className="font-mono font-bold text-slate-300">Operational Nightshift Mode</span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Overrides active status color indicators to Amber Amber.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-4 bg-[#161616]/60 p-4 rounded-xl border border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => changeOpHoursLimit(!opHoursLimit)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                    opHoursLimit ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      opHoursLimit ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="leading-snug select-none text-left">
                  <span className="font-mono font-bold text-slate-300">Enforce Hard Timing Limits</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Closes automatic chat during restricted timelines.</p>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-slate-400">Dynamic Hours Constraints Rule</label>
                <input type="text" disabled={!opHoursLimit} value={opHoursConstraint} onChange={(e) => changeOpHoursConstraint(e.target.value)} placeholder="e.g., 23:00 - 05:00" className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 focus:border-amber-400 font-mono disabled:opacity-40" />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || syncLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-[#E6C687] text-slate-950 font-serif tracking-widest font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {loading ? "Saving configs state..." : "Apply hotel gateway settings"}
        </button>
      </form>

      {/* MASTER TASK LOGGER & REPORT EXPORT CENTRE */}
      <div className="bg-black/35 border border-slate-800 rounded-xl p-6 mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-800 gap-3 text-left">
          <div className="space-y-0.5">
            <h4 className="font-serif text-base tracking-wider text-amber-500 font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-amber-500" /> Guest action audit report center
            </h4>
            <p className="text-[11px] text-slate-400 font-sans">
              Query database task actions historical traces and export print audit protocols.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadCsv}
              className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-bold transition scale-95 hover:scale-100 flex items-center gap-1 cursor-pointer"
            >
              <Download size={12} /> Export CSV
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold transition scale-95 hover:scale-100 flex items-center gap-1 cursor-pointer"
            >
              <Download size={12} /> Export print / PDF
            </button>
          </div>
        </div>

        {/* Date Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-900 text-left">
          <div className="flex flex-col space-y-1">
            <label className="font-mono text-slate-400 text-[10px] font-bold tracking-wider">Date from (UTC)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs text-white"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="font-mono text-slate-400 text-[10px] font-bold tracking-wider">Date to (UTC)</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs text-white"
            />
          </div>
        </div>

        {/* Inline Logs Table Grid of the queried tasks items */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/20 max-h-[300px] overflow-y-auto w-full text-left">
          <table className="w-full text-left text-[11px] font-sans border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-mono text-[10px] tracking-wider border-b border-slate-800">
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Room</th>
                <th className="p-2.5">Task Title</th>
                <th className="p-2.5">Dept</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Logs Trace</th>
                <th className="p-2.5">Resolution Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono italic">
                    No task events matched date query. Select another range.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 text-slate-300 border-b border-slate-900/40 last:border-0">
                    <td className="p-2.5 font-mono text-slate-500">{t.id.slice(0, 8)}</td>
                    <td className="p-2.5 font-mono text-amber-400 font-bold">Rm {t.room}</td>
                    <td className="p-2.5 text-slate-200 lg:max-w-[200px] truncate" title={t.title}>{t.title}</td>
                    <td className="p-2.5 text-[10px] font-mono">{t.informedDept}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                        t.status === "completed" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900/30" :
                        t.status === "in_progress" ? "bg-amber-950/80 text-amber-400 border border-amber-900/30" :
                        "bg-slate-900 text-slate-300 border border-slate-800"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[9px] text-slate-400 leading-normal">
                      Cr: {t.createdAt ? new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "-"}
                      {t.completedAt && ` | Dn: ${new Date(t.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })}`}
                    </td>
                    <td className="p-2.5 text-emerald-400 font-mono text-[10px] italic">
                      {t.resolutionNote || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1">
          <span>Query result size: {filteredTasks.length} matches</span>
          <span>System TZ: UTC</span>
        </div>
      </div>
    </div>
  );
}

// --- 9. ALERTS & NOTIFICATIONS MANAGER ---
export function AlertsNotificationsForm({
  config,
  onRefresh,
  onConfigChange
}: {
  config: any;
  onRefresh: () => void;
  onConfigChange?: (updatedFields: any) => void;
}) {
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const [alertPopupActive, setAlertPopupActive] = useState(false);
  const [alertPopupHeader, setAlertPopupHeader] = useState("");
  const [alertPopupBody, setAlertPopupBody] = useState("");
  const [alertBannerActive, setAlertBannerActive] = useState(false);
  const [alertBannerText, setAlertBannerText] = useState("");

  const prevConfigRef = useRef<any>(null);

  const handleTogglePopupActive = () => {
    const nextVal = !alertPopupActive;
    setAlertPopupActive(nextVal);
    if (onConfigChange) {
      onConfigChange({ alertPopupActive: nextVal });
    }
  };

  const handlePopupHeaderChange = (val: string) => {
    setAlertPopupHeader(val);
    if (onConfigChange) {
      onConfigChange({ alertPopupHeader: val });
    }
  };

  const handlePopupBodyChange = (val: string) => {
    setAlertPopupBody(val);
    if (onConfigChange) {
      onConfigChange({ alertPopupBody: val });
    }
  };

  const handleToggleBannerActive = () => {
    const nextVal = !alertBannerActive;
    setAlertBannerActive(nextVal);
    if (onConfigChange) {
      onConfigChange({ alertBannerActive: nextVal });
    }
  };

  const handleBannerTextChange = (val: string) => {
    setAlertBannerText(val);
    if (onConfigChange) {
      onConfigChange({ alertBannerText: val });
    }
  };

  useEffect(() => {
    if (config) {
      const prev = prevConfigRef.current;
      if (!prev) {
        setAlertPopupActive(!!config.alertPopupActive);
        setAlertPopupHeader(config.alertPopupHeader || "Scheduled Maintenance");
        setAlertPopupBody(config.alertPopupBody || "Pool will be closed for maintenance today.");
        setAlertBannerActive(!!config.alertBannerActive);
        setAlertBannerText(config.alertBannerText || "Happy Father's Day Dads!");
      } else {
        // Only update local input elements if the fields downloaded from server actually changed compared to prior sync
        if (config.alertPopupActive !== prev.alertPopupActive) {
          setAlertPopupActive(!!config.alertPopupActive);
        }
        if (config.alertPopupHeader !== prev.alertPopupHeader) {
          setAlertPopupHeader(config.alertPopupHeader || "Scheduled Maintenance");
        }
        if (config.alertPopupBody !== prev.alertPopupBody) {
          setAlertPopupBody(config.alertPopupBody || "Pool will be closed for maintenance today.");
        }
        if (config.alertBannerActive !== prev.alertBannerActive) {
          setAlertBannerActive(!!config.alertBannerActive);
        }
        if (config.alertBannerText !== prev.alertBannerText) {
          setAlertBannerText(config.alertBannerText || "Happy Father's Day Dads!");
        }
      }
      prevConfigRef.current = config;
    }
  }, [config]);

  const handleSaveAlerts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess("");
    setSaveError("");

    const updatedConfig = {
      ...config,
      alertPopupActive,
      alertPopupHeader,
      alertPopupBody,
      alertBannerActive,
      alertBannerText
    };

    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "config", data: updatedConfig })
      });
      if (res.ok) {
        setSaveSuccess("Saved");
        onRefresh();
        setTimeout(() => setSaveSuccess(""), 3000);
      } else {
        setSaveError("Error saving alerts");
      }
    } catch (err: any) {
      console.error(err);
      setSaveError("Connection error");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left animate-fade-in">
      <div>
        <h2 className="font-serif text-2xl text-slate-100 tracking-wide font-medium mb-1">
          Alerts & Notifications
        </h2>
        <p className="text-xs text-slate-400 font-sans">
          Configure real-time guest popup alerts and status banners below.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 font-mono text-xs rounded-xl animate-fade-in">
          ✓ Parameters updated successfully.
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-950/30 border border-rose-900/30 text-rose-400 font-mono text-xs rounded-xl animate-fade-in">
          ✗ {saveError}
        </div>
      )}

      {/* SECTION 1: GUEST POPUP ALERT */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] text-[#cca472] font-mono uppercase tracking-widest font-bold block mb-1">
            ALERT SETTINGS
          </span>
          <h3 className="font-serif text-slate-150 font-semibold tracking-wide text-lg">
            Guest Popup Alert
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Acts as a full-screen entry modal. Guests must dismiss it before entering.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-[#181818]/60 border border-white/[0.03] p-6 rounded-2xl flex flex-col space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-bold">ACTIVE REGIME STATUS</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePopupActive}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                    alertPopupActive ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      alertPopupActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-mono font-bold ${alertPopupActive ? "text-[#cca472]" : "text-zinc-500"}`}>
                  {alertPopupActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">HEADER TITLE</span>
              <input
                type="text"
                value={alertPopupHeader}
                onChange={(e) => handlePopupHeaderChange(e.target.value)}
                placeholder="Scheduled Maintenance"
                className="bg-black/40 border border-[#232323] focus:border-[#cca472] rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#cca472] font-sans"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">PARAGRAPH TEXT</span>
              <textarea
                value={alertPopupBody}
                onChange={(e) => handlePopupBodyChange(e.target.value)}
                placeholder="Pool will be closed for maintenance today."
                rows={3}
                className="bg-black/40 border border-[#232323] focus:border-[#cca472] rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#cca472] font-sans resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="relative w-full min-h-[220px] bg-black/10 rounded-2xl flex items-center justify-center border border-white/[0.03] p-6">
            <div className="absolute top-4 left-5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              LIVE POPUP PREVIEW
            </div>
            
            <div className="bg-[#1c1c1c] border border-white/[0.04] rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
              <h5 className="font-serif text-base text-[#cca472] font-semibold">
                {alertPopupHeader || "Scheduled Maintenance"}
              </h5>
              <p className="text-slate-300 text-xs leading-relaxed">
                {alertPopupBody || "Pool will be closed for maintenance today."}
              </p>
              <button
                type="button"
                className="w-full bg-[#cca472]/90 hover:bg-[#cca472] text-[#0d0d0d] font-sans text-xs font-bold py-2.5 rounded-xl transition shadow-sm cursor-not-allowed uppercase tracking-wider leading-none"
              >
                Close Alert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: GUEST BANNER NOTIFICATION */}
      <div className="space-y-4 pt-6 border-t border-white/[0.03]">
        <div>
          <span className="text-[10px] text-[#cca472] font-mono uppercase tracking-widest font-bold block mb-1">
            STATUS STRIP
          </span>
          <h3 className="font-serif text-slate-150 font-semibold tracking-wide text-lg">
            Guest Banner Notification
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Displays as a fixed notice bar on the guest portal main screen dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-[#181818]/60 border border-white/[0.03] p-6 rounded-2xl flex flex-col space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-bold">STATUS</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleBannerActive}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none p-0.5 items-center ${
                    alertBannerActive ? 'bg-[#cca472]' : 'bg-[#3a3a3a]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      alertBannerActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-mono font-bold ${alertBannerActive ? "text-[#cca472]" : "text-zinc-500"}`}>
                  {alertBannerActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">BANNER CONTENT</span>
              <input
                type="text"
                value={alertBannerText}
                onChange={(e) => handleBannerTextChange(e.target.value)}
                placeholder="Happy Father's Day Dads!"
                className="bg-black/40 border border-[#232323] focus:border-[#cca472] rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#cca472] font-sans"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="relative w-full min-h-[220px] bg-black/10 rounded-2xl flex items-center justify-center border border-white/[0.03] p-6">
            <div className="absolute top-4 left-5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              LIVE BANNER PREVIEW
            </div>

            <div className="w-full max-w-[280px] bg-[#121212] border border-white/[0.04] rounded-xl p-4.5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-b border-white/[0.02] pb-3 uppercase">
                <span>Room 203</span>
                <span>21°C</span>
              </div>

              <div className="bg-[#1c1c1c] border border-white/[0.04] rounded-xl p-3 flex items-center justify-between text-[10px] text-slate-300">
                <span className="truncate pr-1 text-slate-200">📢 {alertBannerText || "Happy Father's Day Dads!"}</span>
                <span className="text-slate-500 text-xs px-1 cursor-not-allowed">×</span>
              </div>

              <span className="text-[9px] font-mono uppercase tracking-widest text-[#cca472]/60 block text-center mt-1">
                guest terminal mockup
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saveLoading}
        onClick={() => handleSaveAlerts()}
        className="w-full bg-[#cca472] hover:bg-[#ba9361] text-[#0d0d0d] font-sans tracking-widest font-semibold py-4 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 text-xs uppercase"
      >
        {saveLoading ? "Saving..." : "Apply alerts state"}
      </button>
    </div>
  );
}
