"use client";

import { useState, useTransition } from "react";
import type { StorePickupAddress } from "@/domain/store/types";
import { savePickupAddress } from "../actions";
import { Button } from "../../../../_components/Button";
import { InlineFeedback } from "../../../../_components/InlineFeedback";
import { Input } from "../../../../_components/Input";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PickupAddressFormProps {
  initialAddress: StorePickupAddress | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PickupAddressForm({ initialAddress }: PickupAddressFormProps) {
  const [fields, setFields] = useState({
    locationName: initialAddress?.locationName ?? "",
    street: initialAddress?.street ?? "",
    number: initialAddress?.number ?? "",
    neighborhood: initialAddress?.neighborhood ?? "",
    city: initialAddress?.city ?? "",
    complement: initialAddress?.complement ?? "",
    reference: initialAddress?.reference ?? "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setFeedback(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await savePickupAddress({
        locationName: fields.locationName,
        street: fields.street,
        number: fields.number,
        neighborhood: fields.neighborhood,
        city: fields.city,
        complement: fields.complement.trim() || null,
        reference: fields.reference.trim() || null,
      });

      if (result.success) {
        setFeedback({
          type: "success",
          message: "Endereço salvo com sucesso!",
        });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
      {/* Section header */}
      <div className="space-y-0.5">
        <h2 className="font-semibold text-foreground">Endereço de retirada</h2>
        <p className="text-sm text-foreground-muted">
          Local onde os clientes poderão retirar os pedidos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 2-column responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Nome do local — full width */}
          <div className="sm:col-span-2">
            <Input
              label="Nome do local"
              id="pickup-locationName"
              name="locationName"
              value={fields.locationName}
              onChange={handleChange}
              placeholder="Ex.: Loja Centro"
              required
            />
          </div>

          {/* Rua — full width */}
          <div className="sm:col-span-2">
            <Input
              label="Rua / Av."
              id="pickup-street"
              name="street"
              value={fields.street}
              onChange={handleChange}
              placeholder="Ex.: Av. Paraná"
              required
            />
          </div>

          {/* Número */}
          <Input
            label="Número"
            id="pickup-number"
            name="number"
            value={fields.number}
            onChange={handleChange}
            placeholder="Ex.: 123"
            required
          />

          {/* Bairro */}
          <Input
            label="Bairro"
            id="pickup-neighborhood"
            name="neighborhood"
            value={fields.neighborhood}
            onChange={handleChange}
            placeholder="Ex.: Centro"
            required
          />

          {/* Cidade — full width */}
          <div className="sm:col-span-2">
            <Input
              label="Cidade"
              id="pickup-city"
              name="city"
              value={fields.city}
              onChange={handleChange}
              placeholder="Ex.: Londrina"
              required
            />
          </div>

          {/* Complemento — full width, optional */}
          <div className="sm:col-span-2">
            <Input
              label="Complemento (opcional)"
              id="pickup-complement"
              name="complement"
              value={fields.complement}
              onChange={handleChange}
              placeholder="Ex.: Sala 2, fundos"
            />
          </div>

          {/* Referência — full width, optional */}
          <div className="sm:col-span-2">
            <Input
              label="Referência (opcional)"
              id="pickup-reference"
              name="reference"
              value={fields.reference}
              onChange={handleChange}
              placeholder="Ex.: Próximo ao Mercado X"
            />
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <InlineFeedback type={feedback.type} message={feedback.message} />
        )}

        <Button type="submit" loading={isPending}>
          Salvar endereço
        </Button>
      </form>
    </div>
  );
}
