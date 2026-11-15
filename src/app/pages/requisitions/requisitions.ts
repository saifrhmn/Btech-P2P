import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PrItem, PrStatus, PurchaseRequisition } from '../../core/models';
import { P2pStore, PrDraft, historyOf, tone } from '../../core/p2p.store';
import { CATEGORIES, LOCATIONS, MATERIALS, PURCHASE_GROUPS } from '../../core/seed';

const TABS: (PrStatus | 'All')[] = ['All', 'Open', 'RFQ created'];

@Component({
  selector: 'app-requisitions',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './requisitions.html',
})
export class RequisitionsPage {
  readonly store = inject(P2pStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly tone = tone;
  readonly historyOf = historyOf;
  readonly tabs = TABS;
  readonly materials = MATERIALS;
  readonly groups = PURCHASE_GROUPS;
  readonly locations = LOCATIONS;
  readonly categories = CATEGORIES;

  readonly tab = signal<(typeof TABS)[number]>('All');
  readonly selected = signal<PurchaseRequisition | null>(null);
  readonly creating = signal(false);
  draft: PrDraft = this.blank();
  formError = '';

  readonly rows = computed(() => {
    const t = this.tab();
    return this.store.prs().filter((p) => t === 'All' || p.status === t);
  });

  readonly canCreate = computed(() => this.auth.can('requester', 'rfq-creator'));

  constructor() {
    if (inject(ActivatedRoute).snapshot.queryParamMap.get('new')) this.startNew();
  }

  count(t: (typeof TABS)[number]): number {
    return t === 'All' ? this.store.prs().length : this.store.prs().filter((p) => p.status === t).length;
  }

  /** Re-read the record from the store so the drawer reflects the latest status. */
  current(pr: PurchaseRequisition): PurchaseRequisition {
    return this.store.pr(pr.id) ?? pr;
  }

  startNew(): void {
    this.draft = this.blank();
    this.formError = '';
    this.selected.set(null);
    this.creating.set(true);
  }

  addItem(): void {
    this.draft.items = [...this.draft.items, blankItem()];
  }

  removeItem(i: number): void {
    this.draft.items = this.draft.items.filter((_, n) => n !== i);
  }

  pickMaterial(item: PrItem, code: string): void {
    item.materialCode = code;
    const m = MATERIALS.find((x) => x.code === code);
    if (m) {
      item.uom = m.uom;
      item.description = m.description;
    }
    if (!this.draft.title && m) this.draft.title = m.description;
  }

  pickGroup(code: string): void {
    this.draft.purchaseGroup = code;
    this.draft.department = PURCHASE_GROUPS.find((g) => g.code === code)?.department ?? this.draft.department;
  }

  draftValue(): number {
    return this.store.prValue(this.draft);
  }

  save(): void {
    const d = this.draft;
    if (!d.title.trim()) {
      this.formError = 'Enter a PR title.';
      return;
    }
    if (!d.items.length || d.items.some((i) => !i.description.trim() || !(i.quantity > 0) || !i.uom.trim() || !(i.unitPrice > 0))) {
      this.formError = 'Every item needs a description, quantity, unit of measure and estimated price.';
      return;
    }
    const id = this.store.savePr({ ...d, items: d.items.map((i) => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) });
    if (!id) return;
    this.creating.set(false);
    // No PR approval: go straight to RFQ creation when the user may create RFQs.
    if (this.auth.can('rfq-creator')) this.router.navigate(['/rfqs/new'], { queryParams: { pr: id } });
    else this.selected.set(this.store.pr(id) ?? null);
  }

  private blank(): PrDraft {
    const dept = this.auth.user()?.department ?? 'IT Infrastructure';
    const group = PURCHASE_GROUPS.find((g) => g.department === dept)?.code ?? 'PG-IT';
    return { title: '', items: [blankItem()], department: dept, location: 'Dhaka HQ', purchaseGroup: group, category: 'IT equipment' };
  }
}

function blankItem(): PrItem {
  return { materialCode: '', description: '', quantity: 1, uom: 'EA', unitPrice: 0 };
}
