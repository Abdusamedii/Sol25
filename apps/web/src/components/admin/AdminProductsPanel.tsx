import { productCategories } from '@sol25/shared';
import type { Product } from '@sol25/shared';
import { Pencil, Plus, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '../../hooks/useAdminProducts';
import { useProducts } from '../../hooks/useProducts';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Input';

type ProductFormState = {
  name: string;
  sku: string;
  price: string;
  stockQuantity: string;
  category: string;
  imageUrl: string;
};

const emptyForm: ProductFormState = {
  name: '',
  sku: '',
  price: '',
  stockQuantity: '0',
  category: productCategories[0] ?? 'Grocery',
  imageUrl: '',
};

const productPageLimit = 20;
const fieldLabelClassName = 'text-white/80';

function toForm(product: Product): ProductFormState {
  return {
    name: product.name,
    sku: product.sku,
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
    category: product.category,
    imageUrl: product.imageUrl ?? '',
  };
}

export function AdminProductsPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();

    if (trimmed === debouncedQuery) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput, debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const productQuery = useMemo(
    () => ({
      page,
      limit: productPageLimit,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      q: debouncedQuery || undefined,
    }),
    [debouncedQuery, page],
  );

  const products = useProducts(productQuery);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const isSaving = createProduct.isPending || updateProduct.isPending;

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
    };

    try {
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, input: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }

      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      await deleteProduct.mutateAsync(id);

      if (editingId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed');
    }
  }

  const list = products.data?.data ?? [];
  const totalPages = products.data?.totalPages ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="h-fit rounded-lg bg-primary p-6 sm:p-8 lg:sticky lg:top-28">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-primary">
            {editingId ? <Pencil className="h-5 w-5" strokeWidth={2.5} /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">
              {editingId ? 'Edit product' : 'New product'}
            </p>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              {editingId ? 'Update item' : 'Add item'}
            </h2>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Name" labelClassName={fieldLabelClassName}>
            <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="SKU" labelClassName={fieldLabelClassName}>
            <Input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
          </Field>
          <Field label="Price" labelClassName={fieldLabelClassName}>
            <Input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </Field>
          <Field label="Stock" labelClassName={fieldLabelClassName}>
            <Input
              required
              min="0"
              type="number"
              value={form.stockQuantity}
              onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
            />
          </Field>
          <Field label="Category" labelClassName={fieldLabelClassName}>
            <Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Image URL" labelClassName={fieldLabelClassName}>
            <Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          </Field>

          {error ? <p className="rounded-md bg-white/10 p-3 text-sm text-white">{error}</p> : null}

          <div className="grid gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-semibold text-primary transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
            </button>
            {editingId ? (
              <Button type="button" variant="secondary" className="h-12" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg bg-background p-6 sm:p-8">
        <p className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Inventory</p>
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight">Products</h2>

        <div className="mb-6 grid gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-md border-0 bg-muted pr-4 pl-12 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search by name or SKU..."
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          {products.data ? (
            <p className="text-sm font-semibold text-muted-foreground">
              Showing <span className="text-foreground">{products.data.data.length}</span> of{' '}
              <span className="text-primary">{products.data.total}</span> products
              {products.isFetching ? ' · Updating...' : ''}
            </p>
          ) : null}
        </div>

        {products.isPending && !products.data ? (
          <p className="font-semibold text-muted-foreground">Loading products...</p>
        ) : products.isError ? (
          <p className="font-semibold text-error">{products.error.message}</p>
        ) : (
          <div
            className={`grid gap-3 ${products.isFetching ? 'pointer-events-none opacity-70 transition-opacity duration-200' : ''}`}
          >
            {list.length === 0 ? (
              <div className="rounded-lg bg-muted p-8 text-center">
                <p className="font-semibold">
                  {debouncedQuery ? 'No products match your search.' : 'No products yet.'}
                </p>
              </div>
            ) : (
              list.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col gap-4 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <strong className="block text-lg font-bold">{product.name}</strong>
                    <p className="text-sm text-muted-foreground">
                      {product.sku} · {product.category}
                    </p>
                    <p className="mt-2 font-extrabold text-primary">
                      ${product.price.toFixed(2)} · Stock {product.stockQuantity}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(product.id);
                        setForm(toForm(product));
                        setError(null);
                      }}
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-background px-4 text-sm font-semibold transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-white"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2.5} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(product.id)}
                      disabled={deleteProduct.isPending}
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-background px-4 text-sm font-semibold text-error transition-all duration-200 hover:scale-105 hover:bg-error hover:text-white disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg bg-muted p-4">
            <Button
              variant="secondary"
              type="button"
              className="h-12 gap-2 px-4"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              Previous
            </Button>
            <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              type="button"
              className="h-12 gap-2 px-4"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
