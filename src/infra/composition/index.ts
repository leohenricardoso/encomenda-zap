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

// ─── Application ─────────────────────────────────────────────────────────────

import { LoginUseCase } from "@/application/auth/LoginUseCase";
import { RegisterStoreUseCase } from "@/application/store/RegisterStoreUseCase";
import { CreateProductUseCase } from "@/application/product/CreateProductUseCase";
import { ListProductsUseCase } from "@/application/product/ListProductsUseCase";
import { GetProductByIdUseCase } from "@/application/product/GetProductByIdUseCase";
import { UpdateProductUseCase } from "@/application/product/UpdateProductUseCase";
import { DeleteProductUseCase } from "@/application/product/DeleteProductUseCase";

// ─── Controllers ─────────────────────────────────────────────────────────────

import { AuthController } from "@/controllers/http/AuthController";
import { ProductController } from "@/controllers/http/ProductController";

// ─── Wire-up ─────────────────────────────────────────────────────────────────
// Module-level singletons — Next.js server restarts on code changes,
// so singletons are safe and avoid unnecessary re-instantiation per request.

const hasher = new Argon2PasswordHasher();
const adminRepo = new PrismaAdminRepository();
const storeRepo = new PrismaStoreRepository();
const productRepo = new PrismaProductRepository();

const loginUseCase = new LoginUseCase(adminRepo, hasher);
const registerStoreUseCase = new RegisterStoreUseCase(storeRepo, hasher);

const createProductUseCase = new CreateProductUseCase(productRepo);
const listProductsUseCase = new ListProductsUseCase(productRepo);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepo);
const updateProductUseCase = new UpdateProductUseCase(productRepo);
const deleteProductUseCase = new DeleteProductUseCase(productRepo);

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

/**
 * Use case singletons — available for direct use in Server Components.
 *
 * Server Components are view-layer adapters: they call use cases directly
 * (no HTTP round-trip). Importing these from the composition root keeps the
 * wiring in one place and avoids recreating instances per render.
 */
export { listProductsUseCase, getProductByIdUseCase };
