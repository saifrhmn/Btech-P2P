import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PurchaseRequisition, Stage } from '../../core/models';
import { P2pStore, historyOf, tone } from '../../core/p2p.store';

const STAGES: { stage: Stage; color: string; dot: string }[] = [
  { stage: 'Awaiting RFQ', color: '#e8b15e', dot: 'dot-amber' },
  { stage: 'In sourcing', color: '#a48adb', dot: 'dot-violet' },
  { stage: 'Purchase order', color: '#737dea', dot: 'dot-blue' },
  { stage: 'Goods received', color: '#5fa9c9', dot: 'dot-blue' },
  { stage: 'Invoice', color: '#55b997', dot: 'dot-green' },
  { stage: 'Paid', color: '#9da9b8', dot: 'dot-slate' },
];

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  readonly tone = tone;
  readonly historyOf = historyOf;
  readonly today = new Date();
  readonly stages = STAGES;
  readonly workflowSteps: Stage[] = ['Awaiting RFQ', 'In sourcing', 'Purchase order', 'Goods received', 'Invoice', 'Paid'];

  readonly statusFilter = signal<string>('All stages');
  readonly search = signal('');
  readonly selected = signal<PurchaseRequisition | null>(null);

  readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  readonly counts = computed(() => {
    const c = new Map<Stage, number>();
    for (const { stage } of this.store.prStages()) c.set(stage, (c.get(stage) ?? 0) + 1);
    return c;
  });

  readonly committedValue = computed(() => this.store.pos().reduce((t, p) => t + p.amount, 0));

  readonly chart = computed(() => {
    const total = this.store.prStages().length || 1;
    let at = 0;
    const parts = STAGES.map(({ stage, color }) => {
      const from = at;
      at += ((this.counts().get(stage) ?? 0) / total) * 100;
      return `${color} ${from}% ${at}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  });

  readonly rows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const f = this.statusFilter();
    return this.store.prStages().filter(({ pr, stage }) => {
      const text = [pr.id, pr.title, pr.requester, pr.department, pr.rfqId ?? '', this.reference(pr)].join(' ').toLowerCase();
      return (f === 'All stages' || stage === f) && (!q || text.includes(q));
    });
  });

  filterBy(stage: string): void {
    this.statusFilter.set(stage);
    document.getElementById('requisitions')?.scrollIntoView({ behavior: 'smooth' });
  }

  stepIndex(stage: Stage): number {
    return Math.max(0, this.workflowSteps.indexOf(stage));
  }

  supplier(pr: PurchaseRequisition): string {
    const pos = this.store.pos().filter((p) => p.prId === pr.id);
    if (pos.length) return pos.map((p) => this.store.vendorName(p.vendorId)).join(', ');
    return pr.rfqId ? 'Sourcing in progress' : 'Awaiting RFQ';
  }

  reference(pr: PurchaseRequisition): string {
    const rfq = pr.rfqId ? this.store.rfq(pr.rfqId) : undefined;
    if (rfq?.erpRfqNo) return `ERP RFQ ${rfq.erpRfqNo}`;
    return pr.rfqId ?? 'Ready for RFQ';
  }

  exportCsv(): void {
    const header = ['PR number', 'Description', 'Requester', 'Department', 'Supplier', 'Created', 'Amount', 'Stage', 'Reference', 'Location'];
    const lines = this.rows().map(({ pr, stage }) => [
      pr.id, pr.title, pr.requester, pr.department, this.supplier(pr), pr.createdAt.slice(0, 10),
      String(this.store.prValue(pr)), stage, this.reference(pr), pr.location,
    ]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'p2p-requisitions.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
