/**
 * Port: Password Hashing abstraction used by the Application layer.
 *
 * Defined here (application/ports) so use cases depend on this
 * interface — not on any concrete implementation (argon2, bcrypt, etc.).
 *
 * NestJS migration: this becomes an @Injectable() abstract class or
 * an injection token with a provider binding in the module.
 */
export interface IPasswordHasher {
  /**
   * Produces a salted hash of the raw password.
   * Implementations must use a memory-hard algorithm (Argon2id, bcrypt).
   */
  hash(password: string): Promise<string>;

  /**
   * Returns true when the raw password matches the stored hash.
   * Must run in constant time to prevent timing attacks.
   */
  verify(password: string, hash: string): Promise<boolean>;
}
