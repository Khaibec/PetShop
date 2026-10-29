import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthCallbackComponent } from './auth-callback.component';
import { LinkCallbackComponent } from './link-callback.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: LoginComponent },
  { path: 'callback', component: AuthCallbackComponent },
  { path: 'link-callback', component: LinkCallbackComponent }
];

@NgModule({
  declarations: [
    LoginComponent,
    AuthCallbackComponent,
    LinkCallbackComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AuthModule {}
