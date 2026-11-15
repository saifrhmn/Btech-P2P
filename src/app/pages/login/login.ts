import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { User } from '../../core/models';
import { DEMO_PASSWORD } from '../../core/seed';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly users = this.auth.users;
  readonly password = DEMO_PASSWORD;
  email = '';
  secret = '';
  showPassword = false;
  readonly error = signal('');

  submit(): void {
    this.error.set('');
    if (!this.email.trim() || !this.secret) {
      this.error.set('Enter your email and password.');
      return;
    }
    if (!this.auth.login(this.email, this.secret)) {
      this.error.set('Email or password is incorrect.');
      return;
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl && returnUrl !== '/' ? returnUrl : this.auth.homePath());
  }

  useAccount(user: User): void {
    this.email = user.email;
    this.secret = DEMO_PASSWORD;
    this.submit();
  }
}
