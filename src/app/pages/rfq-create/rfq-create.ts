import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RfqItem } from '../../core/models';
import { P2pStore, RfqDraft, VendorDraft } from '../../core/p2p.store';
import { CATEGORIES, MATERIALS } from '../../core/seed';

const STEPS = ['Source PR', 'RFQ name & items', 'Technical specs', 'Terms & conditions', 'Vendors', 'RFQ validation', 'Review & send'];

@Component({
  selector: 'app-rfq-create',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './rfq-create.html',
})
export class RfqCreatePage {
  readonly store = inject(P2pStore);
  private readonly router = inject(Router);

  readonly steps = STEPS;
  readonly materials = MATERIALS;
  readonly categories = CATEGORIES;

  readonly step = signal(0);
  readonly reached = signal(0);
  readonly error = signal('');
  readonly addingVendor = signal(false);

  readonly eligiblePrs = computed(() => this.store.prs().filter((p) => p.status === 'Open' && !p.rfqId));

  draft: RfqDraft = {
    prId: '',
    name: '',
    items: [],
    vendorIds: [],
    termsId: '',
    validUntil: toLocalInput(new Date(Date.now() + 3 * 86_400_000)),
  };
  newVendor: VendorDraft = blankVendor();
  readonly minValidity = toLocalInput(new Date());

  constructor() {
    const prId = inject(ActivatedRoute).snapshot.queryParamMap.get('pr');
    if (prId && this.eligiblePrs().some((p) => p.id === prId)) {
      this.selectPr(prId);
      this.goTo(1);
    }
  }

  get pr() {
    return this.store.pr(this.draft.prId);
  }

  selectPr(id: string): void {
    const pr = this.store.pr(id);
    if (!pr) return;
    this.draft.prId = id;
    this.draft.name = pr.title;
    this.draft.items = pr.items.map((i, n) => {
      const code = this.store.isRecognized(i.materialCode) ? i.materialCode : '';
      return { lineNo: (n + 1) * 10, materialCode: code, description: i.description, quantity: i.quantity, uom: i.uom, techSpecs: [...this.store.specsFor(code)] };
    });
    this.draft.vendorIds = this.store.vendors().filter((v) => v.category === pr.category).map((v) => v.id);
  }

  selectMaterial(item: RfqItem, code: string): void {
    item.materialCode = code;
    const m = MATERIALS.find((x) => x.code === code);
    if (m) item.uom = m.uom;
    item.techSpecs = [...this.store.specsFor(code)];
  }

  /* ---- technical specs ---- */

  addSpec(item: RfqItem): void {
    item.techSpecs = [...item.techSpecs, ''];
  }

  removeSpec(item: RfqItem, n: number): void {
    item.techSpecs = item.techSpecs.filter((_, i) => i !== n);
  }

  reloadSpecs(item: RfqItem): void {
    item.techSpecs = [...this.store.specsFor(item.materialCode)];
  }

  saveSpecsToSetup(item: RfqItem): void {
    this.store.saveTechSpecs(item.materialCode, item.techSpecs);
  }

  /* ---- vendors ---- */

  toggleVendor(id: string): void {
    const ids = this.draft.vendorIds;
    this.draft.vendorIds = ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id];
  }

  startAddVendor(): void {
    this.newVendor = { ...blankVendor(), category: this.pr?.category ?? 'IT equipment' };
    this.addingVendor.set(true);
  }

  saveVendor(): void {
    const id = this.store.addVendor(this.newVendor);
    if (!id) return;
    this.draft.vendorIds = [...this.draft.vendorIds, id];
    this.addingVendor.set(false);
  }

  selectedVendors() {
    return this.store.vendors().filter((v) => this.draft.vendorIds.includes(v.id));
  }

  /* ---- navigation ---- */

  terms() {
    return this.store.termsTemplate(this.draft.termsId);
  }

  next(): void {
    const problem = this.validate(this.step());
    this.error.set(problem);
    if (!problem) this.goTo(this.step() + 1);
  }

  goTo(i: number): void {
    this.step.set(i);
    this.reached.update((r) => Math.max(r, i));
    this.error.set('');
  }

  save(): void {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const problem = this.validate(i);
      if (problem) {
        this.goTo(i);
        this.error.set(problem);
        return;
      }
    }
    const items = this.draft.items.map((i) => ({ ...i, techSpecs: i.techSpecs.map((s) => s.trim()).filter(Boolean) }));
    const id = this.store.createRfq({ ...this.draft, items, validUntil: new Date(this.draft.validUntil).toISOString() });
    if (id) this.router.navigate(['/rfqs', id]);
  }

  private validate(i: number): string {
    const d = this.draft;
    switch (i) {
      case 0: return d.prId ? '' : 'Select a PR.';
      case 1:
        if (!d.name.trim()) return 'Enter an RFQ name.';
        return d.items.every((x) => x.materialCode && x.description.trim()) ? '' : 'Select a material for every item.';
      case 3: return d.termsId ? '' : 'Select the terms & conditions.';
      case 4: return d.vendorIds.length ? '' : 'Select at least one vendor.';
      case 5:
        if (!d.validUntil) return 'Enter the RFQ end date.';
        return new Date(d.validUntil).getTime() > Date.now() ? '' : 'The RFQ end date must be in the future.';
      default: return '';
    }
  }
}

function blankVendor(): VendorDraft {
  return { name: '', email: '', contactPerson: '', phone: '', category: 'IT equipment' };
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
