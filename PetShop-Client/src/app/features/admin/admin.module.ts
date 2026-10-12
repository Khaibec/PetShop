import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminChatComponent } from './admin-chat.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: AdminComponent },
  { path: 'chat', component: AdminComponent }
];

@NgModule({
  declarations: [AdminComponent, AdminChatComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule {}
