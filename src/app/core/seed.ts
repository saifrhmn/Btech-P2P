import {
  Award,
  Invoice,
  MailMessage,
  Material,
  PoLine,
  PrItem,
  PurchaseCategory,
  PurchaseOrder,
  PurchaseRequisition,
  Quotation,
  Rfq,
  RfqItem,
  Role,
  TechSpecMaster,
  TermsTemplate,
  User,
  Vendor,
} from './models';

/* ------------------------------------------------------------------ */
/* Demo configuration. In a real deployment these come from SAP / P2P  */
/* master data and workflow configuration.                             */
/* ------------------------------------------------------------------ */

export const DEMO_PASSWORD = 'demo123';

export const USERS: User[] = [
  { id: 'U01', name: 'Sohel', email: 'sohel@p2p.demo', role: 'admin', title: 'Procurement admin' },
  { id: 'U02', name: 'Nadia Rahman', email: 'nadia@p2p.demo', role: 'requester', title: 'Requester / SAP user', department: 'IT Infrastructure' },
  { id: 'U04', name: 'Rafiq Islam', email: 'rafiq@p2p.demo', role: 'rfq-creator', title: 'RFQ creator' },
  { id: 'U06', name: 'Imran Chowdhury', email: 'imran@p2p.demo', role: 'tech-approver', title: 'Technical evaluator' },
  { id: 'U08', name: 'Arif Hasan', email: 'arif@p2p.demo', role: 'dept-approver', title: 'User department approver' },
  { id: 'U09', name: 'Rumana Sultana', email: 'rumana@p2p.demo', role: 'vat-approver', title: 'VAT approver' },
  { id: 'U10', name: 'Jahid Karim', email: 'jahid@p2p.demo', role: 'accounts', title: 'Accounts in Charge' },
  { id: 'U11', name: 'Connect Systems Ltd.', email: 'sales@connectsystems.demo', role: 'vendor', title: 'Vendor 1', vendorId: 'V-1002' },
  { id: 'U12', name: 'NetLink Solutions', email: 'rfq@netlink.demo', role: 'vendor', title: 'Vendor 2', vendorId: 'V-1006' },
];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Procurement admin',
  requester: 'Requester / SAP user',
  'rfq-creator': 'RFQ creator',
  'tech-approver': 'Technical evaluator',
  'dept-approver': 'User department approver',
  'vat-approver': 'VAT approver',
  accounts: 'Accounts in Charge',
  vendor: 'Vendor',
};

const INITIAL_VENDORS: Vendor[] = [
  { id: 'V-1001', name: 'Delta Industrial Supply', category: 'Operations supplies', email: 'bids@deltaindustrial.demo' },
  { id: 'V-1002', name: 'Connect Systems Ltd.', category: 'IT equipment', email: 'sales@connectsystems.demo' },
  { id: 'V-1003', name: 'TechBridge Bangladesh', category: 'IT equipment', email: 'tenders@techbridge.demo' },
  { id: 'V-1004', name: 'PowerCare Services', category: 'Facilities & services', email: 'quotes@powercare.demo' },
  { id: 'V-1005', name: 'CoolAir Engineering', category: 'Facilities & services', email: 'sales@coolair.demo' },
  { id: 'V-1006', name: 'NetLink Solutions', category: 'IT equipment', email: 'rfq@netlink.demo' },
  { id: 'V-1007', name: 'Prime Office Mart', category: 'Operations supplies', email: 'orders@primeoffice.demo' },
];

export const MATERIALS: Material[] = [
  { code: 'MAT-20481', description: 'Fiber optic patch panel, 24-port', uom: 'EA' },
  { code: 'MAT-20482', description: 'Fiber patch cord, LC-LC 3 m', uom: 'EA' },
  { code: 'MAT-30112', description: 'Precision cooling unit, 12 kW', uom: 'EA' },
  { code: 'MAT-10452', description: 'Rugged tablet, 10-inch', uom: 'EA' },
  { code: 'MAT-10453', description: 'Tablet vehicle mount', uom: 'EA' },
  { code: 'MAT-40877', description: 'Safety helmet & PPE kit', uom: 'SET' },
  { code: 'MAT-40878', description: 'Safety boots, steel toe', uom: 'PR' },
  { code: 'MAT-20333', description: 'Branch router, dual WAN', uom: 'EA' },
  { code: 'MAT-20334', description: 'PoE access switch, 24-port', uom: 'EA' },
  { code: 'MAT-10088', description: 'Laptop, 14-inch business', uom: 'EA' },
  { code: 'MAT-60310', description: 'Conference room AV kit', uom: 'SET' },
  { code: 'MAT-50021', description: 'Office supplies bundle', uom: 'LOT' },
  { code: 'SRV-90012', description: 'Generator maintenance service', uom: 'JOB' },
  { code: 'SRV-90044', description: 'Structured cabling service', uom: 'JOB' },
];

const INITIAL_TECH_SPECS: TechSpecMaster = {
  'MAT-20481': ['24 x LC duplex ports, 1U rack mount', 'TIA-568 / ISO 11801 compliant', 'Manufacturer warranty ≥ 5 years'],
  'MAT-20482': ['OS2 single-mode, LC-LC duplex', 'Insertion loss ≤ 0.3 dB', 'Factory tested with report'],
  'MAT-30112': ['Rated cooling capacity ≥ 12 kW', 'EER ≥ 3.0', 'N+1 redundancy with remote monitoring', 'Local service coverage within 4 h'],
  'MAT-10452': ['IP65 rated, MIL-STD-810H', '8 GB RAM / 128 GB storage', 'Hot-swappable battery', '3-year on-site warranty'],
  'MAT-10453': ['Fits 10-inch rugged tablet', 'Lockable with key', 'Vibration-damped'],
  'MAT-40877': ['EN 397 certified helmet', 'Includes goggles, gloves, ear protection', 'Sizes S–XL available'],
  'MAT-40878': ['EN ISO 20345 S3', 'Anti-slip sole', 'Sizes 38–46'],
  'MAT-20333': ['Dual WAN with failover', 'Throughput ≥ 1 Gbps', 'Centralized management support'],
  'MAT-20334': ['24 x 1G PoE+ ports, 370 W budget', '4 x 10G SFP+ uplinks', 'Layer 3 lite / VLAN support'],
  'MAT-10088': ['Intel Core i5 / AMD Ryzen 5 or better', '16 GB RAM, 512 GB SSD', 'Windows 11 Pro', '3-year on-site warranty'],
  'MAT-60310': ['65-inch 4K display', 'Certified for Teams / Zoom', 'Installation included'],
  'SRV-90012': ['OEM-certified technicians', 'Quarterly preventive maintenance', '4-hour emergency response'],
  'SRV-90044': ['Cat6A cabling, certified test reports', '25-year system warranty', 'Work outside office hours'],
};

const INITIAL_TERMS: TermsTemplate[] = [
  { id: 'TC-STD', name: 'Standard goods T&C', clauses: ['Delivery DAP to the PR delivery location', 'Payment 30 days after invoice and GRN', 'Minimum 12-month warranty', 'Prices inclusive of all taxes except VAT'] },
  { id: 'TC-SERV', name: 'Service contract T&C', clauses: ['Milestone-based payments', 'SLA penalties apply to missed response times', 'Public liability insurance required', 'Contractor safety induction mandatory'] },
  { id: 'TC-CAPEX', name: 'Capex T&C with LD clause', clauses: ['Liquidated damages 0.5% per week of delay, max 10%', 'Performance bond 10% of PO value', 'Installation & commissioning included', 'Payment 80% on delivery, 20% on commissioning'] },
];

export const PURCHASE_GROUPS: { code: string; department: string }[] = [
  { code: 'PG-IT', department: 'IT Infrastructure' },
  { code: 'PG-FAC', department: 'Facilities' },
  { code: 'PG-OPS', department: 'Operations' },
  { code: 'PG-ADM', department: 'Administration' },
  { code: 'PG-HR', department: 'People & Culture' },
];

export const LOCATIONS = ['Dhaka HQ', 'Chattogram DC', 'Sylhet Branch'];
export const CATEGORIES: PurchaseCategory[] = ['IT equipment', 'Facilities & services', 'Operations supplies', 'Capex'];

/** Invoice approval route bound to purchase group + PO location. */
export function invoiceRoute(purchaseGroup: string, location: string): { label: string; role: Role }[] {
  const department = PURCHASE_GROUPS.find((g) => g.code === purchaseGroup)?.department ?? 'User department';
  return [
    { label: `${department} — ${location}`, role: 'dept-approver' },
    { label: `VAT review — ${location}`, role: 'vat-approver' },
  ];
}

/** The invitation email sent to each vendor when an RFQ is saved. */
export function rfqMail(rfq: Pick<Rfq, 'id' | 'name' | 'items' | 'validUntil'>, vendor: Vendor, sentAt: string, id: string): MailMessage {
  const lines = rfq.items.map((i) => `  ${i.lineNo}. ${i.description} — ${i.quantity} ${i.uom}`).join('\n');
  const until = new Date(rfq.validUntil).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  return {
    id,
    rfqId: rfq.id,
    vendorId: vendor.id,
    to: vendor.email,
    subject: `Request for quotation ${rfq.id} — ${rfq.name}`,
    body: `Dear ${vendor.contactPerson || vendor.name},\n\nYou are invited to quote for ${rfq.id} “${rfq.name}”.\n\nItems:\n${lines}\n\nPlease submit a unit price for each item in the Vendor Portal. This RFQ is valid until ${until}; quotations are not accepted after that.\n\nRegards,\nProcurement`,
    sentAt,
  };
}

/* ------------------------------------------------------------------ */
/* Seed transactions                                                   */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

function item(code: string, quantity: number, unitPrice: number): PrItem {
  const m = MATERIALS.find((x) => x.code === code)!;
  return { materialCode: code, description: m.description, quantity, uom: m.uom, unitPrice };
}

function pr(p: Omit<PurchaseRequisition, 'history' | 'status'>): PurchaseRequisition {
  const history = [
    { at: p.createdAt, by: p.requester, action: 'PR created in SAP' },
    { at: p.createdAt, by: 'SAP interface', action: 'Sent to P2P via real-time API — ready for RFQ' },
  ];
  if (p.rfqId) history.push({ at: p.createdAt, by: 'Rafiq Islam', action: `${p.rfqId} created in P2P` });
  return { ...p, status: p.rfqId ? 'RFQ created' : 'Open', history };
}

function rfqItems(prItems: PrItem[]): RfqItem[] {
  return prItems.map((i, n) => ({
    lineNo: (n + 1) * 10,
    materialCode: i.materialCode,
    description: i.description,
    quantity: i.quantity,
    uom: i.uom,
    techSpecs: INITIAL_TECH_SPECS[i.materialCode] ?? [],
  }));
}

function quote(vendorId: string, items: RfqItem[], prices: number[], submittedAt: string, deliveryDays = 14): Quotation {
  return { vendorId, submittedAt, deliveryDays, remarks: '', prices: Object.fromEntries(items.map((i, n) => [i.lineNo, prices[n]]).filter(([, p]) => p > 0)) };
}

function rfq(o: {
  id: string; name: string; source: PurchaseRequisition; created: number; validUntil: string; vendors: string[]; termsId: string;
  prices: number[][]; status?: Rfq['status']; techEval?: Rfq['techEval']; awards?: Award[]; erpRfqNo?: string; poIds?: string[];
}): Rfq {
  const items = rfqItems(o.source.items);
  const createdAt = ago(o.created);
  const quotations = o.vendors.flatMap((v, n) => (o.prices[n]?.length ? [quote(v, items, o.prices[n], ago(o.created - 1, n * 3), 10 + n * 5)] : []));
  const history = [
    { at: createdAt, by: 'Rafiq Islam', action: `RFQ “${o.name}” created from ${o.source.id}` },
    { at: createdAt, by: 'P2P mail', action: `Invitation emailed to ${o.vendors.length} vendor(s)` },
  ];
  if (o.status === 'Technical evaluation' || o.status === 'Processed') history.push({ at: ago(o.created - 3), by: 'Imran Chowdhury', action: 'Technical evaluation started' });
  if (o.status === 'Processed') history.push({ at: ago(o.created - 4), by: 'Rafiq Islam', action: `RFQ processed — lowest technically accepted price selected per material; ERP RFQ ${o.erpRfqNo} created` });
  return {
    id: o.id, name: o.name, prId: o.source.id, createdBy: 'Rafiq Islam', createdAt, items, vendorIds: o.vendors,
    termsId: o.termsId, terms: INITIAL_TERMS.find((t) => t.id === o.termsId)!.clauses, validUntil: o.validUntil,
    status: o.status ?? 'Open', quotations, techEval: o.techEval ?? {}, awards: o.awards ?? [], erpRfqNo: o.erpRfqNo, poIds: o.poIds ?? [], history,
  };
}

function allYes(r: { vendors: string[]; source: PurchaseRequisition }): Rfq['techEval'] {
  const items = rfqItems(r.source.items);
  return Object.fromEntries(r.vendors.map((v) => [v, Object.fromEntries(items.map((i) => [i.lineNo, true]))]));
}

function po(o: Omit<PurchaseOrder, 'amount' | 'location' | 'purchaseGroup' | 'department' | 'prId'> & { source: PurchaseRequisition }): PurchaseOrder {
  const { source, ...rest } = o;
  return {
    ...rest,
    prId: source.id,
    location: source.location,
    purchaseGroup: source.purchaseGroup,
    department: source.department,
    amount: o.lines.reduce((t, l) => t + l.quantity * l.unitPrice, 0),
  };
}

function lines(r: Rfq, vendorId: string): PoLine[] {
  return r.awards
    .filter((a) => a.vendorId === vendorId)
    .map((a) => {
      const i = r.items.find((x) => x.lineNo === a.lineNo)!;
      return { lineNo: i.lineNo, materialCode: i.materialCode, description: i.description, quantity: i.quantity, uom: i.uom, unitPrice: a.unitPrice };
    });
}

function fullGrn(number: string, l: PoLine[], days: number, by = 'Nadia Rahman') {
  return { number, postedAt: ago(days), received: Object.fromEntries(l.map((x) => [x.lineNo, x.quantity])), recordedBy: by };
}

export function seedData() {
  const vendors = structuredClone(INITIAL_VENDORS);
  const techSpecs = structuredClone(INITIAL_TECH_SPECS);
  const terms = structuredClone(INITIAL_TERMS);

  const base = { department: 'IT Infrastructure', location: 'Dhaka HQ', purchaseGroup: 'PG-IT', category: 'IT equipment' as PurchaseCategory };
  const p150 = pr({ ...base, id: 'PR-2026-0150', title: 'Rugged field tablets', items: [item('MAT-10452', 40, 620), item('MAT-10453', 40, 45)], requester: 'Farzana Islam', department: 'Operations', location: 'Chattogram DC', purchaseGroup: 'PG-OPS', createdAt: ago(0, 5) });
  const p149 = pr({ ...base, id: 'PR-2026-0149', title: 'Conference room AV upgrade', items: [{ materialCode: '', description: 'Conference room AV upgrade (free text)', quantity: 3, uom: 'SET', unitPrice: 5400 }], requester: 'Mehedi Kabir', department: 'Administration', purchaseGroup: 'PG-ADM', category: 'Facilities & services', createdAt: ago(1) });
  const p148 = pr({ ...base, id: 'PR-2026-0148', title: 'Fiber optic patch panels & cords', items: [item('MAT-20481', 45, 410), item('MAT-20482', 200, 9)], requester: 'Nadia Rahman', createdAt: ago(4), rfqId: 'RFQ-92018' });
  const p147 = pr({ ...base, id: 'PR-2026-0147', title: 'Server room cooling units', items: [item('MAT-30112', 4, 10700)], requester: 'Arif Hasan', location: 'Chattogram DC', category: 'Capex', createdAt: ago(9), rfqId: 'RFQ-92016' });
  const p146 = pr({ ...base, id: 'PR-2026-0146', title: 'Industrial safety equipment', items: [item('MAT-40877', 120, 102), item('MAT-40878', 120, 48)], requester: 'Farzana Islam', department: 'Operations', purchaseGroup: 'PG-OPS', category: 'Operations supplies', createdAt: ago(14), rfqId: 'RFQ-92012' });
  const p145 = pr({ ...base, id: 'PR-2026-0145', title: 'Branch network refresh', items: [item('MAT-20333', 12, 2200), item('MAT-20334', 12, 1650)], requester: 'Imran Chowdhury', location: 'Sylhet Branch', createdAt: ago(24), rfqId: 'RFQ-91987' });
  const p144 = pr({ ...base, id: 'PR-2026-0144', title: 'Laptop refresh — phase 2', items: [item('MAT-10088', 75, 1180)], requester: 'Sabrina Akter', department: 'People & Culture', purchaseGroup: 'PG-HR', createdAt: ago(32), rfqId: 'RFQ-91960' });
  const p143 = pr({ ...base, id: 'PR-2026-0143', title: 'Backup generator maintenance', items: [item('SRV-90012', 1, 37900)], requester: 'Tanvir Ahmed', department: 'Facilities', location: 'Chattogram DC', purchaseGroup: 'PG-FAC', category: 'Facilities & services', createdAt: ago(38), rfqId: 'RFQ-91944' });
  const p142 = pr({ ...base, id: 'PR-2026-0142', title: 'Structured cabling — floor 4', items: [item('SRV-90044', 1, 54200)], requester: 'Nadia Rahman', category: 'Facilities & services', createdAt: ago(52), rfqId: 'RFQ-91902' });
  const prs = [p150, p149, p148, p147, p146, p145, p144, p143, p142];

  const r91987src = { vendors: ['V-1002', 'V-1006', 'V-1003'], source: p145 };
  const r91987 = rfq({
    id: 'RFQ-91987', name: 'Sylhet branch routers & switches', created: 22, validUntil: ago(19), ...r91987src, termsId: 'TC-STD',
    prices: [[2200, 1720], [2310, 1590], [2260, 1640]], status: 'Processed', techEval: allYes(r91987src),
    awards: [{ lineNo: 10, vendorId: 'V-1002', unitPrice: 2200 }, { lineNo: 20, vendorId: 'V-1006', unitPrice: 1590 }],
    erpRfqNo: '6100004517', poIds: ['PO-4500098317', 'PO-4500098318'],
  });
  const r91960 = rfq({
    id: 'RFQ-91960', name: 'Laptop refresh phase 2', source: p144, created: 30, validUntil: ago(27), vendors: ['V-1003', 'V-1002'], termsId: 'TC-STD',
    prices: [[1180], [1215]], status: 'Processed', techEval: allYes({ vendors: ['V-1003', 'V-1002'], source: p144 }),
    awards: [{ lineNo: 10, vendorId: 'V-1003', unitPrice: 1180 }], erpRfqNo: '6100004498', poIds: ['PO-4500098290'],
  });
  const r91944 = rfq({
    id: 'RFQ-91944', name: 'Generator AMC 2026', source: p143, created: 36, validUntil: ago(33), vendors: ['V-1004', 'V-1005'], termsId: 'TC-SERV',
    prices: [[37900], [39400]], status: 'Processed', techEval: allYes({ vendors: ['V-1004', 'V-1005'], source: p143 }),
    awards: [{ lineNo: 10, vendorId: 'V-1004', unitPrice: 37900 }], erpRfqNo: '6100004480', poIds: ['PO-4500098255'],
  });
  const r91902 = rfq({
    id: 'RFQ-91902', name: 'Floor 4 structured cabling', source: p142, created: 50, validUntil: ago(47), vendors: ['V-1002', 'V-1006'], termsId: 'TC-SERV',
    prices: [[54200], [56800]], status: 'Processed', techEval: allYes({ vendors: ['V-1002', 'V-1006'], source: p142 }),
    awards: [{ lineNo: 10, vendorId: 'V-1002', unitPrice: 54200 }], erpRfqNo: '6100004431', poIds: ['PO-4500097922'],
  });

  const rfqs: Rfq[] = [
    rfq({ id: 'RFQ-92018', name: 'Data centre fiber patching', source: p148, created: 3, validUntil: ahead(3), vendors: ['V-1002', 'V-1003', 'V-1006'], termsId: 'TC-STD', prices: [[], [398, 8.4], [372, 9.1]] }),
    rfq({ id: 'RFQ-92016', name: 'Chattogram DC precision cooling', source: p147, created: 7, validUntil: ago(0, 2), vendors: ['V-1004', 'V-1005', 'V-1001'], termsId: 'TC-CAPEX', prices: [[9890], [10250], [11100]] }),
    rfq({
      id: 'RFQ-92012', name: 'PPE for warehouse staff', source: p146, created: 12, validUntil: ago(8), vendors: ['V-1001', 'V-1007'], termsId: 'TC-STD',
      prices: [[101, 52], [108, 44]], status: 'Technical evaluation', techEval: { 'V-1001': { 10: true, 20: true } },
    }),
    r91987, r91960, r91944, r91902,
  ];

  const pos: PurchaseOrder[] = [
    po({ id: 'PO-4500098317', rfqId: r91987.id, erpRfqNo: r91987.erpRfqNo!, source: p145, vendorId: 'V-1002', description: r91987.name, lines: lines(r91987, 'V-1002'), createdAt: ago(18), status: 'Issued' }),
    po({ id: 'PO-4500098318', rfqId: r91987.id, erpRfqNo: r91987.erpRfqNo!, source: p145, vendorId: 'V-1006', description: r91987.name, lines: lines(r91987, 'V-1006'), createdAt: ago(18), status: 'Goods received', grn: fullGrn('5000412088', lines(r91987, 'V-1006'), 4) }),
    po({ id: 'PO-4500098290', rfqId: r91960.id, erpRfqNo: r91960.erpRfqNo!, source: p144, vendorId: 'V-1003', description: r91960.name, lines: lines(r91960, 'V-1003'), createdAt: ago(26), status: 'Invoiced', grn: fullGrn('5000411950', lines(r91960, 'V-1003'), 8), invoiceId: 'INV-2026-7712' }),
    po({ id: 'PO-4500098255', rfqId: r91944.id, erpRfqNo: r91944.erpRfqNo!, source: p143, vendorId: 'V-1004', description: r91944.name, lines: lines(r91944, 'V-1004'), createdAt: ago(32), status: 'Invoiced', grn: fullGrn('5000411804', lines(r91944, 'V-1004'), 12, 'Tanvir Ahmed'), invoiceId: 'INV-2026-7684' }),
    po({ id: 'PO-4500097922', rfqId: r91902.id, erpRfqNo: r91902.erpRfqNo!, source: p142, vendorId: 'V-1002', description: r91902.name, lines: lines(r91902, 'V-1002'), createdAt: ago(46), status: 'Paid', grn: fullGrn('5000411320', lines(r91902, 'V-1002'), 30), invoiceId: 'INV-2026-7590' }),
  ];

  const steps = (pg: string, loc: string, approvedCount: number, parked = true) =>
    invoiceRoute(pg, loc).map((s, i) => ({
      ...s,
      status: i < approvedCount ? ('Approved' as const) : i === approvedCount && parked ? ('Pending' as const) : ('Waiting' as const),
      by: i < approvedCount ? (s.role === 'dept-approver' ? 'Arif Hasan' : 'Rumana Sultana') : undefined,
      at: i < approvedCount ? ago(3) : undefined,
    }));

  const invoices: Invoice[] = [
    { id: 'INV-2026-7712', vendorInvoiceNo: 'TB/INV/3381', poId: 'PO-4500098290', vendorId: 'V-1003', netAmount: 88500, vatAmount: 13275, submittedAt: ago(1), status: 'Awaiting park', steps: steps('PG-HR', 'Dhaka HQ', 0, false), history: [{ at: ago(1), by: 'TechBridge Bangladesh', action: 'Invoice raised in Vendor Portal' }] },
    { id: 'INV-2026-7684', vendorInvoiceNo: 'PCS-2026-118', poId: 'PO-4500098255', vendorId: 'V-1004', netAmount: 37900, vatAmount: 5685, submittedAt: ago(9), status: 'VAT approval', parkNo: 'PK-2026-00418', parkedAt: ago(8), steps: steps('PG-FAC', 'Chattogram DC', 1), history: [{ at: ago(9), by: 'PowerCare Services', action: 'Invoice raised in Vendor Portal' }, { at: ago(8), by: 'Jahid Karim', action: 'Invoice parked — park no. PK-2026-00418' }, { at: ago(3), by: 'Arif Hasan', action: 'Approved by user department' }] },
    { id: 'INV-2026-7590', vendorInvoiceNo: 'CS/2026/0912', poId: 'PO-4500097922', vendorId: 'V-1002', netAmount: 54200, vatAmount: 8130, submittedAt: ago(28), status: 'Paid', parkNo: 'PK-2026-00377', parkedAt: ago(27), steps: steps('PG-IT', 'Dhaka HQ', 2), sapDocument: '5105538812', paidAt: ago(20), paymentRef: 'PAY-77120', history: [{ at: ago(28), by: 'Connect Systems Ltd.', action: 'Invoice raised in Vendor Portal' }, { at: ago(27), by: 'Jahid Karim', action: 'Invoice parked — park no. PK-2026-00377' }, { at: ago(20), by: 'Jahid Karim', action: 'Bill paid — process complete' }] },
  ];

  let mailNo = 0;
  const mails: MailMessage[] = rfqs.flatMap((r) =>
    r.vendorIds.map((vid) => rfqMail(r, vendors.find((v) => v.id === vid)!, r.createdAt, `MAIL-${String(++mailNo).padStart(5, '0')}`)),
  );

  return { prs, rfqs, pos, invoices, vendors, techSpecs, terms, mails };
}
