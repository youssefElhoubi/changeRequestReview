import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ChangeRequest,
  ChangeRequestStatus,
  ChangeRequestSummary,
  RejectChangeRequestBody,
} from '../models/change-request.models';

@Injectable({
  providedIn: 'root',
})
export class ChangeRequestService {
  private readonly endpoint = '/api/change-requests';

  constructor(private readonly http: HttpClient) {}

  getChangeRequests(
    status?: ChangeRequestStatus,
  ): Observable<ChangeRequestSummary[]> {
    return this.http.get<ChangeRequestSummary[]>(this.endpoint, {
      params: status ? { status } : {},
    });
  }

  getChangeRequest(id: string): Observable<ChangeRequest> {
    return this.http.get<ChangeRequest>(`${this.endpoint}/${id}`);
  }

  approve(id: string): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.endpoint}/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<ChangeRequest> {
    const body: RejectChangeRequestBody = { reason };
    return this.http.post<ChangeRequest>(`${this.endpoint}/${id}/reject`, body);
  }
}
