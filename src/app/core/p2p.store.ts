import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import {
  ApprovalStep,
  AuditEntry,
  Award,
  PoStatus,
  PrItem,
  PurchaseRequisition,
  Quotation,
  Rfq,
  RfqItem,
  Role,
  Stage,
  TermsTemplate,
  Vendor,
} from './models';
import { MATERIALS, invoiceRoute, rfqMail, seedData } from './seed';

const STORAGE_KEY = 'p2p-demo.state.v2';

type State = ReturnType<typeof seedData>;

export type PrDraft = Pick<PurchaseRequisition, 'title' | 'items' | 'department' | 'location' | 'purchaseGroup' | 'category'>;

export interface RfqDraft {
  prId: string;
  name: string;
  items: RfqItem[];
  vendorIds: string[];
  termsId: string;
  validUntil: string;
}

export type VendorDraft = Omit<Vendor, 'id'>;

/** Roles that may run the technical evaluation (company staff). */
export const TECH_EVALUATORS: Role[] = ['tech-approver', 'rfq-creator'];

/**
 * In-browser P2P state for the demo. Every action enforces the process
 * controls: PR → RFQ (no PR approval), RFQ validity end date, technical
 * evaluation before processing, lowest accepted price per material,
 * GRN before invoice, invoice parked before approval.
 */
@Injectable({ providedIn: 'root' })
export class P2pStore {
  private readonly auth = inject(AuthService);
  private readonly state = signal<State>(this.load());

  readonly prs = computed(() => this.state().prs);
  readonly rfqs = computed(() => this.state().rfqs);
  readonly pos = computed(() => this.state().pos);
  readonly invoices = computed(() => this.state().invoices);
  readonly vendors = computed(() => this.state().vendors);
  readonly techSpecs = computed(() => this.state().techSpecs);
  readonly terms = computed(() => this.state().terms);
  readonly mails = computed(() => this.state().mails);
  readonly notice = signal<{ text: string; tone: 'ok' | 'error' } | null>(null);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch {
        /* storage unavailable — state lasts for this tab only */
      }
    });
  }

  /* ---------------------------- lookups ---------------------------- */

  pr(id: string) { return this.prs().find((p) => p.id === id); }
  rfq(id: string) { return this.rfqs().find((r) => r.id === id); }
  po(id: string) { return this.pos().find((p) => p.id === id); }
  invoice(id: string) { return this.invoices().find((i) => i.id === id); }
  vendor(id: string | undefined) { return this.vendors().find((v) => v.id === id); }
  vendorName(id: string | undefined) { return this.vendor(id)?.name ?? '—'; }
  termsTemplate(id: string) { return this.terms().find((t) => t.id === id); }
  specsFor(materialCode: string): string[] { return this.techSpecs()[materialCode] ?? []; }
  mailsFor(rfqId: string) { return this.mails().filter((m) => m.rfqId === rfqId); }

  isRecognized(materialCode: string): boolean {
    return MATERIALS.some((m) => m.code === materialCode);
  }

  prValue(pr: { items: PrItem[] }): number {
    return pr.items.reduce((t, i) => t + i.quantity * i.unitPrice, 0);
  }

  /** True once the RFQ validation end date has passed — no more quotations. */
  validityPassed(rfq: Rfq): boolean {
    return Date.now() >= new Date(rfq.validUntil).getTime();
  }

  acceptingQuotes(rfq: Rfq): boolean {
    return rfq.status === 'Open' && !this.validityPassed(rfq);
  }

  quoteTotal(rfq: Rfq, q: Quotation): number {
    return rfq.items.reduce((t, i) => t + (q.prices[i.lineNo] ?? 0) * i.quantity, 0);
  }

  /** Every quoted line of every quotation has a Yes/No technical decision. */
  evaluationComplete(rfq: Rfq): boolean {
    return rfq.quotations.every((q) => rfq.items.every((i) => !(q.prices[i.lineNo] > 0) || rfq.techEval[q.vendorId]?.[i.lineNo] !== undefined));
  }

  /** Lowest technically accepted unit price per material line. */
  bestOffers(rfq: Rfq): Award[] {
    return rfq.items.flatMap((i) => {
      const offers = rfq.quotations
        .filter((q) => q.prices[i.lineNo] > 0 && rfq.techEval[q.vendorId]?.[i.lineNo] === true)
        .map((q) => ({ lineNo: i.lineNo, vendorId: q.vendorId, unitPrice: q.prices[i.lineNo] }))
        .sort((a, b) => a.unitPrice - b.unitPrice);
      return offers.length ? [offers[0]] : [];
    });
  }

  stage(pr: PurchaseRequisition): Stage {
    if (!pr.rfqId) return 'Awaiting RFQ';
    const pos = this.pos().filter((p) => p.prId === pr.id);
    if (!pos.length) return 'In sourcing';
    const order: PoStatus[] = ['Issued', 'Goods received', 'Invoiced', 'Paid'];
    const least = order[Math.min(...pos.map((p) => order.indexOf(p.status)))];
    return ({ Issued: 'Purchase order', 'Goods received': 'Goods received', Invoiced: 'Invoice', Paid: 'Paid' } as const)[least];
  }

  readonly prStages = computed(() => this.prs().map((pr) => ({ pr, stage: this.stage(pr) })));

  /** Steps the signed-in user can act on now. */
  readonly myTasks = computed(() => {
    const tasks: { kind: string; ref: string; label: string; link: string }[] = [];
    const can = (...roles: Role[]) => this.auth.can(...roles);
    for (const pr of this.prs()) {
      if (pr.status === 'Open' && can('rfq-creator')) tasks.push({ kind: 'Create RFQ', ref: pr.id, label: pr.title, link: '/rfqs/new' });
    }
    for (const r of this.rfqs()) {
      const link = `/rfqs/${r.id}`;
      if (r.status === 'Open' && this.validityPassed(r) && r.quotations.length && can(...TECH_EVALUATORS)) tasks.push({ kind: 'Technical evaluation', ref: r.id, label: r.name, link });
      if (r.status === 'Technical evaluation') {
        if (!this.evaluationComplete(r) && can(...TECH_EVALUATORS)) tasks.push({ kind: 'Technical evaluation', ref: r.id, label: r.name, link });
        else if (this.evaluationComplete(r) && can('rfq-creator')) tasks.push({ kind: 'Process RFQ', ref: r.id, label: r.name, link });
      }
    }
    for (const p of this.pos()) {
      if (p.status === 'Issued' && can('requester')) tasks.push({ kind: 'Record GRN', ref: p.id, label: p.description, link: '/purchase-orders' });
    }
    for (const inv of this.invoices()) {
      if (inv.status === 'Awaiting park' && can('accounts')) tasks.push({ kind: 'Park invoice', ref: inv.id, label: this.vendorName(inv.vendorId), link: '/invoices' });
      const step = inv.steps.find((s) => s.status === 'Pending');
      if (step && can(step.role)) tasks.push({ kind: step.role === 'vat-approver' ? 'VAT approval' : 'Department approval', ref: inv.id, label: this.vendorName(inv.vendorId), link: '/invoices' });
      if (inv.status === 'Posted' && can('accounts')) tasks.push({ kind: 'Pay bill', ref: inv.id, label: this.vendorName(inv.vendorId), link: '/invoices' });
    }
    return tasks;
  });

  /* ------------------------------ PR -------------------------------- */

  /** Saves a PR. No approval is needed — it is immediately ready for an RFQ. */
  savePr(draft: PrDraft): string | null {
    if (!this.guard(this.auth.can('requester', 'rfq-creator'), 'Only a requester or RFQ creator can create a PR.')) return null;
    if (!this.guard(!!draft.title.trim() && draft.items.length > 0, 'Enter a title and at least one item.')) return null;
    if (!this.guard(draft.items.every((i) => i.description.trim() && i.quantity > 0 && i.uom.trim()), 'Each item needs a description, quantity and unit of measure.')) return null;
    const by = this.who();
    const now = new Date().toISOString();
    let id = '';
    this.mutate((s) => {
      id = nextId('PR-2026-', s.prs.map((p) => p.id), 4);
      s.prs.unshift({
        ...structuredClone(draft),
        title: draft.title.trim(),
        id,
        requester: by,
        createdAt: now,
        status: 'Open',
        history: [
          { at: now, by, action: 'PR created in SAP' },
          { at: now, by: 'SAP interface', action: 'Sent to P2P via real-time API — ready for RFQ' },
        ],
      });
    });
    this.flash(`${id} saved and ready for RFQ.`);
    return id;
  }

  /* ----------------------------- Setup ------------------------------ */

  saveTechSpecs(materialCode: string, specs: string[]): void {
    if (!this.setupOnly()) return;
    const clean = specs.map((x) => x.trim()).filter(Boolean);
    this.mutate((s) => {
      s.techSpecs = { ...s.techSpecs, [materialCode]: clean };
    });
    this.flash(`Technical specification saved for ${materialCode} (${clean.length} item${clean.length === 1 ? '' : 's'}).`);
  }

  saveTerms(t: TermsTemplate): string | null {
    if (!this.setupOnly()) return null;
    const clauses = t.clauses.map((x) => x.trim()).filter(Boolean);
    if (!this.guard(!!t.name.trim() && clauses.length > 0, 'Enter a name and at least one clause.')) return null;
    let id = t.id;
    this.mutate((s) => {
      if (id && s.terms.some((x) => x.id === id)) {
        s.terms = s.terms.map((x) => (x.id === id ? { id, name: t.name.trim(), clauses } : x));
      } else {
        id = nextId('TC-', s.terms.map((x) => x.id), 3);
        s.terms.push({ id, name: t.name.trim(), clauses });
      }
    });
    this.flash(`Terms & conditions “${t.name.trim()}” saved.`);
    return id;
  }

  deleteTerms(id: string): void {
    if (!this.setupOnly()) return;
    if (!this.guard(!this.rfqs().some((r) => r.termsId === id && r.status !== 'Processed'), 'This template is used by an active RFQ.')) return;
    this.mutate((s) => {
      s.terms = s.terms.filter((x) => x.id !== id);
    });
    this.flash('Terms & conditions template deleted.');
  }

  /** Registers a new vendor (from the RFQ wizard). Returns the vendor id. */
  addVendor(d: VendorDraft): string | null {
    if (!this.setupOnly()) return null;
    const name = d.name.trim();
    const email = d.email.trim().toLowerCase();
    if (!this.guard(!!name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), 'Enter the vendor name and a valid email address.')) return null;
    if (!this.guard(!this.vendors().some((v) => v.email.toLowerCase() === email || v.name.toLowerCase() === name.toLowerCase()), 'A vendor with this name or email already exists.')) return null;
    let id = '';
    this.mutate((s) => {
      id = nextId('V-', s.vendors.map((v) => v.id), 4);
      s.vendors.push({ ...d, id, name, email, contactPerson: d.contactPerson?.trim() || undefined, phone: d.phone?.trim() || undefined });
    });
    this.flash(`Vendor ${name} added (${id}).`);
    return id;
  }

  /* ------------------------------ RFQ ------------------------------- */

  /** Saves the RFQ and emails the invitation to every selected vendor. */
  createRfq(d: RfqDraft): string | null {
    const pr = this.pr(d.prId);
    if (!this.guard(this.auth.can('rfq-creator'), 'Only the RFQ creator can create RFQs.')) return null;
    if (!this.guard(pr?.status === 'Open' && !pr.rfqId, 'An RFQ can only be created from an open PR without an RFQ.')) return null;
    if (!this.guard(!!d.name.trim(), 'Enter an RFQ name.')) return null;
    if (!this.guard(d.items.length > 0 && d.items.every((i) => i.materialCode && i.description.trim()), 'Every RFQ item needs a material.')) return null;
    if (!this.guard(d.vendorIds.length > 0, 'Select at least one vendor.')) return null;
    const terms = this.termsTemplate(d.termsId);
    if (!this.guard(!!terms, 'Select the terms & conditions.')) return null;
    if (!this.guard(new Date(d.validUntil).getTime() > Date.now(), 'The RFQ end date must be in the future.')) return null;
    const now = new Date().toISOString();
    const by = this.who();
    let id = '';
    this.mutate((s) => {
      id = nextId('RFQ-', s.rfqs.map((r) => r.id), 5);
      const rfq: Rfq = {
        id,
        name: d.name.trim(),
        prId: d.prId,
        createdBy: by,
        createdAt: now,
        items: structuredClone(d.items),
        vendorIds: [...d.vendorIds],
        termsId: d.termsId,
        terms: [...terms!.clauses],
        validUntil: d.validUntil,
        status: 'Open',
        quotations: [],
        techEval: {},
        awards: [],
        poIds: [],
        history: [{ at: now, by, action: `RFQ “${d.name.trim()}” created from ${d.prId} — valid until ${fmt(d.validUntil)}` }],
      };
      let n = s.mails.reduce((m, x) => Math.max(m, Number(x.id.slice(5)) || 0), 0);
      for (const vid of rfq.vendorIds) {
        const v = s.vendors.find((x) => x.id === vid)!;
        s.mails.unshift(rfqMail(rfq, v, now, `MAIL-${String(++n).padStart(5, '0')}`));
      }
      rfq.history.push({ at: now, by: 'P2P mail', action: `Invitation emailed to ${rfq.vendorIds.length} vendor(s)` });
      s.rfqs.unshift(rfq);
      const source = s.prs.find((p) => p.id === d.prId)!;
      source.rfqId = id;
      source.status = 'RFQ created';
      source.history.push({ at: now, by, action: `${id} created in P2P` });
    });
    this.flash(`${id} saved — invitation emailed to ${d.vendorIds.length} vendor(s).`);
    return id;
  }

  submitQuotation(rfqId: string, q: Quotation): void {
    const rfq = this.rfq(rfqId);
    if (!this.guard(!!rfq && this.acceptingQuotes(rfq), 'This RFQ is no longer valid — the end date has passed.')) return;
    if (!this.guard(rfq!.vendorIds.includes(q.vendorId), 'This vendor was not invited to the RFQ.')) return;
    const prices = Object.fromEntries(Object.entries(q.prices).map(([k, v]) => [k, Number(v)]).filter(([, v]) => (v as number) > 0));
    if (!this.guard(Object.keys(prices).length > 0, 'Enter a price for at least one item.')) return;
    this.mutate((s) => {
      const r = s.rfqs.find((x) => x.id === rfqId)!;
      const resubmit = r.quotations.some((x) => x.vendorId === q.vendorId);
      r.quotations = [...r.quotations.filter((x) => x.vendorId !== q.vendorId), { ...q, prices }];
      r.history.push({ at: q.submittedAt, by: this.vendorName(q.vendorId), action: `${resubmit ? 'Quotation revised' : 'Quotation submitted'} — ${Object.keys(prices).length} of ${r.items.length} item(s) priced` });
    });
    this.flash(`Quotation submitted for ${rfqId}.`);
  }

  /** Demo helper so the validity-gated steps can be tried without waiting. */
  endValidityNow(rfqId: string): void {
    this.mutate((s) => {
      const r = s.rfqs.find((x) => x.id === rfqId);
      if (!r || r.status !== 'Open') return;
      r.validUntil = new Date(Date.now() - 1000).toISOString();
      r.history.push({ at: r.validUntil, by: this.who(), action: 'RFQ end date brought forward (demo)' });
    });
  }

  startTechEvaluation(rfqId: string): void {
    const rfq = this.rfq(rfqId);
    if (!this.guard(this.auth.can(...TECH_EVALUATORS), 'Only company technical staff can evaluate an RFQ.')) return;
    if (!this.guard(!!rfq && rfq.status === 'Open' && this.validityPassed(rfq), 'Technical evaluation starts after the RFQ end date.')) return;
    if (!this.guard(rfq!.quotations.length > 0, 'No quotations were received.')) return;
    this.rfqAction(rfqId, 'Technical evaluation started', (r) => (r.status = 'Technical evaluation'));
  }

  setTechEval(rfqId: string, vendorId: string, lineNo: number, value: boolean): void {
    if (!this.guard(this.auth.can(...TECH_EVALUATORS), 'Only company technical staff can evaluate an RFQ.')) return;
    this.mutate((s) => {
      const r = s.rfqs.find((x) => x.id === rfqId);
      if (r?.status !== 'Technical evaluation') return;
      r.techEval = { ...r.techEval, [vendorId]: { ...r.techEval[vendorId], [lineNo]: value } };
    });
  }

  /**
   * Picks the lowest technically accepted price for each material, creates
   * the SAP/ERP RFQ number and one purchase order per awarded vendor.
   */
  processRfq(rfqId: string): string | null {
    if (!this.guard(this.auth.can('rfq-creator'), 'Only the RFQ creator can process an RFQ.')) return null;
    const rfq = this.rfq(rfqId);
    if (!this.guard(rfq?.status === 'Technical evaluation', 'Only an RFQ under technical evaluation can be processed.')) return null;
    if (!this.guard(this.evaluationComplete(rfq!), 'Complete the technical evaluation (Yes / No) for every quoted item first.')) return null;
    const awards = this.bestOffers(rfq!);
    if (!this.guard(awards.length > 0, 'No item has a technically accepted quotation.')) return null;
    const pr = this.pr(rfq!.prId)!;
    const now = new Date().toISOString();
    const by = this.who();
    let erp = '';
    this.mutate((s) => {
      erp = String(s.rfqs.reduce((m, x) => Math.max(m, Number(x.erpRfqNo ?? 0)), 6100004400) + 1);
      const r = s.rfqs.find((x) => x.id === rfqId)!;
      r.awards = awards;
      r.erpRfqNo = erp;
      r.status = 'Processed';
      for (const vendorId of [...new Set(awards.map((a) => a.vendorId))]) {
        const id = nextId('PO-45000', s.pos.map((p) => p.id), 5);
        const lines = awards
          .filter((a) => a.vendorId === vendorId)
          .map((a) => {
            const i = r.items.find((x) => x.lineNo === a.lineNo)!;
            return { lineNo: i.lineNo, materialCode: i.materialCode, description: i.description, quantity: i.quantity, uom: i.uom, unitPrice: a.unitPrice };
          });
        s.pos.unshift({
          id, rfqId, erpRfqNo: erp, prId: pr.id, vendorId, description: r.name, lines,
          amount: lines.reduce((t, l) => t + l.quantity * l.unitPrice, 0),
          location: pr.location, purchaseGroup: pr.purchaseGroup, department: pr.department, createdAt: now, status: 'Issued',
        });
        r.poIds.push(id);
      }
      const unawarded = r.items.length - awards.length;
      const winners = [...new Set(awards.map((a) => a.vendorId))]
        .map((v) => `${this.vendorName(v)} (line ${awards.filter((a) => a.vendorId === v).map((a) => a.lineNo).join(', ')})`)
        .join('; ');
      r.history.push({ at: now, by, action: `RFQ processed — lowest accepted price selected for ${awards.length} item(s)${unawarded ? `, ${unawarded} without an accepted offer` : ''}` });
      r.history.push({ at: now, by: 'P2P', action: `Bid winner(s) — lowest technically accepted price: ${winners}` });
      r.history.push({ at: now, by: 'SAP interface', action: `ERP RFQ ${erp} created; order(s) ${r.poIds.join(', ')}` });
    });
    this.flash(`${rfqId} processed — ERP RFQ ${erp} created.`);
    return erp;
  }

  /* ---------------- GRN, invoice, park, payment ----------------- */

  recordGrn(poId: string, received: Record<number, number>): void {
    if (!this.guard(this.auth.can('requester'), 'Only the SAP user can record a GRN.')) return;
    const po = this.po(poId);
    if (!this.guard(po?.status === 'Issued', 'GRN can only be recorded against an issued order.')) return;
    const ok = po!.lines.every((l) => received[l.lineNo] >= 0 && received[l.lineNo] <= l.quantity) && po!.lines.some((l) => received[l.lineNo] > 0);
    if (!this.guard(ok, 'Received quantity must be between 0 and the ordered quantity, and at least one line must be received.')) return;
    let number = '';
    this.mutate((s) => {
      const numbers = s.pos.flatMap((p) => (p.grn ? [Number(p.grn.number)] : []));
      number = String(Math.max(5000412000, ...numbers) + 1);
      const p = s.pos.find((x) => x.id === poId)!;
      p.grn = { number, postedAt: new Date().toISOString(), received: { ...received }, recordedBy: this.who() };
      p.status = 'Goods received';
    });
    this.flash(`GRN ${number} recorded in SAP for ${poId}. The vendor can now raise an invoice.`);
  }

  grnValue(poId: string): number {
    const po = this.po(poId);
    if (!po?.grn) return 0;
    return po.lines.reduce((t, l) => t + (po.grn!.received[l.lineNo] ?? 0) * l.unitPrice, 0);
  }

  raiseInvoice(poId: string, vendorId: string, vendorInvoiceNo: string, netAmount: number, vatAmount: number): void {
    const po = this.po(poId);
    if (!this.guard(!!po && po.vendorId === vendorId, 'This order does not belong to the vendor.')) return;
    if (!this.guard(po!.status === 'Goods received' && !!po!.grn, 'An invoice can be raised only after the GRN is recorded in SAP.')) return;
    if (!this.guard(!!vendorInvoiceNo.trim() && netAmount > 0 && vatAmount >= 0, 'Enter the invoice number and amounts.')) return;
    const now = new Date().toISOString();
    let id = '';
    this.mutate((s) => {
      id = nextId('INV-2026-', s.invoices.map((i) => i.id), 4);
      s.invoices.unshift({
        id,
        vendorInvoiceNo: vendorInvoiceNo.trim(),
        poId,
        vendorId,
        netAmount,
        vatAmount,
        submittedAt: now,
        status: 'Awaiting park',
        steps: invoiceRoute(po!.purchaseGroup, po!.location).map((x) => ({ ...x, status: 'Waiting' })),
        history: [{ at: now, by: this.vendorName(vendorId), action: 'Invoice raised in Vendor Portal' }],
      });
      const p = s.pos.find((x) => x.id === poId)!;
      p.status = 'Invoiced';
      p.invoiceId = id;
    });
    this.flash(`Invoice ${id} submitted — waiting for the company to park it.`);
  }

  /** Company creates the invoice park number, then the approval route starts. */
  parkInvoice(id: string): string | null {
    if (!this.guard(this.auth.can('accounts'), 'Only Accounts can park an invoice.')) return null;
    const inv = this.invoice(id);
    if (!this.guard(inv?.status === 'Awaiting park', 'Only a newly submitted invoice can be parked.')) return null;
    const now = new Date().toISOString();
    let parkNo = '';
    this.mutate((s) => {
      parkNo = nextId('PK-2026-', s.invoices.flatMap((x) => (x.parkNo ? [x.parkNo] : [])), 5);
      const i = s.invoices.find((x) => x.id === id)!;
      i.parkNo = parkNo;
      i.parkedAt = now;
      i.status = 'Department approval';
      i.steps = i.steps.map((x, n) => ({ ...x, status: n === 0 ? 'Pending' : 'Waiting' }));
      i.history.push({ at: now, by: this.who(), action: `Invoice parked — park no. ${parkNo}` });
      i.history.push({ at: now, by: 'Invoice automation', action: `Routed by purchase group and location` });
    });
    this.flash(`${id} parked under ${parkNo}.`);
    return parkNo;
  }

  decideInvoice(id: string, approve: boolean, comment: string): void {
    const inv = this.invoice(id);
    const step = inv?.steps.find((s) => s.status === 'Pending');
    if (!this.guard(!!step && this.auth.can(step.role), 'You are not the approver for the current step.')) return;
    const now = new Date().toISOString();
    this.mutate((s) => {
      const i = s.invoices.find((x) => x.id === id)!;
      const done = decide(i.steps, approve, this.who(), comment);
      i.history.push({ at: now, by: this.who(), action: `${step!.label}: ${approve ? 'approved' : 'rejected'}${comment ? ` (“${comment}”)` : ''}` });
      if (!approve) {
        i.status = 'Rejected';
        const p = s.pos.find((x) => x.id === i.poId)!;
        p.status = 'Goods received';
        p.invoiceId = undefined;
      } else if (done) {
        const docs = s.invoices.flatMap((x) => (x.sapDocument ? [Number(x.sapDocument)] : []));
        i.sapDocument = String(Math.max(5105538800, ...docs) + 1);
        i.status = 'Posted';
        i.history.push({ at: now, by: 'Invoice automation', action: `Parked invoice ${i.parkNo} posted in SAP — document ${i.sapDocument}` });
      } else {
        i.status = 'VAT approval';
      }
    });
    this.flash(approve ? `${id} approved.` : `${id} rejected — the vendor can submit a corrected invoice.`);
  }

  payInvoice(id: string): void {
    if (!this.guard(this.auth.can('accounts'), 'Only Accounts in Charge can pay a bill.')) return;
    const inv = this.invoice(id);
    if (!this.guard(inv?.status === 'Posted', 'Only posted invoices can be paid.')) return;
    const now = new Date().toISOString();
    this.mutate((s) => {
      const i = s.invoices.find((x) => x.id === id)!;
      const refs = s.invoices.flatMap((x) => (x.paymentRef ? [Number(x.paymentRef.slice(4))] : []));
      i.paymentRef = `PAY-${Math.max(77120, ...refs) + 1}`;
      i.paidAt = now;
      i.status = 'Paid';
      i.history.push({ at: now, by: this.who(), action: `Bill paid (${i.paymentRef}) — process complete` });
      s.pos.find((x) => x.id === i.poId)!.status = 'Paid';
    });
    this.flash(`${id} paid. Procure-to-pay complete.`);
  }

  /* ----------------------------- misc ------------------------------- */

  resetDemo(): void {
    this.state.set(seedData());
    this.flash('Demo data reset.');
  }

  flash(text: string, tone: 'ok' | 'error' = 'ok'): void {
    clearTimeout(this.noticeTimer);
    this.notice.set({ text, tone });
    this.noticeTimer = setTimeout(() => this.notice.set(null), 5000);
  }

  private who(): string {
    return this.auth.user()?.name ?? 'System';
  }

  private guard(ok: boolean, message: string): boolean {
    if (!ok) this.flash(message, 'error');
    return ok;
  }

  private setupOnly(): boolean {
    return this.guard(this.auth.can('rfq-creator'), 'Only the RFQ creator or admin can change setup data.');
  }

  private rfqAction(id: string, action: string, change: (r: Rfq) => void): void {
    this.mutate((s) => {
      const r = s.rfqs.find((x) => x.id === id);
      if (!r) return;
      change(r);
      r.history.push({ at: new Date().toISOString(), by: this.who(), action });
    });
    this.flash(`${id}: ${action}.`);
  }

  /** Applies a change to a deep copy so signals see a new reference. */
  private mutate(change: (s: State) => void): void {
    const next = structuredClone(this.state());
    change(next);
    this.state.set(next);
  }

  private load(): State {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as State;
    } catch {
      /* fall through to seed */
    }
    return seedData();
  }
}

/** Records a decision on the pending step. Returns true when every step is approved. */
function decide(steps: ApprovalStep[], approve: boolean, by: string, comment: string): boolean {
  const index = steps.findIndex((s) => s.status === 'Pending');
  const at = new Date().toISOString();
  steps[index] = { ...steps[index], status: approve ? 'Approved' : 'Rejected', by, at, comment: comment || undefined };
  if (!approve) return false;
  if (index + 1 < steps.length) {
    steps[index + 1] = { ...steps[index + 1], status: 'Pending' };
    return false;
  }
  return true;
}

function nextId(prefix: string, ids: string[], width: number): string {
  const max = ids
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return prefix + String(max + 1).padStart(width, '0');
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export function historyOf(e: { history: AuditEntry[] }): AuditEntry[] {
  return [...e.history].reverse();
}

/** Maps any workflow status to a colour tone used by `.status-pill`. */
export function tone(status: string): string {
  const map: Record<string, string> = {
    Open: 'violet', 'RFQ created': 'blue', 'Awaiting RFQ': 'amber', Rejected: 'red', 'In sourcing': 'violet',
    'Technical evaluation': 'amber', Expired: 'amber', Processed: 'slate',
    Issued: 'blue', 'Purchase order': 'blue', 'Goods received': 'teal', Invoiced: 'amber', Invoice: 'amber',
    'Awaiting park': 'amber', 'Department approval': 'amber', 'VAT approval': 'amber',
    Posted: 'blue', Paid: 'green', Pending: 'amber', Approved: 'green', Waiting: 'slate', Yes: 'green', No: 'red',
  };
  return `status-pill tone-${map[status] ?? 'slate'}`;
}
