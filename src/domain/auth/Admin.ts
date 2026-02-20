/**
 * Admin entity — minimal shape used during authentication.
 *
 * Only exposes fields required for credential verification.
 * Never exposes raw passwords or other sensitive infra fields.
 */
export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  storeId: string;
}
