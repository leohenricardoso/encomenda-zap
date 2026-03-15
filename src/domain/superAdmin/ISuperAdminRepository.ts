import type { SuperAdmin } from "./SuperAdmin";

/**
 * Repository port for SuperAdmin persistence.
 *
 * Defined in domain — infra must implement without leaking Prisma types.
 */
export interface ISuperAdminRepository {
  /** Find a super admin by email. Returns null if not found. */
  findByEmail(email: string): Promise<SuperAdmin | null>;

  /** Find a super admin by ID. Returns null if not found. */
  findById(id: string): Promise<SuperAdmin | null>;
}
