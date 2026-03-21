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
import { PrismaSuperAdminRepository } from "@/infra/repositories/PrismaSuperAdminRepository";
import { PrismaProductRepository } from "@/infra/repositories/PrismaProductRepository";
import { PrismaCatalogRepository } from "@/infra/repositories/PrismaCatalogRepository";
import { PrismaCustomerRepository } from "@/infra/repositories/PrismaCustomerRepository";
import { PrismaOrderRepository } from "@/infra/repositories/PrismaOrderRepository";
import { PrismaOrderItemRepository } from "@/infra/repositories/PrismaOrderItemRepository";
import { PrismaStoreScheduleRepository } from "@/infra/repositories/PrismaStoreScheduleRepository";
import { PrismaPickupSlotRepository } from "@/infra/repositories/PrismaPickupSlotRepository";
import { PrismaCepRangeRepository } from "@/infra/repositories/PrismaCepRangeRepository";
import { PrismaStoreMessageRepository } from "@/infra/repositories/PrismaStoreMessageRepository";
import { PrismaProductImageRepository } from "@/infra/repositories/PrismaProductImageRepository";
import { PrismaCategoryRepository } from "@/infra/repositories/PrismaCategoryRepository";
import { PrismaProductCategoryRepository } from "@/infra/repositories/PrismaProductCategoryRepository";

// ─── Application ─────────────────────────────────────────────────────────────

import { LoginUseCase } from "@/application/auth/LoginUseCase";
import { RegisterStoreUseCase } from "@/application/store/RegisterStoreUseCase";
import { LoginSuperAdminUseCase } from "@/application/superAdmin/LoginSuperAdminUseCase";
import { ListAllStoresUseCase } from "@/application/store/ListAllStoresUseCase";
import { GetStoreDetailUseCase } from "@/application/store/GetStoreDetailUseCase";
import { CreateStoreBySuperAdminUseCase } from "@/application/store/CreateStoreBySuperAdminUseCase";
import { UpdateStoreInfoUseCase } from "@/application/store/UpdateStoreInfoUseCase";
import { SetStoreStatusUseCase } from "@/application/store/SetStoreStatusUseCase";
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
import { ListOrdersUseCase } from "@/application/order/ListOrdersUseCase";
import { GetOrderUseCase } from "@/application/order/GetOrderUseCase";
import { UpdateOrderTrackingStatusUseCase } from "@/application/order/UpdateOrderTrackingStatusUseCase";
import { ListCustomersWithStatsUseCase } from "@/application/customer/ListCustomersWithStatsUseCase";
import { GetStoreScheduleUseCase } from "@/application/schedule/GetStoreScheduleUseCase";
import { SetDayAvailabilityUseCase } from "@/application/schedule/SetDayAvailabilityUseCase";
import { ListPickupSlotsUseCase } from "@/application/pickupSlot/ListPickupSlotsUseCase";
import { CreatePickupSlotUseCase } from "@/application/pickupSlot/CreatePickupSlotUseCase";
import { TogglePickupSlotUseCase } from "@/application/pickupSlot/TogglePickupSlotUseCase";
import { DeletePickupSlotUseCase } from "@/application/pickupSlot/DeletePickupSlotUseCase";
import { GetPublicPickupSlotsUseCase } from "@/application/pickupSlot/GetPublicPickupSlotsUseCase";
import { GetCepRangeUseCase } from "@/application/cepRange/GetCepRangeUseCase";
import { AddCepRangeUseCase } from "@/application/cepRange/UpsertCepRangeUseCase";
import { DeleteCepRangeUseCase } from "@/application/cepRange/DeleteCepRangeUseCase";
import { ValidateCepUseCase } from "@/application/cepRange/ValidateCepUseCase";
import { GetStoreMessagesUseCase } from "@/application/store/GetStoreMessagesUseCase";
import { UpsertStoreMessagesUseCase } from "@/application/store/UpsertStoreMessagesUseCase";
import { GetStoreWhatsappUseCase } from "@/application/store/GetStoreWhatsappUseCase";
import { UpdateStoreWhatsappUseCase } from "@/application/store/UpdateStoreWhatsappUseCase";
import { GetStorePickupAddressUseCase } from "@/application/store/GetStorePickupAddressUseCase";
import { UpdateStorePickupAddressUseCase } from "@/application/store/UpdateStorePickupAddressUseCase";
import { UpdateDefaultDeliveryFeeUseCase } from "@/application/store/UpdateDefaultDeliveryFeeUseCase";
import { GetMinimumAdvanceDaysUseCase } from "@/application/store/GetMinimumAdvanceDaysUseCase";
import { UpdateMinimumAdvanceDaysUseCase } from "@/application/store/UpdateMinimumAdvanceDaysUseCase";
import { AddProductImageUseCase } from "@/application/productImage/AddProductImageUseCase";
import { GetProductImagesUseCase } from "@/application/productImage/GetProductImagesUseCase";
import { RemoveProductImageUseCase } from "@/application/productImage/RemoveProductImageUseCase";
import { SetImageAsPrimaryUseCase } from "@/application/productImage/SetImageAsPrimaryUseCase";
import { UploadProductImageUseCase } from "@/application/productImage/UploadProductImageUseCase";
import { ListCategoriesUseCase } from "@/application/category/ListCategoriesUseCase";
import { CreateCategoryUseCase } from "@/application/category/CreateCategoryUseCase";
import { UpdateCategoryUseCase } from "@/application/category/UpdateCategoryUseCase";
import { DeleteCategoryUseCase } from "@/application/category/DeleteCategoryUseCase";
import { AssignProductToCategoryUseCase } from "@/application/category/AssignProductToCategoryUseCase";
import { RemoveProductFromCategoryUseCase } from "@/application/category/RemoveProductFromCategoryUseCase";
import { ReorderCategoryProductsUseCase } from "@/application/category/ReorderCategoryProductsUseCase";
import { GetCategoryProductsUseCase } from "@/application/category/GetCategoryProductsUseCase";

// ─── Controllers ─────────────────────────────────────────────────────────────

import { AuthController } from "@/controllers/http/AuthController";
import { SuperAdminAuthController } from "@/controllers/http/SuperAdminAuthController";
import { AdminStoreController } from "@/controllers/http/AdminStoreController";
import { ProductController } from "@/controllers/http/ProductController";
import { ProductVariantController } from "@/controllers/http/ProductVariantController";
import { PlaceOrderController } from "@/controllers/http/PlaceOrderController";
import { StoreScheduleController } from "@/controllers/http/StoreScheduleController";
import { StorePickupSlotController } from "@/controllers/http/StorePickupSlotController";
import { StoreCepRangeController } from "@/controllers/http/StoreCepRangeController";
import { ProductImageController } from "@/controllers/http/ProductImageController";
import { ProductImageUploadController } from "@/controllers/http/ProductImageUploadController";
import { CategoryController } from "@/controllers/http/CategoryController";

// ─── Wire-up ─────────────────────────────────────────────────────────────────
// Module-level singletons — Next.js server restarts on code changes,
// so singletons are safe and avoid unnecessary re-instantiation per request.

const hasher = new Argon2PasswordHasher();
const adminRepo = new PrismaAdminRepository();
const storeRepo = new PrismaStoreRepository();
const superAdminRepo = new PrismaSuperAdminRepository();
const productRepo = new PrismaProductRepository();
const catalogRepo = new PrismaCatalogRepository();
const customerRepo = new PrismaCustomerRepository();
const orderRepo = new PrismaOrderRepository();
const orderItemRepo = new PrismaOrderItemRepository();
const scheduleRepo = new PrismaStoreScheduleRepository();
const pickupSlotRepo = new PrismaPickupSlotRepository();
const cepRangeRepo = new PrismaCepRangeRepository();
const imageRepo = new PrismaProductImageRepository();
const categoryRepo = new PrismaCategoryRepository();
const productCategoryRepo = new PrismaProductCategoryRepository();

const loginUseCase = new LoginUseCase(adminRepo, hasher);
const registerStoreUseCase = new RegisterStoreUseCase(storeRepo, hasher);

// ─── Super Admin ──────────────────────────────────────────────────────────────
const loginSuperAdminUseCase = new LoginSuperAdminUseCase(
  superAdminRepo,
  hasher,
);
const listAllStoresUseCase = new ListAllStoresUseCase(storeRepo);
const getStoreDetailUseCase = new GetStoreDetailUseCase(storeRepo);
const createStoreBySuperAdminUseCase = new CreateStoreBySuperAdminUseCase(
  storeRepo,
  hasher,
);
const updateStoreInfoUseCase = new UpdateStoreInfoUseCase(storeRepo);
const setStoreStatusUseCase = new SetStoreStatusUseCase(storeRepo);

const createProductUseCase = new CreateProductUseCase(
  productRepo,
  productCategoryRepo,
);
const listProductsUseCase = new ListProductsUseCase(productRepo);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepo);
const updateProductUseCase = new UpdateProductUseCase(
  productRepo,
  productCategoryRepo,
);
const deleteProductUseCase = new DeleteProductUseCase(productRepo);
const createVariantUseCase = new CreateVariantUseCase(productRepo);
const updateVariantUseCase = new UpdateVariantUseCase(productRepo);
const deleteVariantUseCase = new DeleteVariantUseCase(productRepo);

// ─── Exported singletons (imported by route handlers) ────────────────────────

export const authController = new AuthController(
  loginUseCase,
  registerStoreUseCase,
);

export const superAdminAuthController = new SuperAdminAuthController(
  loginSuperAdminUseCase,
);

export const adminStoreController = new AdminStoreController(
  listAllStoresUseCase,
  getStoreDetailUseCase,
  createStoreBySuperAdminUseCase,
  updateStoreInfoUseCase,
  setStoreStatusUseCase,
);

// Export use cases for direct use in Server Components
export { listAllStoresUseCase, getStoreDetailUseCase };

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
  cepRangeRepo,
);
export const placeOrderController = new PlaceOrderController(placeOrderService);

export const listOrdersUseCase = new ListOrdersUseCase(orderRepo);
export const getOrderUseCase = new GetOrderUseCase(orderRepo);
export const updateOrderTrackingStatusUseCase =
  new UpdateOrderTrackingStatusUseCase(orderRepo);
export const listCustomersWithStatsUseCase = new ListCustomersWithStatsUseCase(
  customerRepo,
);

/**
 * Use case singletons — available for direct use in Server Components.
 */
export const getStoreCatalogUseCase = new GetStoreCatalogUseCase(catalogRepo);

export { listProductsUseCase, getProductByIdUseCase };

// ─── Product Images ───────────────────────────────────────────────────────────

const addProductImageUseCase = new AddProductImageUseCase(
  productRepo,
  imageRepo,
);
const getProductImagesUseCase = new GetProductImagesUseCase(imageRepo);
const removeProductImageUseCase = new RemoveProductImageUseCase(imageRepo);
const setImageAsPrimaryUseCase = new SetImageAsPrimaryUseCase(imageRepo);

export const productImageController = new ProductImageController(
  addProductImageUseCase,
  removeProductImageUseCase,
  getProductImagesUseCase,
  setImageAsPrimaryUseCase,
);

export { getProductImagesUseCase };

// ─── Product Image Upload ───────────────────────────────────────────────────

const uploadProductImageUseCase = new UploadProductImageUseCase(
  productRepo,
  imageRepo,
);

export const productImageUploadController = new ProductImageUploadController(
  uploadProductImageUseCase,
);

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

export { getStoreScheduleUseCase };

// ─── Pickup Slots ───────────────────────────────────────────────────────────

const listPickupSlotsUseCase = new ListPickupSlotsUseCase(pickupSlotRepo);
const createPickupSlotUseCase = new CreatePickupSlotUseCase(pickupSlotRepo);
const togglePickupSlotUseCase = new TogglePickupSlotUseCase(pickupSlotRepo);
const deletePickupSlotUseCase = new DeletePickupSlotUseCase(pickupSlotRepo);
const getPublicPickupSlotsUseCase = new GetPublicPickupSlotsUseCase(
  catalogRepo,
  pickupSlotRepo,
);

export const storePickupSlotController = new StorePickupSlotController(
  listPickupSlotsUseCase,
  createPickupSlotUseCase,
  togglePickupSlotUseCase,
  deletePickupSlotUseCase,
  getPublicPickupSlotsUseCase,
);

export { listPickupSlotsUseCase };

// ─── CEP Range ─────────────────────────────────────────────────────────────────

const getCepRangeUseCase = new GetCepRangeUseCase(cepRangeRepo);
const addCepRangeUseCase = new AddCepRangeUseCase(cepRangeRepo);
const deleteCepRangeUseCase = new DeleteCepRangeUseCase(cepRangeRepo);
const validateCepUseCase = new ValidateCepUseCase(catalogRepo, cepRangeRepo);

export const storeCepRangeController = new StoreCepRangeController(
  getCepRangeUseCase,
  addCepRangeUseCase,
  deleteCepRangeUseCase,
  validateCepUseCase,
);

export { getCepRangeUseCase };

// ─── Message Config ────────────────────────────────────────────────────────────

const messageRepo = new PrismaStoreMessageRepository();

export const getStoreMessagesUseCase = new GetStoreMessagesUseCase(messageRepo);
export const upsertStoreMessagesUseCase = new UpsertStoreMessagesUseCase(
  messageRepo,
);

export const getStoreWhatsappUseCase = new GetStoreWhatsappUseCase(storeRepo);
export const updateStoreWhatsappUseCase = new UpdateStoreWhatsappUseCase(
  storeRepo,
);

export const getStorePickupAddressUseCase = new GetStorePickupAddressUseCase(
  storeRepo,
);
export const updateStorePickupAddressUseCase =
  new UpdateStorePickupAddressUseCase(storeRepo);

export const updateDefaultDeliveryFeeUseCase =
  new UpdateDefaultDeliveryFeeUseCase(storeRepo);

export const getMinimumAdvanceDaysUseCase = new GetMinimumAdvanceDaysUseCase(
  storeRepo,
);
export const updateMinimumAdvanceDaysUseCase =
  new UpdateMinimumAdvanceDaysUseCase(storeRepo);

// Helper: read default delivery fee directly via storeRepo
export { storeRepo };

// ─── Categories ─────────────────────────────────────────────────────────────────────────────

export const listCategoriesUseCase = new ListCategoriesUseCase(categoryRepo);
export const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);
export const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepo);
export const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepo);
export const assignProductToCategoryUseCase =
  new AssignProductToCategoryUseCase(
    categoryRepo,
    productCategoryRepo,
    productRepo,
  );
export const removeProductFromCategoryUseCase =
  new RemoveProductFromCategoryUseCase(productCategoryRepo);
export const reorderCategoryProductsUseCase =
  new ReorderCategoryProductsUseCase(productCategoryRepo);
export const getCategoryProductsUseCase = new GetCategoryProductsUseCase(
  productCategoryRepo,
);

export const categoryController = new CategoryController(
  listCategoriesUseCase,
  createCategoryUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
  assignProductToCategoryUseCase,
  removeProductFromCategoryUseCase,
  reorderCategoryProductsUseCase,
  getCategoryProductsUseCase,
);
