'use client';

import { useMemo } from 'react';
import {
  type Control,
  type FieldArrayWithId,
  type UseFieldArrayRemove,
  type UseFormSetValue,
  useWatch,
  Controller,
} from 'react-hook-form';
import type { InvoiceFormValues, InvoiceLineFormValues } from '@/validation/invoiceSchema';
import type { PieceItem, WeightCategory } from '@/services/invoiceFormData.service';
import { computeLineTotal, type Metal } from '@/lib/invoiceMath';

function groupPieceItems(items: PieceItem[]) {
  const by: Record<string, PieceItem[]> = {};
  for (const it of items) {
    const k = it.category || 'Other';
    if (!by[k]) by[k] = [];
    by[k].push(it);
  }
  return by;
}

function metalForRow(
  line: InvoiceLineFormValues,
  pieceItems: PieceItem[],
  weightCats: WeightCategory[],
): Metal {
  if (line.lineType === 'weight' && line.category) {
    const c = weightCats.find((x) => x.id === line.category);
    return (c?.metal_type as Metal) || 'gold';
  }
  if (line.lineType === 'piece' && line.inventoryItem) {
    const it = pieceItems.find((x) => x.id === line.inventoryItem);
    return (it?.metal_type as Metal) || 'gold';
  }
  return 'gold';
}

export function LineItemsTable({
  control,
  setValue,
  fields,
  remove,
  pieceItems,
  weightCategories,
  errors,
}: {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  fields: FieldArrayWithId<InvoiceFormValues, 'lineItems', 'id'>[];
  remove: UseFieldArrayRemove;
  pieceItems: PieceItem[];
  weightCategories: WeightCategory[];
  errors?: unknown[];
}) {
  const lineItems = useWatch({ control, name: 'lineItems' }) as InvoiceFormValues['lineItems'];
  const grouped = useMemo(() => groupPieceItems(pieceItems), [pieceItems]);

  const rowTotals = useMemo(() => {
    return (lineItems || []).map((line) => {
      if (!line) return null;
      const filled =
        line.weight != null ||
        line.rate != null ||
        line.inventoryItem ||
        line.category ||
        (line.description && line.description.trim());
      if (!filled) return null;
      const metal = metalForRow(line, pieceItems, weightCategories);
      return computeLineTotal(
        {
          weight: line.weight,
          rate: line.rate,
          makingChargeType: line.makingChargeType,
          makingChargePct: line.makingChargePct,
          makingChargeAmt: line.makingChargeAmt,
        },
        metal,
      );
    });
  }, [lineItems, pieceItems, weightCategories]);

  return (
    <div className="table-scroll rounded-lg border border-gray-200">
      <div
        className="grid min-w-[900px] gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2 text-[0.62rem] font-semibold uppercase tracking-wide text-gray-500"
        style={{
          gridTemplateColumns: '28px 88px 160px 1fr 64px 72px 80px 90px 80px 36px',
        }}
      >
        <div>#</div>
        <div>Type</div>
        <div>Picker</div>
        <div>Description</div>
        <div className="text-center">Karat</div>
        <div className="text-right">Wt (g)</div>
        <div className="text-right">Rate</div>
        <div className="text-center">MC</div>
        <div className="text-right">Total</div>
        <div />
      </div>
      {fields.map((field, index) => {
        const line = lineItems?.[index];
        const metal = line ? metalForRow(line, pieceItems, weightCategories) : 'gold';
        const rateUnit = metal === 'silver' ? '₹/10g' : '₹/g';
        const showKarat = metal !== 'silver';
        const err = Array.isArray(errors) ? (errors[index] as Record<string, { message?: string }> | undefined) : undefined;

        return (
          <div
            key={field.id}
            className="grid min-w-[900px] gap-1 border-b border-gray-100 px-2 py-2 text-sm"
            style={{
              gridTemplateColumns: '28px 88px 160px 1fr 64px 72px 80px 90px 80px 36px',
            }}
          >
            <div className="pt-2 text-center text-xs text-gray-400">{index + 1}</div>
            <div className="pt-1">
              <Controller
                control={control}
                name={`lineItems.${index}.lineType`}
                render={({ field: f }) => (
                  <div className="flex overflow-hidden rounded-md border border-gray-300 text-[0.7rem]">
                    <button
                      type="button"
                      className={`flex-1 px-1 py-0.5 ${f.value === 'piece' ? 'bg-brand font-semibold text-white' : 'bg-white text-gray-600'}`}
                      onClick={() => {
                        f.onChange('piece');
                        setValue(`lineItems.${index}.category`, '');
                      }}
                    >
                      Piece
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-1 py-0.5 ${f.value === 'weight' ? 'bg-brand font-semibold text-white' : 'bg-white text-gray-600'}`}
                      onClick={() => {
                        f.onChange('weight');
                        setValue(`lineItems.${index}.inventoryItem`, '');
                      }}
                    >
                      Bulk
                    </button>
                  </div>
                )}
              />
            </div>
            <div>
              {line?.lineType !== 'weight' ? (
                <Controller
                  control={control}
                  name={`lineItems.${index}.inventoryItem`}
                  render={({ field: f }) => (
                    <select
                      className="w-full rounded border border-gray-300 px-1 py-1 text-[0.75rem]"
                      value={f.value || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        f.onChange(v);
                        const it = pieceItems.find((p) => p.id === v);
                        if (it) {
                          setValue(
                            `lineItems.${index}.description`,
                            [it.code, it.description].filter(Boolean).join(' — '),
                          );
                          setValue(`lineItems.${index}.karat`, (it.karat || '22ct') as InvoiceLineFormValues['karat']);
                          setValue(`lineItems.${index}.weight`, it.weight ?? undefined);
                          setValue(`lineItems.${index}.lineType`, 'piece');
                        }
                      }}
                    >
                      <option value="">— Pick item —</option>
                      {Object.entries(grouped).map(([cat, items]) => (
                        <optgroup key={cat} label={cat}>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {[it.code, it.description].filter(Boolean).join(' — ')} (
                              {it.metal_type === 'silver'
                                ? `Silver, ${it.weight}g`
                                : `${it.karat}, ${it.weight}g`}
                              )
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                />
              ) : (
                <Controller
                  control={control}
                  name={`lineItems.${index}.category`}
                  render={({ field: f }) => (
                    <select
                      className="w-full rounded border border-gray-300 px-1 py-1 text-[0.75rem]"
                      value={f.value || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        f.onChange(v);
                        const c = weightCategories.find((x) => x.id === v);
                        if (c?.karat) {
                          setValue(`lineItems.${index}.karat`, c.karat as InvoiceLineFormValues['karat']);
                        }
                      }}
                    >
                      <option value="">— Category —</option>
                      {weightCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
            </div>
            <Controller
              control={control}
              name={`lineItems.${index}.description`}
              render={({ field: f }) => (
                <input {...f} className="form-input py-1 text-[0.8rem]" placeholder="Description" />
              )}
            />
            <div className={showKarat ? '' : 'opacity-40'}>
              <Controller
                control={control}
                name={`lineItems.${index}.karat`}
                render={({ field: f }) => (
                  <select {...f} className="form-input py-1 text-[0.8rem]" disabled={!showKarat}>
                    <option value="22ct">22ct 91.6%</option>
                    <option value="20ct">20ct 83.3%</option>
                    <option value="18ct">18ct 75%</option>
                  </select>
                )}
              />
            </div>
            <Controller
              control={control}
              name={`lineItems.${index}.weight`}
              render={({ field: f }) => (
                <input
                  type="number"
                  step="0.001"
                  min={0}
                  className="form-input py-1 text-right text-[0.8rem]"
                  value={f.value ?? ''}
                  onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              )}
            />
            <div>
              <Controller
                control={control}
                name={`lineItems.${index}.rate`}
                render={({ field: f }) => (
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="form-input py-1 text-right text-[0.8rem]"
                    value={f.value ?? ''}
                    onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
              />
              <span className="block text-right text-[0.6rem] text-gray-400">{rateUnit}</span>
            </div>
            <div>
              <Controller
                control={control}
                name={`lineItems.${index}.makingChargeType`}
                render={({ field: f }) => (
                  <div className="mb-0.5 flex overflow-hidden rounded border border-gray-300 text-[0.65rem]">
                    <button
                      type="button"
                      className={`flex-1 px-0.5 py-0.5 ${f.value === 'pct' ? 'bg-brand text-white' : 'bg-white text-gray-600'}`}
                      onClick={() => f.onChange('pct')}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-0.5 py-0.5 ${f.value === 'amt' ? 'bg-brand text-white' : 'bg-white text-gray-600'}`}
                      onClick={() => f.onChange('amt')}
                    >
                      ₹
                    </button>
                  </div>
                )}
              />
              {line?.makingChargeType === 'amt' ? (
                <Controller
                  control={control}
                  name={`lineItems.${index}.makingChargeAmt`}
                  render={({ field: f }) => (
                    <input
                      type="number"
                      step="0.01"
                      className="form-input py-1 text-right text-[0.8rem]"
                      value={f.value ?? ''}
                      onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  )}
                />
              ) : (
                <Controller
                  control={control}
                  name={`lineItems.${index}.makingChargePct`}
                  render={({ field: f }) => (
                    <input
                      type="number"
                      step="0.01"
                      className="form-input py-1 text-right text-[0.8rem]"
                      value={f.value ?? ''}
                      onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  )}
                />
              )}
            </div>
            <div className="pt-2 text-right text-[0.78rem] font-semibold text-gray-800">
              {rowTotals[index] != null ? `₹${rowTotals[index]!.toFixed(2)}` : '—'}
            </div>
            <div className="pt-1 text-center">
              <button type="button" className="text-xs text-red-400" onClick={() => remove(index)}>
                ✕
              </button>
            </div>
            {err?.weight?.message ? (
              <p className="col-span-full text-xs text-red-600">{err.weight.message}</p>
            ) : null}
            {err?.rate?.message ? (
              <p className="col-span-full text-xs text-red-600">{err.rate.message}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
