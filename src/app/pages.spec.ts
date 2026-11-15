import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { P2pStore } from './core/p2p.store';
import { DEMO_PASSWORD, USERS } from './core/seed';

const PAGES = ['/', '/dashboard', '/requisitions', '/rfqs', '/rfqs/new', '/rfqs/RFQ-92016', '/rfqs/RFQ-92012', '/rfqs/RFQ-91987', '/setup', '/purchase-orders', '/invoices', '/vendor-portal'];

describe('pages render per user', () => {
  for (const user of USERS) {
    it(`renders pages for ${user.email}`, async () => {
      localStorage.clear();
      sessionStorage.clear();
      TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
      TestBed.inject(P2pStore).resetDemo();
      const auth = TestBed.inject(AuthService);
      expect(auth.login(user.email, DEMO_PASSWORD)).toBe(true);
      const harness = await RouterTestingHarness.create();
      const router = TestBed.inject(Router);
      const home = user.role === 'vendor' ? '/vendor-portal' : '/dashboard';
      for (const url of PAGES) {
        await harness.navigateByUrl(url);
        harness.fixture.detectChanges();
        const el = harness.routeNativeElement as HTMLElement;
        // Every page renders a heading and the sidebar navigation.
        expect(el.querySelector('h1')?.textContent?.trim(), `${user.email} ${url}`).toBeTruthy();
        expect(el.querySelectorAll('.side-nav a').length, `${user.email} ${url}`).toBeGreaterThan(0);
        if (url === '/') expect(router.url).toBe(home);
      }
    });
  }
});
