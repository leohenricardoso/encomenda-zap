/**
 * Composition Root
 *
 * The single location where all concrete implementations are instantiated
 * and wired together. Nothing outside this file should call `new` on
 * infrastructure classes.
 *
 * Why here?
 * - Keeps the dependency graph explicit and auditable.
 * - Swapping an implementation (e.g. from Argon2 to bcrypt, or Prisma to
 *   another ORM) requires changing exactly one file.
 *
 * NestJS migration:
 * Replace this file with NestJS @Module() declarations:
 *
 *   @Module({
 *     providers: [
 *       { provide: 'IPasswordHasher', useClass: Argon2PasswordHasher },
 *       { provide: 'IProductRepository', useClass: PrismaProductRepository },
 *       // ...
 *       LoginUseCase, RegisterStoreUseCase, CreateProductUseCase, ...
 *     ],
 *   })
 *   export class AppModule {}
 *
 * All @Injectable() classes become providers; controllers become @Controller().
 */

// ─── Infrastructure ───────────────────────────────────────────────────────────

import { Argon2PasswordHasher } from "@/infra/security/Argon2PasswordHasher";
import { PrismaAdminRepository } from "@/infra/repositories/PrismaAdminRepository";
import { PrismaStoreRepository } from "@/infra/repositories/PrismaStoreRepository";
import { PrismaProductRepository } from "@/infra/repositories/PrismaProductRepository";
import { PrismaCatalogRepository } from "@/infra/repositories/PrismaCatalogRepository";
import { PrismaCustomerRepository } from "@/infra/repositories/PrismaCustomerRepository";
import { PrismaOrderRepository } from "@/infra/repositories/PrismaOrderRepository";
import { PrismaOrderItemRepository } from "@/infra/repositories/PrismaOrderItemRepository";
import { PrismaStoreScheduleRepository } from "@/infra/repositories/PrismaStoreScheduleRepository";
import { PrismaPickupSlotRepository } from "@/infra/repositories/PrismaPickupSlotRepository";

// ─── Application ─────────────────────────────────────────────────────────────

import { LoginUseCase } from "@/application/auth/LoginUseCase";
import { RegisterStoreUseCase } from "@/application/store/RegisterStoreUseCase";
import { CreateProductUseCase } from "@/application/product/CreateProductUseCase";
import { ListProductsUseCase } from "@/application/product/ListProductsUseCase";
import { GetProductByIdUseCase } from "@/application/product/GetProductByIdUseCase";
import { UpdateProductUseCase } from "@/application/product/UpdateProductUseCase";
import { DeleteProductUseCase } from "@/application/product/DeleteProductUseCase";
import { CreateVariantUseCase } from "@/application/product/CreateVariantUseCase";
import { UpdateVariantUseCase } from "@/application/product/UpdateVariantUseCase";
import { DeleteVariantUseCase } from "@/application/product/DeleteVariantUseCase";
import { GetStoreCatalogUseCase } from "@/application/catalog/GetStoreCatalogUseCase";
import { PlaceOrderService } from "@/application/order/PlaceOrderService";
import { GetStoreScheduleUseCase } from "@/application/schedule/GetStoreScheduleUseCase";
import { SetDayAvailabilityUseCase } from "@/application/schedule/SetDayAvailabilityUseCase";
import { ListPickupSlotsUseCase } from "@/application/pickupSlot/ListPickupSlotsUseCase";
import { CreatePickupSlotUseCase } from "@/application/pickupSlot/CreatePickupSlotUseCase";
import { TogglePickupSlotUseCase } from "@/application/pickupSlot/TogglePickupSlotUseCase";
import { GetPublicPickupSlotsUseCase } from "@/application/pickupSlot/GetPublicPickupSlotsUseCase";

// ─── Controllers ─────────────────────────────────────────────────────────────

import { AuthController } from "@/controllers/http/AuthController";
import { ProductController } from "@/controllers/http/ProductController";
import { ProductVariantController } from "@/controllers/http/ProductVariantController";
import { PlaceOrderController } from "@/controllers/http/PlaceOrderController";
import { StoreScheduleController } from "@/controllers/http/StoreScheduleController";
import { StorePickupSlotController } from "@/controllers/http/StorePickupSlotController";

// ─── Wire-up ─────────────────────────────────────────────────────────────────
// Module-level singletons — Next.js server restarts on code changes,
// so singletons are safe and avoid unnecessary re-instantiation per request.

const hasher = new Argon2PasswordHasher();
const adminRepo = new PrismaAdminRepository();
const storeRepo = new PrismaStoreRepository();
const productRepo = new PrismaProductRepository();
const catalogRepo = new PrismaCatalogRepository();
const customerRepo = new PrismaCustomerRepository();
const orderRepo = new PrismaOrderRepository();
const orderItemRepo = new PrismaOrderItemRepository();
const scheduleRepo = new PrismaStoreScheduleRepository();
const pickupSlotRepo = new PrismaPickupSlotRepository();

const loginUseCase = new LoginUseCase(adminRepo, hasher);
const registerStoreUseCase = new RegisterStoreUseCase(storeRepo, hasher);

const createProductUseCase = new CreateProductUseCase(productRepo);
const listProductsUseCase = new ListProductsUseCase(productRepo);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepo);
const updateProductUseCase = new UpdateProductUseCase(productRepo);
const deleteProductUseCase = new DeleteProductUseCase(productRepo);
const createVariantUseCase = new CreateVariantUseCase(productRepo);
const updateVariantUseCase = new UpdateVariantUseCase(productRepo);
const deleteVariantUseCase = new DeleteVariantUseCase(productRepo);

// ─── Exported singletons (imported by route handlers) ────────────────────────

export const authController = new AuthController(
  loginUseCase,
  registerStoreUseCase,
);

export const productController = new ProductController(
  createProductUseCase,
  listProductsUseCase,
  getProductByIdUseCase,
  updateProductUseCase,
  deleteProductUseCase,
);

export const productVariantController = new ProductVariantController(
  createVariantUseCase,
  updateVariantUseCase,
  deleteVariantUseCase,
);

const placeOrderService = new PlaceOrderService(
  catalogRepo,
  customerRepo,
  productRepo,
  orderRepo,
  orderItemRepo,
);
export const placeOrderController = new PlaceOrderController(placeOrderService);

/**
 * Use case singletons — available for direct use in Server Components.
 */
export const getStoreCatalogUseCase = new GetStoreCatalogUseCase(catalogRepo);

export { listProductsUseCase, getProductByIdUseCase };

/**
 * Repository singletons — available for direct import in future use cases.
 */
export { customerRepo, orderRepo, orderItemRepo };

// ─── Schedule ─────────────────────────────────────────────────────────────────

const getStoreScheduleUseCase = new GetStoreScheduleUseCase(scheduleRepo);
const setDayAvailabilityUseCase = new SetDayAvailabilityUseCase(scheduleRepo);

export const storeScheduleController = new StoreScheduleController(
  getStoreScheduleUseCase,
  setDayAvailabilityUseCase,
);

// ─── Pickup Slots ───────────────────────────────────────────────────────────

const listPickupSlotsUseCase = new ListPickupSlotsUseCase(pickupSlotRepo);
const createPickupSlotUseCase = new CreatePickupSlotUseCase(pickupSlotRepo);
const togglePickupSlotUseCase = new TogglePickupSlotUseCase(pickupSlotRepo);
const getPublicPickupSlotsUseCase = new GetPublicPickupSlotsUseCase(
  catalogRepo,
  pickupSlotRepo,
);

export const storePickupSlotController = new StorePickupSlotController(
  listPickupSlotsUseCase,
  createPickupSlotUseCase,
  togglePickupSlotUseCase,
  getPublicPickupSlotsUseCase,
);
