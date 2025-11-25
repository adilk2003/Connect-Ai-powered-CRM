
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export type LeadStatus = 'New' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface Lead {
  id: string;
  dealName: string;
  companyName: string;
  contactName: string;
  value: number;
  status: LeadStatus;
  source?: string;
  createdAt?: string; // ISO Date string
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  status: TaskStatus;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'meeting' | 'task' | 'deadline';
}

export interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'IMG';
  size: string;
  dateModified: string;
  owner: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  folder: 'inbox' | 'sent' | 'trash' | 'drafts';
  read: boolean;
  avatar?: string;
}

export interface UserProfile {
    name: string;
    email: string;
    title: string; // e.g. "Pro Plan" or Job Title
    avatar: string;
}

export type View = 'Dashboard' | 'Contacts' | 'Pipeline' | 'Tasks' | 'Calendar' | 'Documents' | 'Reports' | 'Settings' | 'Email';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
