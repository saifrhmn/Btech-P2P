import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PurchaseRequisition, Rfq } from '../../core/models';
import { P2pStore, tone } from '../../core/p2p.store';

type Tab = 'Active' | 'Awaiting RFQ' | 'Processed' | 'All';

@Component({
  selector: 'app-rfq-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './rfq-list.html',
})
export class RfqListPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly tone = tone;
  readonly tabs: Tab[] = ['Active', 'Awaiting RFQ', 'Processed', 'All'];
  readonly tab = signal<Tab>('Active');

  readonly awaiting = computed(() => this.store.prs().filter((p) => p.status === 'Open' && !p.rfqId));

  readonly rows = computed(() => {
    const t = this.tab();
    return this.store.rfqs().filter((r) => t === 'All' || (t === 'Processed') === (r.status === 'Processed'));
  });

  count(t: Tab): number {
    if (t === 'Awaiting RFQ') return this.awaiting().length;
    if (t === 'All') return this.store.rfqs().length;
    return this.store.rfqs().filter((r) => (t === 'Processed') === (r.status === 'Processed')).length;
  }

  allRecognized(pr: PurchaseRequisition): boolean {
    return pr.items.every((i) => this.store.isRecognized(i.materialCode));
  }

  stageLabel(r: Rfq): string {
    if (r.status === 'Open') return this.store.validityPassed(r) ? 'Expired — ready for evaluation' : 'Open for quotations';
    if (r.status === 'Processed') return `Processed · ERP ${r.erpRfqNo}`;
    return r.status;
  }

  stageTone(r: Rfq): string {
    return tone(r.status === 'Open' && this.store.validityPassed(r) ? 'Expired' : r.status);
  }

  open(r: Rfq): void {
    this.router.navigate(['/rfqs', r.id]);
  }
}
