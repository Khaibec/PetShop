import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OrdersComponent } from './orders.component';
import { OrderTrackingComponent } from './order-tracking.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: OrdersComponent },
  { path: 'my-orders', component: OrdersComponent },
  { path: 'tracking', component: OrderTrackingComponent }
];

@NgModule({
  declarations: [OrdersComponent, OrderTrackingComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class OrdersModule {}
