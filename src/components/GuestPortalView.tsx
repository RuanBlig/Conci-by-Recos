import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  X,
  Star,
  Car,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  ExternalLink,
  MapPin
} from "lucide-react";
import { useRole } from "../App";
import { cn } from "../lib/utils";

// Helper function to check operational shift timelines
function isTimeWithinRange(timeStr: string, openTimeStr: string, closeTimeStr: string): boolean {
  if (!timeStr || !openTimeStr || !closeTimeStr) return false;
  try {
    const parseTime = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m;
    };
    const t = parseTime(timeStr);
    const open = parseTime(openTimeStr);
    const close = parseTime(closeTimeStr);
    
    if (close < open) {
      // Handles overnight ranges like 21:00 to 02:00
      return t >= open || t <= close;
    }
    return t >= open && t <= close;
  } catch (e) {
    return false;
  }
}

export default function GuestPortalView() {
  const { guestSession, logout } = useRole();
  const [loading, setLoading] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [dismissedEmergency, setDismissedEmergency] = useState<boolean>(false);

  useEffect(() => {
    if (!emergencyMode) {
      setDismissedEmergency(false);
    }
  }, [emergencyMode]);

  // Server state data with matching placeholder fallbacks
  const [masterConfig, setMasterConfig] = useState({
    hotelName: "Sandton Hotel",
    logoUrl: "",
    conciergeKb: "",
    feedbackUrl: "",
    nightshift: false,
    opHoursMorning: "06:00 AM - 11:30 AM",
    opHoursAfternoon: "12:00 PM - 05:00 PM",
    opHoursNight: "06:00 PM - 11:00 PM",
    alertPopupActive: false,
    alertPopupHeader: "",
    alertPopupBody: "",
    alertBannerActive: false,
    alertBannerText: ""
  });

  const [promotions, setPromotions] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [recos, setRecos] = useState<any[]>([]);

  const firedImpressionsRef = useRef<Set<string>>(new Set());

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
          console.warn("[GUEST SYNC] Invalid JSON received from /api/sync, fallback to memory", parseErr);
          return;
        }
        if (mounted && json && json.success) {
          if (json.masterConfig) setMasterConfig(json.masterConfig);
          if (json.masterPromotions) setPromotions(json.masterPromotions);
          if (json.masterFacilities) setFacilities(json.masterFacilities);
          if (json.masterRestaurants) setRestaurants(json.masterRestaurants);
          if (json.masterRecos) setRecos(json.masterRecos);
          setEmergencyMode(!!json.emergencyMode);
          if (json.chatMessages && Array.isArray(json.chatMessages)) {
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
        }
      } catch (err: any) {
        const isNetworkError = err?.name === "TypeError" || 
                               err?.message?.toLowerCase().includes("fetch") || 
                               err?.message?.toLowerCase().includes("network") ||
                               err?.message?.toLowerCase().includes("failed") ||
                               err?.message?.toLowerCase().includes("429") ||
                               err?.message?.toLowerCase().includes("status: 429");
        if (isNetworkError) {
          console.warn("[GUEST PORTAL SYNC WARNING] Transient rate-limited or connectivity warning (status: 429 or similar): retaining local state.");
        } else {
          console.error("Failed to sync guest portal collections:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    syncData();
    const interval = setInterval(syncData, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [guestSession?.roomNumber]);

  // Automatic recommendation impressions logging
  useEffect(() => {
    if (recos && recos.length > 0 && guestSession) {
      recos.forEach((reco) => {
        if (reco.id && !firedImpressionsRef.current.has(reco.id)) {
          firedImpressionsRef.current.add(reco.id);
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
          }).catch(e => console.error("Failed to fire auto-impression:", e));
        }
      });
    }
  }, [recos, guestSession]);

  const handleOpenReco = (reco: any) => {
    setSelectedReco(reco);
    // Log "open" event to backend
    fetch("/api/sync/recos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "open",
        recoId: reco.id,
        guestName: guestSession?.guestName || "Anonymous",
        roomNumber: guestSession?.roomNumber || "0",
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.error("Failed to fire open event:", e));
  };

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

  // --- 2. HERO CAROUSEL ROTATION ---
  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (promotions.length <= 1) return;
    const handleAutoplay = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(handleAutoplay);
  }, [promotions.length]);

  // Swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || promotions.length <= 1) return;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      setSlideIdx((prev) => (prev + 1) % promotions.length);
    } else if (diff < -50) {
      setSlideIdx((prev) => (prev - 1 + promotions.length) % promotions.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
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

  const handleMoreInfoClick = () => {
    if (!selectedReco) return;
    
    // Log "impression" to the backend
    fetch("/api/sync/recos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "impression",
        recoId: selectedReco.id,
        guestName: guestSession?.guestName || "Anonymous",
        roomNumber: guestSession?.roomNumber || "0",
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.error("Failed to fire impression:", e));
    
    setShowLeaveConfirmation(true);
  };

  const handleConfirmLeave = () => {
    if (!selectedReco || !selectedReco.cta_url) return;
    
    // Log "click" to the backend
    fetch("/api/sync/recos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "click",
        recoId: selectedReco.id,
        guestName: guestSession?.guestName || "Anonymous",
        roomNumber: guestSession?.roomNumber || "0",
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.error("Failed to fire click:", e));
    
    // Open the external page
    window.open(selectedReco.cta_url, "_blank");
    
    // Reset states
    setShowLeaveConfirmation(false);
    setSelectedReco(null);
  };

  // --- OVERLAY WINDOWS & MODALS ---
  const [chatOpen, setChatOpen] = useState(false);
  const [showDressCodeModal, setShowDressCodeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSelfDriveModal, setShowSelfDriveModal] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [alertPopupDismissed, setAlertPopupDismissed] = useState(false);
  const [showFathersDayModal, setShowFathersDayModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedReco, setSelectedReco] = useState<any | null>(null);
  const [fullscreenRecoImage, setFullscreenRecoImage] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  useEffect(() => {
    if (!selectedReco) {
      setShowLeaveConfirmation(false);
    }
  }, [selectedReco]);

  const handleRecoImageClick = (imageUrl: string) => {
    if (!imageUrl || !selectedReco) return;
    setFullscreenRecoImage(imageUrl);
    // Log "image_click" to the dashboard analytics backend
    fetch("/api/sync/recos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "image_click",
        recoId: selectedReco.id,
        guestName: guestSession?.guestName || "Anonymous",
        roomNumber: guestSession?.roomNumber || "0",
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.error("Failed to log recommendation image click event:", e));
  };

  // Transfer Forms states
  const [transferDestination, setTransferDestination] = useState("");
  const [transferTimeType, setTransferTimeType] = useState<"immediate" | "schedule">("schedule");
  const [transferDate, setTransferDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [transferTime, setTransferTime] = useState(() => {
    const today = new Date();
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  const transferDateTime = transferDate && transferTime ? `${transferDate}T${transferTime}` : "";
  const [shuttleTravellers, setShuttleTravellers] = useState(2);
  const [shuttleLoading, setShuttleLoading] = useState(false);
  const [shuttleSubmitted, setShuttleSubmitted] = useState(false);
  const [calcDistance, setCalcDistance] = useState<string>("5");
  const [calcShowPricingList, setCalcShowPricingList] = useState<boolean>(false);
  const [isDistanceAutoEstimated, setIsDistanceAutoEstimated] = useState<boolean>(true);
  const [isReturnTrip, setIsReturnTrip] = useState<boolean>(true);

  // Johannesburg Sandton Local Custom Popular Landmarks (within 5km radius)
  const POPULAR_DESTINATIONS = useMemo(() => [
    { name: "Nelson Mandela Square", km: 2 },
    { name: "Sandton City Mall", km: 1 },
    { name: "Sandton Gautrain Station", km: 2 },
    { name: "Morningside Shopping Centre", km: 3 }
  ], []);

  // Update distance dynamically when destination is typed or selected (unless manually overridden by slider/input)
  useEffect(() => {
    if (!transferDestination || transferDestination.trim().length === 0) {
      if (isDistanceAutoEstimated) {
        setCalcDistance("5");
      }
      return;
    }

    if (!isDistanceAutoEstimated) return; // Do not overwrite if client manually adjusted it

    const cleanDest = transferDestination.toLowerCase().trim();
    
    // Find exact or partial matches in our database
    const exactMatch = POPULAR_DESTINATIONS.find(
      d => cleanDest.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(cleanDest)
    );

    if (exactMatch) {
      setCalcDistance(String(exactMatch.km));
    } else {
      // Automatic stable hash distance generator for typed addresses
      let hash = 0;
      for (let i = 0; i < cleanDest.length; i++) {
        hash = cleanDest.charCodeAt(i) + ((hash << 5) - hash);
      }
      const absoluteHash = Math.abs(hash);
      // Generates a robust, stable distance between 12km and 150km based on the text
      const calculatedKm = (absoluteHash % 139) + 12;
      setCalcDistance(String(calculatedKm));
    }
  }, [transferDestination, isDistanceAutoEstimated, POPULAR_DESTINATIONS]);

  // Chat representation
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLogs, chatAwaitingResponse, chatOpen]);



  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatAwaitingResponse) return;

    const query = chatInput;
    setChatInput("");
    setChatAwaitingResponse(true);

    const userMsg = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
      senderName: guestSession?.guestName || "Guest"
    };

    setChatLogs(prev => [...prev, userMsg]);

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
    "Tell me about the restaurants.",
    "Tell me about the spa treatments.",
    "Things in Joburg"
  ];

  const handleSendQuickQuestion = async (q: string) => {
    if (q === "Things in Joburg") {
      setChatOpen(false);
      setTimeout(() => {
        const el = document.getElementById("discover-joburg-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      return;
    }
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
      
      await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency: true,
          room: guestSession?.roomNumber || "N/A",
          guestName: guestSession?.guestName || "Guest",
          actor: guestSession?.guestName || "Guest"
        })
      });

      await fetch("/api/sync/tasks/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "MEDICAL EMERGENCY",
          room: guestSession?.roomNumber || "N/A",
          informedDept: "Concierge",
          guestName: guestSession?.guestName || "Guest",
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

  // Calculation Helper for Distance Pricing & After-Hours check
  const getCalculateTripData = () => {
    const oneWay = parseFloat(calcDistance) || 0;
    const roundTrip = oneWay * 2;
    const distanceUsed = isReturnTrip ? roundTrip : oneWay;
    const isExceeded = distanceUsed > 180;
    let priceVal = 0;
    let priceText = "";
    let tierText = "";

    if (isExceeded) {
      priceVal = distanceUsed * 17;
      priceText = `R ${priceVal.toLocaleString()}*`;
      tierText = "Exceeds 180km (Charged at R17* per kilometre)";
    } else {
      // trips below 180km must be matched according to the approved distance pricing structure
      if (distanceUsed === 0) {
        priceVal = 0;
        priceText = "R 0";
        tierText = "No distance entered";
      } else if (distanceUsed <= 10) {
        priceVal = 0; // standard complimentary local boundary
        priceText = "Complimentary";
        tierText = `Complimentary Local Radius (0 - 10km ${isReturnTrip ? 'roundtrip' : 'one-way'})`;
      } else if (distanceUsed <= 40) {
        priceVal = 350;
        priceText = "R 350";
        tierText = `Approved Structure Tier 1 (11km - 40km ${isReturnTrip ? 'roundtrip' : 'one-way'})`;
      } else if (distanceUsed <= 90) {
        priceVal = 780;
        priceText = "R 780";
        tierText = `Approved Structure Tier 2 (41km - 90km ${isReturnTrip ? 'roundtrip' : 'one-way'})`;
      } else if (distanceUsed <= 140) {
        priceVal = 1350;
        priceText = "R 1,350";
        tierText = `Approved Structure Tier 3 (91km - 140km ${isReturnTrip ? 'roundtrip' : 'one-way'})`;
      } else {
        priceVal = 1950;
        priceText = "R 1,950";
        tierText = `Approved Structure Tier 4 (141km - 180km ${isReturnTrip ? 'roundtrip' : 'one-way'})`;
      }
    }

    // After-Hours Shuttle Service Check: After 22:00 (10pm) or before 05:00 (5am)
    let isAfterHours = false;
    let checkHour = new Date().getHours();
    let selectedTimeLabel = "Immediate Request";

    if (transferTimeType === "schedule" && transferDateTime) {
      try {
        const dt = new Date(transferDateTime);
        checkHour = dt.getHours();
        selectedTimeLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) {
        console.error(e);
      }
    } else {
      checkHour = new Date().getHours();
      selectedTimeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + " (Immediate)";
    }

    if (checkHour >= 22 || checkHour < 5) {
      isAfterHours = true;
    }

    return {
      oneWay,
      roundTrip,
      distanceUsed,
      isExceeded,
      priceVal,
      priceText,
      tierText,
      isAfterHours,
      checkHour,
      selectedTimeLabel
    };
  };

  const handleBookTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShuttleLoading(true);
    try {
      const calcData = getCalculateTripData();
      const res = await fetch("/api/sync/tasks/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Airport Shuttle",
          room: guestSession?.roomNumber || "N/A",
          informedDept: "Concierge",
          details: {
            flightNumber: transferTimeType === "immediate" ? "Immediate Chauffeur" : "Scheduled Ride",
            dateTime: transferTimeType === "immediate" ? new Date().toISOString() : transferDateTime || new Date().toISOString(),
            route: `${transferDestination || "Specified Dropoff"} (${isReturnTrip ? "Roundtrip" : "One-Way"}, Distance: ${calcData.distanceUsed}km)`,
            travellers: shuttleTravellers,
            vehicle: "Luxury Sedan",
            baseEstimate: calcData.priceText,
            pricingTier: calcData.tierText,
            afterHoursAlert: calcData.isAfterHours ? "YES (Between 22:00 & 05:00)" : "No"
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShuttleSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShuttleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#121212] text-slate-100 flex items-center justify-center font-sans sm:py-6 lg:py-10 overflow-y-auto">
      
      {/* Physical Mockup Device Screen Container */}
      <div className="w-full sm:max-w-[425px] sm:h-[860px] sm:rounded-[48px] sm:border-[10px] sm:border-slate-800/95 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] sm:ring-[1px] sm:ring-slate-700/40 bg-[#161616] flex flex-col font-sans relative overflow-hidden h-screen select-none border-b border-t">
        
        {/* CUSTOM GUEST POPUP ALERT OVERLAY */}
        <AnimatePresence>
          {masterConfig.alertPopupActive && !alertPopupDismissed && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 z-[9999] backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="absolute inset-[24px] m-auto h-fit max-w-[340px] bg-[#1c1c1c] border border-white/[0.08] rounded-3xl p-6 z-[10000] shadow-2xl flex flex-col justify-between text-center space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#cca472]/10 text-[#cca472] flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <span className="text-xl">📢</span>
                  </div>
                  <h3 className="font-serif text-lg text-[#cca472] font-semibold leading-snug">
                    {masterConfig.alertPopupHeader || "Scheduled Maintenance"}
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed font-light">
                    {masterConfig.alertPopupBody || "Pool will be closed for maintenance today."}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setAlertPopupDismissed(true)}
                  className="w-full bg-[#cca472] hover:bg-[#ba9361] text-[#0d0d0d] font-sans text-xs font-bold py-3.5 rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer uppercase tracking-widest leading-none outline-none"
                >
                  Close Alert
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Scrollable Container Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7 scrollbar-none select-text pb-16 relative">
          
          {loading && promotions.length === 0 && (
            <div className="absolute inset-0 bg-[#161616] z-50 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-[#cca472] border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase animate-pulse">Loading Guest Portal...</p>
            </div>
          )}
          
          {/* Room details header line */}
          <div className="flex justify-between items-center text-[10px] sm:text-xs tracking-[0.2em] font-semibold text-slate-400 font-sans border-b border-[#cca472]/30 pb-2.5 mt-1">
            <span className="text-white">SUITE {guestSession?.roomNumber || "123"}</span>
            <span>22°C</span>
          </div>

          {/* Main Dashboard Emergency Warning Banner */}
          {emergencyMode && (
            <div className="bg-red-950/95 border border-red-500/50 rounded-2xl p-4 space-y-2 text-left animate-fade-in relative shadow-lg" id="dashboard-emergency-popup">
              <div className="flex items-center gap-2.5">
                <span className="text-lg animate-bounce">🚨</span>
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider font-sans">
                  Critical Emergency Lockdown
                </h4>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-auto" />
              </div>
              <p className="text-[11px] text-slate-350 leading-relaxed font-light">
                The facility management desk has activated emergency protocols. Please stay inside your suite on standby. Press the Concierge Chat trigger to monitor live responder broadcast streams in the message section.
              </p>
            </div>
          )}

          {/* Welcome Notification Banner */}
          {masterConfig.alertBannerActive && bannerVisible && masterConfig.alertBannerText && (
            <div 
              className="flex justify-between items-center bg-white/[0.04] border border-[#cca472]/30 rounded-xl p-3 text-[11px] text-slate-350 relative gap-3 backdrop-blur-md select-none transition-all cursor-pointer hover:bg-white/[0.08] active:scale-[0.99] group"
              title="Alert Notification"
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-yellow-500 text-xs animate-bounce">📢</span>
                <span className="font-medium leading-relaxed group-hover:text-white transition-colors pr-1">
                  {masterConfig.alertBannerText}
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setBannerVisible(false);
                }}
                className="text-slate-500 hover:text-white transition-colors flex-shrink-0 p-1 rounded-full hover:bg-white/5"
                title="Dismiss banner"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Title Greetings Area */}
          <div className="text-center space-y-1 my-4 select-none flex flex-col items-center justify-center w-full">
            <span className="text-[10px] sm:text-xs tracking-[0.45em] text-[#cca472] font-semibold uppercase font-sans">
              Welcome to {masterConfig.hotelName ? masterConfig.hotelName.toUpperCase() : "@SANDTON"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-light lowercase first-letter:uppercase mt-1">
              {getGreeting()}
            </h2>
            <h1 className="text-3xl sm:text-4xl italic text-[#cca472] font-semibold tracking-wide font-serif">
              {guestSession?.guestName || "Mr. Blig"}
            </h1>
          </div>

          {/* Primary CTA Buttons Stacked */}
          <div className="flex flex-col gap-3.5 mt-2">
            <button
              onClick={() => setChatOpen(true)}
              className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-4 rounded-xl text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.99] font-sans"
            >
              ASK CONCIERGE
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="w-full bg-transparent hover:bg-white/[0.02] text-[#cca472] border border-[#cca472] font-bold py-4 rounded-xl text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer active:scale-[0.99]"
            >
              BOOK TRANSFER
            </button>
            <button
              onClick={() => setShowSelfDriveModal(true)}
              className="w-full bg-transparent hover:bg-white/[0.02] text-[#cca472] border border-[#cca472] font-bold py-4 rounded-xl text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer active:scale-[0.99]"
            >
              BOOK A SELF-DRIVE
            </button>
          </div>

          {/* Dress Code Smart casual reminder banner */}
          <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-4 select-none text-center">
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed font-light">
              To maintain our elegant atmosphere, we kindly ask all guests to abide by our{" "}
              <button
                onClick={() => setShowDressCodeModal(true)}
                className="text-[#D4B27C] underline font-medium hover:text-[#C5A873] cursor-pointer"
              >
                smart casual dress code
              </button>{" "}
              in public areas.
            </p>
          </div>

          {/* Exclusive Promotions Horizontal Slider (4:5 Ratio, No Text, Click opens bottom sheet) */}
          {promotions && promotions.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <h3 className="font-serif italic font-semibold text-lg text-white">
                  Exclusive Promotions
                </h3>
                <span className="text-[10px] font-mono tracking-widest text-[#D4B27C] uppercase">
                  {promotions.length} Offers
                </span>
              </div>

              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
                  {promotions.map((promo, idx) => (
                    <div
                      key={promo.id || idx}
                      onClick={() => setSelectedPromo(promo)}
                      className="snap-start flex-shrink-0 w-[240px] aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative cursor-pointer shadow-lg group transition-all duration-300 hover:scale-[1.01] hover:border-[#D4B27C]/40"
                    >
                      <img
                        src={promo.image_url}
                        alt={promo.title}
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-all duration-500 group-hover:scale-[1.05]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                    </div>
                  ))}
                </div>
                <div className="text-[9px] font-mono tracking-widest text-[#D4B27C]/60 text-right mt-1.5 select-none uppercase">
                  ← Swipe to explore offers →
                </div>
              </div>
            </div>
          )}

          {/* Hotel Facilities Horizontal Slider */}
          {facilities && facilities.length > 0 && (
            <div className="space-y-3.5 bg-transparent">
              <div className="flex justify-between items-center text-xs">
                <h3 className="font-serif italic font-semibold text-lg text-white">
                  Hotel Facilities
                </h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                {facilities.map((fac) => (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className="flex-shrink-0 w-64 snap-start bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-md cursor-pointer hover:border-[#D4B27C]/30 transition-all duration-300 hover:scale-[1.01] group"
                  >
                    <div className="h-28 relative overflow-hidden">
                      <img
                        src={fac.image_url}
                        alt={fac.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur text-[8px] font-bold text-[#D4B27C] uppercase tracking-widest px-2 py-0.5 rounded border border-white/5">
                        {fac.category}
                      </span>
                    </div>
                    <div className="p-3.5 text-left">
                      <h4 className="text-[11px] font-serif font-semibold text-white truncate group-hover:text-[#D4B27C] transition-colors">{fac.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dining & Gastronomy Horizontal Slider */}
          {restaurants && restaurants.length > 0 && (
            <div className="space-y-3.5 bg-transparent opacity-100">
              <div className="flex justify-between items-center text-xs">
                <h3 className="font-serif italic font-semibold text-lg text-white">
                  Dining & Gastronomy
                </h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                {restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    onClick={() => setSelectedRestaurant(rest)}
                    className="flex-shrink-0 w-64 snap-start bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden shadow-md cursor-pointer hover:border-[#D4B27C]/30 transition-all duration-300 hover:scale-[1.01] group"
                  >
                    <div className="h-28 relative overflow-hidden">
                      <img
                        src={rest.image_url}
                        alt={rest.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3.5 text-left">
                      <h4 className="text-[11px] font-serif font-semibold text-white truncate group-hover:text-[#D4B27C] transition-colors">{rest.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Fidelity feedback banner matching the screengrab */}
          {masterConfig.feedbackUrl && (
            <div className="bg-[#F6F4EF] text-slate-900 rounded-t-[40px] -mx-6 px-6 py-11 text-center space-y-6 select-none shadow-inner border-t border-white/5">
              <h3 className="font-serif text-[26px] tracking-normal text-[#1C1C1C] font-medium leading-none">
                Loved Your Stay?
              </h3>
              <p id="feedback-paragraph" className="text-[#4f4f4f] text-[15px] leading-relaxed max-w-[280px] mx-auto font-sans font-normal">
                Your feedback helps future guests discover the best of @Sandton
              </p>
              <div className="pt-2">
                <a
                  href={masterConfig.feedbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block tracking-[0.2em] font-sans font-bold text-[12px] text-black border-b-[1.5px] border-black pb-1 uppercase hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                >
                  LEAVE A REVIEW
                </a>
              </div>
            </div>
          )}

          {/* Local Discovery Recommendations: Discover Joburg styled as a horizontally scrollable container with 15px fonts */}
          {recos && recos.length > 0 && (
            <div id="discover-joburg-section" className="space-y-4 bg-transparent pt-3 text-center scroll-mt-6">
              <div className="space-y-1.5 my-3 select-none">
                <h3 className="font-serif italic font-semibold text-xl text-white tracking-wide">
                  Discover Joburg
                </h3>
                <p className="text-[11px] font-sans font-bold tracking-[0.25em] text-[#cca472] uppercase">
                  Curated by Recos
                </p>
              </div>

              {(() => {
                const cardRecos = recos.filter((r) => r.type !== "button" && r.status !== "pending_approval");
                const buttonRecos = recos.filter((r) => r.type === "button" && r.status !== "pending_approval");
                
                return (
                  <div className="space-y-4">
                    {cardRecos.length > 0 && (
                      <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-6 -mx-6">
                        {cardRecos.map((reco) => (
                          <div
                            key={reco.id}
                            onClick={() => handleOpenReco(reco)}
                            className="flex-shrink-0 w-[230px] aspect-[4/5] snap-start bg-black/40 border border-white/5 rounded-2xl overflow-hidden relative cursor-pointer group shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-[#cca472]/30"
                          >
                            <img
                              src={reco.image_url}
                              alt={reco.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-all duration-500 group-hover:scale-[1.05]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none" />
                            <div className="absolute inset-x-3 bottom-3 text-left">
                              <h4 className="text-[15px] font-serif font-bold text-white tracking-wide line-clamp-2 leading-tight">
                                {reco.title}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {buttonRecos.length > 0 && (
                      <div className="space-y-2 mt-4 text-left">
                        {buttonRecos.map((reco) => (
                          <div
                            key={reco.id}
                            onClick={() => handleOpenReco(reco)}
                            className="w-full bg-[#141414] border border-white/[0.04] hover:bg-[#1a1a1a] hover:border-[#cca472]/20 rounded-xl p-4 flex justify-between items-center cursor-pointer transition-all duration-200 group active:scale-[0.99]"
                          >
                            <div className="space-y-1.5 pr-4 flex-1">
                              <h4 className="text-[13px] font-sans font-bold text-slate-100 group-hover:text-[#cca472] transition-colors leading-tight">
                                {reco.title}
                              </h4>
                              {reco.paragraph && (
                                <p className="text-[11px] text-slate-400 font-normal line-clamp-1 leading-normal font-sans">
                                  {reco.paragraph}
                                </p>
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.04] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#cca472]/10 group-hover:border-[#cca472]/20 transition-all flex-shrink-0">
                              <ExternalLink size={13} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Simple footer drag handle line to logout */}
          <div 
            onClick={logout}
            className="text-center pt-5 hover:opacity-100 transition-all duration-300 cursor-pointer text-[11px] font-mono tracking-widest uppercase font-bold text-[#D4B27C] hover:text-[#C5A873] active:scale-[0.98]"
            title="Click to Exit Guest Portal"
          >
            {"Log Out"}
          </div>

        </div>

        {/* 1. SMART CASUAL DRESS CODE MODAL SHEEET (Image 1) */}
        <AnimatePresence>
          {showDressCodeModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDressCodeModal(false)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl space-y-5 flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setShowDressCodeModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white font-sans">
                      Hotel Guidelines & Protocol
                    </span>
                    <h3 className="text-2xl font-serif text-[#cca472] font-semibold">
                      Smart Casual Dress Code
                    </h3>
                  </div>

                  <p className="text-xs text-slate-350 font-light leading-relaxed">
                    To maintain a sophisticated and elegant atmosphere at @Sandton, we kindly ask our guests to observe our smart casual dress code policy.
                  </p>
                  
                  <p className="text-xs text-slate-350 font-light leading-relaxed">
                    This guideline applies to all public venues of the hotel, including the Lobby, Restaurants, Bars, Spa reception, and Club Lounge areas.
                  </p>

                  <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-4.5 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-extrabold tracking-widest text-[#cca472] uppercase font-sans">
                        ✓ APPRECIATED DRESS CODE
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                        Collared polo shirts, dress shirts, smart blouses, tailored trousers, neat designer jeans, elegant knee-length dresses, and appropriate footwear.
                      </p>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div className="space-y-1">
                      <h4 className="text-[10px] font-extrabold tracking-widest text-[#cca472]/60 uppercase font-sans">
                        ✗ PROHIBITED APPAREL
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                        Beachwear, bathrobes, wet clothes, run-down sportswear, gentlemen's sleeveless gym shirts, and hotel guest room slippers.
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] sm:text-xs text-slate-400 italic font-serif leading-relaxed text-center opacity-85 pt-2 pb-1">
                    Thank you for respecting the elegance and charm of our shared spaces.
                  </p>
                </div>

                <div className="pt-2 pb-[10%] w-full flex-shrink-0">
                  <button
                    onClick={() => setShowDressCodeModal(false)}
                    className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-[0.2em] uppercase cursor-pointer"
                  >
                    ACKNOWLEDGE
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Father's Day Package Detailed Modal Sheet */}
        <AnimatePresence>
          {showFathersDayModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFathersDayModal(false)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setShowFathersDayModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#cca472] font-sans">
                      Exclusive Package
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-[#cca472] font-semibold">
                      Father's Day Spa Retreat
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Treat your Father (or yourself) this Father’s Day to our meticulously curated luxury healing retreat. Designed to melt body tension, relieve physical soreness, and restore mental focus.
                  </p>

                  <div className="bg-[#1c1c1c] border border-[#cca472]/20 rounded-2xl p-4 space-y-3.5">
                    <h4 className="text-[10px] font-bold tracking-widest text-[#cca472] uppercase font-sans">
                      What is Included:
                    </h4>
                    
                    <ul className="space-y-2.5 text-xs text-slate-300 font-light">
                      <li className="flex items-start gap-2">
                        <span className="text-[#cca472] font-bold mt-0.5">✦</span>
                        <span><strong>Muscle Tension Release Massage:</strong> 60 minutes of deep-tissue muscle relief using customized oils.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#cca472] font-bold mt-0.5">✦</span>
                        <span><strong>Rosemary-Scalp Nourishment:</strong> 30 minutes of scalp reflexology and therapeutic essential oil application.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#cca472] font-bold mt-0.5">✦</span>
                        <span><strong>Eucalyptus Steam therapy:</strong> Private luxury access to steam bath and heat recovery amenities.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#cca472] font-bold mt-0.5">✦</span>
                        <span><strong>Father's Day Pour:</strong> Complimentary single-malt Scotch whiskey or single-origin hot filter brew in our sensory garden lounge.</span>
                      </li>
                    </ul>

                    <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 uppercase tracking-wider text-[9px]">PACKAGE VALUE</span>
                      <span className="text-[#cca472] font-semibold">ZAR 1,450 / guest</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 pb-[10%] flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowFathersDayModal(false);
                      setChatOpen(true);
                      setChatInput("Hi! I would like to inquire about booking the Father's Day Spa Retreat, please.");
                    }}
                    className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    INQUIRE WITH CHAT
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Selected Promotion Detail Modal Sheet */}
        <AnimatePresence>
          {selectedPromo && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPromo(null)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedPromo(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#cca472] font-sans">
                      Special Promotion
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-semibold">
                      {selectedPromo.title}
                    </h3>
                  </div>

                  {/* Promotion image banner */}
                  <div className="w-full h-36 rounded-xl overflow-hidden border border-white/5 bg-slate-900/40 relative">
                    <img 
                      src={selectedPromo.image_url} 
                      alt={selectedPromo.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {selectedPromo.paragraph}
                  </p>


                </div>

                <div className="pt-4 pb-[10%] flex-shrink-0">
                  <button
                    onClick={() => {
                      const promoTitle = selectedPromo.title;
                      setSelectedPromo(null);
                      setChatOpen(true);
                      setChatInput(`Hi! I'm interested in booking the "${promoTitle}" promotion. Could you help me with that?`);
                    }}
                    className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    INQUIRE WITH CHAT
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FEEDBACK SUBMISSION BOTTOM DRAWER SHEET */}
        <AnimatePresence>
          {showFeedbackModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFeedbackModal(false)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none select-text">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#cca472] font-sans">
                      Share Your Experience
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-semibold">
                      Loved Your Stay?
                    </h3>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Help us protect and elevate @Sandton hospitality standards.
                    </p>
                  </div>

                  <form onSubmit={(e) => {
                    handleFeedbackSubmit(e);
                    setShowFeedbackModal(false);
                  }} className="space-y-5 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs items-center select-none">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">Satisfaction Score</span>
                        <span className="font-mono text-[#cca472] text-sm font-semibold">{feedbackRating} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={feedbackRating}
                        onChange={(e) => setFeedbackRating(parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#cca472]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 block font-sans">REVIEW NOTES</label>
                      <textarea
                        placeholder="Stay experience review note..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full border border-white/5 bg-black/20 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-[#cca472] text-white placeholder-slate-600 transition-all font-light"
                        rows={3}
                      />
                    </div>

                    <div className="pt-2 pb-[10%]">
                      <button
                        type="submit"
                        disabled={feedbackLoading}
                        className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {feedbackLoading ? "SAVING..." : "SUBMIT REVIEW"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* SELECTED RECOMMENDATION (DISCOVER JOBURG) DETAIL BOTTOM SHEET */}
        <AnimatePresence>
          {selectedReco && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReco(null)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedReco(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none select-text font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#cca472] font-sans">
                      Discover Joburg
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-semibold">
                      {selectedReco.title}
                    </h3>
                  </div>

                  {/* Recommendation high-res image banner clickable */}
                  {selectedReco.image_url && (
                    <div 
                      onClick={() => handleRecoImageClick(selectedReco.image_url)}
                      className="w-full h-40 rounded-xl overflow-hidden border border-white/5 bg-slate-900/40 relative cursor-pointer group hover:border-[#cca472]/40 transition-all duration-300"
                      title="Click to view full image"
                    >
                      <img 
                        src={selectedReco.image_url} 
                        alt={selectedReco.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <span className="text-[10px] font-mono tracking-widest text-[#cca472] bg-black/70 px-3 py-1.5 rounded-full border border-[#cca472]/20 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">
                          Open Full Image
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {selectedReco.paragraph}
                  </p>


                </div>

                <div className="pt-4 pb-[10%] flex-shrink-0">
                  {selectedReco.cta_url ? (
                    <button
                      onClick={handleMoreInfoClick}
                      className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer flex items-center justify-center text-center font-bold"
                    >
                      {selectedReco.cta_text || "MORE DETAILS"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const recTitle = selectedReco.title;
                        setSelectedReco(null);
                        setChatOpen(true);
                        setChatInput(`Hi! I'm planning to visit "${recTitle}". Could you recommend some top attractions or dining spots there, or arrange a transfer?`);
                      }}
                      className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer"
                    >
                      INQUIRE WITH CONCIERGE
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FULLSCREEN RECO IMAGE MODAL */}
        <AnimatePresence>
          {fullscreenRecoImage && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.95 }}
                exit={{ opacity: 0 }}
                onClick={() => setFullscreenRecoImage(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 cursor-pointer"
              />
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] max-h-[70%] bg-[#121212] border border-white/10 z-[120] rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2"
              >
                <button
                  type="button"
                  onClick={() => setFullscreenRecoImage(null)}
                  className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1.5 rounded-full bg-black/50 border border-white/10 cursor-pointer z-[130] hover:scale-[1.05]"
                  aria-label="Close image view"
                >
                  <X size={15} />
                </button>
                <img
                  src={fullscreenRecoImage}
                  alt="Full resolution recommendation view"
                  className="max-w-full max-h-[60vh] object-contain select-none rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* LEAVE PORTAL DIRECTORY CONFIRMATION MODAL */}
        <AnimatePresence>
          {showLeaveConfirmation && selectedReco && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLeaveConfirmation(false)}
                className="absolute inset-0 bg-black/80 z-[60]"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="absolute inset-x-8 top-1/2 -translate-y-1/2 bg-[#1c1c1c] border border-white/10 z-[70] rounded-2xl p-5 text-center shadow-2xl space-y-4 max-w-sm mx-auto"
              >
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    You are about to visit an external business website. This website is not operated by or affiliated with the {masterConfig.hotelName || "Sandton Hotel"}.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowLeaveConfirmation(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-350 py-2.5 px-4 rounded-lg text-[10px] tracking-wider uppercase cursor-pointer text-center font-sans font-semibold border border-white/5"
                  >
                    GO BACK
                  </button>
                  <button
                    onClick={handleConfirmLeave}
                    className="flex-1 bg-[#cca472] hover:bg-[#ba9361] text-black font-semibold py-2.5 px-4 rounded-lg text-[10px] tracking-wider uppercase cursor-pointer text-center font-sans"
                  >
                    CONFIRM
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* HOTEL FACILITY BOTTOM DRAWERS */}
        <AnimatePresence>
          {selectedFacility && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedFacility(null)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedFacility(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none select-text font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#cca472] font-sans">
                      {selectedFacility.category || "Hotel Facility"}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-semibold">
                      {selectedFacility.title}
                    </h3>
                  </div>

                  {/* Facility image banner */}
                  <div className="w-full h-40 rounded-xl overflow-hidden border border-white/5 bg-slate-900/40 relative">
                    <img 
                      src={selectedFacility.image_url} 
                      alt={selectedFacility.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {selectedFacility.description || "Experience the absolute peak of bespoke luxury with our customized amenities designed to support your wellness and active lifestyle."}
                  </p>


                </div>

                <div className="pt-4 pb-[10%] flex-shrink-0">
                  <button
                    onClick={() => {
                      const fTitle = selectedFacility.title;
                      setSelectedFacility(null);
                      setChatOpen(true);
                      setChatInput(`Hi! I'm planning to visit the "${fTitle}" facility. Could you assist me with schedules, booking guidelines, or private sessions?`);
                    }}
                    className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    INQUIRE WITH CHAT
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* DINING & RESTAURANT BOTTOM DRAWERS */}
        <AnimatePresence>
          {selectedRestaurant && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRestaurant(null)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedRestaurant(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-4 overflow-y-auto pr-1 scrollbar-none select-text font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#cca472] font-sans">
                      Dining Excellence
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-semibold">
                      {selectedRestaurant.title}
                    </h3>
                  </div>

                  {/* Restaurant image banner */}
                  <div className="w-full h-40 rounded-xl overflow-hidden border border-white/5 bg-slate-900/40 relative">
                    <img 
                      src={selectedRestaurant.image_url} 
                      alt={selectedRestaurant.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {selectedRestaurant.description || "Indulge in a gourmet journey with authentic flavors curated by executive culinary masters at @Sandton."}
                  </p>


                </div>

                <div className="pt-4 pb-[10%] flex-shrink-0">
                  {selectedRestaurant.cta_enabled && selectedRestaurant.cta_url ? (
                    <a
                      href={selectedRestaurant.cta_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer flex items-center justify-center text-center font-bold"
                    >
                      {selectedRestaurant.cta_text || "MAKE A BOOKING"}
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        const rTitle = selectedRestaurant.title;
                        setSelectedRestaurant(null);
                        setChatOpen(true);
                        setChatInput(`Hi! I'd like to book a table at "${rTitle}". Could you help with dining availability, timing slots, or table reservations?`);
                      }}
                      className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-wider uppercase cursor-pointer"
                    >
                      REQUEST RESERVATION
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 2. BOOK LUXURY TRANSFER MODAL SHEET (Image 2) */}
        <AnimatePresence>
          {showTransferModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTransferModal(false)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[90%] relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShuttleSubmitted(false);
                    setShowTransferModal(false);
                    setTransferDestination("");
                  }}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                {shuttleSubmitted ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/20 text-[#cca472] rounded-full flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-[#cca472]" />
                    </div>
                    <div className="space-y-1.5 px-2">
                      <h3 className="font-serif text-base text-white font-semibold">Request Sent</h3>
                      <p className="text-[11px] text-[#cca472] leading-relaxed font-medium font-mono">
                        It has been sent and will be confirmed shortly.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShuttleSubmitted(false);
                          setShowTransferModal(false);
                          setTransferDestination("");
                        }}
                        className="bg-[#cca472] hover:bg-[#ba9361] text-black text-[9px] font-bold uppercase tracking-wider py-2 px-5 rounded-lg cursor-pointer font-sans"
                      >
                        CLOSE
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookTransferSubmit} className="space-y-4 overflow-y-auto pr-1">
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-bold text-[#cca472] uppercase tracking-widest font-sans">
                        Transportation Desk
                      </span>
                      <h3 className="text-xl font-serif text-white font-semibold">
                        Book Luxury Transfer
                      </h3>
                      <p className="text-[10px] text-slate-450 font-light mt-0.5">
                        Complimentary transfer within 5km radius of the hotel.
                      </p>
                    </div>



                    <div className="space-y-1.5 mt-2">
                      <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 block font-sans">
                        DROP-OFF DESTINATION
                      </label>
                      <div className="relative flex items-center">
                        <Search className="absolute left-3.5 text-slate-505" size={15} style={{ color: '#6A6F7C' }} />
                        <input
                          type="text"
                          placeholder="Search popular hubs or type address..."
                          value={transferDestination}
                          onChange={(e) => {
                            setTransferDestination(e.target.value);
                            setIsDistanceAutoEstimated(true); // resume auto-estimation as soon as they type
                          }}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-24 text-xs text-white focus:outline-none focus:border-[#cca472] font-light"
                          required
                        />
                        {transferDestination ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(transferDestination + ", Sandton, Johannesburg")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 px-2.5 py-1.5 rounded-lg bg-[#cca472]/10 hover:bg-[#cca472]/20 border border-[#cca472]/35 text-[#cca472] hover:text-[#ba9361] transition-all flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-wider cursor-pointer"
                            title="Verify destination coordinates on outer map"
                          >
                            <MapPin size={10} />
                            <span>Map</span>
                          </a>
                        ) : (
                          <div className="absolute right-3 text-[9px] font-mono text-slate-500 flex items-center gap-1 font-semibold select-none">
                            <MapPin size={10} className="opacity-40" />
                            <span>Map Search</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Popular Quick-Select Destination Tags */}
                      <div className="pt-1 select-none">
                        <span className="text-[8.5px] font-mono text-[#cca472]/85 uppercase tracking-wider block mb-1.5 text-left font-bold">
                          🎯 Suggested Premium Landmarks:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-[82px] overflow-y-auto pr-0.5 custom-scrollbar">
                          {POPULAR_DESTINATIONS.map((d) => {
                            const isSelected = transferDestination.toLowerCase().trim() === d.name.toLowerCase().trim();
                            return (
                              <button
                                key={d.name}
                                type="button"
                                onClick={() => {
                                  setTransferDestination(d.name);
                                  setCalcDistance(String(d.km));
                                  setIsDistanceAutoEstimated(true);
                                }}
                                className={cn(
                                  "px-2 py-0.5 rounded-md text-[8.5px] font-sans transition-all border cursor-pointer flex items-center gap-0.5",
                                  isSelected
                                    ? "bg-[#cca472]/20 border-[#cca472] text-[#cca472] font-semibold"
                                    : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                              >
                                {d.name} <span className="font-mono text-[7.5px] opacity-75">({d.km} km)</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 block font-sans">
                          DEPARTURE DATE
                        </label>
                        <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5">
                          <input
                            type="date"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#cca472] text-white font-light font-mono scheme-dark"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 block font-sans">
                          DEPARTURE TIME
                        </label>
                        <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5">
                          <input
                            type="time"
                            value={transferTime}
                            onChange={(e) => setTransferTime(e.target.value)}
                            className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#cca472] text-white font-light font-mono scheme-dark"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 block font-sans">
                        TRIP TYPE
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-[#1c1c1c] p-1 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setIsReturnTrip(true)}
                          className={cn(
                            "py-2 rounded-lg text-center font-sans text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all duration-200",
                            isReturnTrip
                              ? "bg-[#cca472] text-black font-extrabold shadow-md"
                              : "text-slate-400 hover:text-white bg-transparent"
                          )}
                        >
                          Return Trip
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsReturnTrip(false)}
                          className={cn(
                            "py-2 rounded-lg text-center font-sans text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all duration-200",
                            !isReturnTrip
                              ? "bg-[#cca472] text-black font-extrabold shadow-md"
                              : "text-slate-400 hover:text-white bg-transparent"
                          )}
                        >
                          One-Way Only
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 block font-sans font-semibold">
                        NUMBER OF PASSENGERS
                      </label>
                      <div className="bg-[#1c1c1c] border border-white/5 rounded-xl py-2.5 px-4 flex justify-between items-center bg-transparent bg-white/[0.01]">
                        <div className="flex items-center gap-2.5 text-xs text-white">
                          <User size={15} className="text-[#cca472]" />
                          <span className="font-semibold text-[11px]">{shuttleTravellers} Guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={shuttleTravellers <= 1}
                            onClick={() => setShuttleTravellers(shuttleTravellers - 1)}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center select-none active:scale-90 font-bold disabled:opacity-[0.2] cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setShuttleTravellers(shuttleTravellers + 1)}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center select-none active:scale-90 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* MINIMALIST TRIP PRICE GUESTIMATE */}
                    {(() => {
                      const calcData = getCalculateTripData();
                      return (
                        <>
                          {/* AFTER-HOURS SERVICES STATUS SECTION */}
                          {calcData.isAfterHours && (
                            <div className="border border-amber-500/25 bg-amber-500/[0.04] rounded-xl p-3 space-y-1 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider font-sans">
                                  🌙 AFTER-HOURS SURCHARGE
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-normal">
                                Bookings between 22:00 and 05:00 are subject to surcharge.
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <p className="text-[9px] text-slate-500 leading-normal font-light">
                      Departures leave from the lobby. Surcharges for extended single-trip limits beyond 10km return are room-billed.
                    </p>

                    {/* SUBJECT TO AVAILABILITY REMINDER */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-start gap-2.5 text-left">
                      <Clock size={14} className="text-[#cca472] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-[#cca472] uppercase tracking-wider font-sans block">
                          Subject to Availability Reminder
                        </span>
                        <p className="text-[9px] text-slate-400 leading-normal font-light">
                          All luxury transfers and express shuttles are subject to vehicle and driver availability. We recommend booking in advance.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 pb-[10%]">
                      <button
                        type="submit"
                        disabled={shuttleLoading}
                        className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Car size={14} /> REQUEST TRANSFER
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* BOOK A SELF-DRIVE MODAL SHEET */}
        <AnimatePresence>
          {showSelfDriveModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSelfDriveModal(false)}
                className="absolute inset-0 bg-black z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 22, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 bg-[#181818] border-t border-white/10 z-50 rounded-t-[32px] p-6 text-left shadow-2xl flex flex-col justify-between max-h-[85%] relative"
              >
                <button
                  type="button"
                  onClick={() => setShowSelfDriveModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="space-y-5 overflow-y-auto pr-1">
                  <div className="space-y-1">
                    {/* Header group */}
                    <h3 className="text-xl font-serif text-white font-semibold">
                      Book a Self-drive
                    </h3>
                    <p className="text-[10px] text-slate-400 font-light mt-0.5 pr-[50px]">
                      Explore Johannesburg at your own pace with self-drive options.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2.5">
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        Through our alliance with <strong className="font-bold">Hertz South Africa</strong>, guests can seamlessly book standard, luxury, or electric self-drive vehicles.
                      </p>
                      <ul className="space-y-1.5 text-[11px] text-slate-400 font-light">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-[#cca472] shrink-0" />
                          <span>Direct pickup & delivery options at hotel outer arrivals</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-[#cca472] shrink-0" />
                          <span>Fully insured vehicles with 24/7 Hertz roadside assistance</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-[#cca472] shrink-0" />
                          <span>GPS packages and infant seat configurations upon request</span>
                        </li>
                      </ul>
                    </div>

                    {/* This section can only be updated on Recos */}
                  </div>

                  <div className="pt-4 pb-6">
                    <a
                      href="https://www.hertz.co.za/?step=search-results"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#cca472] hover:bg-[#ba9361] text-black font-bold py-3.5 rounded-xl text-[10px] tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center select-none shadow-md"
                    >
                      <span>Book Now</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. CONCIERGE CHAT BOTTOM DRAWER MODAL (Image 3) */}
        <AnimatePresence>
          {chatOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setChatOpen(false)}
                className="absolute inset-0 bg-black/70 z-45"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="absolute top-[10%] bottom-0 left-0 right-0 bg-[#121212] z-50 shadow-2xl flex flex-col justify-between overflow-hidden rounded-t-3xl border-t border-white/10"
              >
                {/* Header structure like image 3 */}
                <header className="px-5 py-4.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-[#cca472] text-black flex items-center justify-center shadow-md">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif text-[18px] text-white font-semibold flex items-center gap-1.5">Concierge</h3>
                      <p className="text-[10px] tracking-[0.15em] text-[#cca472] font-sans uppercase font-bold">
                        ALWAYS AT YOUR SERVICE
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setChatOpen(false)}
                    className="w-9 h-9 bg-white/5 hover:bg-white/12 text-slate-300 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X size={18} />
                  </button>
                </header>

                {/* Auxiliary Pills row below chat header */}
                <div className="px-4 py-3 border-b border-white/10 flex gap-2.5 overflow-x-auto scrollbar-none select-none bg-black/20 flex-shrink-0">
                  <button
                    onClick={handleMedicalEmergency}
                    className="flex-shrink-0 border border-red-500/30 text-red-400 text-xs tracking-wide font-bold uppercase rounded-full px-3.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 select-none active:scale-95 transition-all"
                  >
                    🆘 MEDICAL EMERGENCY
                  </button>
                  <button
                    onClick={handleChatWithManager}
                    className="flex-shrink-0 border border-[#cca472]/30 text-[#cca472] text-xs tracking-wide font-bold uppercase rounded-full px-3.5 py-1.5 bg-[#cca472]/5 hover:bg-[#cca472]/15 select-none active:scale-95 transition-all"
                  >
                    💬 CHAT WITH MANAGER
                  </button>
                </div>

                {/* EMERGENCY BROADCAST ALERT BANNER POPUP */}
                {emergencyMode && !dismissedEmergency && (
                  <div className="bg-red-950/95 border-b border-red-500/50 p-4 flex items-start gap-3.5 text-left animate-fade-in flex-shrink-0 relative" id="chat-emergency-popup">
                    <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-500/30 flex items-center justify-center text-lg shrink-0 animate-pulse">
                      🚨
                    </div>
                    <div className="flex-1 space-y-1 pr-6">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
                        Central Emergency Broadcast
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-550 animate-ping" />
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-normal font-light">
                        The luxury frontoffice desk has declared an active facility alarm. Emergency protocol instructions are active. Please preserve immediate standby in your room and watch for live updates.
                      </p>
                    </div>
                    <button
                      onClick={() => setDismissedEmergency(true)}
                      className="absolute top-3.5 right-3.5 w-6 h-6 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Message lists canvas with minimum 16px font sizes */}
                <div className="flex-1 p-5 overflow-y-auto space-y-5 flex flex-col bg-[#181818] scrollbar-none text-left select-text">
                  {chatLogs
                    .filter((msg) => !msg.roomNumber || String(msg.roomNumber) === String(guestSession?.roomNumber || "0"))
                    .map((msg, idx) => {
                    const isStaff = msg.role !== "user";
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "max-w-[88%] rounded-2xl p-4 text-base text-left leading-relaxed space-y-1.5 shadow-md transition-all",
                          isStaff
                            ? "bg-black text-slate-100 self-start border border-[#cca472]/85"
                            : "bg-[#cca472] text-black self-end rounded-tr-none font-medium"
                        )}
                      >
                        <div className={cn("flex items-center justify-between text-xs font-mono uppercase pb-1", isStaff ? "text-[#cca472]" : "text-black/60")}>
                          <span className="font-bold">{msg.senderName || (isStaff ? "Guest Assistant" : "Guest")}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed text-base">{msg.content}</p>
                      </div>
                    );
                  })}

                  {chatAwaitingResponse && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 max-w-[20%] self-start flex space-x-1.5 items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#cca472] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-[#cca472] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-[#cca472] animate-bounce" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Drawer query send action footer */}
                <div className="p-4.5 bg-white/[0.01] border-t border-white/10 flex-shrink-0">
                  {!currentShiftOpen ? (
                    <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-1 text-center">
                      <p className="text-sm text-amber-400 font-semibold font-sans uppercase tracking-wider">
                        SHIFT IS CURRENTLY CLOSED
                      </p>
                      <p className="text-xs text-slate-355 font-light leading-relaxed">
                        General manager on standby dispatch. For support, dial <span className="text-[#cca472] font-mono font-bold">+27 11 123 4567</span> directly.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 justify-start">
                        {quickQuestions.map((q, qidx) => (
                          <button
                            key={qidx}
                            type="button"
                            onClick={() => handleSendQuickQuestion(q)}
                            className="bg-[#181818] border border-white/5 hover:border-[#cca472]/40 hover:bg-[#202020] rounded-full px-3.5 py-2.5 text-[11px] text-slate-300 font-sans tracking-wide transition-all cursor-pointer select-none active:scale-95 text-center leading-none shadow-sm"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                      <form onSubmit={handleSendChatMessage} className="flex gap-2">
                         <input
                          type="text"
                          placeholder="How can we assist you today?"
                          value={chatInput}
                          disabled={chatAwaitingResponse}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#cca472] text-white placeholder-slate-500 transition-all font-light"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || chatAwaitingResponse}
                          className="bg-[#cca472] hover:bg-[#ba9361] text-black w-12 h-12 rounded-xl cursor-pointer disabled:opacity-30 transition-all flex items-center justify-center shadow-md flex-shrink-0"
                        >
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
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
