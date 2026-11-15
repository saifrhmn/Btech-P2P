import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Invoice, InvoiceStatus } from '../../core/models';
import { P2pStore, historyOf, tone } from '../../core/p2p.store';

type Tab = 'Open' | InvoiceStatus | 'All';

@Component({
  selector: 'app-invoices',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './invoices.html',
})
export class InvoicesPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  readonly tone = tone;
  readonly historyOf = historyOf;
  readonly tabs: Tab[] = ['Open', 'Awaiting park', 'Department approval', 'VAT approval', 'Posted', 'Paid', 'Rejected', 'All'];
  readonly tab = signal<Tab>('Open');
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => (this.selectedId() ? this.store.invoice(this.selectedId()!) : undefined));
  comment = '';

  readonly rows = computed(() => this.store.invoices().filter((i) => this.matches(i, this.tab())));

  count(t: Tab): number {
    return this.store.invoices().filter((i) => this.matches(i, t)).length;
  }

  canDecide(inv: Invoice): boolean {
    const step = inv.steps.find((s) => s.status === 'Pending');
    return !!step && this.auth.can(step.role);
  }

  pendingLabel(inv: Invoice): string {
    return inv.steps.find((s) => s.status === 'Pending')?.label ?? '';
  }

  decide(inv: Invoice, approve: boolean): void {
    if (!approve && !this.comment.trim()) {
      this.store.flash('Add a comment explaining the rejection.', 'error');
      return;
    }
    this.store.decideInvoice(inv.id, approve, this.comment.trim());
    this.comment = '';
  }

  private matches(i: Invoice, t: Tab): boolean {
    if (t === 'All') return true;
    if (t === 'Open') return i.status !== 'Paid' && i.status !== 'Rejected';
    return i.status === t;
  }
}
