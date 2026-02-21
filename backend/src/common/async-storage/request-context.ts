import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  adminId?: string;
  ip: string;
  userAgent: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}
