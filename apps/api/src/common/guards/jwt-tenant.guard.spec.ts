import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtTenantGuard } from './jwt-tenant.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../middleware/tenant-resolution.middleware';
import { IJwtPayload } from '@clinic/shared-types';

const CLINIC_A_ID = 'clinic-a-uuid-0001';
const CLINIC_B_ID = 'clinic-b-uuid-0002';

function makePayload(overrides: Partial<IJwtPayload> = {}): IJwtPayload {
  return {
    sub: 'user-uuid-1111',
    email: 'doctor@clinic.com',
    clinic_id: CLINIC_A_ID,
    roles: ['doctor'],
    is_platform_admin: false,
    ...overrides,
  } as IJwtPayload;
}

function makeContext(): ExecutionContext {
  return {} as ExecutionContext;
}

describe('JwtTenantGuard — handleRequest (Cross-Tenant Security)', () => {
  let guard: JwtTenantGuard;

  const clsServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    guard = new JwtTenantGuard(clsServiceMock as unknown as ClsService);
    jest.clearAllMocks();
  });

  it('should allow a valid request when JWT clinic_id matches the resolved tenant', () => {
    const payload = makePayload({ clinic_id: CLINIC_A_ID });
    clsServiceMock.get.mockImplementation((key: string) => {
      if (key === TENANT_ID_KEY) return CLINIC_A_ID;
      return null;
    });

    // handleRequest returns the user if valid — no exception thrown
    const result = guard.handleRequest(null, payload, null, makeContext());
    expect(result).toEqual(payload);
  });

  it('SECURITY: should throw ForbiddenException when JWT clinic_id is for Clinic A but tenant is Clinic B', () => {
    const payload = makePayload({ clinic_id: CLINIC_A_ID, is_platform_admin: false });
    clsServiceMock.get.mockImplementation((key: string) => {
      if (key === TENANT_ID_KEY) return CLINIC_B_ID; // ← different tenant
      return null;
    });

    expect(() =>
      guard.handleRequest(null, payload, null, makeContext()),
    ).toThrow(ForbiddenException);
  });

  it('SECURITY: should throw ForbiddenException when no user is returned from JWT strategy', () => {
    clsServiceMock.get.mockReturnValue(CLINIC_A_ID);

    expect(() =>
      guard.handleRequest(null, null, null, makeContext()),
    ).toThrow(ForbiddenException);
  });

  it('SECURITY: should throw the original error when JWT strategy throws (e.g. expired token)', () => {
    const jwtExpiredError = new Error('jwt expired');
    clsServiceMock.get.mockReturnValue(CLINIC_A_ID);

    expect(() =>
      guard.handleRequest(jwtExpiredError, null, null, makeContext()),
    ).toThrow(jwtExpiredError);
  });

  it('Platform admin should bypass the clinic_id check', () => {
    // Platform admins have is_platform_admin: true — they don't belong to a specific clinic
    const payload = makePayload({ is_platform_admin: true, clinic_id: undefined });
    clsServiceMock.get.mockImplementation((key: string) => {
      if (key === TENANT_ID_KEY) return CLINIC_B_ID; // any tenant subdomain
      return null;
    });

    const result = guard.handleRequest(null, payload, null, makeContext());
    expect(result).toEqual(payload);
  });

  it('should bind tenant ID from JWT when no subdomain tenant was resolved', () => {
    // No tenant from subdomain resolution → guard stores clinic_id from token
    const payload = makePayload({ clinic_id: CLINIC_A_ID });
    clsServiceMock.get.mockImplementation((key: string) => {
      if (key === TENANT_ID_KEY) return null; // no subdomain resolved
      return null;
    });

    guard.handleRequest(null, payload, null, makeContext());

    // Must set the tenant ID in CLS from the JWT
    expect(clsServiceMock.set).toHaveBeenCalledWith(TENANT_ID_KEY, CLINIC_A_ID);
  });

  it('SECURITY: mismatched clinic_id must always throw ForbiddenException regardless of roles', () => {
    const adminPayload = makePayload({
      clinic_id: CLINIC_A_ID,
      roles: ['clinic_owner'], // highest clinic role
      is_platform_admin: false,
    });
    clsServiceMock.get.mockImplementation((key: string) => {
      if (key === TENANT_ID_KEY) return CLINIC_B_ID;
      return null;
    });

    expect(() =>
      guard.handleRequest(null, adminPayload, null, makeContext()),
    ).toThrow(ForbiddenException);
  });
});
