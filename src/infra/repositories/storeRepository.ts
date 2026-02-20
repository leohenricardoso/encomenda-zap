import { prisma } from "@/lib/prisma";

interface CreateStoreWithAdminData {
  name: string;
  whatsapp: string;
  adminEmail: string;
  passwordHash: string;
}

interface CreateStoreWithAdminResult {
  storeId: string;
  adminId: string;
}

/**
 * Atomically creates a Store and its first Admin inside a Prisma transaction.
 *
 * If either insert fails (e.g. duplicate email), the entire transaction rolls
 * back — the database never ends up with a Store that has no Admin.
 */
export async function createStoreWithAdmin(
  data: CreateStoreWithAdminData,
): Promise<CreateStoreWithAdminResult> {
  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        name: data.name,
        whatsapp: data.whatsapp,
      },
      select: { id: true },
    });

    const admin = await tx.admin.create({
      data: {
        email: data.adminEmail,
        passwordHash: data.passwordHash,
        storeId: store.id,
      },
      select: { id: true },
    });

    return { storeId: store.id, adminId: admin.id };
  });
}
