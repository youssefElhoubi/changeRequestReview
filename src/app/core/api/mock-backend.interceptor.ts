import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import {
  ChangeRequest,
  ChangeRequestStatus,
  CreateChangeRequestBody,
  RejectChangeRequestBody,
  UserPermission,
} from '../../features/change-requests/models/change-request.models';
import { MockDataStorageService } from './mock-data-storage.service';

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  private readonly delayMs = 500;

  constructor(
    private readonly authService: AuthService,
    private readonly storage: MockDataStorageService,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const url = new URL(request.urlWithParams, 'http://localhost');
    const path = url.pathname;
    const match = path.match(
      /^\/api\/change-requests\/([^/]+)(?:\/(approve|reject))?$/,
    );

    if (request.method === 'GET' && path === '/api/change-requests') {
      const status = url.searchParams.get(
        'status',
      ) as ChangeRequestStatus | null;
      const data = this.storage
        .getChangeRequests()
        .filter((item) => !status || item.status === status)
        .map((item) => this.toSummary(item));
      return this.success(data);
    }

    if (request.method === 'GET' && match && !match[2]) {
      const changeRequest = this.storage
        .getChangeRequests()
        .find((item) => item.id === match[1]);
      return changeRequest
        ? this.success(this.clone(changeRequest))
        : this.failure(404, 'NOT_FOUND', 'Change request not found.');
    }

    if (
      request.method === 'POST' &&
      path === '/api/change-requests' &&
      !match
    ) {
      return this.handleCreate(request.body);
    }

    if (request.method === 'POST' && match && match[2]) {
      const action = match[2];
      if (action === 'approve' || action === 'reject') {
        return this.handleAction(match[1], action, request.body);
      }
    }

    return next.handle(request);
  }

  reset(): void {
    this.storage.reset();
  }

  private handleCreate(body: unknown): Observable<HttpEvent<unknown>> {
    const currentUser = this.storage.getUserById(
      this.authService.currentUserIdValue,
    );
    if (
      !currentUser.permissions.includes(UserPermission.CreateChangeRequests)
    ) {
      return this.failure(
        403,
        'FORBIDDEN',
        'You do not have permission to create change requests.',
      );
    }

    const parsed = this.parseCreateBody(body);
    if (!parsed) {
      return this.failure(
        400,
        'VALIDATION',
        'Title, description, and at least one change are required.',
      );
    }

    const now = new Date().toISOString();
    const id = `cr-${Date.now()}`;
    const changeRequest: ChangeRequest = {
      id,
      title: parsed.title,
      description: parsed.description,
      status: ChangeRequestStatus.Draft,
      createdBy: { id: currentUser.id, name: currentUser.name },
      createdAt: now,
      changeCount: parsed.changes.length,
      changes: parsed.changes.map((change, index) => ({
        id: `${id}-change-${index}`,
        field: change.field,
        before: change.before,
        after: change.after,
      })),
      timeline: [
        {
          id: `${id}-created`,
          type: 'created',
          actor: { id: currentUser.id, name: currentUser.name },
          at: now,
        },
      ],
    };

    const requests = this.storage.getChangeRequests();
    this.storage.saveChangeRequests([...requests, changeRequest]);
    return this.success(this.clone(changeRequest));
  }

  private parseCreateBody(body: unknown): CreateChangeRequestBody | null {
    if (!body || typeof body !== 'object') {
      return null;
    }
    const record = body as Record<string, unknown>;
    const title =
      typeof record['title'] === 'string' ? record['title'].trim() : '';
    const description =
      typeof record['description'] === 'string'
        ? record['description'].trim()
        : '';
    if (!title || !description || !Array.isArray(record['changes'])) {
      return null;
    }
    const changes = record['changes'].filter(
      (entry): entry is { field: string; before: unknown; after: unknown } =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as Record<string, unknown>)['field'] === 'string',
    );
    if (changes.length === 0) {
      return null;
    }
    return {
      title,
      description,
      changes: changes.map((c) => ({
        field: c.field,
        before:
          c.before === null ||
          typeof c.before === 'string' ||
          typeof c.before === 'number' ||
          typeof c.before === 'boolean'
            ? c.before
            : null,
        after:
          c.after === null ||
          typeof c.after === 'string' ||
          typeof c.after === 'number' ||
          typeof c.after === 'boolean'
            ? c.after
            : null,
      })),
    };
  }

  private handleAction(
    id: string,
    action: 'approve' | 'reject',
    body: unknown,
  ): Observable<HttpEvent<unknown>> {
    const requests = this.storage.getChangeRequests();
    const changeRequest = requests.find((item) => item.id === id);
    if (!changeRequest) {
      return this.failure(404, 'NOT_FOUND', 'Change request not found.');
    }

    if (id === 'cr-fail') {
      return this.failure(
        500,
        'UNKNOWN',
        'The change request service is unavailable.',
      );
    }

    const permission =
      action === 'approve'
        ? UserPermission.ApproveChangeRequests
        : UserPermission.RejectChangeRequests;
    const currentUser = this.storage.getUserById(
      this.authService.currentUserIdValue,
    );
    if (
      currentUser.role !== 'approver' ||
      !currentUser.permissions.includes(permission) ||
      changeRequest.createdBy.id === currentUser.id
    ) {
      return this.failure(
        403,
        'FORBIDDEN',
        'You do not have permission to review this change request.',
      );
    }

    if (changeRequest.status !== ChangeRequestStatus.PendingReview) {
      return this.failure(
        409,
        'CONFLICT',
        'This change request is no longer pending review.',
      );
    }

    if (action === 'reject') {
      const reason = this.getReason(body);
      if (!reason) {
        return this.failure(
          400,
          'VALIDATION',
          'A rejection reason is required.',
        );
      }
      changeRequest.status = ChangeRequestStatus.Rejected;
      changeRequest.timeline = [
        ...changeRequest.timeline,
        {
          id: `${id}-rejected-${Date.now()}`,
          type: 'rejected',
          actor: {
            id: currentUser.id,
            name: currentUser.name,
          },
          at: new Date().toISOString(),
          note: reason,
        },
      ];
    } else {
      changeRequest.status = ChangeRequestStatus.Approved;
      changeRequest.timeline = [
        ...changeRequest.timeline,
        {
          id: `${id}-approved-${Date.now()}`,
          type: 'approved',
          actor: {
            id: currentUser.id,
            name: currentUser.name,
          },
          at: new Date().toISOString(),
        },
      ];
    }

    this.storage.saveChangeRequests(requests);
    return this.success(this.clone(changeRequest));
  }

  private success<T>(body: T): Observable<HttpEvent<unknown>> {
    return of(new HttpResponse<T>({ status: 200, body })).pipe(
      delay(this.delayFor(body)),
    );
  }

  private failure(
    status: number,
    code: string,
    message: string,
  ): Observable<HttpEvent<unknown>> {
    return throwError(
      () =>
        new HttpErrorResponse({
          status,
          error: { code, message },
          url: '/api/change-requests',
        }),
    ).pipe(delay(this.delayMs));
  }

  private delayFor(body: unknown): number {
    return Array.isArray(body) ||
      typeof body !== 'object' ||
      body === null ||
      !('id' in body) ||
      (body as ChangeRequest).id !== 'cr-slow'
      ? this.delayMs
      : 4000;
  }

  private getReason(body: unknown): string {
    if (!body || typeof body !== 'object' || !('reason' in body)) {
      return '';
    }
    const reason = (body as RejectChangeRequestBody).reason;
    return typeof reason === 'string' ? reason.trim() : '';
  }

  private toSummary(request: ChangeRequest) {
    const cloned = this.clone(request);
    return {
      id: cloned.id,
      title: cloned.title,
      status: cloned.status,
      createdBy: cloned.createdBy,
      createdAt: cloned.createdAt,
      changeCount: cloned.changeCount,
    };
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
