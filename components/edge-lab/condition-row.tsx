"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { FilterCondition, FilterOperator } from "@/types/edge-lab"
import type { FilterFieldDef } from "@/types/edge-lab"

interface ConditionRowProps {
  condition: FilterCondition
  fields: FilterFieldDef[]
  onUpdate: (id: string, updates: Partial<FilterCondition>) => void
  onRemove: (id: string) => void
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "equals",
  neq: "not equal",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  between: "between",
  in: "one of",
  not_in: "not one of",
}

export function ConditionRow({ condition, fields, onUpdate, onRemove }: ConditionRowProps) {
  const fieldDef = fields.find(f => f.key === condition.field)

  // Available operators based on field type
  const availableOperators = getOperatorsForType(fieldDef?.type ?? "number")

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
      {/* Field Selector */}
      <Select
        value={condition.field}
        onValueChange={(field) => {
          const def = fields.find(f => f.key === field)
          onUpdate(condition.id, {
            field,
            fieldLabel: def?.label,
            fieldCategory: def?.category,
            operator: def?.defaultOperator ?? "gte",
            value: null,
          })
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              <span className="text-xs text-muted-foreground mr-1">{f.category}:</span>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selector */}
      <Select
        value={condition.operator}
        onValueChange={(op) => onUpdate(condition.id, { operator: op as FilterOperator })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map(op => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      <div className="flex-1">
        {fieldDef?.type === "select" && fieldDef.options ? (
          <Select
            value={String(condition.value ?? "")}
            onValueChange={(v) => {
              onUpdate(condition.id, { value: v, valueLabel: fieldDef.options?.find(o => String(o.value) === v)?.label })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {fieldDef.options.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : fieldDef?.type === "boolean" ? (
          <Select
            value={String(condition.value ?? "")}
            onValueChange={(v) => onUpdate(condition.id, { value: v === "true", valueLabel: v === "true" ? "Yes" : "No" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Yes / No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        ) : condition.operator === "between" ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step={fieldDef?.step ?? 1}
              min={fieldDef?.min}
              max={fieldDef?.max}
              placeholder="Min"
              value={Array.isArray(condition.value) ? condition.value[0] ?? "" : ""}
              onChange={(e) => {
                const min = parseFloat(e.target.value)
                const max = Array.isArray(condition.value) ? condition.value[1] : fieldDef?.max ?? 30
                onUpdate(condition.id, { value: [min, max], valueLabel: `${min}-${max}` })
              }}
              className="font-mono text-sm"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number"
              step={fieldDef?.step ?? 1}
              min={fieldDef?.min}
              max={fieldDef?.max}
              placeholder="Max"
              value={Array.isArray(condition.value) ? condition.value[1] ?? "" : ""}
              onChange={(e) => {
                const max = parseFloat(e.target.value)
                const min = Array.isArray(condition.value) ? condition.value[0] : fieldDef?.min ?? 0
                onUpdate(condition.id, { value: [min, max], valueLabel: `${min}-${max}` })
              }}
              className="font-mono text-sm"
            />
          </div>
        ) : (
          <Input
            type="number"
            step={fieldDef?.step ?? 1}
            min={fieldDef?.min}
            max={fieldDef?.max}
            placeholder="Value"
            value={condition.value ?? ""}
            onChange={(e) => onUpdate(condition.id, { value: parseFloat(e.target.value) })}
            className="font-mono text-sm"
          />
        )}
      </div>

      {/* Unit Label */}
      {fieldDef?.unit && (
        <span className="text-xs text-muted-foreground shrink-0">{fieldDef.unit}</span>
      )}

      {/* Remove */}
      <Button variant="ghost" size="icon" onClick={() => onRemove(condition.id)} className="shrink-0 h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function getOperatorsForType(type: string): FilterOperator[] {
  switch (type) {
    case "select": return ["eq", "neq"]
    case "boolean": return ["eq"]
    case "multi_select": return ["in", "not_in"]
    case "range": return ["between", "gte", "lte", "gt", "lt", "eq"]
    case "number":
    default:
      return ["gte", "lte", "gt", "lt", "eq", "neq", "between"]
  }
}
