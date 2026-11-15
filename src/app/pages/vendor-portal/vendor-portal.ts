import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { PurchaseOrder, Quotation, Rfq } from '../../core/models';
import { P2pStore, tone } from '../../core/p2p.store';

type Tab = 'Inbox' | 'RFQs' | 'Orders' | 'Invoices';

@Component({
  selector: 'app-vendor-portal',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './vendor-portal.html',
})
export class VendorPortalPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  readonly tone = tone;
  readonly tabs: Tab[] = ['RFQs', 'Inbox', 'Orders', 'Invoices'];
  readonly tab = signal<Tab>('RFQs');

  /** Vendors act as themselves; the admin can switch between vendors for the demo. */
  readonly vendorId = signal(this.auth.user()?.vendorId ?? 'V-1002');
  readonly isAdmin = computed(() => this.auth.user()?.role === 'admin');
  readonly vendorName = computed(() => this.store.vendorName(this.vendorId()));

  readonly myRfqs = computed(() => this.store.rfqs().filter((r) => r.vendorIds.includes(this.vendorId())));
  readonly myMails = computed(() => this.store.mails().filter((m) => m.vendorId === this.vendorId()));
  readonly myPos = computed(() => this.store.pos().filter((p) => p.vendorId === this.vendorId()));
  readonly myInvoices = computed(() => this.store.invoices().filter((i) => i.vendorId === this.vendorId()));

  readonly quoting = signal<Rfq | null>(null);
  readonly invoicing = signal<PurchaseOrder | null>(null);
  prices: Record<number, number | null> = {};
  deliveryDays = 14;
  remarks = '';
  acceptTerms = false;
  invoiceNo = '';
  netAmount = 0;
  vatAmount = 0;

  count(t: Tab): number {
    return { RFQs: this.myRfqs, Inbox: this.myMails, Orders: this.myPos, Invoices: this.myInvoices }[t]().length;
  }

  myQuote(r: Rfq): Quotation | undefined {
    return r.quotations.find((q) => q.vendorId === this.vendorId());
  }

  canQuote(r: Rfq): boolean {
    return this.store.acceptingQuotes(r);
  }

  myAwardCount(r: Rfq): number {
    return r.awards.filter((a) => a.vendorId === this.vendorId()).length;
  }

  rfqState(r: Rfq): string {
    if (this.canQuote(r)) return this.myQuote(r) ? 'Submitted — can revise' : 'Open for quotation';
    if (r.status === 'Processed') {
      const n = this.myAwardCount(r);
      return n ? `Awarded ${n} of ${r.items.length} item(s)` : 'Closed — not awarded';
    }
    return this.myQuote(r) ? 'Under evaluation' : 'Expired — no quotation';
  }

  rfqTone(r: Rfq): string {
    if (this.canQuote(r)) return tone('Open');
    if (r.status === 'Processed') return tone(this.myAwardCount(r) ? 'Paid' : 'Processed');
    return tone('Technical evaluation');
  }

  startQuote(r: Rfq): void {
    const existing = this.myQuote(r);
    this.prices = Object.fromEntries(r.items.map((i) => [i.lineNo, existing?.prices[i.lineNo] ?? null]));
    this.deliveryDays = existing?.deliveryDays ?? 14;
    this.remarks = existing?.remarks ?? '';
    this.acceptTerms = !!existing;
    this.quoting.set(r);
  }

  quoteTotal(r: Rfq): number {
    return r.items.reduce((t, i) => t + Number(this.prices[i.lineNo] || 0) * i.quantity, 0);
  }

  submitQuote(r: Rfq): void {
    if (!this.acceptTerms) return this.store.flash('Accept the RFQ terms and conditions to submit.', 'error');
    if (!r.items.some((i) => Number(this.prices[i.lineNo]) > 0)) return this.store.flash('Enter a unit price for at least one item.', 'error');
    if (!(this.deliveryDays > 0)) return this.store.flash('Enter the delivery lead time.', 'error');
    const prices = Object.fromEntries(r.items.filter((i) => Number(this.prices[i.lineNo]) > 0).map((i) => [i.lineNo, Number(this.prices[i.lineNo])]));
    this.store.submitQuotation(r.id, { vendorId: this.vendorId(), submittedAt: new Date().toISOString(), prices, deliveryDays: Number(this.deliveryDays), remarks: this.remarks });
    if (this.myQuote(this.store.rfq(r.id)!)) this.quoting.set(null);
  }

  openFromMail(rfqId: string): void {
    const r = this.store.rfq(rfqId);
    if (r && this.canQuote(r)) this.startQuote(r);
    else this.tab.set('RFQs');
  }

  startInvoice(po: PurchaseOrder): void {
    this.invoiceNo = '';
    this.netAmount = this.store.grnValue(po.id);
    this.vatAmount = Math.round(this.netAmount * 0.15 * 100) / 100;
    this.invoicing.set(po);
  }

  submitInvoice(po: PurchaseOrder): void {
    this.store.raiseInvoice(po.id, this.vendorId(), this.invoiceNo, Number(this.netAmount), Number(this.vatAmount));
    if (this.store.po(po.id)?.status === 'Invoiced') this.invoicing.set(null);
  }
}
