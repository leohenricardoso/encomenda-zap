import type { CreateStoreOutput } from "./types";

/**
 * Repository interface for Store persistence.
 *
 * Defined in the domain — infrastructure implementations must comply.
 */

export interface CreateStoreWithAdminInput {
  name: string;
  /** URL-safe slug for the public catalog URL: /catalog/:slug */
  slug: string;
  whatsapp: string;
  adminEmail: string;
  /** Pre-hashed password — raw password must NEVER reach the repository. */
  passwordHash: string;
}

export type { CreateStoreOutput };

export interface IStoreRepository {
  /**
   * Atomically creates a Store and its first Admin.
   * If either insert fails (e.g. duplicate email) the whole operation rolls back.
   *
   * Throws AppError(CONFLICT) on duplicate admin email.
   */
  createWithAdmin(input: CreateStoreWithAdminInput): Promise<CreateStoreOutput>;
}
