import { productCategories } from '@sol25/shared';
import type { ProductListQueryInput, ProductSortField, ProductSortOrder } from '@sol25/shared';
import { Filter, Search, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Field, Input, Select } from './ui/Input';

type ProductFiltersProps = {
  urlSearch: ProductListQueryInput;
  hasActiveFilters: boolean;
  onUpdateSearch: (next: Partial<ProductListQueryInput>) => void;
  onClearFilters: () => void;
};

type ProductSearchProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
};

export function ProductSearch({ searchInput, onSearchChange }: ProductSearchProps) {
  return (
    <div className="rounded-lg bg-primary p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-primary">
          <Search className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Find products</p>
          <p className="text-xl font-extrabold tracking-tight text-white">Search inventory</p>
        </div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-14 w-full rounded-md border-0 bg-white pr-4 pl-12 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Search by name or SKU..."
          type="search"
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function ProductFilters({
  urlSearch,
  hasActiveFilters,
  onUpdateSearch,
  onClearFilters,
}: ProductFiltersProps) {
  return (
    <div className="h-fit rounded-lg bg-background p-6 sm:p-8 lg:sticky lg:top-28">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-foreground">
            <Filter className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Refine</p>
            <p className="text-xl font-extrabold tracking-tight">Filters & sorting</p>
          </div>
        </div>
        {hasActiveFilters ? (
          <Button variant="outline" type="button" className="h-12 px-4" onClick={onClearFilters}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4">
          <Field label="Category">
            <Select
              value={urlSearch.category ?? ''}
              onChange={(event) =>
                onUpdateSearch({
                  category: event.target.value || undefined,
                  page: 1,
                })
              }
            >
              <option value="">All categories</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Min price">
            <Input
              min="0"
              placeholder="0"
              step="0.01"
              type="number"
              value={urlSearch.minPrice === undefined ? '' : String(urlSearch.minPrice)}
              onChange={(event) =>
                onUpdateSearch({
                  minPrice: event.target.value === '' ? undefined : Number(event.target.value),
                  page: 1,
                })
              }
            />
          </Field>

          <Field label="Max price">
            <Input
              min="0"
              placeholder="Any"
              step="0.01"
              type="number"
              value={urlSearch.maxPrice === undefined ? '' : String(urlSearch.maxPrice)}
              onChange={(event) =>
                onUpdateSearch({
                  maxPrice: event.target.value === '' ? undefined : Number(event.target.value),
                  page: 1,
                })
              }
            />
          </Field>

          <Field label="Sort by">
            <Select
              value={urlSearch.sortBy}
              onChange={(event) =>
                onUpdateSearch({
                  sortBy: event.target.value as ProductSortField,
                  page: 1,
                })
              }
            >
              <option value="createdAt">Date added</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
              <option value="sku">SKU</option>
            </Select>
          </Field>

          <Field label="Order">
            <Select
              value={urlSearch.sortOrder}
              onChange={(event) =>
                onUpdateSearch({
                  sortOrder: event.target.value as ProductSortOrder,
                  page: 1,
                })
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </Select>
          </Field>
      </div>
    </div>
  );
}
