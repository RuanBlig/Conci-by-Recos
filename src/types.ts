export interface GuestSession {
  guestName: string;
  roomNumber: string;
}

export type Role = "guest" | "staff" | "manager" | "admin" | "recos" | null;

export interface Task {
  id: string;
  title: string;
  room: string;
  status: "received" | "in_progress" | "completed";
  createdAt: number;
  informedDept: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "staff";
  content: string;
  timestamp: string;
  senderName: string;
}

export interface HotelConfig {
  hotelName: string;
  logoUrl: string;
  conciergeKb: string;
  feedbackUrl: string;
  nightshift: boolean;
  opHoursMorning: string;
  opHoursAfternoon: string;
  opHoursNight: string;
  opHoursLimitEnabled: boolean;
  opHoursConstraint: string;
  alertPopupActive: boolean;
  alertPopupHeader: string;
  alertPopupBody: string;
  alertBannerActive: boolean;
  alertBannerText: string;
}
