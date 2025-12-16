import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface RequestOptions {
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class PocketBaseClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.pocketbaseUrl;

  private buildUrl(collection: string, resource: string = 'records'): string {
    return `${this.baseUrl}/api/collections/${collection}/${resource}`;
  }

  get<T>(collection: string, params?: Record<string, string>, options?: RequestOptions): Observable<T> {
    const httpParams = new HttpParams({ fromObject: params ?? {} });
    return this.http.get<T>(this.buildUrl(collection), {
      params: httpParams,
      headers: this.buildHeaders(options?.token)
    });
  }

  getById<T>(collection: string, id: string, options?: RequestOptions): Observable<T> {
    return this.http.get<T>(`${this.buildUrl(collection)}/${id}`, { headers: this.buildHeaders(options?.token) });
  }

  create<T>(collection: string, body: unknown, resource = 'records', options?: RequestOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(collection, resource), body, {
      headers: this.buildHeaders(options?.token)
    });
  }

  update<T>(collection: string, id: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.patch<T>(`${this.buildUrl(collection)}/${id}`, body, {
      headers: this.buildHeaders(options?.token)
    });
  }

  delete(collection: string, id: string, options?: RequestOptions): Observable<void> {
    return this.http.delete<void>(`${this.buildUrl(collection)}/${id}`, {
      headers: this.buildHeaders(options?.token)
    });
  }

  private buildHeaders(token?: string): HttpHeaders {
    const base = { 'Content-Type': 'application/json' };
    if (!token) {
      return new HttpHeaders(base);
    }
    return new HttpHeaders({ ...base, Authorization: `Bearer ${token}` });
  }
}
