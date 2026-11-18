import { apiClient } from "./client";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  client_id?: number;
}

export interface ClientProfile {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billing_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DashboardStats {
  total_invoices: number;
  unpaid_invoices_count: number;
  unpaid_amount: number;
  paid_amount: number;
  active_projects: number;
  open_tickets: number;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: "draft" | "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled";
  subtotal: number;
  tax_amount: number;
  total: number;
  paid_amount?: number;
  client?: ClientProfile;
  items?: InvoiceItem[];
}

export interface Estimate {
  id: number;
  estimate_number: string;
  estimate_date: string;
  expiry_date?: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  subtotal: number;
  tax_amount: number;
  total: number;
  items?: InvoiceItem[];
  notes?: string;
}

export interface ProjectDeliverable {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "completed";
  due_date?: string;
}

export interface Project {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
  progress?: number;
  start_date?: string;
  deadline?: string;
  deliverables?: ProjectDeliverable[];
}

export interface TicketMessage {
  id: number;
  message: string;
  sender_type: "client" | "staff" | "system";
  sender_name?: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  messages?: TicketMessage[];
}

export interface DashboardResponse {
  client: ClientProfile;
  stats: DashboardStats;
  recent_invoices: Invoice[];
  projects: Project[];
  recent_tickets: SupportTicket[];
}

export const portalApi = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiClient<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  // Dashboard
  getDashboard: () => apiClient<DashboardResponse>("/portal/dashboard"),

  // Invoices
  getInvoices: (status?: string) =>
    apiClient<{ invoices: Invoice[] }>("/portal/invoices", {
      params: { status },
    }),

  getInvoice: (id: number | string) =>
    apiClient<{ invoice: Invoice }>(`/portal/invoices/${id}`),

  getPaymentLink: (invoiceId: number | string) =>
    apiClient<{ success: boolean; payment_link?: { link_url: string } }>(
      `/portal/invoices/${invoiceId}/payment-link`,
      { method: "POST" }
    ),

  // Estimates / Quotations
  getEstimates: (status?: string) =>
    apiClient<{ estimates: Estimate[] }>("/portal/estimates", {
      params: { status },
    }),

  getEstimate: (id: number | string) =>
    apiClient<{ estimate: Estimate }>(`/portal/estimates/${id}`),

  respondEstimate: (id: number | string, action: "accepted" | "declined", reason?: string) =>
    apiClient<{ success: boolean; message: string }>(`/portal/estimates/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),

  // Projects
  getProjects: () => apiClient<{ projects: Project[] }>("/portal/projects"),

  getProject: (id: number | string) =>
    apiClient<{ project: Project }>(`/portal/projects/${id}`),

  // Support Tickets
  getTickets: (status?: string) =>
    apiClient<{ tickets: SupportTicket[] }>("/portal/tickets", {
      params: { status },
    }),

  getTicket: (id: number | string) =>
    apiClient<{ ticket: SupportTicket }>(`/portal/tickets/${id}`),

  createTicket: (data: { subject: string; message: string; priority: string }) =>
    apiClient<{ success: boolean; ticket: SupportTicket }>("/portal/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  replyTicket: (id: number | string, message: string) =>
    apiClient<{ success: boolean; message: TicketMessage }>(`/portal/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};
