import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./Customer";

/**
 * ICustomerRepository — domain port (interface).
 *
 * All methods are scoped to a store (storeId) to enforce tenant isolation.
 * The concrete implementation lives in infra/repositories/PrismaCustomerRepository.ts.
 */
export interface ICustomerRepository {
  /**
   * Returns all customers that belong to the given store, ordered by name.
   */
  findAllByStore(storeId: string): Promise<Customer[]>;

  /**
   * Returns the customer by id within the store, or null if not found.
   */
  findById(id: string, storeId: string): Promise<Customer | null>;

  /**
   * Returns the customer whose normalised WhatsApp matches, within the store.
   * Critical for order creation — allows deduplication and customer lookup
   * from incoming WhatsApp messages before an Order entity is introduced.
   */
  findByWhatsApp(whatsapp: string, storeId: string): Promise<Customer | null>;

  /**
   * Creates a new customer. The repository is responsible for calling
   * normalizeWhatsApp() before persisting, or callers may normalise first.
   */
  create(input: CreateCustomerInput): Promise<Customer>;

  /**
   * Partially updates a customer. Returns null if the customer does not exist
   * (or does not belong to the store).
   */
  update(
    id: string,
    storeId: string,
    input: UpdateCustomerInput,
  ): Promise<Customer | null>;

  /**
   * Deletes a customer. Returns true if deleted, false if not found.
   */
  delete(id: string, storeId: string): Promise<boolean>;
}
