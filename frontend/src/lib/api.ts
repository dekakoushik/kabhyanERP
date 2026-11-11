const API_BASE =
  (typeof window !== "undefined" && window.location.hostname !== "localhost")
    ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_API_URL
        : "/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "superadmin" | "admin" | "hr" | "manager" | "employee" | "client";
  department?: string | null;
  designation?: string | null;
  status: "active" | "inactive" | "suspended";
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  superadmins: number;
  admins: number;
  employees: number;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  client_id?: number | null;
  client?: Client | null;
  client_name?: string | null;
  manager_id?: number | null;
  manager?: User | null;
  members?: User[];
  status: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  budget?: number | null;
  start_date?: string | null;
  deadline?: string | null;
  progress_percentage: number;
  tasks_count?: number;
  completed_tasks_count?: number;
  tasks?: Task[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStats {
  total_projects: number;
  in_progress: number;
  completed: number;
  planning: number;
  on_hold: number;
  total_tasks: number;
  completed_tasks: number;
}

export interface Task {
  id: number;
  project_id: number;
  project?: { id: number; name: string; code: string };
  assigned_to?: number | null;
  assignee?: User | null;
  created_by?: number | null;
  creator?: User | null;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "in_review" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  estimated_hours?: number;
  logged_hours?: number;
  due_date?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EstimateItem {
  id?: number;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface Estimate {
  id: number;
  estimate_number: string;
  project_id?: number | null;
  project?: Project | null;
  created_by?: number | null;
  creator?: User | null;
  client_name: string;
  client_email?: string | null;
  client_company?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  estimate_date: string;
  expiry_date?: string | null;
  status: "draft" | "sent" | "accepted" | "declined" | "invoiced";
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  round_off?: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  notes?: string | null;
  terms_and_conditions?: string | null;
  items?: EstimateItem[];
  created_at?: string;
  updated_at?: string;
}

export interface EstimateStats {
  total_estimates: number;
  total_value: number;
  accepted_value: number;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  invoiced: number;
}

export interface ProformaInvoiceItem {
  id?: number;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface ProformaInvoice {
  id: number;
  proforma_number: string;
  estimate_id?: number | null;
  estimate?: { id: number; estimate_number: string } | null;
  project_id?: number | null;
  project?: Project | null;
  created_by?: number | null;
  creator?: User | null;
  client_name: string;
  client_company?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  invoice_date: string;
  due_date?: string | null;
  status: "unpaid" | "partially_paid" | "paid" | "cancelled";
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  round_off?: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string | null;
  terms_and_conditions?: string | null;
  bank_details?: string | null;
  items?: ProformaInvoiceItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ProformaInvoiceStats {
  total_invoices: number;
  total_value: number;
  paid_value: number;
  unpaid_value: number;
  unpaid: number;
  partially_paid: number;
  paid: number;
  cancelled: number;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  item_name: string;
  description?: string | null;
  sac_code?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: "bank_transfer" | "neft" | "rtgs" | "upi" | "cheque" | "cash" | "card" | "other";
  transaction_reference?: string | null;
  notes?: string | null;
  recorded_by?: number | null;
  recorder?: User | null;
  created_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  proforma_invoice_id?: number | null;
  proforma_invoice?: { id: number; proforma_number: string } | null;
  estimate_id?: number | null;
  estimate?: { id: number; estimate_number: string } | null;
  project_id?: number | null;
  project?: Project | null;
  created_by?: number | null;
  creator?: User | null;
  client_name: string;
  client_company?: string | null;
  client_gstin?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  invoice_date: string;
  due_date?: string | null;
  status: "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled";
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  round_off?: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  notes?: string | null;
  terms_and_conditions?: string | null;
  bank_details?: string | null;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceStats {
  total_invoices: number;
  total_invoiced_value: number;
  total_collected_value: number;
  total_outstanding_value: number;
  unpaid: number;
  partially_paid: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description?: string | null;
  is_active: boolean;
  expenses_count?: number;
}

export interface Expense {
  id: number;
  expense_number: string;
  expense_category_id: number;
  category?: ExpenseCategory;
  project_id?: number | null;
  project?: Project | null;
  created_by?: number | null;
  creator?: User | null;
  title: string;
  description?: string | null;
  vendor_name?: string | null;
  vendor_gstin?: string | null;
  expense_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_method: "bank_transfer" | "upi" | "neft" | "rtgs" | "corporate_card" | "cash" | "cheque";
  transaction_reference?: string | null;
  status: "paid" | "pending" | "cancelled";
  receipt_attachment?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  year: number;
  total_collected_income: number;
  total_invoiced_gross: number;
  total_outstanding_due: number;
  total_expenses_paid: number;
  total_input_gst_credit: number;
  net_operating_profit: number;
  profit_margin: number;
}

export interface MonthlyFinancial {
  month: string;
  month_number: number;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  id: number;
  name: string;
  color: string;
  total_amount: number;
}

export interface CashflowTransaction {
  id: string;
  type: "income" | "expense";
  title: string;
  party: string;
  date: string;
  amount: number;
  method: string;
  reference?: string | null;
  status: string;
}

export interface FinancialReportResponse {
  summary: FinancialSummary;
  monthly: MonthlyFinancial[];
  category_breakdown: CategoryBreakdown[];
  recent_transactions: CashflowTransaction[];
}

export interface Client {
  id: number;
  user_id?: number | null;
  user?: User | null;
  client_code: string;
  name: string;
  company_name: string;
  email: string;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  portal_access_status: "active" | "inactive";
  notes?: string | null;
  projects_count?: number;
  tickets_count?: number;
  projects?: Project[];
  tickets?: Ticket[];
  created_at?: string;
  updated_at?: string;
}

export interface ClientStats {
  total_clients: number;
  active_portal_users: number;
  total_active_projects: number;
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  user_id?: number | null;
  client_id?: number | null;
  staff?: User | null;
  client?: Client | null;
  message: string;
  is_staff_reply: boolean;
  attachments?: any;
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  client_id: number;
  client?: Client;
  project_id?: number | null;
  project?: Project | null;
  assigned_to?: number | null;
  assignee?: User | null;
  subject: string;
  type: "issue" | "change_request" | "improvement" | "query" | "billing";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "awaiting_client_reply" | "resolved" | "closed";
  description: string;
  attachments?: any;
  resolved_at?: string | null;
  replies_count?: number;
  replies?: TicketReply[];
  created_at: string;
  updated_at?: string;
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved: number;
}

export interface PortalDashboardData {
  client: Client;
  projects: Project[];
  recent_tickets: Ticket[];
  recent_invoices: Invoice[];
  stats: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    open_tickets: number;
    total_invoiced: number;
    total_due: number;
  };
}

export interface SystemSettingItem {
  id?: number;
  key: string;
  value: string;
  group: string;
  type: string;
  description?: string | null;
}

export interface EnvironmentHealth {
  app_name: string;
  app_env: string;
  php_version: string;
  laravel_version: string;
  database_status: string;
  redis_status: string;
  redis_ping?: string;
  cache_driver: string;
  server_time: string;
  timezone: string;
}

export interface SettingsResponse {
  settings: Record<string, SystemSettingItem[]>;
  environment: EnvironmentHealth;
}

export interface SystemNotificationItem {
  id: number;
  user_id?: number | null;
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
  data?: any;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  unread_count: number;
  notifications: {
    data: SystemNotificationItem[];
    current_page: number;
    total: number;
  };
}

export const api = {
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kabhyan_token");
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kabhyan_token", token);
    }
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kabhyan_token");
      localStorage.removeItem("kabhyan_user");
    }
  },

  getUser: (): User | null => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("kabhyan_user");
      return data ? JSON.parse(data) : null;
    }
    return null;
  },

  setUser: (user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kabhyan_user", JSON.stringify(user));
    }
  },

  request: async (endpoint: string, options: RequestInit = {}) => {
    const token = api.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        api.removeToken();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      throw new Error(data.message || "An unexpected error occurred.");
    }

    return data;
  },
};
