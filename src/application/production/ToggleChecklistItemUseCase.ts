import type { IDailyProductionChecklistRepository } from "@/domain/production/IDailyProductionChecklistRepository";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface ToggleChecklistItemInput {
  storeId: string;
  /** Calendar date in YYYY-MM-DD format. */
  date: string;
  /** Composite key: "${productId}::${variantId ?? 'no-variant'}" */
  itemKey: string;
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface ToggleChecklistItemOutput {
  /** The new produced state after the toggle. */
  produced: boolean;
}

// ─── Use case ─────────────────────────────────────────────────────────────────

/**
 * ToggleChecklistItemUseCase
 *
 * Marks an item as produced (or un-marks it) for a given store and date.
 * The toggle is idempotent in the sense that calling it twice returns the
 * item to its original state.
 */
export class ToggleChecklistItemUseCase {
  constructor(
    private readonly checklistRepo: IDailyProductionChecklistRepository,
  ) {}

  async execute(
    input: ToggleChecklistItemInput,
  ): Promise<ToggleChecklistItemOutput> {
    const produced = await this.checklistRepo.toggleItem(
      input.storeId,
      input.date,
      input.itemKey,
    );
    return { produced };
  }
}
