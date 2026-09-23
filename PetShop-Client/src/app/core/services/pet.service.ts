import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pet, PetDetail, PetFilter } from '../models/pet.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private readonly apiUrl = `${environment.apiUrl}/pets`;

  constructor(private http: HttpClient) {}

  getPets(filter: PetFilter): Observable<PagedResult<Pet>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize', filter.pageSize.toString());

    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.species) params = params.set('species', filter.species);
    if (filter.breed) params = params.set('breed', filter.breed);
    if (filter.gender) params = params.set('gender', filter.gender);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.minPrice !== undefined && filter.minPrice !== null) params = params.set('minPrice', filter.minPrice.toString());
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) params = params.set('maxPrice', filter.maxPrice.toString());

    return this.http.get<PagedResult<Pet>>(this.apiUrl, { params });
  }

  getFeaturedPets(count: number = 8): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.apiUrl}/featured?count=${count}`);
  }

  getPet(id: number): Observable<PetDetail> {
    return this.http.get<PetDetail>(`${this.apiUrl}/${id}`);
  }

  createPet(data: any): Observable<PetDetail> {
    return this.http.post<PetDetail>(this.apiUrl, data);
  }

  updatePet(id: number, data: any): Observable<PetDetail> {
    return this.http.put<PetDetail>(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deletePet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
