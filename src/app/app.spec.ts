import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { P2pStore } from './core/p2p.store';
import { DEMO_PASSWORD } from './core/seed';

describe('P2P demo', () => {
  let auth: AuthService;
  let store: P2pStore;
  const as = (email: string) => {
    auth.logout();
    expect(auth.login(email, DEMO_PASSWORD)).toBe(true);
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    store = TestBed.inject(P2pStore);
    store.resetDemo();
  });

  it('creates the app', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('rejects wrong credentials', () => {
    expect(auth.login('sohel@p2p.demo', 'wrong')).toBe(false);
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('runs a PR end to end from RFQ to payment', () => {
    as('nadia@p2p.demo');
    const prId = store.savePr({
      title: 'Branch switching', department: 'IT Infrastructure', location: 'Dhaka HQ', purchaseGroup: 'PG-IT', category: 'IT equipment',
      items: [
        { materialCode: 'MAT-20333', description: 'Branch router, dual WAN', quantity: 2, uom: 'EA', unitPrice: 500 },
        { materialCode: 'MAT-20334', description: 'PoE access switch, 24-port', quantity: 4, uom: 'EA', unitPrice: 300 },
      ],
    })!;
    // No PR approval: the PR is immediately ready for RFQ.
    expect(store.pr(prId)!.status).toBe('Open');

    as('rafiq@p2p.demo');
    store.saveTechSpecs('MAT-20333', ['Dual WAN', 'Throughput ≥ 1 Gbps']);
    const newVendor = store.addVendor({ name: 'Fresh Networks', email: 'rfq@freshnet.demo', category: 'IT equipment' })!;
    expect(store.vendor(newVendor)?.name).toBe('Fresh Networks');

    const vendorIds = ['V-1002', 'V-1006', newVendor];
    const rfqId = store.createRfq({
      prId, name: 'Branch switching 2026', vendorIds, termsId: 'TC-STD',
      validUntil: new Date(Date.now() + 86_400_000).toISOString(),
      items: [
        { lineNo: 10, materialCode: 'MAT-20333', description: 'Branch router', quantity: 2, uom: 'EA', techSpecs: store.specsFor('MAT-20333') },
        { lineNo: 20, materialCode: 'MAT-20334', description: 'PoE switch', quantity: 4, uom: 'EA', techSpecs: store.specsFor('MAT-20334') },
      ],
    })!;
    const rfq = store.rfq(rfqId)!;
    expect(rfq.name).toBe('Branch switching 2026');
    expect(rfq.items[0].techSpecs).toEqual(['Dual WAN', 'Throughput ≥ 1 Gbps']);
    // One invitation email per vendor.
    expect(store.mailsFor(rfqId).map((m) => m.vendorId).sort()).toEqual([...vendorIds].sort());
    expect(store.mailsFor(rfqId).find((m) => m.vendorId === newVendor)!.to).toBe('rfq@freshnet.demo');

    // Each vendor prices each item.
    const quote = (vendorId: string, prices: Record<number, number>) =>
      store.submitQuotation(rfqId, { vendorId, prices, submittedAt: new Date().toISOString(), deliveryDays: 10, remarks: '' });
    quote('V-1002', { 10: 480, 20: 290 });
    quote('V-1006', { 10: 450, 20: 310 });
    quote(newVendor, { 10: 400 });
    expect(store.rfq(rfqId)!.quotations.length).toBe(3);

    // Technical evaluation only after the RFQ end date.
    as('imran@p2p.demo');
    store.startTechEvaluation(rfqId);
    expect(store.rfq(rfqId)!.status).toBe('Open');
    store.endValidityNow(rfqId);
    quote('V-1002', { 10: 1, 20: 1 }); // expired RFQ is no longer valid
    expect(store.rfq(rfqId)!.quotations.find((q) => q.vendorId === 'V-1002')!.prices[10]).toBe(480);
    store.startTechEvaluation(rfqId);
    expect(store.rfq(rfqId)!.status).toBe('Technical evaluation');

    store.setTechEval(rfqId, 'V-1002', 10, true);
    store.setTechEval(rfqId, 'V-1002', 20, true);
    store.setTechEval(rfqId, 'V-1006', 10, true);
    store.setTechEval(rfqId, 'V-1006', 20, true);
    expect(store.evaluationComplete(store.rfq(rfqId)!)).toBe(false);
    store.setTechEval(rfqId, newVendor, 10, false); // cheapest but technically rejected
    expect(store.evaluationComplete(store.rfq(rfqId)!)).toBe(true);

    // Processing auto-selects the lowest accepted price per material.
    as('rafiq@p2p.demo');
    const erp = store.processRfq(rfqId)!;
    const processed = store.rfq(rfqId)!;
    expect(processed.status).toBe('Processed');
    expect(processed.erpRfqNo).toBe(erp);
    expect(processed.awards).toEqual([
      { lineNo: 10, vendorId: 'V-1006', unitPrice: 450 },
      { lineNo: 20, vendorId: 'V-1002', unitPrice: 290 },
    ]);
    expect(processed.poIds.length).toBe(2);
    const poId = store.pos().find((p) => p.rfqId === rfqId && p.vendorId === 'V-1006')!.id;
    expect(store.po(poId)!.erpRfqNo).toBe(erp);
    expect(store.po(poId)!.amount).toBe(900);

    store.raiseInvoice(poId, 'V-1006', 'NL-1', 900, 135);
    expect(store.invoices().some((i) => i.poId === poId)).toBe(false); // no GRN yet

    as('nadia@p2p.demo');
    store.recordGrn(poId, { 10: 2 });
    store.raiseInvoice(poId, 'V-1006', 'NL-1', 900, 135);
    const inv = store.invoices().find((i) => i.poId === poId)!;
    expect(inv.status).toBe('Awaiting park');

    as('arif@p2p.demo');
    store.decideInvoice(inv.id, true, '');
    expect(store.invoice(inv.id)!.status).toBe('Awaiting park'); // cannot approve before parking

    as('jahid@p2p.demo');
    const parkNo = store.parkInvoice(inv.id);
    expect(parkNo).toMatch(/^PK-2026-\d{5}$/);
    expect(store.invoice(inv.id)!.status).toBe('Department approval');

    as('arif@p2p.demo');
    store.decideInvoice(inv.id, true, '');
    as('rumana@p2p.demo');
    store.decideInvoice(inv.id, true, '');
    expect(store.invoice(inv.id)!.status).toBe('Posted');
    expect(store.invoice(inv.id)!.sapDocument).toBeTruthy();

    as('jahid@p2p.demo');
    store.payInvoice(inv.id);
    expect(store.invoice(inv.id)!.status).toBe('Paid');
    // The other vendor's order is still open, so the PR is not fully paid yet.
    expect(store.stage(store.pr(prId)!)).toBe('Purchase order');
  });

  it('manages terms & conditions in setup', () => {
    as('rafiq@p2p.demo');
    const id = store.saveTerms({ id: '', name: 'Spare parts T&C', clauses: ['Genuine OEM parts only', '', '  6-month warranty '] })!;
    expect(store.termsTemplate(id)!.clauses).toEqual(['Genuine OEM parts only', '6-month warranty']);
    as('nadia@p2p.demo');
    expect(store.saveTerms({ id: '', name: 'Nope', clauses: ['x'] })).toBeNull();
  });
});
