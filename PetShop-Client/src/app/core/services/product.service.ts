import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductDetail, ProductFilter } from '../models/product.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(filter: ProductFilter): Observable<PagedResult<Product>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize', filter.pageSize.toString());

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId.toString());
    if (filter.brand) params = params.set('brand', filter.brand);
    if (filter.minPrice !== undefined && filter.minPrice !== null) params = params.set('minPrice', filter.minPrice.toString());
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter.inStockOnly) params = params.set('inStockOnly', 'true');

    return this.http.get<PagedResult<Product>>(this.apiUrl, { params });
  }

  getFeaturedProducts(count: number = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured?count=${count}`);
  }

  getProduct(id: number): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.apiUrl}/${id}`);
  }

  createProduct(data: any): Observable<ProductDetail> {
    return this.http.post<ProductDetail>(this.apiUrl, data);
  }

  updateProduct(id: number, data: any): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${this.apiUrl}/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
