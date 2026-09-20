// This interface describes one savings challenge.

export interface Challenge {
  id: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly';
  startDate: string;
  targetDays?: number;
  targetAmount?: number;
  currency: string;
  createdAt: string;
}

// This interface describes one check-in record.

export interface CheckIn {
  id: string;
  challengeId: string;
  date: string;
  saved: boolean;
  actualAmount?: number;
  reason?: string;
  updatedAt: string;
}

// This interface describes one reflection note.

export interface Reflection {
  id: string;
  challengeId: string;
  text: string;
  updatedAt: string;
}