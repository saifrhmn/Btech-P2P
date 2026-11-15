import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PoStatus, PurchaseOrder } from '../../core/models';
import { P2pStore, tone } from '../../core/p2p.store';

@Component({
  selector: 'app-purchase-orders',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './purchase-orders.html',
})
export class PurchaseOrdersPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  readonly tone = tone;
  readonly tabs: (PoStatus | 'All')[] = ['All', 'Issued', 'Goods received', 'Invoiced', 'Paid'];
  readonly tab = signal<PoStatus | 'All'>('All');
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => (this.selectedId() ? this.store.po(this.selectedId()!) : undefined));
  received: Record<number, number> = {};

  readonly rows = computed(() => this.store.pos().filter((p) => this.tab() === 'All' || p.status === this.tab()));

  count(t: PoStatus | 'All'): number {
    return t === 'All' ? this.store.pos().length : this.store.pos().filter((p) => p.status === t).length;
  }

  open(po: PurchaseOrder): void {
    this.received = Object.fromEntries(po.lines.map((l) => [l.lineNo, l.quantity]));
    this.selectedId.set(po.id);
  }

  recordGrn(po: PurchaseOrder): void {
    this.store.recordGrn(po.id, Object.fromEntries(po.lines.map((l) => [l.lineNo, Number(this.received[l.lineNo] ?? 0)])));
  }
}
