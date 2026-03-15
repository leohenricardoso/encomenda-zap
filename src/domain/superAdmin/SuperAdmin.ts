/**
 * SuperAdmin entity — platform-level administrator.
 *
 * Distinct from the store-level Admin entity.
 * SuperAdmins belong to the platform itself and have no storeId binding.
 * Only exposes fields required for authentication and identity.
 */
export interface SuperAdmin {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  isActive: boolean;
}
