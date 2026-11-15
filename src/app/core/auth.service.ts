import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role, User } from './models';
import { DEMO_PASSWORD, USERS } from './seed';

const SESSION_KEY = 'p2p-demo.session';

/**
 * Demo-only authentication. Credentials are checked in the browser against
 * the sample user list; replace with the corporate identity provider (SSO)
 * before any real use.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly users = USERS;
  private readonly current = signal<User | null>(this.restore());

  readonly user = this.current.asReadonly();
  readonly isLoggedIn = computed(() => this.current() !== null);

  login(email: string, password: string): boolean {
    const user = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== DEMO_PASSWORD) return false;
    this.current.set(user);
    try {
      sessionStorage.setItem(SESSION_KEY, user.id);
    } catch {
      /* storage unavailable — session lasts until reload */
    }
    return true;
  }

  logout(): void {
    this.current.set(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  /** True when the signed-in user holds one of the roles (admins can act on every step). */
  can(...roles: Role[]): boolean {
    const user = this.current();
    return !!user && (user.role === 'admin' || roles.includes(user.role));
  }

  homePath(): string {
    return this.current()?.role === 'vendor' ? '/vendor-portal' : '/dashboard';
  }

  private restore(): User | null {
    try {
      const id = sessionStorage.getItem(SESSION_KEY);
      return USERS.find((u) => u.id === id) ?? null;
    } catch {
      return null;
    }
  }
}

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).parseUrl(auth.homePath()) : true;
};

/** Restricts a route to the roles listed in `data.roles`. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = (route.data['roles'] as Role[] | undefined) ?? [];
  return roles.length === 0 || auth.can(...roles) ? true : inject(Router).parseUrl(auth.homePath());
};
