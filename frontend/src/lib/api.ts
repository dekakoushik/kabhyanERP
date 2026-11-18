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
  days_count?: number;
  total_days?: number;
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
  name?: string;
  title?: string;
  date?: string;
  holiday_date?: string;
  day_of_week?: string;
  type?: string;
  is_optional: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyAttendanceLedgerItem {
  id?: number;
  record_id?: number | null;
  user_id: number;
  name?: string;
  employee_code?: string;
  department?: string;
  designation?: string;
  month?: string;
  total_days?: number;
  working_days: number;
  days_present?: number;
  approved_leaves?: number;
  approved_leaves_count: number;
  lop_days?: number;
  loss_of_pay_days: number;
  paid_days?: number;
  notes?: string | null;
  user?: User;
}

export interface SalaryStructure {
  id: number;
  user_id: number;
  effective_from: string;
  ctc_annual: number;
  city_tier?: "non_metro" | "metro";
  basic_monthly: number;
  has_hra?: boolean;
  hra_monthly: number;
  has_special_allowance?: boolean;
  special_allowance_monthly: number;
  has_conveyance?: boolean;
  conveyance_monthly: number;
  gross_monthly: number;
  has_epf?: boolean;
  epf_mode?: "statutory_capped" | "actual" | "exempt";
  epf_employee: number;
  epf_employer: number;
  has_esi?: boolean;
  esi_employee?: number;
  esi_employer?: number;
  has_professional_tax?: boolean;
  professional_tax: number;
  pt_state?: string;
  has_gratuity?: boolean;
  gratuity_monthly?: number;
  has_tds?: boolean;
  tds_monthly: number;
  tax_regime?: "new" | "old";
  net_monthly: number;
  total_employer_cost?: number;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;
  uan_number?: string | null;
  esic_number?: string | null;
  is_active?: boolean;
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
  sac_code?: string | null;
  hsn_sac?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number | string | null;
  tax_amount?: number | null;
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
  client_gstin?: string | null;
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
  total?: number;
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
  sac_code?: string | null;
  hsn_sac?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number | string | null;
  tax_amount?: number | null;
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
  hsn_sac?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number | string | null;
  tax_amount?: number | null;
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
  advance_adjusted?: number;
  advance_adjustments?: InvoiceAdvanceAdjustment[];
  notes?: string | null;
  terms_and_conditions?: string | null;
  bank_details?: string | null;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceAdvanceAdjustment {
  id: number;
  invoice_id: number;
  receipt_voucher_id: number;
  adjusted_amount: number;
  created_at?: string;
  receipt_voucher?: ReceiptVoucher;
  invoice?: Invoice;
}

export interface ReceiptVoucher {
  id: number;
  voucher_number: string;
  estimate_id?: number | null;
  estimate?: { id: number; estimate_number: string; total_amount: number } | null;
  proforma_invoice_id?: number | null;
  project_id?: number | null;
  project?: Project | null;
  client_id?: number | null;
  created_by?: number | null;
  creator?: User | null;
  client_name: string;
  client_company?: string | null;
  client_gstin?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  voucher_date: string;
  amount_received: number;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  is_inter_state: boolean;
  place_of_supply?: string | null;
  payment_mode: "bank_transfer" | "upi" | "cheque" | "card" | "cash" | "other";
  payment_reference?: string | null;
  adjusted_amount: number;
  remaining_advance: number;
  status: "active" | "partially_adjusted" | "fully_adjusted" | "refunded";
  notes?: string | null;
  adjustments?: InvoiceAdvanceAdjustment[];
  invoice_advance_adjustments?: InvoiceAdvanceAdjustment[];
  refund_vouchers?: RefundVoucher[];
  created_at?: string;
  updated_at?: string;
}

export interface RefundVoucher {
  id: number;
  refund_number: string;
  receipt_voucher_id: number;
  created_by?: number | null;
  refund_date: string;
  amount_refunded: number;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  refund_mode: string;
  refund_reference?: string | null;
  reason: string;
  receipt_voucher?: ReceiptVoucher;
  created_at?: string;
}

export interface ReceiptVoucherStats {
  total_vouchers: number;
  total_advance_received: number;
  total_adjusted: number;
  total_remaining: number;
  active: number;
  partially_adjusted: number;
  fully_adjusted: number;
  refunded: number;
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

export interface ReportPeriod {
  start_date: string;
  end_date: string;
  label: string;
}

export interface ReportOverviewResponse {
  period: ReportPeriod;
  kpis: {
    invoiced_gross: number;
    invoiced_taxable: number;
    collections_cash: number;
    advances_received: number;
    advances_unadjusted: number;
    total_inflow: number;
    expenses_paid: number;
    net_profit: number;
    net_margin_pct: number;
    realization_rate: number;
    outstanding_due: number;
    output_gst: number;
    input_gst: number;
    net_gst_payable: number;
    active_projects: number;
    total_clients: number;
    estimate_win_rate: number;
    accepted_estimates_count: number;
  };
  recent_cashflow: Array<{
    id: string;
    type: "inflow" | "outflow";
    title: string;
    party: string;
    date: string;
    amount: number;
  }>;
}

export interface ReportRevenueResponse {
  period: ReportPeriod;
  summary: {
    total_invoiced: number;
    total_inflow: number;
    total_expense: number;
    net_profit: number;
    net_margin_pct: number;
  };
  monthly: Array<{
    month: string;
    short_month: string;
    year: number;
    invoiced: number;
    collected: number;
    advances: number;
    total_inflow: number;
    expense: number;
    net_profit: number;
    margin_pct: number;
  }>;
  quarters: Record<string, {
    invoiced: number;
    collected: number;
    expense: number;
    net: number;
  }>;
  expense_categories: CategoryBreakdown[];
}

export interface ReportGstResponse {
  period: ReportPeriod;
  company_info: {
    gstin: string;
    state_code: string;
  };
  gstr3b_summary: {
    total_turnover: number;
    taxable_turnover: number;
    total_output_tax: number;
    total_itc_claimed: number;
    net_gst_payable: number;
  };
  table4_b2b: {
    records: Array<{
      id: number;
      invoice_number: string;
      invoice_date: string;
      client_name: string;
      client_company: string;
      client_gstin: string;
      place_of_supply: string;
      invoice_value: number;
      taxable_value: number;
      tax_rate: number;
      igst: number;
      cgst: number;
      sgst: number;
      total_tax: number;
      reverse_charge: string;
    }>;
    totals: {
      count: number;
      invoice_value: number;
      taxable_value: number;
      igst: number;
      cgst: number;
      sgst: number;
      total_tax: number;
    };
  };
  table7_b2c: {
    records: Array<{
      id: number;
      invoice_number: string;
      invoice_date: string;
      client_name: string;
      client_company: string;
      client_gstin: string;
      place_of_supply: string;
      invoice_value: number;
      taxable_value: number;
      tax_rate: number;
      igst: number;
      cgst: number;
      sgst: number;
      total_tax: number;
      reverse_charge: string;
    }>;
    totals: {
      count: number;
      invoice_value: number;
      taxable_value: number;
      igst: number;
      cgst: number;
      sgst: number;
      total_tax: number;
    };
  };
  table11a_advances: {
    records: Array<{
      id: number;
      voucher_number: string;
      voucher_date: string;
      client_name: string;
      place_of_supply: string;
      amount_received: number;
      taxable_amount: number;
      tax_rate: number;
      igst: number;
      cgst: number;
      sgst: number;
      status: string;
      remaining_advance: number;
    }>;
    totals: {
      count: number;
      gross_amount: number;
      taxable_amount: number;
      igst: number;
      cgst: number;
      sgst: number;
      total_tax: number;
    };
  };
  table11b_adjustments: {
    records: Array<{
      id: number;
      invoice_number: string;
      voucher_number: string;
      adjusted_amount: number;
      invoice_date: string;
      client_name: string;
    }>;
    total_adjusted: number;
  };
  table13_documents: Array<{
    nature_of_doc: string;
    sr_from: string;
    sr_to: string;
    total_number: number;
    cancelled: number;
    net_issued: number;
  }>;
}

export interface ReportReceivablesResponse {
  summary: {
    total_receivables: number;
    dso_days: number;
    unpaid_invoices_count: number;
    debtors_count: number;
  };
  aging_buckets: {
    current_0_30: number;
    overdue_31_60: number;
    overdue_61_90: number;
    overdue_90_plus: number;
  };
  debtors: Array<{
    client_id: number | null;
    client_name: string;
    client_company?: string | null;
    client_email?: string | null;
    client_phone?: string | null;
    total_due: number;
    total_invoiced: number;
    unpaid_invoices_count: number;
    oldest_due_date: string;
    max_days_overdue: number;
  }>;
  invoices: Array<{
    id: number;
    invoice_number: string;
    client_name: string;
    client_company?: string | null;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    days_overdue: number;
    bucket: string;
    status: string;
  }>;
}

export interface ReportClientsResponse {
  period: ReportPeriod;
  concentration: {
    total_revenue: number;
    top_3_revenue: number;
    top_3_pct: number;
    top_5_revenue: number;
    top_5_pct: number;
  };
  clients: Array<{
    id: number;
    name: string;
    company_name: string;
    email: string;
    phone?: string | null;
    gstin?: string | null;
    city?: string | null;
    state?: string | null;
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    estimates_won: number;
    estimates_total: number;
    conversion_rate: number;
  }>;
}

export interface ReportProjectsResponse {
  summary: {
    total_projects: number;
    total_turnover: number;
    total_direct_cost: number;
    overall_margin: number;
    overall_margin_pct: number;
  };
  projects: Array<{
    id: number;
    name: string;
    client_name: string;
    status: string;
    start_date?: string | null;
    deadline?: string | null;
    budget: number;
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    total_expenses: number;
    gross_margin: number;
    margin_pct: number;
  }>;
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
  has_password_set?: boolean;
  password_set_at?: string | null;
  business_associate_id?: number | null;
  business_associate?: BusinessAssociate | null;
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

export interface BusinessAssociate {
  id: number;
  associate_code: string;
  name: string;
  email?: string | null;
  phone: string;
  emergency_contact?: string | null;
  address?: string | null;
  city?: string | null;
  state: string;
  pincode?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  engagement_model: "salary" | "commission" | "hybrid";
  base_salary: number | string;
  commission_rate: number | string;
  commission_basis: "taxable_turnover" | "gross_amount";
  commission_scope: "one_time" | "recurring";
  partner_tier: "bronze" | "silver" | "gold";
  status: "active" | "probation" | "inactive" | "terminated";
  joining_date: string;
  contract_end_date?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_upi_id?: string | null;
  notes?: string | null;
  clients_count?: number;
  payouts_count?: number;
  total_paid?: number | string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessAssociatePayout {
  id: number;
  payout_number: string;
  business_associate_id: number;
  client_id?: number | null;
  invoice_id?: number | null;
  invoice_payment_id?: number | null;
  type: "salary" | "commission" | "bonus" | "reimbursement";
  period_month?: string | null;
  gross_amount: number | string;
  tds_rate: number | string;
  tds_amount: number | string;
  net_amount: number | string;
  status: "pending" | "approved" | "paid" | "cancelled";
  payment_method: "bank_transfer" | "upi" | "cheque" | "cash";
  reference_number?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  client?: Client | null;
  invoice?: {
    id: number;
    invoice_number: string;
    total: number | string;
    taxable_amount?: number | string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessAssociateDocument {
  id: number;
  business_associate_id: number;
  title: string;
  document_type: "contract" | "nda" | "pan" | "kyc" | "other";
  file_path: string;
  file_size?: string | null;
  expiry_date?: string | null;
  created_at?: string;
}

export interface BusinessAssociateStats {
  total_associates: number;
  active_associates: number;
  salary_model_count: number;
  commission_model_count: number;
  total_payouts_disbursed: number;
  pending_payouts_count: number;
  pending_payouts_amount: number;
}

export interface BusinessAssociateMetrics {
  total_clients_referred: number;
  total_sales_driven: number;
  total_paid_payouts: number;
  pending_payouts: number;
  lifetime_gross_earnings: number;
  total_tds_withheld: number;
}

export interface BusinessAssociateDossierResponse {
  associate: BusinessAssociate;
  referred_clients: (Client & { total_invoices_count?: number; total_revenue_paid?: number })[];
  payouts: BusinessAssociatePayout[];
  documents: BusinessAssociateDocument[];
  metrics: BusinessAssociateMetrics;
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

/**
 * Safely extracts a setting value from the flat settings map.
 * If the key exists in the database flat map, its exact value (even if an empty string "") is returned.
 * The fallback is ONLY used if the key is completely absent from the database.
 */
export function getSettingValue(
  flat: Record<string, string>,
  key: string,
  fallbackIfUnset: string = ""
): string {
  if (key in flat && flat[key] !== null && flat[key] !== undefined) {
    return flat[key];
  }
  return fallbackIfUnset;
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

  request: async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = api.getToken();
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

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
      sync: (data?: { year?: number | string; region?: string }) =>
        api.request("/hrms/holidays/sync", {
          method: "POST",
          body: JSON.stringify(data || {}),
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
      update: (data: { user_id: number; month: string; loss_of_pay_days?: number; lop_days?: number; paid_days?: number; notes?: string }) =>
        api.request("/hrms/attendance", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      quickFill: (data: { month: string; action: "mark_all_present" | "reset_to_leaves" }) =>
        api.request("/hrms/attendance/quick-fill", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      daily: (date?: string) => {
        const q = date ? `?date=${date}` : "";
        return api.request(`/hrms/attendance/daily${q}`);
      },
      updateDaily: (data: { user_id: number; date: string; status: string; punch_in?: string; punch_out?: string; notes?: string }) =>
        api.request("/hrms/attendance/daily", {
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

  invoices: {
    generatePaymentLink: (id: number | string, returnUrl?: string) =>
      api.request(`/invoices/${id}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ return_url: returnUrl }),
      }),
  },

  portal: {
    dashboard: () => api.request("/portal/dashboard"),
    projects: () => api.request("/portal/projects"),
    project: (id: number | string) => api.request(`/portal/projects/${id}`),
    invoices: (params?: Record<string, any>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return api.request(`/portal/invoices${q}`);
    },
    invoice: (id: number | string) => api.request(`/portal/invoices/${id}`),
    invoicePaymentLink: (id: number | string, returnUrl?: string) =>
      api.request(`/portal/invoices/${id}/payment-link`, {
        method: "POST",
        body: JSON.stringify({ return_url: returnUrl }),
      }),
    estimates: (params?: Record<string, any>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return api.request(`/portal/estimates${q}`);
    },
    estimate: (id: number | string) => api.request(`/portal/estimates/${id}`),
    respondEstimate: (id: number | string, data: { action: "accepted" | "declined"; feedback?: string }) =>
      api.request(`/portal/estimates/${id}/respond`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    tickets: (params?: Record<string, any>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return api.request(`/portal/tickets${q}`);
    },
    createTicket: (data: any) =>
      api.request("/portal/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ticket: (id: number | string) => api.request(`/portal/tickets/${id}`),
    replyTicket: (id: number | string, message: string) =>
      api.request(`/portal/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
  },

  settings: {
    get: () => api.request("/settings"),
    update: (settings: any[]) =>
      api.request("/settings", {
        method: "POST",
        body: JSON.stringify({ settings }),
      }),
    flushCache: () =>
      api.request("/settings/flush-cache", {
        method: "POST",
      }),
    migrateDatabase: () =>
      api.request("/settings/migrate-database", {
        method: "POST",
      }),
    resetDatabase: (data: { confirmation: string; password: string }) =>
      api.request("/settings/reset-database", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
