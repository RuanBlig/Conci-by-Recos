import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import mammoth from "mammoth";

let bootupPhaseActive = true;

const firebaseConfigPath = process.env.FIREBASE_CONFIG_PATH || "./firebase-applet-config.json";
let firebaseConfig: any = null;
try {
  const absoluteConfigPath = path.resolve(firebaseConfigPath);
  if (fs.existsSync(absoluteConfigPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(absoluteConfigPath, "utf-8"));
  } else {
    console.warn(`[FIRESTORE] Config file not found at ${absoluteConfigPath}`);
  }
} catch (err) {
  console.error("[FIRESTORE] Failed to load/parse firebase config:", err);
}

let db: any = null;
if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("[FIRESTORE] Standard Firestore initialized successfully with database ID:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("[FIRESTORE] Error initializing app/database:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // In-memory staff login credentials
  let staffLogons = [
    { name: "Sibusiso Zulu", whatsApp: "+27821234567", role: "manager", username: "manager", password: "password123" },
    { name: "Super Admin", whatsApp: "+27829999999", role: "admin", username: "admin", password: "password456" },
    { name: "Dumi Ncube", whatsApp: "+27821112222", role: "staff", username: "staff", password: "password789" },
    { name: "Tshepo Reco", whatsApp: "+27823334444", role: "recos", username: "recos", password: "passwordabc" }
  ];

  // In-memory hotel state
  const masterConfig = {
    hotelName: "Sandton Hotel",
    logoUrl: "https://sandton-hotel.com/wp-content/uploads/2026/05/Untitled-design-2.png",
    conciergeKb: "Welcome to Sandton Hotel Concierge. We offer luxury suites, a heated sky pool, 24/7 fitness gymnasium, and fine dining at our Clubhouse Restaurant. Our shuttle runs to OR Tambo, Lanseria, and local private airstrips.",
    feedbackUrl: "https://sandton-hotel.com/feedback",
    nightshift: false,
    opHoursMorning: "06:00 AM - 11:30 AM",
    opHoursAfternoon: "12:00 PM - 05:00 PM",
    opHoursNight: "06:00 PM - 11:00 PM",
    opHoursLimitEnabled: true,
    opHoursConstraint: "Strictly active",
    alertPopupActive: false,
    alertPopupHeader: "Scheduled Maintenance",
    alertPopupBody: "Pool will be closed for maintenance today.",
    alertBannerActive: false,
    alertBannerText: "Happy Father's Day Dads!"
  };

  const masterPromotions = [
    {
      id: "1",
      title: "Clubhouse Fixture",
      paragraph: "Join us at the Clubhouse as we bring the atmosphere, the flavour and the big game energy to every South African fixture during the FIFA World Cup 🇿🇦🔥",
      image_url: "https://sandton-hotel.com/wp-content/uploads/2026/05/Untitled-design-1.png",
      cta_text: "Make a Booking",
      cta_url: "https://www.dineplan.com/restaurants/sandton-hotel-restaurant"
    },
    {
      id: "2",
      title: "Father's Day Spit Braai",
      paragraph: "Celebrate Father’s Day at @SandtonHotel with a relaxed afternoon filled with great food, family time and a proper spit braai experience. While dad enjoys a well-deserved break, the kids can swim and play.",
      image_url: "https://sandton-hotel.com/wp-content/uploads/2026/05/@Sandton-Fathers-Day-IG-1080x1350-1.jpg",
      cta_text: "Make a Booking",
      cta_url: "https://www.dineplan.com/restaurants/sandton-hotel-restaurant"
    }
  ];

  const masterFacilities = [
    {
      id: "fac-1",
      title: "The Sky Pool",
      description: "Heated infinity pool with panoramic Johannesburg city views, open daily.",
      image_url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80",
      category: "Swimming"
    },
    {
      id: "fac-2",
      title: "Gym & Fitness",
      description: "State-of-the-art weights, cardio, and training equipment open 24/7.",
      image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80",
      category: "Fitness"
    },
    {
      id: "fac-3",
      title: "Aura Wellness Spa",
      description: "Treat yourself to luxury organic therapeutics, massotherapy, and bio-beauty treatments.",
      image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80",
      category: "Wellness"
    },
    {
      id: "fac-4",
      title: "Indoor Heated Lap Pool",
      description: "A secluded pool climate-regulated for deep relaxation and laps at your convenience.",
      image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80",
      category: "Swimming"
    }
  ];

  const masterRestaurants = [
    {
      id: "r-1",
      title: "Clubhouse Restaurant & Bar",
      description: "Elegant fine dining overlooking the golf course, with high ceilings and cozy fire places.",
      image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
      cta_enabled: true,
      cta_text: "Make a Booking",
      cta_url: "https://www.dineplan.com/restaurants/sandton-hotel-restaurant",
      subsections: [
        {
          id: "sub-1",
          title: "The Clubhouse Lounge",
          description: "Relaxed atmosphere with hand-styled drinks.",
          timings: [
            { id: "time-1", name: "Breakfast", openTime: "06:00", closeTime: "11:00" },
            { id: "time-2", name: "Dinner", openTime: "18:00", closeTime: "22:00" }
          ]
        },
        {
          id: "sub-2",
          title: "The Cigar Bar",
          description: "A customized ambient bar offering premium quality cubans.",
          timings: [
            { id: "time-3", name: "After Hours", openTime: "21:00", closeTime: "02:00" }
          ]
        }
      ]
    }
  ];

  const masterRecos = [
    {
      id: "reco-1",
      title: "Nelson Mandela Square",
      paragraph: "Joburg's finest dining destination, situated in the heart of Sandton. Paying homage to one of the world's greatest men, our symbol of freedom and African pride.",
      image_url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80",
      cta_text: "More Info",
      cta_url: "https://www.google.com/maps/search/Nelson+Mandela+Square",
      is_featured: true
    },
    {
      id: "reco-2",
      title: "Apartheid Museum",
      paragraph: "The Apartheid Museum opened in 2001 and is acknowledged as the pre-eminent museum in the world dealing with 20th century South Africa.",
      "image_url": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80",
      cta_text: "More Info",
      cta_url: "https://www.apartheidmuseum.org/",
      is_featured: true
    },
    {
      id: "reco-3",
      title: "Fine Dining: Marble",
      paragraph: "Authentic contemporary grill with stunning vistas of the Johannesburg skyline.",
      image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80",
      cta_text: "Book A Table",
      cta_url: "https://marble.restaurant/",
      is_featured: false
    }
  ];

  // Transactions logs/state
  const tasks: any[] = [
    {
      id: "task-1",
      title: "Fresh linens & towels requested",
      room: "104",
      status: "received",
      createdAt: Date.now() - 360 * 1000,
      informedDept: "Housekeeping",
      details: {}
    },
    {
      id: "task-2",
      title: "Airport luxury transit shuttle",
      room: "205",
      status: "in_progress",
      createdAt: Date.now() - 1500 * 1000,
      actionedAt: Date.now() - 1200 * 1000,
      claimedBy: "Dumi Ncube",
      informedDept: "Concierge",
      details: {
        flightNumber: "SA314",
        dateTime: "2026-06-05T20:00",
        route: "OR Tambo",
        travellers: 2,
        vehicle: "Executive SUV"
      }
    },
    {
      id: "task-3",
      title: "In-room champagne set up",
      room: "302",
      status: "completed",
      createdAt: Date.now() - 3600 * 1000,
      actionedAt: Date.now() - 3200 * 1000,
      completedAt: Date.now() - 2400 * 1000,
      claimedBy: "Sibusiso Zulu",
      completedBy: "Sibusiso Zulu",
      informedDept: "F&B",
      details: {}
    }
  ];

  const feedbackLogs: any[] = [
    {
      id: "feedback-1",
      rating: 9,
      text: "Extremely seamless digital portal! The sky pool was marvelous, heated perfectly in the Joburg cold.",
      roomNumber: "302",
      guestName: "Sipho Khumalo",
      timestamp: new Date().toISOString()
    },
    {
      id: "feedback-2",
      rating: 4,
      text: "The fitness gym has great dumbbells but the treadmill belt in high speed is loose and slips. Please check.",
      roomNumber: "104",
      guestName: "Sarah Jenkins",
      timestamp: new Date(Date.now() - 1800 * 1000).toISOString()
    },
    {
      id: "feedback-3",
      rating: 2,
      text: "Waited 45 mins for fresh towels. Called three times but receptionist said they were busy.",
      roomNumber: "201",
      guestName: "Lerato Modise",
      timestamp: new Date(Date.now() - 7200 * 1000).toISOString()
    }
  ];

  const nowISO = new Date().toISOString().split("T")[0];
  const recoInteractions: any[] = [
    { id: "log-1", type: "impression", recoId: "reco-1", guestName: "Sarah Jenkins", roomNumber: "104", timestamp: `${nowISO}T10:00:00.000Z` },
    { id: "log-2", type: "impression", recoId: "reco-1", guestName: "Sipho Khumalo", roomNumber: "302", timestamp: `${nowISO}T10:15:00.000Z` },
    { id: "log-3", type: "click", recoId: "reco-1", guestName: "Sipho Khumalo", roomNumber: "302", timestamp: `${nowISO}T10:16:00.000Z` },
    { id: "log-4", type: "click", recoId: "reco-1", guestName: "Sipho Khumalo", roomNumber: "302", timestamp: `${nowISO}T11:00:00.000Z` },
    { id: "log-5", type: "impression", recoId: "reco-2", guestName: "Sarah Jenkins", roomNumber: "104", timestamp: `${nowISO}T11:30:00.000Z` },
    { id: "log-6", type: "impression", recoId: "reco-2", guestName: "Lerato Modise", roomNumber: "201", timestamp: `${nowISO}T12:00:00.000Z` },
    { id: "log-7", type: "click", recoId: "reco-2", guestName: "Sarah Jenkins", roomNumber: "104", timestamp: `${nowISO}T12:05:00.050Z` },
    { id: "log-8", type: "impression", recoId: "reco-3", guestName: "Sipho Khumalo", roomNumber: "302", timestamp: `${nowISO}T14:15:00.000Z` },
    { id: "log-9", type: "click", recoId: "reco-3", guestName: "Sipho Khumalo", roomNumber: "302", timestamp: `${nowISO}T14:16:00.000Z` }
  ];

  let emergencyMode = false;
  const chatbotStatus: Record<string, boolean> = {
    "104": true,
    "205": false,
    "302": true
  };

  const chatMessages: any[] = [
    {
      role: "assistant",
      content: "Hello Sarah Jenkins! Welcome to Sandton Hotel. How can I help you today?",
      timestamp: new Date(Date.now() - 3600 * 1000).toLocaleTimeString(),
      senderName: "Guest Assistant",
      roomNumber: "104"
    },
    {
      role: "user",
      content: "Hi, can you send some fresh towels up to Room 104?",
      timestamp: new Date(Date.now() - 400 * 1000).toLocaleTimeString(),
      senderName: "Sarah Jenkins",
      roomNumber: "104"
    },
    {
      role: "assistant",
      content: "Of course! I have created a request to send fresh linen and towels up to Room 104. Housekeeping is on it.",
      timestamp: new Date(Date.now() - 360 * 1000).toLocaleTimeString(),
      senderName: "Guest Assistant",
      roomNumber: "104"
    },
    {
      role: "assistant",
      content: "Hello Dumi Ncube! Welcome to Sandton Hotel. How can I help you today?",
      timestamp: new Date(Date.now() - 7200 * 1000).toLocaleTimeString(),
      senderName: "Guest Assistant",
      roomNumber: "205"
    },
    {
      role: "user",
      content: "We need an airport shuttle booked for tonight.",
      timestamp: new Date(Date.now() - 1500 * 1000).toLocaleTimeString(),
      senderName: "Dumi Ncube",
      roomNumber: "205"
    },
    {
      role: "assistant",
      content: "Sure! Please fill out the booking form in our Shuttle tab, or I can help you set it up. I have notified our Concierge desk to assist.",
      timestamp: new Date(Date.now() - 1480 * 1000).toLocaleTimeString(),
      senderName: "Guest Assistant",
      roomNumber: "205"
    }
  ];

  // --- BOOT GUARD STARTUP & LOCAL BACKUP HANDLERS ---
  const configDbPath = path.resolve("./chats_db.json");
  const defaultDbData = {
    chats: [],
    tasks: [],
    staffLogons: [],
    emergency: null,
    departments: ["Housekeeping", "Concierge", "Spa", "Butlers"]
  };
  if (!fs.existsSync(configDbPath) || fs.statSync(configDbPath).size === 0) {
    fs.writeFileSync(configDbPath, JSON.stringify(defaultDbData, null, 2), "utf8");
    console.log("[BOOT] Created or re-initialized default chats_db.json.");
  }

  let localBackupData: any = {};
  try {
    const fileContent = fs.readFileSync(configDbPath, "utf8").trim();
    if (fileContent) {
      localBackupData = JSON.parse(fileContent);
      console.log("[BOOT] Loaded data from local chats_db.json successfully.");
    } else {
      localBackupData = defaultDbData;
    }
  } catch (err) {
    console.error("[BOOT] Failed to parse chats_db.json, using defaults:", err);
    localBackupData = defaultDbData;
  }

  // Populate in-memory arrays from local backup (if they exist in localBackupData)
  if (Array.isArray(localBackupData.tasks)) {
    tasks.length = 0;
    tasks.push(...localBackupData.tasks);
  }
  if (Array.isArray(localBackupData.staffLogons)) {
    staffLogons.length = 0;
    staffLogons.push(...localBackupData.staffLogons);
  }
  if (localBackupData.emergency !== undefined) {
    emergencyMode = !!localBackupData.emergency;
  }
  if (Array.isArray(localBackupData.feedbackLogs)) {
    feedbackLogs.length = 0;
    feedbackLogs.push(...localBackupData.feedbackLogs);
  }
  if (Array.isArray(localBackupData.recoInteractions)) {
    recoInteractions.length = 0;
    recoInteractions.push(...localBackupData.recoInteractions);
  }
  if (localBackupData.chatbotStatus) {
    Object.assign(chatbotStatus, localBackupData.chatbotStatus);
  }
  
  // Handle parsing of chats/chatMessages securely
  if (Array.isArray(localBackupData.chats)) {
    const hasNestedMessages = localBackupData.chats.some((c: any) => c && Array.isArray(c.messages));
    if (hasNestedMessages) {
      const flat: any[] = [];
      for (const chatThread of localBackupData.chats) {
        if (chatThread && Array.isArray(chatThread.messages)) {
          for (const msg of chatThread.messages) {
            flat.push({
              ...msg,
              roomNumber: msg.roomNumber || chatThread.roomNumber || "0",
              senderName: msg.senderName || chatThread.guestName,
            });
          }
        }
      }
      chatMessages.length = 0;
      chatMessages.push(...flat);
    } else {
      chatMessages.length = 0;
      chatMessages.push(...localBackupData.chats);
    }
  } else if (Array.isArray(localBackupData.chatMessages)) {
    chatMessages.length = 0;
    chatMessages.push(...localBackupData.chatMessages);
  }

  let loadedFromFirestore = false;
  if (db) {
    try {
      console.log("[BOOT] Attempting to read hotel_info from Firestore...");
      const docRef = doc(db, "hotels", "_sandton", "knowledge", "hotel_info");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        if (firestoreData && (firestoreData.config || firestoreData.promotions || firestoreData.facilities || firestoreData.restaurants || firestoreData.recos)) {
          console.log("[BOOT] Successfully read hotel information from Firestore!");
          
          if (firestoreData.config) {
            for (const key in masterConfig) {
              delete (masterConfig as any)[key];
            }
            Object.assign(masterConfig, firestoreData.config);
          }
          if (Array.isArray(firestoreData.promotions)) {
            masterPromotions.length = 0;
            masterPromotions.push(...firestoreData.promotions);
          }
          if (Array.isArray(firestoreData.facilities)) {
            masterFacilities.length = 0;
            masterFacilities.push(...firestoreData.facilities);
          }
          if (Array.isArray(firestoreData.restaurants)) {
            masterRestaurants.length = 0;
            masterRestaurants.push(...firestoreData.restaurants);
          }
          if (Array.isArray(firestoreData.recos)) {
            masterRecos.length = 0;
            masterRecos.push(...firestoreData.recos);
          }
          
          loadedFromFirestore = true;
        }
      }
    } catch (err) {
      console.error("[FIRESTORE FALLBACK] Serving from local in-memory state. Boot read failed:", err);
    }
  }

  if (!loadedFromFirestore) {
    console.log("[BOOT] No Firestore data found, loading from local backup");
    
    if (localBackupData.config) {
      for (const key in masterConfig) {
        delete (masterConfig as any)[key];
      }
      Object.assign(masterConfig, localBackupData.config);
    }
    if (Array.isArray(localBackupData.promotions)) {
      masterPromotions.length = 0;
      masterPromotions.push(...localBackupData.promotions);
    }
    if (Array.isArray(localBackupData.facilities)) {
      masterFacilities.length = 0;
      masterFacilities.push(...localBackupData.facilities);
    }
    if (Array.isArray(localBackupData.restaurants)) {
      masterRestaurants.length = 0;
      masterRestaurants.push(...localBackupData.restaurants);
    }
    if (Array.isArray(localBackupData.recos)) {
      masterRecos.length = 0;
      masterRecos.push(...localBackupData.recos);
    }
  }

  bootupPhaseActive = false;
  console.log("[BOOT] Boot phase complete. Writes now enabled.");

  function saveToChatsDb() {
    const dbPath = path.resolve("./chats_db.json");
    let originalDbContent: any = {};
    if (fs.existsSync(dbPath)) {
      try {
        const fileContent = fs.readFileSync(dbPath, "utf8").trim();
        if (fileContent) {
          originalDbContent = JSON.parse(fileContent);
        }
      } catch (err) {
        console.error("Error reading db content:", err);
      }
    }
    const dataToSave = {
      ...originalDbContent,
      chats: chatMessages,
      tasks: tasks,
      staffLogons: staffLogons,
      emergency: emergencyMode,
      departments: ["Housekeeping", "Concierge", "Spa", "Butlers"],
      config: masterConfig,
      promotions: masterPromotions,
      facilities: masterFacilities,
      restaurants: masterRestaurants,
      recos: masterRecos
    };
    const tempPath = dbPath + ".tmp";
    try {
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), "utf8");
      fs.renameSync(tempPath, dbPath);
    } catch (err) {
      console.error("[LOCAL BACKUP] Error writing to chats_db.json atomic:", err);
    }
  }

  async function saveSectionToFirestore(section: string, data: any) {
    if (bootupPhaseActive) {
      console.warn("[BOOT GUARD] Write blocked during initialisation — skipping.");
      return false;
    }
    if (db) {
      try {
        const docRef = doc(db, "hotels", "_sandton", "knowledge", "hotel_info");
        await setDoc(docRef, {
          [section]: data,
          updatedAt: Date.now()
        }, { merge: true });
        console.log(`[FIRESTORE] Saved section ${section} successfully.`);
      } catch (err) {
        console.error("[FIRESTORE FALLBACK] Serving from local in-memory state. Write to Firestore failed:", err);
      }
    } else {
      console.warn("[FIRESTORE FALLBACK] Serving from local in-memory state. Firestore not initialized.");
    }
    
    saveToChatsDb();
    return true;
  }

  // Disable aggressive caching for API routes
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Endpoints
  // GET /api/sync - returns all configuration and collections
  app.get("/api/sync", (req, res) => {
    return res.json({
      success: true,
      masterConfig,
      masterPromotions,
      masterFacilities,
      masterRestaurants,
      masterRecos,
      tasks,
      feedbackLogs,
      chatMessages,
      recoInteractions,
      emergencyMode,
      chatbotStatus,
      staffLogons
    });
  });

  // Guest Check-In
  app.post("/api/chat/checkin", (req, res) => {
    const { roomNumber, surname, salutation } = req.body;
    
    const parsedRoom = parseInt(roomNumber, 10);
    if (isNaN(parsedRoom)) {
      return res.status(400).json({ success: false, error: "Room number must be a valid integer." });
    }
    
    if (!surname || typeof surname !== "string" || surname.trim() === "") {
      return res.status(400).json({ success: false, error: "Surname is required." });
    }

    // Standardize salutation with a dot if missing, e.g. "Mr" -> "Mr.", "Mrs" -> "Mrs.", etc.
    let finalSalutation = "";
    if (salutation && typeof salutation === "string") {
      const trimmedSal = salutation.replace(".", "").trim();
      if (trimmedSal) {
        finalSalutation = trimmedSal + ".";
      }
    }

    const guestName = finalSalutation ? `${finalSalutation} ${surname.trim()}` : surname.trim();

    return res.json({ 
      success: true, 
      guestName: guestName, 
      roomNumber: parsedRoom.toString() 
    });
  });

  // Manager Username + Password verification (supports returning high-fidelity roles)
  app.post("/api/auth/manager", (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required." });
    }

    const matched = staffLogons.find(
      (u) => u && typeof u.username === "string" && typeof username === "string" && u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (matched) {
      return res.json({ success: true, username: matched.name || matched.username, role: matched.role });
    } else {
      return res.status(401).json({ success: false, error: "Invalid username or password." });
    }
  });

  // POST /api/sync/tasks/new
  app.post("/api/sync/tasks/new", (req, res) => {
    const { title, room, informedDept, details } = req.body;
    if (!title || !room) {
      return res.status(400).json({ success: false, error: "Missing required task fields." });
    }
    const newTask = {
      id: `task-${Date.now()}`,
      title,
      room,
      status: "received",
      createdAt: Date.now(),
      informedDept: informedDept || "Concierge",
      details
    };
    tasks.push(newTask);
    saveToChatsDb();
    console.log("[SERVER] Task added successfully:", newTask);
    return res.json({ success: true, task: newTask });
  });

  // PUT /api/sync/tasks/:id (Handles claims and completions)
  app.put("/api/sync/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { status, actionedAt, completedAt, claimedBy, completedBy, informedDept, resolutionNote } = req.body;
    
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found." });
    }
    
    if (status !== undefined) task.status = status;
    if (actionedAt !== undefined) task.actionedAt = actionedAt;
    if (completedAt !== undefined) task.completedAt = completedAt;
    if (claimedBy !== undefined) task.claimedBy = claimedBy;
    if (completedBy !== undefined) task.completedBy = completedBy;
    if (informedDept !== undefined) task.informedDept = informedDept;
    if (resolutionNote !== undefined) task.resolutionNote = resolutionNote;
    
    saveToChatsDb();
    console.log("[SERVER] Task updated successfully:", task);
    return res.json({ success: true, task });
  });

  // POST /api/feedback
  app.post("/api/feedback", (req, res) => {
    const { rating, text, roomNumber, guestName, timestamp } = req.body;
    if (rating === undefined) {
      return res.status(400).json({ success: false, error: "Rating is required." });
    }
    const feedback = {
      id: `feedback-${Date.now()}`,
      rating,
      text: text || "",
      roomNumber: roomNumber || "000",
      guestName: guestName || "Anonymous",
      timestamp: timestamp || new Date().toISOString()
    };
    feedbackLogs.push(feedback);
    saveToChatsDb();
    console.log("[SERVER] Feedback recorded:", feedback);
    return res.json({ success: true, feedback });
  });

  // POST /api/sync/recos (Impressions / Clicks logging)
  app.post("/api/sync/recos", (req, res) => {
    const { type, recoId, guestName, roomNumber, timestamp } = req.body;
    if (!type || !recoId) {
      return res.status(400).json({ success: false, error: "Type and recoId are required." });
    }
    const log = {
      id: `interaction-${Date.now()}`,
      type,
      recoId,
      guestName: guestName || "Anonymous",
      roomNumber: roomNumber || "000",
      timestamp: timestamp || new Date().toISOString()
    };
    recoInteractions.push(log);
    saveToChatsDb();
    console.log(`[SERVER] Reco Interaction [${type.toUpperCase()}] logged:`, log);
    return res.json({ success: true });
  });

  // Helper to dynamically repair truncated or malformed JSON returned by LLM APIs
  function repairJson(jsonStr: string): string {
    let str = jsonStr.trim();
    if (!str) return "{}";

    // Balance quotes first
    let inQuote = false;
    let escaped = false;
    let cleanStr = "";

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '\\' && !escaped) {
        escaped = true;
        cleanStr += char;
        continue;
      }
      if (char === '"' && !escaped) {
        inQuote = !inQuote;
      }
      escaped = false;
      cleanStr += char;
    }

    // If we ended inside an open quote, safely close it
    if (inQuote) {
      cleanStr += '"';
    }

    // Clean up trailing punctuation if the JSON was cut off
    cleanStr = cleanStr.trim();
    if (cleanStr.endsWith(":")) {
      cleanStr += ' ""';
    }
    if (cleanStr.endsWith(",")) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 1).trim();
    }

    // Now let's balance braces and brackets
    const openBraces: string[] = [];
    inQuote = false;
    escaped = false;

    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr[i];
      if (char === '\\' && !escaped) {
        escaped = true;
        continue;
      }
      if (char === '"' && !escaped) {
        inQuote = !inQuote;
      }
      escaped = false;

      if (!inQuote) {
        if (char === '{' || char === '[') {
          openBraces.push(char);
        } else if (char === '}') {
          if (openBraces.length && openBraces[openBraces.length - 1] === '{') {
            openBraces.pop();
          }
        } else if (char === ']') {
          if (openBraces.length && openBraces[openBraces.length - 1] === '[') {
            openBraces.pop();
          }
        }
      }
    }

    // Append necessary closing braces / brackets in reverse order of opening
    while (openBraces.length) {
      const last = openBraces.pop();
      if (last === '{') {
        cleanStr += '}';
      } else if (last === '[') {
        cleanStr += ']';
      }
    }

    // Strip trailing commas left inside freshly closed containers
    cleanStr = cleanStr.trim();
    cleanStr = cleanStr.replace(/,(\s*[}\]])/g, "$1");

    return cleanStr;
  }

  // Robustly extract and parse JSON from any text response generated by Gemini, eliminating conversational wrappers
  function robustJsonParse(text: string): any {
    if (!text) {
      throw new Error("Empty input string provided to robustJsonParse");
    }
    let cleaned = text.trim();
    
    // Strip Markdown code block indicators (```json ... ``` or ``` ... ```) if they wrap the text
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?|```$/gi, "").trim();
    }
    
    // Find the first occurrence of { or [ to try to isolate JSON candidate
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    
    let startIdx = -1;
    let endIdx = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf("]");
    }
    
    if (startIdx !== -1) {
      if (endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      } else {
        // Truncated trailing close - extract from start to end of string and attempt repair
        cleaned = cleaned.substring(startIdx);
      }
    }
    
    try {
      return JSON.parse(cleaned);
    } catch (firstErr) {
      // Attempt clean recovery / auto-completion of truncated string
      try {
        const repaired = repairJson(cleaned);
        return JSON.parse(repaired);
      } catch (secondErr) {
        // Robust regex heuristic extracts in case the model responded entirely in natural language
        const lower = text.toLowerCase();
        
        // Target 1: Prohibited Policy violation assessment
        if (lower.includes("isviolation") || lower.includes("violation")) {
          const isViolation = lower.includes("isviolation\": true") || lower.includes("isviolation: true") || (!lower.includes("false") && lower.includes("violation"));
          return { isViolation };
        }
        
        // Target 2: Task classification details
        if (lower.includes("needsattention") || lower.includes("attention")) {
          const needsAttention = lower.includes("needsattention\": true") || lower.includes("needsattention: true") || lower.includes("attention: true");
          const deptMatch = text.match(/informedDept"[ :]+"?([A-Za-z& /]+)"?/i) || text.match(/department"[ :]+"?([A-Za-z& /]+)"?/i);
          const dept = deptMatch ? deptMatch[1].trim() : "Concierge";
          const titleMatch = text.match(/taskTitle"[ :]+"?([^"\n]+)"?/i) || text.match(/title"[ :]+"?([^"\n]+)"?/i);
          const title = titleMatch ? titleMatch[1].trim() : "Guest Request";
          
          return {
            needsAttention,
            taskTitle: title,
            informedDept: dept,
            details: text
          };
        }
        
        throw firstErr;
      }
    }
  }

  // Robust retry wrapper to handle 503 (Spikes in demand) and 429 (Rate Limit) errors beautifully
  async function generateContentWithRetry(ai: any, params: any, maxRetries = 5, initialDelayMs = 1500) {
    let originalModel = params.model || "gemini-3.5-flash";
    let currentModel = originalModel;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Dynamic fallback model mapping depending on the retry progress:
      if (attempt === 1 || attempt === 2) {
        currentModel = originalModel;
      } else if (attempt === 3) {
        currentModel = "gemini-3.1-flash-lite";
      } else if (attempt === 4) {
        currentModel = "gemini-flash-latest";
      } else {
        currentModel = "gemini-3.1-flash-lite";
      }

      try {
        console.log(`[GEMINI] Sending generateContent request (Model: ${currentModel}, Attempt: ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel
        });
        return response;
      } catch (err: any) {
        const errStr = (err.message || "").toLowerCase();
        const errStatus = err.status || err.statusCode || (err.error && err.error.code) || 0;
        
        const isTransient = errStatus === 502 || errStatus === 503 || errStatus === 429 || 
                            errStr.includes("502") || errStr.includes("503") || errStr.includes("429") ||
                            errStr.includes("bad gateway") || errStr.includes("badgateway") ||
                            errStr.includes("unreachable") || errStr.includes("unavailable") ||
                            errStr.includes("resource_exhausted") || errStr.includes("high demand") ||
                            errStr.includes("spikes in demand") || errStr.includes("rate limit") ||
                            errStr.includes("overloaded");

        console.log(`[GEMINI INFO] Attempt ${attempt} received a temporary status (${errStatus}). isTransient: ${isTransient}`);
        
        if (isTransient && attempt < maxRetries) {
          // Exponential backoff combined with voluntary random jitter to break pattern lockstep
          const jitter = Math.random() * 1000;
          const delay = (initialDelayMs * Math.pow(1.8, attempt - 1)) + jitter;
          console.log(`[GEMINI RETRY] Transient issue detected on model ${currentModel}. Retrying in ${Math.round(delay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
  }

  function findProhibitedViolation(text: string): { isViolation: boolean; category?: string } {
    const norm = text.toLowerCase().trim();
    
    // Strong prohibited terms that have 0% legitimate use in a hotel portal
    const highConfidenceProhibited = [
      "escort", "escorts", "prostitute", "prostitutes", "prostitution",
      "call girl", "call girls", "callboy", "callboys", "call boy", "call boys",
      "hooker", "hookers", "sexual service", "sexual services", "happy ending",
      "sex worker", "sex workers", "erotic massage", "erotic massages", "sensual massage",
      "sensual massages", "happy endings", "adult service", "adult services",
      "adult companion", "adult companions", "room companion", "room companions",
      "human trafficking", "trafficking humans", "cocaine", "heroin", "methamphetamine",
      "crack cocaine", "mdma", "ecstasy drug", "buy sex", "sell sex", "brothel", "brothels",
      "blowjob", "blowjobs", "handjob", "handjobs"
    ];

    for (const term of highConfidenceProhibited) {
      const rx = new RegExp(`\\b${term}\\b|${term}`, "i");
      if (rx.test(norm)) {
        return { isViolation: true, category: term };
      }
    }

    // Check some patterns like "buy [drug]", "get [drug]"
    const drugKeywords = ["weed", "marijuana", "cannabis", "drugs", "pills", "coke", "meth", "speed"];
    const actionKeywords = ["buy", "get", "order", "find", "score", "procure", "purchase", "sell", "provide"];
    for (const action of actionKeywords) {
      for (const drug of drugKeywords) {
        if (norm.includes(`${action} ${drug}`) || norm.includes(`${drug} ${action}`)) {
          return { isViolation: true, category: `${action} ${drug}` };
        }
      }
    }

    // Check custom phrases
    if (norm.includes("buy a girl") || norm.includes("rent a girl") || norm.includes("hire a girl") || norm.includes("order a girl") ||
        norm.includes("buy a woman") || norm.includes("rent a woman") || norm.includes("hire a woman") || norm.includes("order a woman") ||
        norm.includes("send a girl to my room") || norm.includes("send some girls") || norm.includes("send a lady to my room") ||
        norm.includes("companion for the night") || norm.includes("companions for the night")) {
      return { isViolation: true, category: "solicitation" };
    }

    return { isViolation: false };
  }

  async function checkProhibitedContentViaGemini(aiClient: any, content: string): Promise<boolean> {
    try {
      const policyPrompt = `You are an automated safety guard for the guest portal of Sandton Hotel.
Determine if the following guest message violates the Prohibited Content Policy.

The policy strictly prohibits and bans assistant processing/storing/escalation of:
1. Escort services, prostitution, sexual services, adult companions, erotic/sensual/sexual massages, or happy endings.
2. Illegal activities, such as buying/selling illegal drugs, firearms, or modern slave trafficking.
3. Human trafficking.
4. Any request that violates hotel policy or local law.

Analyze the message:
"${content}"

Response MUST be a JSON object:
{
  "isViolation": boolean
}`;

      const response = await generateContentWithRetry(aiClient, {
        model: "gemini-3.5-flash",
        contents: policyPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isViolation: { type: Type.BOOLEAN, description: "True if the message is related to escorts, prostitution, sexual services, illegal activities, human trafficking, or local law/hotel policy violations." }
            },
            required: ["isViolation"]
          },
          maxOutputTokens: 250,
          temperature: 0.0
        }
      });

      if (response && response.text) {
        const parsed = robustJsonParse(response.text);
        return !!parsed.isViolation;
      }
    } catch (err) {
      console.error("[POLICY CHECK GEMINI ERROR]:", err);
    }
    return false;
  }

  let geminiClientInstance: any = null;
  function getGeminiClient() {
    if (!geminiClientInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("[GEMINI] GEMINI_API_KEY not defined in environment secrets. Task auto-creation falls back to rule-based assistant.");
        return null;
      }
      try {
        geminiClientInstance = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("[GEMINI] Error instantiating GoogleGenAI client:", err);
      }
    }
    return geminiClientInstance;
  }

  function fallbackClassification(content: string) {
    const norm = content.toLowerCase();
    
    // keywords that imply staff attention is needed
    const keywords = [
      "need", "please", "can i get", "bring", "deliver", "towels", "blanket", "clean", "housekeeping", "fix", "repair", "leak", "broken",
      "shuttle", "book", "massage", "reserve", "room service", "breakfast", "dinner", "lunch", "food", "pillows", "soap", "shampoo",
      "wifi", "ac ", "hot", "cold", "help", "ordered", "luggage", "iron", "wake me", "wake-up", "late checkout", "toilet", "ice"
    ];
    const needsAttention = keywords.some(k => norm.includes(k));
    
    let department = "Concierge";
    if (norm.includes("clean") || norm.includes("towel") || norm.includes("blanket") || norm.includes("pillow") || norm.includes("soap") || norm.includes("shampoo") || norm.includes("housekeeping") || norm.includes("toilet") || norm.includes("linen")) {
      department = "Housekeeping";
    } else if (norm.includes("massage") || norm.includes("spa") || norm.includes("aura") || norm.includes("sauna")) {
      department = "Spa";
    } else if (norm.includes("food") || norm.includes("drink") || norm.includes("dine") || norm.includes("restaurant") || norm.includes("dinner") || norm.includes("breakfast") || norm.includes("lunch") || norm.includes("bar") || norm.includes("room service") || norm.includes("ice")) {
      department = "F&B";
    } else if (norm.includes("repair") || norm.includes("leak") || norm.includes("broken") || norm.includes("tv") || norm.includes("ac ") || norm.includes("light") || norm.includes("drain") || norm.includes("wifi")) {
      department = "HOD";
    }
    
    return {
      needsAttention,
      taskTitle: `Guest Request: "${content.substring(0, 45)}${content.length > 45 ? "..." : ""}"`,
      department,
      details: content
    };
  }

  // POST /api/chat/message
  app.post("/api/chat/message", async (req, res) => {
    let { content, roomNumber, guestName } = req.body;
    if (content === undefined || content === null) {
      return res.status(400).json({ success: false, error: "Content is required." });
    }
    content = String(content);
    if (!content.trim()) {
      return res.status(400).json({ success: false, error: "Content cannot be empty." });
    }
    
    const roomKey = roomNumber || "0";

    // 1. Instantly check via local regex/keyword list
    let isProhibited = findProhibitedViolation(content).isViolation;

    // 2. Layered check: If local fast check did not trigger, evaluate via Gemini
    const aiClientForPolicy = getGeminiClient();
    if (!isProhibited && aiClientForPolicy) {
      isProhibited = await checkProhibitedContentViaGemini(aiClientForPolicy, content);
    }

    if (isProhibited) {
      console.log(`[POLICY BLOCK] Intercepted and blocked message violating Prohibited Content Policy: "${content}"`);
      const neutralReply = {
        role: "assistant",
        content: "I'm unable to assist with that request.",
        timestamp: new Date().toLocaleTimeString(),
        senderName: "Guest Assistant",
        roomNumber: roomKey
      };
      
      // Immediately respond with a brief, neutral refusal.
      // Do NOT push to chatMessages, do NOT create autoTask, do NOT save actions, do NOT escalate!
      return res.json({
        success: true,
        userMessage: {
          role: "user",
          content,
          timestamp: new Date().toLocaleTimeString(),
          senderName: guestName || `Guest (Rm ${roomKey || "N/A"})`,
          roomNumber: roomKey
        },
        aiReply: neutralReply
      });
    }
    
    // Push user message
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
      senderName: guestName || `Guest (Rm ${roomKey || "N/A"})`,
      roomNumber: roomKey
    };
    chatMessages.push(userMessage);
    saveToChatsDb();

    // AI auto task-creation dispatcher & concierge response generation in parallel
    const isBotEnabled = chatbotStatus[roomKey] !== false;
    const aiClient = getGeminiClient();

    let isTaskNeeded = false;
    let taskTitle = "";
    let taskDept = "Concierge";
    let taskDetails = "";
    let reply = "I have noted your inquiry. Our Concierge team has been notified. Let me know if there's anything else I can assist you with.";

    const getRuleBasedFallbackReply = (inquiringText: string): string => {
      const norm = inquiringText.toLowerCase();

      // Check if trying to book or trigger any action (Never promise actions rule)
      const actionKeywords = [
        "book", "reserve", "order", "send", "bring", "deliver", "towels", "blanket", "clean", "fix", "repair", 
        "shuttle", "massage", "room service", "wake-up", "late checkout", "service", "linen", "keycard", "champagne"
      ];
      const isActionRequested = actionKeywords.some(k => norm.includes(k));
      if (isActionRequested) {
        return "I have forwarded your request to the concierge team. The concierge team will confirm your request and a staff member will assist you shortly.";
      }

      // Answer strictly based on the static data
      if (norm.includes("pool") || norm.includes("swim")) {
        return "The Sky Pool is a heated infinity pool with panoramic Johannesburg city views on the rooftop, open daily. We also feature an indoor heated lap pool climate-regulated for deep relaxation.";
      }
      if (norm.includes("gym") || norm.includes("fitness") || norm.includes("exercise")) {
        return "Our Gym & Fitness center is open 24/7 with state-of-the-art multi-weights, premium free-lifting bars, and automated treadmills.";
      }
      if (norm.includes("shuttle") || norm.includes("airport") || norm.includes("transfers")) {
        return "Our shuttle service connects to OR Tambo, Lanseria, and local private airstrips. I have forwarded your request to the concierge team to coordinate your transport details.";
      }
      if (norm.includes("restaurant") || norm.includes("dining") || norm.includes("food") || norm.includes("bar")) {
        return "The Clubhouse Restaurant & Bar serves elegant fine dining overlooking the golf course. Subsections include The Clubhouse Lounge and the climate-controlled Cigar Bar.";
      }
      if (norm.includes("spa") || norm.includes("massage") || norm.includes("aura")) {
        return "Aura Wellness Spa offers organic therapeutics, luxury massage packages, and biological skin healing treatments.";
      }
      if (norm.includes("promotions") || norm.includes("promotion") || norm.includes("braai") || norm.includes("father")) {
        return "Sandton Hotel features seasonal promotions such as the Father's Day Spit Braai and Clubhouse Fixture World Cup matching viewings.";
      }

      return "I am sorry, but that information is currently unavailable from our database. I have forwarded your request to the concierge team and a staff member will assist you shortly.";
    };

    if (aiClient) {
      // 1. Define classification task
      const classificationPromise = (async () => {
        try {
          const classificationPrompt = `You are a professional hotel concierge dispatcher at Sandton Hotel. Direct Guest Request auto-creation dispatch system.
Analyze this message sent by room number "${roomKey}" (Guest name: "${guestName || 'Anonymous'}"):
"${content}"

Determine whether this message represents a specific request that needs to be "attended to" by the hotel staff (e.g. they need to physically clean, repair, deliver, book, schedule, reset, order, retrieve, or service something for the guest).
Keep in mind:
- Simple questions or generic greetings/chit-chat (e.g., "how is the weather?", "where is the gym?", "hello") DO NOT need to be attended to (needsAttention: false).
- Solid requests, issues, orders, or service appeals (e.g., "bring towels", "shuttle to airport", "fix TV", "clean my room", "can I check out late", "need room service", "sauna reservation") DO need to be attended to (needsAttention: true).

Return a valid JSON object matching the following structure:
{
  "needsAttention": boolean,
  "taskTitle": string, // A short professional action title (e.g. "Deliver extra towels to Room 301")
  "informedDept": string, // One of exactly: "Housekeeping", "Concierge", "Spa", "F&B", "HOD"
  "details": string // Concise summary of details or notes of what the guest asked
}`;

          const classificationResponse = await generateContentWithRetry(aiClient, {
            model: "gemini-3.5-flash",
            contents: classificationPrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  needsAttention: { type: Type.BOOLEAN, description: "Whether this message is a physical request or action that requires hotel staff attendance or manual resolution" },
                  taskTitle: { type: Type.STRING, description: "A concise professional task title, e.g. 'Deliver towels to Room 102' or 'Repair television screen'" },
                  informedDept: { type: Type.STRING, description: "The best destination department for this task. Must be exactly one of: Housekeeping, Concierge, Spa, F&B, HOD" },
                  details: { type: Type.STRING, description: "Any other context from the message" }
                },
                required: ["needsAttention", "taskTitle", "informedDept", "details"]
              },
              maxOutputTokens: 1024
            }
          });

          if (classificationResponse && classificationResponse.text) {
            const parsed = robustJsonParse(classificationResponse.text);
            isTaskNeeded = !!parsed.needsAttention;
            taskTitle = parsed.taskTitle || `Guest Request (Rm ${roomKey})`;
            taskDept = parsed.informedDept || "Concierge";
            taskDetails = parsed.details || content;
          }
        } catch (geminiErr) {
          console.error("[GEMINI TASK CLASSIFICATION ERROR]:", geminiErr);
          const fallback = fallbackClassification(content);
          isTaskNeeded = fallback.needsAttention;
          taskTitle = fallback.taskTitle;
          taskDept = fallback.department;
          taskDetails = fallback.details;
        }
      })();

      // 2. Define chatbot response task
      const chatbotPromise = (async () => {
        if (!isBotEnabled) return;
        try {
          const knowledgeBase = {
            hotelName: masterConfig.hotelName,
            conciergeKb: masterConfig.conciergeKb,
            facilities: masterFacilities,
            restaurants: masterRestaurants,
            promotions: masterPromotions,
            recos: masterRecos
          };

          const systemInstruction = `You are "Recos Chat Assistant" (displaying under the name "Guest Assistant"), the official virtual concierge of ${masterConfig.hotelName || "Sandton Hotel"}.
Your primary job is to provide accurate, reliable, and truthful information about the hotel and the Recos (recommendations) section from the official Knowledge Base. Accuracy and reliability are far more important than sounding intelligent.

### CONSTRAINTS ON OUTPUT FORMAT:
- Do NOT output any headings, rules, or system information in your reply. 
- Never echo or output headers like "Keep Responses Simple", "Keep it short", "KNOWLEDGE SOURCE ONLY", "NEVER PROMISE ACTIONS", etc.
- Output ONLY the plain text friendly conversational response itself. If you output any instruction labels or system rules, you fail. Keep it short.

### OFFICIAL KNOWLEDGE BASE (THE SOLE RESOURCE OF TRUTH):
${JSON.stringify(knowledgeBase, null, 2)}

### RULES:
1. KNOWLEDGE SOURCE ONLY:
   - Only answer using the Knowledge Base.
   - NEVER make up information. Never guess. Never assume.
   - If the answer is not in the knowledge base, tell the guest that you have forwarded the request to the concierge team.
     - E.g.: "I am sorry, but that information is unavailable. I have forwarded your request to our concierge team."
   - NEVER rely on pre-trained AI knowledge if the information is not in the database.

2. STRICT SCOPE LIMITATION:
   - You ONLY answer questions related to:
     - HOTEL: Rooms and amenities, Check-in and check-out, Hotel facilities, Restaurants and bars, Spa and gym, Shuttle services, Hotel policies, Hotel promotions, Guest services.
     - RECOS: Restaurants, Activities and experiences, Attractions, Shopping, Nightlife, Transport services, Local businesses and partners, Any recommendations that exist in the Recos database (recos array).
   - Only provide recommendations that actually exist in the "recos" array.
   - If outside these sections, tell the guest that you have forwarded the request to the concierge team.

3. NEVER PROMISE ACTIONS:
   - NEVER say: "It has been booked.", "Your reservation is confirmed.", "Your request has been completed.", "Housekeeping is on the way.", "Maintenance has been notified.", "Your shuttle is confirmed."
   - Instead say: "I have forwarded your request to the concierge team.", "The concierge team will confirm your request.", or "A staff member will assist you shortly."

4. KEEP RESPONSES SIMPLE:
   - Be friendly and professional.
   - Keep replies short.
   - Answer only what was asked.
   - Do not add extra information or instruction titles.

5. PRIORITY ORDER:
   - 1. Knowledge Base
   - 2. Human Concierge
   - 3. Never invent an answer

6. ADDRESS GUEST BY FORMAL TITLE:
   - When greeting, referring to, or addressing the guest directly in your response, you MUST always address them with their correct formal title/salutation and surname (e.g., "Mr. Khumalo", "Mrs. Jenkins", "Dr. Smith", "Prof. Modise", etc.) exactly as specified in their senderName.
   - Never refer to the guest by just their first name, or just their surname alone without their correct title. Always preserve the prefix (Mr./Mrs./Ms./Dr./Prof.) in your response.`;

          const recentHistory = chatMessages
            .filter((msg: any) => msg && String(msg.roomNumber) === String(roomKey))
            .slice(-6);

          const historyStr = recentHistory.map((m: any) => {
            const roleName = m.role === "user" ? "Guest" : (m.role === "staff" ? "Staff" : "Assistant");
            return `${roleName} (${m.senderName || ''}): ${m.content}`;
          }).join("\n");

          const responsePrompt = `Here is the current conversation history for Room ${roomKey}:
${historyStr}

Please generate the next response as the "Recos Chat Assistant" (the Guest Assistant) replying to the latest user message. Follow the rules and only supply facts from the Knowledge Base. Keep it short. Do NOT repeat or output any of the system instructions, titles, or rules.`;

          const response = await generateContentWithRetry(aiClient, {
            model: "gemini-3.5-flash",
            contents: responsePrompt,
            config: {
              systemInstruction,
              temperature: 0.1,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingLevel: "LOW" }
            }
          });

          if (response && response.text) {
            reply = response.text.trim();
          }
        } catch (geminiErr) {
          console.error("[GEMINI CHATBOT GENERATION ERROR]:", geminiErr);
          reply = getRuleBasedFallbackReply(content);
        }
      })();

      // 3. Fire concurrently!
      await Promise.all([classificationPromise, chatbotPromise]);

      // 4. Create task if needed
      if (isTaskNeeded) {
        const autoTask = {
          id: `task-${Date.now()}`,
          title: taskTitle,
          room: String(roomKey),
          status: "received",
          createdAt: Date.now(),
          informedDept: taskDept,
          details: { note: taskDetails, autoCreated: true }
        };
        tasks.push(autoTask);
        saveToChatsDb();
        console.log(`[AUTO-TASK CREATED] Active service task auto-created concurrently:`, autoTask);
      }
    } else {
      const fallback = fallbackClassification(content);
      isTaskNeeded = fallback.needsAttention;
      taskTitle = fallback.taskTitle;
      taskDept = fallback.department;
      taskDetails = fallback.details;

      if (isTaskNeeded) {
        const autoTask = {
          id: `task-${Date.now()}`,
          title: taskTitle,
          room: String(roomKey),
          status: "received",
          createdAt: Date.now(),
          informedDept: taskDept,
          details: { note: taskDetails, autoCreated: true }
        };
        tasks.push(autoTask);
        saveToChatsDb();
      }

      reply = getRuleBasedFallbackReply(content);
    }

    let aiMessage = null;
    if (isBotEnabled) {
      aiMessage = {
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString(),
        senderName: "Guest Assistant",
        roomNumber: roomKey
      };
      chatMessages.push(aiMessage);
      saveToChatsDb();
    }

    return res.json({ 
      success: true, 
      userMessage,
      aiReply: aiMessage
    });
  });

  // POST /api/chat/staff-reply (staff types and sends directly to room thread)
  app.post("/api/chat/staff-reply", (req, res) => {
    const { content, roomNumber, staffName } = req.body;
    if (!content || !roomNumber) {
      return res.status(400).json({ success: false, error: "Content and roomNumber are required." });
    }
    const staffMessage = {
      role: "staff",
      content,
      timestamp: new Date().toLocaleTimeString(),
      senderName: staffName || "Staff Support",
      roomNumber
    };
    chatMessages.push(staffMessage);
    saveToChatsDb();
    console.log("[SERVER] Staff Direct Message Added:", staffMessage);
    return res.json({ success: true, message: staffMessage });
  });

  // POST /api/chatbot/toggle
  app.post("/api/chatbot/toggle", (req, res) => {
    const { roomNumber, enabled } = req.body;
    if (!roomNumber) {
      return res.status(400).json({ success: false, error: "roomNumber is required." });
    }
    chatbotStatus[roomNumber] = enabled;
    saveToChatsDb();
    console.log(`[SERVER] Chatbot state toggled for Room ${roomNumber}:`, enabled);
    return res.json({ success: true, chatbotStatus });
  });

  // POST /api/emergency
  app.post("/api/emergency", (req, res) => {
    const { emergency, actor, escalated } = req.body;
    emergencyMode = !!emergency;
    if (!emergency && actor) {
      console.log(`[SERVER] Emergency mode stopped by ${actor}. Escalated checked: ${escalated}`);
      chatMessages.push({
        role: "assistant",
        content: `🚨 SYSTEM ALERT: Emergency lockdown protocol has been deactivated by: ${actor}. Escalation to local authorities was confirmed.`,
        timestamp: new Date().toLocaleTimeString(),
        senderName: "System",
        roomNumber: "0"
      });
    } else if (emergency) {
      chatMessages.push({
        role: "assistant",
        content: `🚨 SYSTEM ALERT: Emergency lockdown protocol has been activated! Central broadcast active on all panels.`,
        timestamp: new Date().toLocaleTimeString(),
        senderName: "System",
        roomNumber: "0"
      });
    }
    saveToChatsDb();
    console.log("[SERVER] Emergency mode status changed:", emergencyMode);
    return res.json({ success: true, emergencyMode });
  });

  // POST /api/admin/save
  app.post("/api/admin/save", async (req, res) => {
    if (bootupPhaseActive) {
      console.warn("[BOOT GUARD] Write blocked during initialisation — skipping.");
      return res.status(403).json({ error: "Write blocked during initialization." });
    }

    const { section, data } = req.body;
    if (!section || !["config", "promotions", "facilities", "restaurants", "recos"].includes(section)) {
      return res.status(400).json({ success: false, error: "Invalid section block." });
    }

    let currentMaster: any = null;
    if (section === "config") currentMaster = masterConfig;
    if (section === "promotions") currentMaster = masterPromotions;
    if (section === "facilities") currentMaster = masterFacilities;
    if (section === "restaurants") currentMaster = masterRestaurants;
    if (section === "recos") currentMaster = masterRecos;

    // Before writing, run this integrity check:
    // If data is an array AND data.length === 0 AND the current in-memory master for that section has items -> reject the write
    if (Array.isArray(data) && data.length === 0 && currentMaster && currentMaster.length > 0) {
      console.log(`[INTEGRITY] Empty array rejected for section: ${section}. Server copy preserved.`);
      return res.status(409).json({ error: "Write rejected: incoming array was empty but server has existing data." });
    }

    // Update the in-memory master state for that section
    if (section === "config") {
      for (const key in masterConfig) {
        delete (masterConfig as any)[key];
      }
      Object.assign(masterConfig, data);
    } else {
      currentMaster.length = 0;
      currentMaster.push(...data);
    }

    const updatedAt = Date.now();
    await saveSectionToFirestore(section, data);

    return res.json({ success: true, section, updatedAt });
  });

  // POST /api/admin/resync
  app.post("/api/admin/resync", async (req, res) => {
    if (!db) {
      return res.status(503).json({ success: false, error: "Firestore is not initialized." });
    }
    try {
      const docRef = doc(db, "hotels", "_sandton", "knowledge", "hotel_info");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        let updatedAt = Date.now();
        if (firestoreData) {
          if (firestoreData.updatedAt) {
            updatedAt = firestoreData.updatedAt;
          }
          if (firestoreData.config) {
            for (const key in masterConfig) {
              delete (masterConfig as any)[key];
            }
            Object.assign(masterConfig, firestoreData.config);
          }
          if (Array.isArray(firestoreData.promotions)) {
            masterPromotions.length = 0;
            masterPromotions.push(...firestoreData.promotions);
          }
          if (Array.isArray(firestoreData.facilities)) {
            masterFacilities.length = 0;
            masterFacilities.push(...firestoreData.facilities);
          }
          if (Array.isArray(firestoreData.restaurants)) {
            masterRestaurants.length = 0;
            masterRestaurants.push(...firestoreData.restaurants);
          }
          if (Array.isArray(firestoreData.recos)) {
            masterRecos.length = 0;
            masterRecos.push(...firestoreData.recos);
          }
        }
        
        saveToChatsDb();
        console.log("[SERVER] Manual resync success from Firestore.");
        return res.json({ success: true, updatedAt });
      } else {
        return res.status(404).json({ success: false, error: "No Firestore data found." });
      }
    } catch (err: any) {
      console.error("[FIRESTORE FALLBACK] Serving from local in-memory state. Resync failed:", err);
      return res.status(500).json({ success: false, error: err.message || "Resync failed." });
    }
  });

  // STAFF REGISTRY CRUD API
  app.post("/api/admin/staff", (req, res) => {
    const { name, whatsApp, role, username, password } = req.body;
    if (!name || !role || !username || !password) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }
    const exists = staffLogons.some(s => s && typeof s.username === "string" && typeof username === "string" && s.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: "Username already exists." });
    }
    const newStaff = { name, whatsApp: whatsApp || "", role, username, password };
    staffLogons.push(newStaff);
    saveToChatsDb();
    console.log("[SERVER] Staff user registered:", newStaff);
    return res.json({ success: true, staffLogons });
  });

  app.put("/api/admin/staff/:username", (req, res) => {
    const { username } = req.params;
    const { name, whatsApp, role, password } = req.body;
    
    const staff = staffLogons.find(s => s && typeof s.username === "string" && typeof username === "string" && s.username.toLowerCase() === username.toLowerCase());
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff user not found." });
    }
    
    if (name !== undefined) staff.name = name;
    if (whatsApp !== undefined) staff.whatsApp = whatsApp;
    if (role !== undefined) staff.role = role;
    if (password !== undefined) staff.password = password;
    
    saveToChatsDb();
    console.log("[SERVER] Staff user updated:", staff);
    return res.json({ success: true, staffLogons });
  });

  app.delete("/api/admin/staff/:username", (req, res) => {
    const { username } = req.params;
    staffLogons = staffLogons.filter(s => s && typeof s.username === "string" && typeof username === "string" ? s.username.toLowerCase() !== username.toLowerCase() : true);
    saveToChatsDb();
    console.log("[SERVER] Staff user deleted successfully:", username);
    return res.json({ success: true, staffLogons });
  });

  // POST /api/admin/clear-db - clear all chats and tasks with ADMIN2025 password
  app.post("/api/admin/clear-db", (req, res) => {
    const { password } = req.body;
    if (password !== "ADMIN2025") {
      return res.status(401).json({ success: false, error: "Incorrect admin password." });
    }
    chatMessages.length = 0;
    tasks.length = 0;
    saveToChatsDb();
    console.log("[SERVER] Database cleared of all chats and tasks.");
    return res.json({ success: true, message: "Database cleared of all chats and tasks successfully." });
  });

  // CMS CUSTOMIZATIONS (Optional Backend Persisted Sinks)
  app.post("/api/promotions", async (req, res) => {
    const { title, paragraph, image_url, cta_text, cta_url } = req.body;
    const newPromo = { id: `promo-${Date.now()}`, title, paragraph, image_url, cta_text, cta_url };
    masterPromotions.push(newPromo);
    await saveSectionToFirestore("promotions", masterPromotions);
    return res.json({ success: true, masterPromotions });
  });
  app.put("/api/promotions/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterPromotions.findIndex(p => p.id === id);
    if (index !== -1) {
      masterPromotions[index] = { ...masterPromotions[index], ...req.body };
      await saveSectionToFirestore("promotions", masterPromotions);
    }
    return res.json({ success: true, masterPromotions });
  });
  app.delete("/api/promotions/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterPromotions.findIndex(p => p.id === id);
    if (index !== -1) {
      masterPromotions.splice(index, 1);
      await saveSectionToFirestore("promotions", masterPromotions);
    }
    return res.json({ success: true, masterPromotions });
  });

  app.post("/api/facilities", async (req, res) => {
    const { title, description, category, image_url } = req.body;
    const newFacility = { id: `fac-${Date.now()}`, title, description, category, image_url };
    masterFacilities.push(newFacility);
    await saveSectionToFirestore("facilities", masterFacilities);
    return res.json({ success: true, masterFacilities });
  });
  app.put("/api/facilities/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterFacilities.findIndex(f => f.id === id);
    if (index !== -1) {
      masterFacilities[index] = { ...masterFacilities[index], ...req.body };
      await saveSectionToFirestore("facilities", masterFacilities);
    }
    return res.json({ success: true, masterFacilities });
  });
  app.delete("/api/facilities/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterFacilities.findIndex(f => f.id === id);
    if (index !== -1) {
      masterFacilities.splice(index, 1);
      await saveSectionToFirestore("facilities", masterFacilities);
    }
    return res.json({ success: true, masterFacilities });
  });

  app.post("/api/restaurants", async (req, res) => {
    const { title, description, image_url, cta_enabled, cta_text, cta_url, subsections } = req.body;
    const newRest = { id: `rest-${Date.now()}`, title, description, image_url, cta_enabled, cta_text, cta_url, subsections: subsections || [] };
    masterRestaurants.push(newRest);
    await saveSectionToFirestore("restaurants", masterRestaurants);
    return res.json({ success: true, masterRestaurants });
  });
  app.put("/api/restaurants/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterRestaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      masterRestaurants[index] = { ...masterRestaurants[index], ...req.body };
      await saveSectionToFirestore("restaurants", masterRestaurants);
    }
    return res.json({ success: true, masterRestaurants });
  });
  app.delete("/api/restaurants/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterRestaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      masterRestaurants.splice(index, 1);
      await saveSectionToFirestore("restaurants", masterRestaurants);
    }
    return res.json({ success: true, masterRestaurants });
  });

  app.post("/api/recos", async (req, res) => {
    const { title, paragraph, image_url, cta_text, cta_url, is_featured, type } = req.body;
    const newReco = {
      id: `reco-${Date.now()}`,
      title: title || "New Recommendation",
      paragraph: paragraph || "",
      image_url: image_url || "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80",
      cta_text: cta_text || "More Info",
      cta_url: cta_url || "",
      is_featured: is_featured !== undefined ? !!is_featured : true,
      type: type || "card"
    };
    masterRecos.push(newReco);
    await saveSectionToFirestore("recos", masterRecos);
    return res.json({ success: true, masterRecos });
  });

  app.put("/api/recos/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterRecos.findIndex(r => r.id === id);
    if (index !== -1) {
      masterRecos[index] = { ...masterRecos[index], ...req.body };
      await saveSectionToFirestore("recos", masterRecos);
    }
    return res.json({ success: true, masterRecos });
  });

  app.delete("/api/recos/:id", async (req, res) => {
    const { id } = req.params;
    const index = masterRecos.findIndex(r => r.id === id);
    if (index !== -1) {
      masterRecos.splice(index, 1);
      await saveSectionToFirestore("recos", masterRecos);
    }
    return res.json({ success: true, masterRecos });
  });

  // Bulk Upload endpoint for admin to populate guest front-end data
  app.post("/api/admin/bulk-upload", async (req, res) => {
    const { section, data, mode } = req.body;
    
    if (!section || !data) {
      return res.status(400).json({ success: false, error: "Missing required section, data, or mode parameters." });
    }

    try {
      if (section === "promotions") {
        if (!Array.isArray(data)) {
          return res.status(400).json({ success: false, error: "Promotions data must be an array of objects." });
        }
        const cleanData = data.map((item: any, idx: number) => ({
          id: item.id || `promo-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          title: item.title || "Untitled Promotion",
          paragraph: item.paragraph || "",
          image_url: item.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
          cta_text: item.cta_text || "Discover More",
          cta_url: item.cta_url || ""
        }));

        if (mode === "append") {
          masterPromotions.push(...cleanData);
        } else {
          masterPromotions.length = 0;
          masterPromotions.push(...cleanData);
        }
        await saveSectionToFirestore("promotions", masterPromotions);

      } else if (section === "facilities") {
        if (!Array.isArray(data)) {
          return res.status(400).json({ success: false, error: "Facilities data must be an array of objects." });
        }
        const cleanData = data.map((item: any, idx: number) => ({
          id: item.id || `fac-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          title: item.title || "Untitled Facility",
          description: item.description || "",
          category: item.category || "General",
          image_url: item.image_url || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80"
        }));

        if (mode === "append") {
          masterFacilities.push(...cleanData);
        } else {
          masterFacilities.length = 0;
          masterFacilities.push(...cleanData);
        }
        await saveSectionToFirestore("facilities", masterFacilities);

      } else if (section === "restaurants") {
        if (!Array.isArray(data)) {
          return res.status(400).json({ success: false, error: "Restaurants data must be an array of objects." });
        }
        const cleanData = data.map((item: any, idx: number) => ({
          id: item.id || `rest-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          title: item.title || "Untitled Restaurant",
          description: item.description || "",
          image_url: item.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
          cta_enabled: item.cta_enabled !== undefined ? !!item.cta_enabled : false,
          cta_text: item.cta_text || "Book A Table",
          cta_url: item.cta_url || "",
          subsections: Array.isArray(item.subsections) ? item.subsections.map((sub: any, sIdx: number) => ({
            id: sub.id || `sub-${Date.now()}-${sIdx}-${Math.floor(Math.random() * 1000)}`,
            title: sub.title || "Subsection",
            description: sub.description || "",
            timings: Array.isArray(sub.timings) ? sub.timings.map((t: any, tIdx: number) => ({
              id: t.id || `time-${Date.now()}-${tIdx}-${Math.floor(Math.random() * 100)}`,
              name: t.name || "Hours",
              openTime: t.openTime || "08:00",
              closeTime: t.closeTime || "22:00"
            })) : []
          })) : []
        }));

        if (mode === "append") {
          masterRestaurants.push(...cleanData);
        } else {
          masterRestaurants.length = 0;
          masterRestaurants.push(...cleanData);
        }
        await saveSectionToFirestore("restaurants", masterRestaurants);

      } else if (section === "recos") {
        if (!Array.isArray(data)) {
          return res.status(400).json({ success: false, error: "Recommendations data must be an array of objects." });
        }
        const cleanData = data.map((item: any, idx: number) => ({
          id: item.id || `reco-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          title: item.title || "Untitled Recommendation",
          paragraph: item.paragraph || "",
          image_url: item.image_url || "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80",
          cta_text: item.cta_text || "More Info",
          cta_url: item.cta_url || "",
          is_featured: item.is_featured !== undefined ? !!item.is_featured : true
        }));

        if (mode === "append") {
          masterRecos.push(...cleanData);
        } else {
          masterRecos.length = 0;
          masterRecos.push(...cleanData);
        }
        await saveSectionToFirestore("recos", masterRecos);

      } else if (section === "all") {
        if (data.promotions && Array.isArray(data.promotions)) {
          masterPromotions.length = 0;
          masterPromotions.push(...data.promotions);
          await saveSectionToFirestore("promotions", masterPromotions);
        }
        if (data.facilities && Array.isArray(data.facilities)) {
          masterFacilities.length = 0;
          masterFacilities.push(...data.facilities);
          await saveSectionToFirestore("facilities", masterFacilities);
        }
        if (data.restaurants && Array.isArray(data.restaurants)) {
          masterRestaurants.length = 0;
          masterRestaurants.push(...data.restaurants);
          await saveSectionToFirestore("restaurants", masterRestaurants);
        }
        if (data.recos && Array.isArray(data.recos)) {
          masterRecos.length = 0;
          masterRecos.push(...data.recos);
          await saveSectionToFirestore("recos", masterRecos);
        }
      } else {
        return res.status(400).json({ success: false, error: `Invalid bulk uploaded section: ${section}` });
      }

      console.log(`[BULK UPLOAD] Section [${section}] synced successfully. Mode: [${mode}].`);
      return res.json({
        success: true,
        masterPromotions,
        masterFacilities,
        masterRestaurants,
        masterRecos
      });

    } catch (err: any) {
      console.error("[BULK UPLOAD ERROR]", err);
      return res.status(500).json({ success: false, error: err.message || "An exception occurred during bulk ingest." });
    }
  });

  // Bulk Document parsing endpoint using Gemini
  app.post("/api/admin/bulk-upload-document", async (req, res) => {
    const { fileData, fileType, fileName, overwrite } = req.body;

    if (!fileData || !fileType) {
      return res.status(400).json({ success: false, error: "Missing file data or file type selection." });
    }

    if (!overwrite) {
      return res.status(400).json({ success: false, error: "Overwrite confirmation is strictly required to proceed." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ 
        success: false, 
        error: "Gemini API client is not configured on this workspace. Please specify process.env.GEMINI_API_KEY in Settings." 
      });
    }

    try {
      console.log(`[BULK DOCUMENT] Ingesting document: ${fileName} (${fileType}). Overwrite confirmed: ${overwrite}`);

      let contentPart: any;
      if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        (fileName && fileName.endsWith(".docx")) ||
        (fileType && fileType.includes("wordprocessingml"))
      ) {
        console.log("[BULK DOCUMENT] DOCX format or wordprocessingml MIME type detected. Extracting text via mammoth...");
        try {
          const docBuffer = Buffer.from(fileData, "base64");
          const extracted = await mammoth.extractRawText({ buffer: docBuffer });
          const textValue = extracted.value ? extracted.value.trim() : "";
          console.log(`[BULK DOCUMENT] Extracted text character count: ${textValue.length}`);
          contentPart = {
            text: `DOCUMENT CONTENT EXTRACTED FROM ${fileName || "docx_document"}:\n\n${textValue}`
          };
        } catch (mammothErr: any) {
          console.error("[BULK DOCUMENT] Mammoth extraction failed, falling back to raw inlineData:", mammothErr);
          contentPart = {
            inlineData: {
              data: fileData,
              mimeType: fileType
            }
          };
        }
      } else {
        contentPart = {
          inlineData: {
            data: fileData,
            mimeType: fileType
          }
        };
      }

      // Assemble content part list
      const parts: any[] = [
        contentPart,
        {
          text: `You are an elite, professional directory extraction assistant for a premium hotel group's digital guest portal.
Your task is to analyze this document (e.g., brochure, restaurant menu, guest services directory sheet, or hotel pamphlet) and extract all distinct directories.

Map the details to the appropriate category of our master hotel knowledge base:
1. "promotions" - Rotating slideshow banners focusing on key guest specials. For each item:
   - "title" (e.g. 'Private Reserve Cap Classique Tasting')
   - "paragraph" (brief alluring descriptions appealing to hotel guests)
   - "image_url" (provide a gorgeous, realistic high-quality Unsplash image URL matching the specific promotion theme. Select descriptive Unsplash categories, e.g. spa, cocktails, terrace pool, dining)
   - "cta_text" (e.g. 'Book Table' or 'Learn More')
   - "cta_url" (relative/external page URL)

2. "facilities" - Hotel leisure and business amenities. For each:
   - "title" (amenity/facility name)
   - "description" (rich features list, where it is found, available amenities)
   - "category" (This MUST be exactly one of: 'Wellness', 'Fitness', or 'General')
   - "image_url" (matching premium Unsplash interior/relaxation image URL)

3. "restaurants" - Dining venues, bars, cafes, and rooftop lounges. For each:
   - "title" (dining room / bar name)
   - "description" (culinary style, sensory ambience description, typical vibe)
   - "image_url" (matching premium Unsplash cuisine/cocktail image URL)
   - "cta_enabled" (boolean: true if dining booking is active, false otherwise)
   - "cta_text" (e.g., 'Reserve Glasshouse Table')
   - "cta_url" (external booking or digital menu)
   - "subsections" (array of menus, special days, or specific timing categories:
     - "title" (e.g., 'Daily Services' or 'Weekend Features')
     - "timings" (list of operational timing layers:
       - "name" (e.g., 'Breakfast Tier' or 'Sunset Dinner')
       - "openTime" (format 'HH:MM')
       - "closeTime" (format 'HH:MM')
     ))

Strict Constraints:
- Extract and populate all directory assets as comprehensively as possible.
- If no details relate to a section, return an empty array [] for that section.
- You must response with a SINGLE, SYNTAX-VALID, CORRECTLY-TERMINATED JSON OBJECT with NO starting/ending markdown annotations, no intro, and no backticks. Pure JSON only!
- Format structure matching:
{
  "promotions": [...],
  "facilities": [...],
  "restaurants": [...]
}`
        }
      ];

      console.log("[BULK DOCUMENT] Sending document stream to gemini-3.5-flash...");
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      console.log("[BULK DOCUMENT] Gemini returned response length:", responseText.length);

      let parsed: any;
      try {
        parsed = robustJsonParse(responseText);
      } catch (jsonErr: any) {
        console.error("[BULK DOCUMENT] JSON parsing failed. Raw response was:\n", responseText);
        return res.status(500).json({ 
          success: false, 
          error: `The AI produced a non-parseable response. Error: ${jsonErr.message}. Feel free to try again or double-check the uploaded file content.` 
        });
      }

      // Format & sanitize promotions
      const cleanPromotions = Array.isArray(parsed.promotions) ? parsed.promotions.map((p: any, idx: number) => ({
        id: `promo-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title: p.title || "Special Promotion",
        paragraph: p.paragraph || "",
        image_url: p.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
        cta_text: p.cta_text || "Discover More",
        cta_url: p.cta_url || ""
      })) : [];

      // Format & sanitize facilities
      const cleanFacilities = Array.isArray(parsed.facilities) ? parsed.facilities.map((f: any, idx: number) => ({
        id: `fac-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title: f.title || "Hotel Amenity",
        description: f.description || "",
        category: ["Wellness", "Fitness", "General"].includes(f.category) ? f.category : "General",
        image_url: f.image_url || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80"
      })) : [];

      // Format & sanitize restaurants
      const cleanRestaurants = Array.isArray(parsed.restaurants) ? parsed.restaurants.map((r: any, idx: number) => ({
        id: `rest-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title: r.title || "Fine Dining Spotlight",
        description: r.description || "",
        image_url: r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
        cta_enabled: r.cta_enabled !== undefined ? !!r.cta_enabled : false,
        cta_text: r.cta_text || "Book A Table",
        cta_url: r.cta_url || "",
        subsections: Array.isArray(r.subsections) ? r.subsections.map((sub: any, sIdx: number) => ({
          id: `sub-${Date.now()}-${idx}-${sIdx}-${Math.floor(Math.random() * 100)}`,
          title: sub.title || "Timing Categories",
          timings: Array.isArray(sub.timings) ? sub.timings.map((t: any, tIdx: number) => ({
            id: `time-${Date.now()}-${idx}-${sIdx}-${tIdx}`,
            name: t.name || "Daily Service",
            openTime: t.openTime || "08:00",
            closeTime: t.closeTime || "22:00"
          })) : []
        })) : []
      })) : [];

      // Apply the confirmation directive — overwrite current database in firestore
      masterPromotions.length = 0;
      masterPromotions.push(...cleanPromotions);
      await saveSectionToFirestore("promotions", masterPromotions);

      masterFacilities.length = 0;
      masterFacilities.push(...cleanFacilities);
      await saveSectionToFirestore("facilities", masterFacilities);

      masterRestaurants.length = 0;
      masterRestaurants.push(...cleanRestaurants);
      await saveSectionToFirestore("restaurants", masterRestaurants);

      console.log(`[BULK DOCUMENT SUCCESS] Successfully extracted promotions: ${cleanPromotions.length}, facilities: ${cleanFacilities.length}, dining: ${cleanRestaurants.length}`);
      return res.json({
        success: true,
        extractedCount: {
          promotions: cleanPromotions.length,
          facilities: cleanFacilities.length,
          restaurants: cleanRestaurants.length
        },
        masterPromotions,
        masterFacilities,
        masterRestaurants
      });

    } catch (err: any) {
      console.error("[BULK DOCUMENT CRITICAL ERROR]", err);
      return res.status(500).json({ 
        success: false, 
        error: `Processing error during AI parsing of the document: ${err.message}` 
      });
    }
  });

  // Bulk URL parsing endpoint using Gemini
  app.post("/api/admin/bulk-upload-url", async (req, res) => {
    const { url, overwrite } = req.body;

    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ success: false, error: "Please enter a valid, fully-qualified URL starting with http:// or https://" });
    }

    if (!overwrite) {
      return res.status(400).json({ success: false, error: "Overwrite confirmation is strictly required to proceed." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ 
        success: false, 
        error: "Gemini API client is not configured on this workspace. Please specify process.env.GEMINI_API_KEY in Settings." 
      });
    }

    try {
      console.log(`[BULK URL] Fetching webpage content from: ${url}. Overwrite confirmed: ${overwrite}`);

      let htmlText = "";
      try {
        const fetchRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(12000) // 12-second timeout
        });

        if (!fetchRes.ok) {
          return res.status(400).json({ 
            success: false, 
            error: `Unable to download webpage. Destination responded with status: ${fetchRes.status} ${fetchRes.statusText}` 
          });
        }
        htmlText = await fetchRes.text();
      } catch (fetchErr: any) {
        console.error("[CRAWLER FETCH ERROR]", fetchErr);
        return res.status(500).json({ 
          success: false, 
          error: `Network failure fetching web URL contents: ${fetchErr.message}` 
        });
      }

      // Pre-process and clean the HTML code space to prune tags that hold no directory meaning
      let cleanedHtml = htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

      if (cleanedHtml.length > 250000) {
        cleanedHtml = cleanedHtml.substring(0, 250000) + "\n...[TRUNCATED DUE TO BUFFER SIZE]...";
      }

      console.log(`[BULK URL] Content cleaned. Size reduced to ${cleanedHtml.length} characters. Sending to Gemini...`);

      const parts: any[] = [
        {
          text: `You are an elite, professional directory extraction assistant for a premium hotel group's digital guest portal.
Your task is to analyze the cleaned HTML / text contents retrieved from a destination website and extract all distinct hotel directories.

Map the details to the appropriate category of our master hotel knowledge base:
1. "promotions" - Rotating slideshow banners focusing on key guest specials. For each item:
   - "title" (e.g. 'Private Reserve Cap Classique Tasting')
   - "paragraph" (brief alluring descriptions appealing to hotel guests)
   - "image_url" (provide a gorgeous, realistic high-quality Unsplash image URL matching the specific promotion theme. Select descriptive Unsplash categories, e.g. spa, cocktails, terrace pool, dining)
   - "cta_text" (e.g. 'Book Table' or 'Learn More')
   - "cta_url" (relative/external page URL)

2. "facilities" - Hotel leisure and business amenities. For each:
   - "title" (amenity/facility name)
   - "description" (rich features list, where it is found, available amenities)
   - "category" (This MUST be exactly one of: 'Wellness', 'Fitness', or 'General')
   - "image_url" (matching premium Unsplash interior/relaxation image URL)

3. "restaurants" - Dining venues, bars, cafes, and rooftop lounges. For each:
   - "title" (dining room / bar name)
   - "description" (culinary style, sensory ambience description, typical vibe)
   - "image_url" (matching premium Unsplash cuisine/cocktail image URL)
   - "cta_enabled" (boolean: true if dining booking is active, false otherwise)
   - "cta_text" (e.g., 'Reserve Glasshouse Table')
   - "cta_url" (external booking or digital menu)
   - "subsections" (array of menus, special days, or specific timing categories:
     - "title" (e.g., 'Daily Services' or 'Weekend Features')
     - "timings" (list of operational timing layers:
       - "name" (e.g., 'Breakfast Tier' or 'Sunset Dinner')
       - "openTime" (format 'HH:MM')
       - "closeTime" (format 'HH:MM')
     ))

Strict Constraints:
- Extract and populate all directory assets as comprehensively as possible.
- If no details relate to a section, return an empty array [] for that section.
- You must response with a SINGLE, SYNTAX-VALID, CORRECTLY-TERMINATED JSON OBJECT with NO starting/ending markdown annotations, no intro, and no backticks. Pure JSON only!
- Format structure matching:
{
  "promotions": [...],
  "facilities": [...],
  "restaurants": [...]
}`
        },
        {
          text: `WEBSITE HTML ROADMAP TO PARSE:\n\n${cleanedHtml}`
        }
      ];

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      console.log("[BULK URL] Gemini returned response length:", responseText.length);

      let parsed: any;
      try {
        parsed = robustJsonParse(responseText);
      } catch (jsonErr: any) {
        console.error("[BULK URL] JSON parsing failed. Raw response was:\n", responseText);
        return res.status(500).json({ 
          success: false, 
          error: `The AI produced a non-parseable response. Error: ${jsonErr.message}.` 
        });
      }

      // Format & sanitize promotions
      const cleanPromotions = Array.isArray(parsed.promotions) ? parsed.promotions.map((p: any, idx: number) => ({
        id: `promo-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title: p.title || "Special Promotion",
        paragraph: p.paragraph || "",
        image_url: p.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
        cta_text: p.cta_text || "Discover More",
        cta_url: p.cta_url || ""
      })) : [];

      // Format & sanitize facilities
      const cleanFacilities = Array.isArray(parsed.facilities) ? parsed.facilities.map((f: any, idx: number) => ({
        id: `fac-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title: f.title || "Hotel Amenity",
        description: f.description || "",
        category: ["Wellness", "Fitness", "General"].includes(f.category) ? f.category : "General",
        image_url: f.image_url || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80"
      })) : [];

      // Format & sanitize restaurants
      const cleanRestaurants = Array.isArray(parsed.restaurants) ? parsed.restaurants.map((r: any, idx: number) => ({
        id: `rest-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title: r.title || "Fine Dining Spotlight",
        description: r.description || "",
        image_url: r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
        cta_enabled: r.cta_enabled !== undefined ? !!r.cta_enabled : false,
        cta_text: r.cta_text || "Book A Table",
        cta_url: r.cta_url || "",
        subsections: Array.isArray(r.subsections) ? r.subsections.map((sub: any, sIdx: number) => ({
          id: `sub-${Date.now()}-${idx}-${sIdx}-${Math.floor(Math.random() * 100)}`,
          title: sub.title || "Timing Categories",
          timings: Array.isArray(sub.timings) ? sub.timings.map((t: any, tIdx: number) => ({
            id: `time-${Date.now()}-${idx}-${sIdx}-${tIdx}`,
            name: t.name || "Daily Service",
            openTime: t.openTime || "08:00",
            closeTime: t.closeTime || "22:00"
          })) : []
        })) : []
      })) : [];

      // Apply the confirmation directive — overwrite current database in firestore
      masterPromotions.length = 0;
      masterPromotions.push(...cleanPromotions);
      await saveSectionToFirestore("promotions", masterPromotions);

      masterFacilities.length = 0;
      masterFacilities.push(...cleanFacilities);
      await saveSectionToFirestore("facilities", masterFacilities);

      masterRestaurants.length = 0;
      masterRestaurants.push(...cleanRestaurants);
      await saveSectionToFirestore("restaurants", masterRestaurants);

      console.log(`[BULK URL SUCCESS] Successfully extracted promotions: ${cleanPromotions.length}, facilities: ${cleanFacilities.length}, dining: ${cleanRestaurants.length}`);
      return res.json({
        success: true,
        extractedCount: {
          promotions: cleanPromotions.length,
          facilities: cleanFacilities.length,
          restaurants: cleanRestaurants.length
        },
        masterPromotions,
        masterFacilities,
        masterRestaurants
      });

    } catch (err: any) {
      console.error("[BULK URL CRITICAL ERROR]", err);
      return res.status(500).json({ 
        success: false, 
        error: `Processing error during AI parsing of the website URL: ${err.message}` 
      });
    }
  });

  // Vite Integration for Spa Routing & Auto Rebuilding
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Foundational shell backend running at http://localhost:${PORT}`);
  });
}

startServer();
