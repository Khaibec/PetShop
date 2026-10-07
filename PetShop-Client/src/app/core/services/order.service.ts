import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderRequest, OrderDetail, OrderList } from '../models/order.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private readonly dashboardUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  createOrder(req: CreateOrderRequest): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(this.apiUrl, req);
  }

  getMyOrders(): Observable<OrderList[]> {
    return this.http.get<OrderList[]>(`${this.apiUrl}/my-orders`);
  }

  getOrderById(id: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.apiUrl}/${id}`);
  }


  getAllOrders(pageNumber: number = 1, pageSize: number = 10, status?: string): Observable<PagedResult<OrderList>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PagedResult<OrderList>>(this.apiUrl, { params });
  }

  updateOrderStatus(id: number, status: string, trackingCode?: string): Observable<OrderDetail> {
    return this.http.put<OrderDetail>(`${this.apiUrl}/${id}/status`, { status, trackingCode });
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.dashboardUrl}/stats`);
  }
}
