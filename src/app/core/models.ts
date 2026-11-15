export type Role =
  | 'admin'
  | 'requester'
  | 'rfq-creator'
  | 'tech-approver'
  | 'dept-approver'
  | 'vat-approver'
  | 'accounts'
  | 'vendor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department?: string;
  vendorId?: string;
}

export interface AuditEntry {
  at: string;
  by: string;
  action: string;
}

export type PurchaseCategory =
  | 'IT equipment'
  | 'Facilities & services'
  | 'Operations supplies'
  | 'Capex';

/** PRs need no approval: a saved PR is immediately ready for an RFQ. */
export type PrStatus = 'Open' | 'RFQ created';

export interface PrItem {
  /** Empty when the line is a free-text item without a material code. */
  materialCode: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
}

export interface PurchaseRequisition {
  id: string;
  title: string;
  items: PrItem[];
  requester: string;
  department: string;
  location: string;
  purchaseGroup: string;
  category: PurchaseCategory;
  createdAt: string;
  status: PrStatus;
  rfqId?: string;
  history: AuditEntry[];
}

export type StepStatus = 'Waiting' | 'Pending' | 'Approved' | 'Rejected';

export interface ApprovalStep {
  label: string;
  role: Role;
  status: StepStatus;
  by?: string;
  at?: string;
  comment?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: PurchaseCategory;
  email: string;
  contactPerson?: string;
  phone?: string;
}

export interface Material {
  code: string;
  description: string;
  uom: string;
}

/** Setup: technical specification checklist kept per material code. */
export type TechSpecMaster = Record<string, string[]>;

/** Setup: reusable terms & conditions template. */
export interface TermsTemplate {
  id: string;
  name: string;
  clauses: string[];
}

export interface RfqItem {
  lineNo: number;
  materialCode: string;
  description: string;
  quantity: number;
  uom: string;
  /** Snapshot of the specification sent to vendors. */
  techSpecs: string[];
}

export interface Quotation {
  vendorId: string;
  submittedAt: string;
  /** Unit price per RFQ line number. A missing line means "not quoted". */
  prices: Record<number, number>;
  deliveryDays: number;
  remarks: string;
}

export interface MailMessage {
  id: string;
  rfqId: string;
  vendorId: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export type RfqStatus = 'Open' | 'Technical evaluation' | 'Processed';

export interface Award {
  lineNo: number;
  vendorId: string;
  unitPrice: number;
}

export interface Rfq {
  id: string;
  name: string;
  prId: string;
  createdBy: string;
  createdAt: string;
  items: RfqItem[];
  vendorIds: string[];
  termsId: string;
  /** Snapshot of the T&C clauses sent to vendors. */
  terms: string[];
  /** RFQ validation: after this moment the RFQ is no longer valid for quoting. */
  validUntil: string;
  status: RfqStatus;
  quotations: Quotation[];
  /** Technical evaluation: vendorId → lineNo → accepted (Yes) / rejected (No). */
  techEval: Record<string, Record<number, boolean>>;
  awards: Award[];
  erpRfqNo?: string;
  poIds: string[];
  history: AuditEntry[];
}

export type PoStatus = 'Issued' | 'Goods received' | 'Invoiced' | 'Paid';

export interface PoLine {
  lineNo: number;
  materialCode: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
}

export interface Grn {
  number: string;
  postedAt: string;
  /** Received quantity per PO line number. */
  received: Record<number, number>;
  recordedBy: string;
}

export interface PurchaseOrder {
  id: string;
  rfqId: string;
  erpRfqNo: string;
  prId: string;
  vendorId: string;
  description: string;
  lines: PoLine[];
  amount: number;
  location: string;
  purchaseGroup: string;
  department: string;
  createdAt: string;
  status: PoStatus;
  grn?: Grn;
  invoiceId?: string;
}

export type InvoiceStatus =
  | 'Awaiting park'
  | 'Department approval'
  | 'VAT approval'
  | 'Posted'
  | 'Paid'
  | 'Rejected';

export interface Invoice {
  id: string;
  vendorInvoiceNo: string;
  poId: string;
  vendorId: string;
  netAmount: number;
  vatAmount: number;
  submittedAt: string;
  status: InvoiceStatus;
  /** Invoice park number created by the company once the vendor invoice arrives. */
  parkNo?: string;
  parkedAt?: string;
  steps: ApprovalStep[];
  sapDocument?: string;
  paidAt?: string;
  paymentRef?: string;
  history: AuditEntry[];
}

/** Lifecycle stage of a requisition as shown on the overview. */
export type Stage =
  | 'Awaiting RFQ'
  | 'In sourcing'
  | 'Purchase order'
  | 'Goods received'
  | 'Invoice'
  | 'Paid';
