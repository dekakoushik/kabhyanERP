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
  total_invoices?: number;
  unpaid_invoices_count?: number;
  unpaid_amount?: number;
  paid_amount?: number;
  active_projects?: number;
  open_tickets?: number;
  total_due?: number;
  total_invoiced?: number;
}

export type DocumentStage = "estimate" | "proforma" | "tax_invoice";

export interface DocumentHistoryItem {
  stage: "estimate" | "proforma";
  id: number;
  number: string;
  date: string;
  total_amount: number;
  status: string;
}

export interface CommercialThread {
  thread_id: string;
  stage: DocumentStage;
  headline_id: number;
  headline_number: string;
  headline_status: string;
  headline_date: string;
  due_date?: string;
  total_amount: number;
  due_amount?: number;
  paid_amount?: number;
  project_name?: string;
  history: DocumentHistoryItem[];
  raw_document: Invoice | ProformaInvoice | Estimate;
}

export interface InvoiceItem {
  id: number;
  item_name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  taxable_amount?: number;
  gst_rate?: number;
  gst_amount?: number;
  total_amount?: number;
}

export interface ProformaInvoiceSummary {
  id: number;
  proforma_number: string;
  status: string;
  total_amount?: number;
  invoice_date?: string;
  due_date?: string;
  tax_calculation_type?: "exclusive" | "inclusive";
  estimate?: EstimateSummary;
  tax_invoices?: TaxInvoiceSummary[];
}

export interface TaxInvoiceSummary {
  id: number;
  invoice_number: string;
  status: "draft" | "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled";
  total_amount: number;
  due_amount?: number;
  paid_amount?: number;
  invoice_date?: string;
  due_date?: string;
}

export interface EstimateSummary {
  id: number;
  estimate_number: string;
  status: string;
  total_amount?: number;
  total?: number;
  estimate_date?: string;
  tax_calculation_type?: "exclusive" | "inclusive";
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: "draft" | "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled";
  currency?: string;
  tax_calculation_type?: "exclusive" | "inclusive";
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_type?: "percentage" | "fixed";
  discount_rate?: number;
  discount_amount?: number;
  round_off?: number;
  total_amount: number;
  total?: number;
  paid_amount?: number;
  due_amount?: number;
  client?: ClientProfile;
  items?: InvoiceItem[];
  project?: { id: number; name: string; code?: string };
  proforma_invoice?: ProformaInvoiceSummary;
  estimate?: EstimateSummary;
}

export interface ProformaInvoice {
  id: number;
  proforma_number: string;
  invoice_date: string;
  due_date: string;
  status: "draft" | "sent" | "unpaid" | "partially_paid" | "paid" | "converted" | "partially_invoiced" | "fully_invoiced" | "cancelled";
  currency?: string;
  tax_calculation_type?: "exclusive" | "inclusive";
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_type?: "percentage" | "fixed";
  discount_rate?: number;
  discount_amount?: number;
  round_off?: number;
  total_amount: number;
  paid_amount?: number;
  invoiced_amount?: number;
  remaining_amount?: number;
  items?: InvoiceItem[];
  notes?: string;
  terms_and_conditions?: string;
  project?: { id: number; name: string; code?: string };
  estimate?: EstimateSummary;
  tax_invoices?: TaxInvoiceSummary[];
}

export interface Estimate {
  id: number;
  estimate_number: string;
  estimate_date: string;
  expiry_date?: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired" | "invoiced";
  currency?: string;
  tax_calculation_type?: "exclusive" | "inclusive";
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_type?: "percentage" | "fixed";
  discount_rate?: number;
  discount_amount?: number;
  round_off?: number;
  total_amount: number;
  total?: number;
  items?: InvoiceItem[];
  notes?: string;
  terms_and_conditions?: string;
  project?: { id: number; name: string; code?: string };
  proforma_invoices?: ProformaInvoiceSummary[];
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
  type?: "issue" | "change_request" | "improvement" | "query" | "billing" | string;
  status: "open" | "in_progress" | "awaiting_client_reply" | "resolved" | "closed" | string;
  priority: "low" | "medium" | "high" | "urgent" | "critical" | string;
  created_at: string;
  project?: { id: number; name: string; code?: string };
  replies_count?: number;
  messages?: TicketMessage[];
}

export interface DashboardResponse {
  client: ClientProfile;
  stats: DashboardStats;
  recent_invoices: Invoice[];
  projects: Project[];
  recent_tickets: SupportTicket[];
  active_estimates?: Estimate[];
  active_proformas?: ProformaInvoice[];
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

  // Proforma Invoices
  getProformaInvoices: (status?: string) =>
    apiClient<{ proforma_invoices: { data?: ProformaInvoice[] } | ProformaInvoice[] }>("/portal/proforma-invoices", {
      params: { status },
    }),

  getProformaInvoice: (id: number | string) =>
    apiClient<{ proforma_invoice: ProformaInvoice }>(`/portal/proforma-invoices/${id}`),

  // Estimates / Quotations
  getEstimates: (status?: string) =>
    apiClient<{ estimates: Estimate[] }>("/portal/estimates", {
      params: { status },
    }),

  getEstimate: (id: number | string) =>
    apiClient<{ estimate: Estimate }>(`/portal/estimates/${id}`),

  getEstimatePdfUrl: (id: number | string) =>
    apiClient<{ download_url: string; filename: string }>(`/portal/estimates/${id}/download-url`),

  respondEstimate: (id: number | string, action: "accepted" | "declined", reason?: string) =>
    apiClient<{
      success: boolean;
      message: string;
      estimate?: Estimate;
      proforma_invoice?: ProformaInvoiceSummary;
    }>(`/portal/estimates/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),

  getProformaPdfUrl: (id: number | string) =>
    apiClient<{ download_url: string; filename: string }>(`/portal/proforma-invoices/${id}/download-url`),

  getInvoicePdfUrl: (id: number | string) =>
    apiClient<{ download_url: string; filename: string }>(`/portal/invoices/${id}/download-url`),

  // Unified Commercial Documents Lifecycle Feed (Zero-Tab Billing)
  getCommercialDocuments: (search?: string, status?: string) =>
    apiClient<{ threads: CommercialThread[] }>("/portal/documents", {
      params: { search, status },
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

  // Push Notification Device Tokens
  registerDeviceToken: (data: { push_token: string; platform: string; device_name?: string }) =>
    apiClient<{ success: boolean; message: string }>("/portal/device-tokens", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeDeviceToken: (push_token: string) =>
    apiClient<{ success: boolean; message: string }>("/portal/device-tokens/remove", {
      method: "POST",
      body: JSON.stringify({ push_token }),
    }),
};
