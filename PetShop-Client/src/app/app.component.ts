import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'PetShop-Client';
  showHeader = true;

  constructor(private router: Router) {
    if (typeof window !== 'undefined' && window.location) {
      this.updateHeaderVisibility(window.location.pathname);
    }
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateHeaderVisibility(event.urlAfterRedirects || event.url);
    });
  }

  private updateHeaderVisibility(url: string): void {
    if (!url) return;
    // Ẩn thanh header khi người dùng đang ở các trang đăng nhập / đăng ký (/auth, /auth/login, /auth/register,...)
    const isAuthRoute = /^\/auth(\/|$|\?)/.test(url);
    this.showHeader = !isAuthRoute;
  }
}

