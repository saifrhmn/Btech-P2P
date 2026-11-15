import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TermsTemplate } from '../../core/models';
import { P2pStore, VendorDraft } from '../../core/p2p.store';
import { CATEGORIES, MATERIALS } from '../../core/seed';

type Tab = 'specs' | 'terms' | 'vendors';

@Component({
  selector: 'app-setup',
  imports: [FormsModule],
  templateUrl: './setup.html',
})
export class SetupPage {
  readonly store = inject(P2pStore);
  readonly materials = MATERIALS;
  readonly categories = CATEGORIES;
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'specs', label: 'Technical specifications' },
    { id: 'terms', label: 'Terms & conditions' },
    { id: 'vendors', label: 'Vendors' },
  ];
  readonly tab = signal<Tab>('specs');

  /* ---- technical specs per material ---- */
  readonly materialCode = signal(MATERIALS[0].code);
  readonly material = computed(() => MATERIALS.find((m) => m.code === this.materialCode()));
  specs: string[] = [];

  /* ---- terms ---- */
  readonly editingTerms = signal<TermsTemplate | null>(null);
  termsName = '';
  termsClauses = '';

  /* ---- vendors ---- */
  readonly addingVendor = signal(false);
  newVendor: VendorDraft = blankVendor();

  constructor() {
    const t = inject(ActivatedRoute).snapshot.queryParamMap.get('tab') as Tab | null;
    if (t && this.tabs.some((x) => x.id === t)) this.tab.set(t);
    this.selectMaterial(MATERIALS[0].code);
  }

  specCount(code: string): number {
    return this.store.specsFor(code).length;
  }

  selectMaterial(code: string): void {
    this.materialCode.set(code);
    this.specs = [...this.store.specsFor(code)];
    if (!this.specs.length) this.specs = [''];
  }

  addSpec(): void {
    this.specs = [...this.specs, ''];
  }

  removeSpec(n: number): void {
    this.specs = this.specs.filter((_, i) => i !== n);
  }

  saveSpecs(): void {
    this.store.saveTechSpecs(this.materialCode(), this.specs);
    this.selectMaterial(this.materialCode());
  }

  editTerms(t: TermsTemplate | null): void {
    this.termsName = t?.name ?? '';
    this.termsClauses = t?.clauses.join('\n') ?? '';
    this.editingTerms.set(t ?? { id: '', name: '', clauses: [] });
  }

  saveTerms(): void {
    const id = this.store.saveTerms({ id: this.editingTerms()?.id ?? '', name: this.termsName, clauses: this.termsClauses.split('\n') });
    if (id) this.editingTerms.set(null);
  }

  deleteTerms(t: TermsTemplate): void {
    if (confirm(`Delete “${t.name}”?`)) this.store.deleteTerms(t.id);
  }

  saveVendor(): void {
    if (this.store.addVendor(this.newVendor)) {
      this.newVendor = blankVendor();
      this.addingVendor.set(false);
    }
  }
}

function blankVendor(): VendorDraft {
  return { name: '', email: '', contactPerson: '', phone: '', category: 'IT equipment' };
}
