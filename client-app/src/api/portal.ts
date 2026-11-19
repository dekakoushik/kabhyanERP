import { apiClient, API_BASE_URL, getStoredToken } from "./client";
import { logger } from "../utils/logger";

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

export type DocumentStage = "estimate" | "proforma" | "tax_invoice" | "receipt_voucher";

export interface DocumentHistoryItem {
  stage: "estimate" | "proforma" | "receipt_voucher" | "tax_invoice";
  id: number;
  number: string;
  date: string;
  total_amount: number;
  status: string;
}

export interface ReceiptVoucher {
  id: number;
  voucher_number: string;
  voucher_date: string;
  estimate_id?: number;
  proforma_invoice_id?: number;
  project_id?: number;
  client_id?: number;
  client_name: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_gstin?: string;
  place_of_supply?: string;
  amount_received: number;
  total_amount?: number;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  is_inter_state: boolean;
  payment_mode: string;
  payment_reference?: string;
  adjusted_amount: number;
  remaining_advance?: number;
  remaining_amount?: number;
  status: "active" | "partially_adjusted" | "fully_adjusted" | "refunded";
  notes?: string;
  project?: { id: number; name: string; code?: string };
  estimate?: EstimateSummary;
  invoice_advance_adjustments?: Array<{
    id: number;
    invoice_id: number;
    adjusted_amount: number;
    invoice?: {
      id: number;
      invoice_number: string;
      invoice_date: string;
      total_amount: number;
    };
  }>;
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
  advance_adjusted?: number;
  project_name?: string;
  history: DocumentHistoryItem[];
  raw_document: Invoice | ProformaInvoice | Estimate | ReceiptVoucher;
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
  advance_adjusted?: number;
  advance_adjustments?: Array<{
    id: number;
    receipt_voucher_id: number;
    adjusted_amount: number;
    receipt_voucher?: {
      id: number;
      voucher_number: string;
      voucher_date: string;
      total_amount: number;
    };
  }>;
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
  receipt_vouchers?: ReceiptVoucher[];
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

export interface ProjectFileRequest {
  id: number;
  project_id: number;
  client_id: number;
  requested_by: number;
  title: string;
  description?: string | null;
  file_type_allowed?: string;
  due_date?: string | null;
  priority: "normal" | "high" | "urgent";
  status: "pending" | "submitted" | "approved" | "rejected";
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_at?: string | null;
  review_notes?: string | null;
  created_at?: string;
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
  show_tasks_to_client?: boolean;
  deliverables?: ProjectDeliverable[];
  file_requests?: ProjectFileRequest[];
}

export interface TicketMessage {
  id: number;
  message: string;
  sender_type: "client" | "staff" | "system";
  sender_name?: string;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  path: string;
  url: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
}

export interface ChosenAttachment {
  uri: string;
  name: string;
  type?: string;
}

export interface TicketReplyItem {
  id: number;
  ticket_id: number;
  client_id?: number | null;
  user_id?: number | null;
  message: string;
  is_staff_reply: boolean;
  attachments?: TicketAttachment[];
  created_at: string;
  staff?: { id: number; name: string; avatar?: string };
  client?: { id: number; name: string; company_name?: string };
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description?: string;
  type?: "issue" | "change_request" | "improvement" | "query" | "billing" | string;
  status: "open" | "in_progress" | "awaiting_client_reply" | "resolved" | "closed" | string;
  priority: "low" | "medium" | "high" | "urgent" | "critical" | string;
  attachments?: TicketAttachment[];
  created_at: string;
  project?: { id: number; name: string; code?: string };
  assignee?: { id: number; name: string; avatar?: string };
  replies_count?: number;
  replies?: TicketReplyItem[];
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

  logout: () =>
    apiClient<{ message: string }>("/auth/logout", {
      method: "POST",
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

  // Statutory GST Advance Receipt Vouchers (Section 31(3)(d) & Rule 50)
  getReceiptVouchers: (status?: string) =>
    apiClient<{ receipt_vouchers: { data?: ReceiptVoucher[] } | ReceiptVoucher[] }>("/portal/receipt-vouchers", {
      params: { status },
    }),

  getReceiptVoucher: (id: number | string) =>
    apiClient<{ receipt_voucher: ReceiptVoucher }>(`/portal/receipt-vouchers/${id}`),

  getReceiptVoucherPdfUrl: (id: number | string) =>
    apiClient<{ download_url: string; filename: string }>(`/portal/receipt-vouchers/${id}/download-url`),

  // Unified Commercial Documents Lifecycle Feed (Zero-Tab Billing)
  getCommercialDocuments: (search?: string, status?: string) =>
    apiClient<{ threads: CommercialThread[] }>("/portal/documents", {
      params: { search, status },
    }),

  // Projects
  getProjects: () => apiClient<{ projects: Project[] }>("/portal/projects"),

  getProject: (id: number | string) =>
    apiClient<{ project: Project; show_tasks_to_client?: boolean; file_requests?: ProjectFileRequest[] }>(`/portal/projects/${id}`),

  getProjectFileRequests: (projectId: number | string) =>
    apiClient<{ file_requests: ProjectFileRequest[] }>(`/portal/projects/${projectId}/file-requests`),

  uploadFileRequest: async (
    projectId: number | string,
    requestId: number | string,
    fileOrFormData: FormData | { uri: string; name: string; type?: string }
  ) => {
    const token = await getStoredToken();
    const url = `${API_BASE_URL}/portal/projects/${projectId}/file-requests/${requestId}/upload`;

    // If a file descriptor is supplied, use standard Blob or native XHR
    if ("uri" in fileOrFormData) {
      const file = fileOrFormData;

      // Pipeline 1: Convert file URI to standard Blob for modern expo/fetch
      try {
        const fileRes = await fetch(file.uri);
        const blob = await fileRes.blob();
        const formData = new FormData();
        formData.append("file", blob, file.name);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (response.ok) {
          return (await response.json()) as { message: string; file_request: ProjectFileRequest };
        } else {
          const errJson = await response.json().catch(() => ({}));
          const errMsg =
            errJson.message ||
            (errJson.errors ? Object.values(errJson.errors).flat().join(" ") : null) ||
            `Upload failed (Status ${response.status})`;
          throw new Error(errMsg);
        }
      } catch (err: any) {
        // If the server deliberately rejected the request (validation/permissions), throw immediately
        if (
          err.message &&
          !err.message.includes("Network request failed") &&
          !err.message.includes("Unsupported FormDataPart") &&
          !err.message.includes("Failed to fetch")
        ) {
          throw err;
        }
        logger.warn("[Upload] Blob fetch upload failed, falling back to native XHR:", err);
      }

      // Pipeline 2: React Native native XHR bridge (bulletproof for native files)
      return new Promise<{ message: string; file_request: ProjectFileRequest }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Accept", "application/json");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({ message: "File uploaded successfully", file_request: {} as any });
            }
          } else {
            try {
              const errJson = JSON.parse(xhr.responseText);
              reject(new Error(errJson.message || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during file upload."));

        const formData = new FormData();
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: file.type || "application/octet-stream",
        } as any);

        xhr.send(formData);
      });
    }

    return apiClient<{ message: string; file_request: ProjectFileRequest }>(
      `/portal/projects/${projectId}/file-requests/${requestId}/upload`,
      {
        method: "POST",
        body: fileOrFormData,
      }
    );
  },

  // Support Tickets
  getTickets: (status?: string) =>
    apiClient<{ tickets: SupportTicket[] }>("/portal/tickets", {
      params: { status },
    }),

  getTicket: (id: number | string) =>
    apiClient<{ ticket: SupportTicket }>(`/portal/tickets/${id}`),

  createTicket: async (
    data: {
      subject: string;
      message?: string;
      description?: string;
      priority?: string;
      project_id?: number;
      type?: string;
    },
    attachments: ChosenAttachment[] = []
  ) => {
    const fields = {
      subject: data.subject,
      description: data.description || data.message,
      message: data.message || data.description,
      priority: data.priority,
      project_id: data.project_id,
      type: data.type || "query",
    };

    if (attachments.length === 0) {
      return apiClient<{ success: boolean; ticket: SupportTicket }>("/portal/tickets", {
        method: "POST",
        body: JSON.stringify(fields),
      });
    }

    const token = await getStoredToken();
    const url = `${API_BASE_URL}/portal/tickets`;

    return new Promise<{ success: boolean; ticket: SupportTicket }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Accept", "application/json");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ success: true, ticket: {} as any });
          }
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            reject(new Error(errJson.message || `Submission failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Submission failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network connection error during ticket creation."));

      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, String(v));
        }
      });

      attachments.forEach((att, idx) => {
        formData.append("attachments[]", {
          uri: att.uri,
          name: att.name || `image_${idx}.jpg`,
          type: att.type || "image/jpeg",
        } as any);
      });

      xhr.send(formData);
    });
  },

  replyTicket: async (
    id: number | string,
    message: string,
    attachments: ChosenAttachment[] = []
  ) => {
    if (attachments.length === 0) {
      return apiClient<{ message: string; reply?: TicketReplyItem; ticket?: SupportTicket; success?: boolean }>(
        `/portal/tickets/${id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({ message }),
        }
      );
    }

    const token = await getStoredToken();
    const url = `${API_BASE_URL}/portal/tickets/${id}/reply`;

    return new Promise<{ message: string; reply?: TicketReplyItem; ticket?: SupportTicket; success?: boolean }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Accept", "application/json");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({ message: "Reply sent", success: true });
            }
          } else {
            try {
              const errJson = JSON.parse(xhr.responseText);
              reject(new Error(errJson.message || `Reply failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Reply failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during reply upload."));

        const formData = new FormData();
        formData.append("message", message);

        attachments.forEach((att, idx) => {
          formData.append("attachments[]", {
            uri: att.uri,
            name: att.name || `reply_${idx}.jpg`,
            type: att.type || "image/jpeg",
          } as any);
        });

        xhr.send(formData);
      }
    );
  },

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
