import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { Role } from '../core/models';
import { P2pStore } from '../core/p2p.store';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: Role[] | 'internal';
  count?: () => number;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  readonly auth = inject(AuthService);
  readonly store = inject(P2pStore);
  private readonly router = inject(Router);

  readonly crumb = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        // Read the router's settled snapshot; ActivatedRoute snapshots may not exist yet while the shell is being created.
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) r = r.firstChild;
        return (r.data?.['crumb'] as string | undefined) ?? '';
      }),
    ),
    { initialValue: '' },
  );

  readonly initials = computed(() =>
    (this.auth.user()?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join(''),
  );

  private readonly items: NavItem[] = [
    { path: '/dashboard', label: 'Overview', icon: 'overview', roles: 'internal' },
    { path: '/requisitions', label: 'Requisitions', icon: 'pr', roles: 'internal', count: () => this.store.prs().filter((p) => p.status === 'Open').length },
    { path: '/rfqs', label: 'Sourcing & RFQs', icon: 'rfq', roles: 'internal', count: () => this.store.rfqs().filter((r) => r.status !== 'Processed').length },
    { path: '/setup', label: 'Setup', icon: 'setup', roles: ['rfq-creator'] },
    { path: '/purchase-orders', label: 'Orders & GRN', icon: 'po', roles: 'internal', count: () => this.store.pos().filter((p) => p.status === 'Issued').length },
    { path: '/invoices', label: 'Invoices', icon: 'invoice', roles: 'internal', count: () => this.store.invoices().filter((i) => i.status !== 'Paid' && i.status !== 'Rejected').length },
    { path: '/vendor-portal', label: 'Vendor Portal', icon: 'vendor', roles: ['vendor'] },
  ];

  readonly nav = computed(() => {
    const role = this.auth.user()?.role;
    return this.items.filter((i) =>
      role === 'admin' ? true : i.roles === 'internal' ? role !== 'vendor' : i.roles.includes(role!),
    );
  });

  readonly taskCount = computed(() => this.store.myTasks().length);

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  reset(): void {
    if (confirm('Reset all demo data to the original sample records?')) this.store.resetDemo();
  }
}
