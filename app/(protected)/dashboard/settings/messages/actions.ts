"use server";

import { getSession } from "@/infra/http/auth/getSession";
import { upsertStoreMessagesUseCase } from "@/infra/composition";

export async function saveMessages(
  approvalMessage: string | null,
  rejectionMessage: string | null,
): Promise<void> {
  const session = await getSession();
  await upsertStoreMessagesUseCase.execute(
    session.storeId,
    approvalMessage,
    rejectionMessage,
  );
}
