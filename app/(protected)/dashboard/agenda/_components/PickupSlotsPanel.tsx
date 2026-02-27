"use client";

/**
 * PickupSlotsPanel — Client component for managing pickup time slots per day of week.
 *
 * Renders a collapsible panel for each day (Sun–Sat / Dom–Sáb) showing the
 * store's configured pickup windows with options to add new slots and toggle
 * existing ones active/inactive.
 *
 * API contract:
 *   GET  /api/pickup-slots              → { success: true, data: { slots: StorePickupSlot[] } }
 *   POST /api/pickup-slots              → { success: true, data: StorePickupSlot }
 *   PATCH /api/pickup-slots/:id         → { success: true, data: StorePickupSlot }
 */

import { useState } from "react";
import type { StorePickupSlot } from "@/domain/pickupSlot/StorePickupSlot";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

// ─── PickupSlotsPanel ─────────────────────────────────────────────────────────

interface PickupSlotsPanelProps {
  initialSlots: StorePickupSlot[];
}

export function PickupSlotsPanel({ initialSlots }: PickupSlotsPanelProps) {
  const [slotsByDay, setSlotsByDay] = useState<Map<number, StorePickupSlot[]>>(
    () => {
      const map = new Map<number, StorePickupSlot[]>();
      for (let i = 0; i < 7; i++) map.set(i, []);
      for (const slot of initialSlots) {
        const arr = map.get(slot.dayOfWeek) ?? [];
        arr.push(slot);
        map.set(slot.dayOfWeek, arr);
      }
      // Sort each day by startTime
      for (const [day, daySlots] of map) {
        map.set(
          day,
          [...daySlots].sort((a, b) => a.startTime.localeCompare(b.startTime)),
        );
      }
      return map;
    },
  );

  function handleToggle(dayOfWeek: number, updated: StorePickupSlot) {
    setSlotsByDay((prev) => {
      const copy = new Map(prev);
      copy.set(
        dayOfWeek,
        (copy.get(dayOfWeek) ?? []).map((s) =>
          s.id === updated.id ? updated : s,
        ),
      );
      return copy;
    });
  }

  function handleAdd(dayOfWeek: number, added: StorePickupSlot) {
    setSlotsByDay((prev) => {
      const copy = new Map(prev);
      const updated = [...(copy.get(dayOfWeek) ?? []), added].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      copy.set(dayOfWeek, updated);
      return copy;
    });
  }

  return (
    <section className="space-y-4">
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Horários de Retirada
        </h2>
        <p className="text-sm text-foreground-muted">
          Configure os horários disponíveis para retirada de pedidos por dia da
          semana.
        </p>
      </div>

      {/* ── Day panels ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {Array.from({ length: 7 }, (_, i) => (
          <DayPanel
            key={i}
            dayIndex={i}
            dayName={DAY_NAMES[i]}
            slots={slotsByDay.get(i) ?? []}
            onToggle={(updated) => handleToggle(i, updated)}
            onAdd={(added) => handleAdd(i, added)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

interface DayPanelProps {
  dayIndex: number;
  dayName: string;
  slots: StorePickupSlot[];
  onToggle: (updated: StorePickupSlot) => void;
  onAdd: (added: StorePickupSlot) => void;
}

function DayPanel({
  dayIndex,
  dayName,
  slots,
  onToggle,
  onAdd,
}: DayPanelProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const activeCount = slots.filter((s) => s.isActive).length;

  return (
    <div className="rounded-lg border border-line bg-surface overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-hover transition-colors"
        type="button"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">{dayName}</span>
          {slots.length > 0 ? (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              {activeCount} ativo{activeCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-foreground-muted">sem horários</span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3 space-y-3">
          {/* Slot list */}
          {slots.length === 0 ? (
            <p className="text-sm text-foreground-muted italic">
              Nenhum horário configurado para este dia.
            </p>
          ) : (
            <ul className="space-y-2">
              {slots.map((slot) => (
                <SlotRow key={slot.id} slot={slot} onToggle={onToggle} />
              ))}
            </ul>
          )}

          {/* Add slot form or trigger */}
          {showForm ? (
            <SlotForm
              dayOfWeek={dayIndex}
              existingSlots={slots}
              onAdd={(added) => {
                onAdd(added);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              + Adicionar horário
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SlotRow ──────────────────────────────────────────────────────────────────

interface SlotRowProps {
  slot: StorePickupSlot;
  onToggle: (updated: StorePickupSlot) => void;
}

function SlotRow({ slot, onToggle }: SlotRowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pickup-slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !slot.isActive }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data: StorePickupSlot;
        error?: { message: string };
      };
      if (json.success) {
        onToggle(json.data);
      } else {
        setError(json.error?.message ?? "Erro ao atualizar.");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center justify-between rounded-md bg-surface-subtle px-3 py-2">
        <span
          className={`font-mono text-sm ${slot.isActive ? "text-foreground" : "text-foreground-muted line-through"}`}
        >
          {slot.startTime} – {slot.endTime}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            slot.isActive
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {loading ? "..." : slot.isActive ? "Desativar" : "Ativar"}
        </button>
      </div>
      {error && <p className="px-1 text-xs text-danger">{error}</p>}
    </li>
  );
}

// ─── SlotForm ─────────────────────────────────────────────────────────────────

interface SlotFormProps {
  dayOfWeek: number;
  existingSlots: StorePickupSlot[];
  onAdd: (slot: StorePickupSlot) => void;
  onCancel: () => void;
}

function SlotForm({
  dayOfWeek,
  existingSlots,
  onAdd,
  onCancel,
}: SlotFormProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!startTime || !endTime) return "Preencha os dois horários.";
    if (startTime >= endTime)
      return "O horário de início deve ser anterior ao término.";
    // Overlap check against existing active slots
    for (const s of existingSlots) {
      if (!s.isActive) continue;
      const overlaps = startTime < s.endTime && endTime > s.startTime;
      if (overlaps)
        return `Conflito com o horário existente ${s.startTime} – ${s.endTime}.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/pickup-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, startTime, endTime }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data: StorePickupSlot;
        error?: { message: string };
      };
      if (!json.success) {
        setError(json.error?.message ?? "Erro ao salvar.");
        return;
      }
      onAdd(json.data);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-line bg-surface-subtle p-3 space-y-3"
    >
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Início
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
            required
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Término
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
            required
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-1.5 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
