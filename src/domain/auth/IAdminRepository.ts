import type { Admin } from "./Admin";

/**
 * Repository interface for Admin persistence.
 *
 * Defined in the domain — infrastructure implementations must comply.
 *
 * Authentication is the only domain concern here:
 * the repository exposes only the lookup needed to verify credentials.
 */
export interface IAdminRepository {
  /**
   * Returns null when no admin is found.
   * Callers must NOT distinguish "not found" from "wrong password" in
   * their user-facing responses (enumeration prevention).
   */
  findByEmail(email: string): Promise<Admin | null>;
}
