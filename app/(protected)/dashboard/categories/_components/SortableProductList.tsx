"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ProductRow {
  productId: string;
  productName: string;
  position: number;
  isActive: boolean;
}

interface Props {
  categoryId: string;
  storeId: string;
}

// ─── Sortable item ────────────────────────────────────────────────────────────

function SortableItem({
  item,
  onRemove,
}: {
  item: ProductRow;
  onRemove: (productId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.productId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-foreground-muted hover:text-foreground focus:outline-none"
        aria-label="Reordenar"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <span className="flex-1 text-sm text-foreground">{item.productName}</span>

      <span
        className={[
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
          item.isActive
            ? "bg-green-50 text-green-700"
            : "bg-surface-subtle text-foreground-muted",
        ].join(" ")}
      >
        {item.isActive ? "Ativo" : "Inativo"}
      </span>

      <button
        onClick={() => onRemove(item.productId)}
        className="rounded-md px-2 py-1 text-xs text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        aria-label="Remover produto da categoria"
      >
        Remover
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SortableProductList({ categoryId, storeId }: Props) {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Load products in this category ──────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/products`);
      if (!res.ok) throw new Error("Erro ao carregar produtos.");
      const json = (await res.json()) as { data: ProductRow[] };
      const loaded = Array.isArray(json.data) ? json.data : [];
      setItems(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Drag end → optimistic update + API call ──────────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.productId === active.id);
    const newIndex = items.findIndex((i) => i.productId === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await fetch(`/api/categories/${categoryId}/products/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedProductIds: reordered.map((i) => i.productId),
        }),
      });
    } catch {
      // Revert on failure
      setItems(items);
    }
  }

  // ── Remove product from category ────────────────────────────────────────────
  async function handleRemove(productId: string) {
    if (!confirm("Remover produto desta categoria?")) return;
    const prev = items;
    setItems((cur) => cur.filter((i) => i.productId !== productId));
    try {
      const res = await fetch(
        `/api/categories/${categoryId}/products/${productId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-foreground-muted">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-sm text-foreground-muted">
        Nenhum produto nesta categoria ainda. Adicione produtos usando o botão
        acima.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.productId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SortableItem
              key={item.productId}
              item={item}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
