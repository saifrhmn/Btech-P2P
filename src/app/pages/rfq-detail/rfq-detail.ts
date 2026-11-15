import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Quotation, Rfq, RfqItem } from '../../core/models';
import { P2pStore, TECH_EVALUATORS, historyOf, tone } from '../../core/p2p.store';

const STAGES = ['Saved & emailed', 'Vendor quotations', 'RFQ end date', 'Technical evaluation', 'Processing', 'ERP RFQ & orders'];

@Component({
  selector: 'app-rfq-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './rfq-detail.html',
})
export class RfqDetailPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  readonly tone = tone;
  readonly historyOf = historyOf;
  readonly stages = STAGES;

  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  readonly rfq = computed(() => this.store.rfq(this.id()));
  readonly pr = computed(() => this.store.pr(this.rfq()?.prId ?? ''));
  readonly mails = computed(() => this.store.mailsFor(this.id()));
  readonly canEvaluate = computed(() => this.auth.can(...TECH_EVALUATORS));

  /** Prices stay sealed while the RFQ is still valid for quoting. */
  readonly sealed = computed(() => !!this.rfq() && this.store.acceptingQuotes(this.rfq()!));

  /** Awards: final once processed, otherwise a live preview of the lowest accepted prices. */
  readonly awards = computed(() => {
    const r = this.rfq();
    if (!r) return [];
    return r.status === 'Processed' ? r.awards : this.store.bestOffers(r);
  });

  stageIndex(r: Rfq): number {
    if (r.status === 'Processed') return STAGES.length;
    if (r.status === 'Technical evaluation') return this.store.evaluationComplete(r) ? 4 : 3;
    return this.store.validityPassed(r) ? 2 : 1;
  }

  statusLabel(r: Rfq): string {
    return r.status === 'Open' && this.store.validityPassed(r) ? 'Expired' : r.status;
  }

  vendor(id: string | undefined): string {
    return this.store.vendorName(id);
  }

  quoteOf(vendorId: string): Quotation | undefined {
    return this.rfq()?.quotations.find((q) => q.vendorId === vendorId);
  }

  price(q: Quotation, item: RfqItem): number | undefined {
    return q.prices[item.lineNo] > 0 ? q.prices[item.lineNo] : undefined;
  }

  evalOf(r: Rfq, vendorId: string, lineNo: number): boolean | undefined {
    return r.techEval[vendorId]?.[lineNo];
  }

  award(lineNo: number) {
    return this.awards().find((a) => a.lineNo === lineNo);
  }

  isBest(vendorId: string, lineNo: number): boolean {
    return this.award(lineNo)?.vendorId === vendorId;
  }

  pendingCount(r: Rfq): number {
    return r.quotations.reduce((t, q) => t + r.items.filter((i) => q.prices[i.lineNo] > 0 && r.techEval[q.vendorId]?.[i.lineNo] === undefined).length, 0);
  }

  awardTotal(): number {
    const r = this.rfq();
    if (!r) return 0;
    return this.awards().reduce((t, a) => t + a.unitPrice * (r.items.find((i) => i.lineNo === a.lineNo)?.quantity ?? 0), 0);
  }

  item(r: Rfq, lineNo: number): RfqItem | undefined {
    return r.items.find((i) => i.lineNo === lineNo);
  }
}
