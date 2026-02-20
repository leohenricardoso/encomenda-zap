import { prisma } from "@/lib/prisma";

export interface AdminCredentials {
  id: string;
  email: string;
  passwordHash: string;
  storeId: string;
}

/**
 * Finds an Admin by email.
 * Returns only the fields needed for authentication — never exposes
 * fields like createdAt that could aid user enumeration via response timing.
 *
 * Returns null when no admin is found (caller decides how to handle).
 */
export async function findAdminByEmail(
  email: string,
): Promise<AdminCredentials | null> {
  return prisma.admin.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      storeId: true,
    },
  });
}
