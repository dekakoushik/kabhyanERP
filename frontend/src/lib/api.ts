const API_BASE =
  (typeof window !== "undefined" && window.location.hostname !== "localhost")
    ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_API_URL
        : "/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string;
  is_system: boolean;
  users_count?: number;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  slug: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionModuleGroup {
  module: string;
  label: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  employee_code?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  emergency_contact?: string | null;
  role: string;
  role_id?: number | null;
  custom_role?: Role | null;
  department?: string | null;
  designation?: string | null;
  date_of_joining?: string | null;
  status: "active" | "inactive" | "suspended";
  permissions?: string[];
  last_login_at?: string | null;
  last_login_ip?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: number | null;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
  leave_type?: LeaveType;
  approver?: User | null;
}

export interface CompanyHoliday {
  id: number;
  name: string;
  date: string;
  day_of_week?: string;
  type: "national" | "festival" | "company";
  is_optional: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyAttendanceLedgerItem {
  id: number;
  user_id: number;
  month: string;
  working_days: number;
  days_present: number;
  approved_leaves_count: number;
  loss_of_pay_days: number;
  notes?: string | null;
  user?: User;
}

export interface SalaryStructure {
  id: number;
  user_id: number;
  effective_from: string;
  ctc_annual: number;
  basic_monthly: number;
  hra_monthly: number;
  special_allowance_monthly: number;
  conveyance_monthly: number;
  gross_monthly: number;
  epf_employee: number;
  epf_employer: number;
  professional_tax: number;
  tds_monthly: number;
  net_monthly: number;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;
  uan_number?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

export interface PayrollBatch {
  id: number;
  month: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_lop_deductions: number;
  status: "draft" | "finalized" | "disbursed";
  processed_by?: number | null;
  processed_at?: string | null;
  disbursed_at?: string | null;
  notes?: string | null;
  payslips_count?: number;
  payslips?: Payslip[];
  created_at?: string;
  updated_at?: string;
}

export interface Payslip {
  id: number;
  payroll_batch_id: number;
  user_id: number;
  payslip_number: string;
  month: string;
  working_days: number;
  paid_days: number;
  lop_days: number;
  gross_salary: number;
  lop_deduction: number;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  conveyance: number;
  total_earnings: number;
  epf_deduction: number;
  professional_tax: number;
  tds_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  status: "draft" | "generated" | "disbursed";
  payment_mode?: string | null;
  transaction_reference?: string | null;
  disbursed_at?: string | null;
  salary_snapshot?: any;
  created_at?: string;
  updated_at?: string;
  user?: User;
  batch?: PayrollBatch;
}

export interface HrmsDashboardData {
  stats: {
    total_staff: number;
    active_salary_structures: number;
    pending_leaves: number;
    current_month_batch: PayrollBatch | null;
    current_month: string;
  };
  upcoming_holidays: CompanyHoliday[];
  recent_leaves: LeaveRequest[];
  latest_batches: PayrollBatch[];
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  superadmins: number;
  admins: number;
  managers?: number;
  hr?: number;
  employees: number;
  custom_role_users?: number;
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
  proforma_invoices?: ProformaInvoice[];
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
  client_gstin?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  invoice_date: string;
  due_date?: string | null;
  status: "unpaid" | "partially_paid" | "paid" | "partially_invoiced" | "fully_invoiced" | "cancelled";
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  round_off?: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  invoiced_amount?: number;
  remaining_amount?: number;
  notes?: string | null;
  terms_and_conditions?: string | null;
  bank_details?: string | null;
  items?: ProformaInvoiceItem[];
  tax_invoices?: Invoice[];
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
  tax_number?: string | null;
  pan?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  currency?: string | null;
  payment_terms?: string | null;
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
  database_ping?: string;
  database_driver?: string;
  queue_driver?: string;
  session_driver?: string;
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
      const firstValidationError = data.errors
        ? (Object.values(data.errors).flat()[0] as string)
        : null;
      const errorMsg =
        firstValidationError ||
        data.message ||
        data.error ||
        `Server responded with error status ${res.status}`;
      const customErr: any = new Error(errorMsg);
      customErr.status = res.status;
      customErr.data = data;
      throw customErr;
    }

    return data;
  },

  downloadPdf: async (endpoint: string, filename: string) => {
    const token = api.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || "Failed to download PDF document.");
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 5000);
  },

  openPdf: async (endpoint: string) => {
    const token = api.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || "Failed to load PDF document.");
    }

    const blob = await res.blob();
    const fileUrl = window.URL.createObjectURL(blob);
    window.open(fileUrl, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(fileUrl), 10000);
  },

  users: {
    list: (params?: Record<string, any>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return api.request(`/users${q}`);
    },
    get: (id: number | string) => api.request(`/users/${id}`),
    create: (data: any) =>
      api.request("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number | string, data: any) =>
      api.request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      api.request(`/users/${id}`, {
        method: "DELETE",
      }),
    departments: () => api.request("/users/departments"),
  },

  roles: {
    list: () => api.request("/roles"),
    get: (id: number | string) => api.request(`/roles/${id}`),
    create: (data: any) =>
      api.request("/roles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number | string, data: any) =>
      api.request(`/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      api.request(`/roles/${id}`, {
        method: "DELETE",
      }),
  },

  permissions: {
    list: () => api.request("/permissions"),
  },

  departments: {
    list: () => api.request("/users/departments"),
  },

  hrms: {
    dashboard: () => api.request("/hrms/dashboard"),
    leaves: {
      list: (params?: Record<string, any>) => {
        const q = params ? "?" + new URLSearchParams(params).toString() : "";
        return api.request(`/hrms/leaves${q}`);
      },
      types: () => api.request("/hrms/leave-types"),
      apply: (data: any) =>
        api.request("/hrms/leaves", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      updateStatus: (id: number | string, data: { status: "approved" | "rejected"; admin_notes?: string }) =>
        api.request(`/hrms/leaves/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },
    holidays: {
      list: (year?: number | string) => {
        const q = year ? `?year=${year}` : "";
        return api.request(`/hrms/holidays${q}`);
      },
      create: (data: any) =>
        api.request("/hrms/holidays", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      delete: (id: number | string) =>
        api.request(`/hrms/holidays/${id}`, {
          method: "DELETE",
        }),
    },
    attendance: {
      get: (month?: string) => {
        const q = month ? `?month=${month}` : "";
        return api.request(`/hrms/attendance${q}`);
      },
      update: (data: { user_id: number; month: string; loss_of_pay_days: number; notes?: string }) =>
        api.request("/hrms/attendance", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    salaryStructures: {
      list: () => api.request("/hrms/salary-structures"),
      get: (userId: number | string) => api.request(`/hrms/salary-structures/${userId}`),
      save: (data: any) =>
        api.request("/hrms/salary-structures", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    payroll: {
      overview: () => api.request("/hrms/payroll"),
      calculate: (month: string) => api.request(`/hrms/payroll/calculate?month=${month}`),
      generate: (data: { month: string; notes?: string }) =>
        api.request("/hrms/payroll/generate", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      finalize: (id: number | string) =>
        api.request(`/hrms/payroll/${id}/finalize`, {
          method: "POST",
        }),
      disburse: (id: number | string, data: { payment_mode: string; transaction_reference?: string; disbursed_at?: string }) =>
        api.request(`/hrms/payroll/${id}/disburse`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      payslip: (id: number | string) => api.request(`/hrms/payslips/${id}`),
      myPayslips: () => api.request("/hrms/my-payslips"),
    },
  },
};
