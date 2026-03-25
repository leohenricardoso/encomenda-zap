"use client";

/**
 * SortableCategoriesList
 *
 * Drag-and-drop reordering for store categories.
 *
 * Behaviour:
 *  – Categories can be reordered by dragging the grip handle.
 *  – After dropping, a "Salvar ordem" button appears so the owner can
 *    confirm before the positions are persisted.
 *  – On save, PATCH /api/categories/reorder is called with the full ordered
 *    list. Optimistic state is rolled back on failure.
 *  – A "Redefinir" link restores the last-saved order without a network call.
 *  – Keyboard accessible: PointerSensor + KeyboardSensor.
 *
 * Uses @dnd-kit/core + @dnd-kit/sortable — already installed in the project.
 */

import Link from "next/link";
import { useState, useRef } from "react";
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
import type { CategorySummary } from "@/domain/category/Category";

// ─── Drag handle icon ─────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  );
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

interface SortableRowProps {
  category: CategorySummary;
  isDirty: boolean;
  position: number;
  onDelete: (id: string) => void;
  deleting: string | null;
}

function SortableRow({
  category,
  isDirty,
  position,
  onDelete,
  deleting,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={[
        "group transition-colors",
        isDragging ? "bg-surface-subtle shadow-md" : "hover:bg-surface-subtle",
      ].join(" ")}
    >
      {/* Drag handle */}
      <td className="w-10 pl-4">
        <button
          {...attributes}
          {...listeners}
          className={[
            "cursor-grab active:cursor-grabbing",
            "flex items-center justify-center rounded p-1",
            "text-foreground-muted transition-colors",
            "hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          ].join(" ")}
          aria-label={`Reordenar categoria ${category.name}`}
        >
          <GripIcon />
        </button>
      </td>

      {/* Position badge */}
      <td className="w-10 pr-2 text-center">
        <span
          className={[
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            isDirty
              ? "bg-accent/10 text-accent"
              : "bg-surface-subtle text-foreground-muted",
          ].join(" ")}
        >
          {position + 1}
        </span>
      </td>

      {/* Name */}
      <td className="py-3 font-medium text-foreground">{category.name}</td>

      {/* Slug */}
      <td className="hidden px-4 py-3 font-mono text-xs text-foreground-muted sm:table-cell">
        {category.slug}
      </td>

      {/* Product count */}
      <td className="hidden px-4 py-3 text-center text-foreground-muted md:table-cell">
        {category.productCount}
      </td>

      {/* Active badge */}
      <td className="hidden px-4 py-3 text-center sm:table-cell">
        {category.isActive ? (
          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            Ativo
          </span>
        ) : (
          <span className="inline-block rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-foreground-muted">
            Inativo
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/categories/${category.id}`}
            className="text-xs text-accent hover:underline"
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(category.id)}
            disabled={deleting === category.id}
            className="text-xs text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting === category.id ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  categories: CategorySummary[];
}

export function SortableCategoriesList({ categories }: Props) {
  const [list, setList] = useState<CategorySummary[]>(categories);
  // Snapshot of the last-persisted order so we can roll back / reset
  const savedRef = useRef<CategorySummary[]>(categories);

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Drag end ──────────────────────────────────────────────────────────────
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((c) => c.id === active.id);
    const newIndex = list.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(list, oldIndex, newIndex);

    setList(reordered);
    setIsDirty(true);
    setSaveSuccess(false);
    setSaveError(null);
  }

  // ── Save order ────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const items = list.map((c, i) => ({ id: c.id, position: i }));

    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Erro ao salvar a ordem.");
      }

      // Commit the saved snapshot
      savedRef.current = list;
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Erro ao salvar a ordem.",
      );
      // Roll back to last saved state
      setList(savedRef.current);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  }

  // ── Reset to last saved order ─────────────────────────────────────────────
  function handleReset() {
    setList(savedRef.current);
    setIsDirty(false);
    setSaveError(null);
  }

  // ── Delete category ───────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    setDeleting(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Erro ao excluir.");
      }
      const next = list.filter((c) => c.id !== id);
      setList(next);
      savedRef.current = next;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setDeleting(null);
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-12 text-center">
        <p className="text-foreground-muted text-sm">
          Nenhuma categoria criada ainda.
        </p>
        <Link
          href="/dashboard/categories/new"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          Criar primeira categoria
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Error banners ──────────────────────────────────────────────────── */}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}
      {deleteError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 min-h-8">
        <p className="text-xs text-foreground-muted">
          Arraste as linhas para reordenar as categorias.
        </p>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-foreground-muted hover:text-foreground underline transition-colors"
            >
              Desfazer
            </button>
          )}

          {saveSuccess && !isDirty && (
            <span className="text-xs font-medium text-green-600">
              ✓ Ordem salva
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={[
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isDirty
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-surface-subtle text-foreground-muted cursor-not-allowed",
              "disabled:opacity-60",
            ].join(" ")}
          >
            {saving ? "Salvando…" : "Salvar ordem"}
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-subtle">
            <tr>
              {/* Drag handle column — no label */}
              <th className="w-10" />
              {/* Position number */}
              <th className="w-10 pr-2 text-center text-xs font-medium text-foreground-muted">
                #
              </th>
              <th className="py-3 text-left font-medium text-foreground-muted">
                Nome
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-foreground-muted sm:table-cell">
                Slug
              </th>
              <th className="hidden px-4 py-3 text-center font-medium text-foreground-muted md:table-cell">
                Produtos
              </th>
              <th className="hidden px-4 py-3 text-center font-medium text-foreground-muted sm:table-cell">
                Ativo
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={list.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {list.map((cat, index) => (
                  <SortableRow
                    key={cat.id}
                    category={cat}
                    isDirty={isDirty}
                    position={index}
                    onDelete={handleDelete}
                    deleting={deleting}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>
    </div>
  );
}
