import type { PaginatedProducts, Product, ProductListQueryInput } from '@sol25/shared';
import { ChevronLeft, ChevronRight, Package, ShoppingCart } from 'lucide-react';
import { memo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { addToCart } from '../lib/cart';
import { Button } from './ui/Button';

type ProductResultsProps = {
  query: ProductListQueryInput;
  hasActiveFilters: boolean;
  page: number;
  onPageChange: (page: number) => void;
};

function ProductResultsComponent({ query, hasActiveFilters, page, onPageChange }: ProductResultsProps) {
  const products = useProducts(query);
  const isInitialLoad = products.isPending && !products.data;

  if (isInitialLoad) {
    return (
      <div className="rounded-lg bg-background p-12 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-muted text-primary">
          <Package className="h-7 w-7 animate-pulse" strokeWidth={2.5} />
        </span>
        <p className="font-semibold text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (products.isError) {
    return (
      <div className="rounded-lg bg-background p-8">
        <p className="font-semibold text-error">{products.error.message}</p>
      </div>
    );
  }

  const { data, total, totalPages } = products.data as PaginatedProducts;

  return (
    <div
      className={`grid gap-6 ${products.isFetching ? 'pointer-events-none opacity-70 transition-opacity duration-200' : ''}`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          Showing <span className="text-foreground">{data.length}</span> of{' '}
          <span className="text-primary">{total}</span> products
          {products.isFetching ? ' · Updating...' : ''}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg bg-background p-12 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Package className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <p className="font-semibold">
            {hasActiveFilters
              ? 'No products match your search or filters.'
              : 'No products yet. Add sample products through the API.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-background p-4">
          <Button
            variant="secondary"
            type="button"
            className="h-12 gap-2 px-4"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const cardTints = ['bg-blue-50', 'bg-emerald-50', 'bg-amber-50'] as const;

function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stockQuantity <= 0;
  const tint = cardTints[product.name.length % cardTints.length];

  return (
    <article
      className={`group grid gap-4 rounded-lg ${tint} p-6 transition-all duration-200 hover:scale-[1.02]`}
    >
      {product.imageUrl ? (
        <img
          className="h-44 w-full rounded-md object-cover"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
      ) : (
        <div className="flex h-44 items-center justify-center rounded-md bg-white">
          <Package className="h-12 w-12 text-primary transition-transform duration-200 group-hover:scale-110" strokeWidth={2.5} />
        </div>
      )}

      <div>
        <h3 className="text-xl font-extrabold tracking-tight">{product.name}</h3>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{product.sku}</p>
      </div>

      <dl className="m-0 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Category</dt>
          <dd className="mt-1 m-0 font-semibold">{product.category}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Price</dt>
          <dd className="mt-1 m-0 text-lg font-extrabold text-primary">${product.price.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Stock</dt>
          <dd className={`mt-1 m-0 font-semibold ${isOutOfStock ? 'text-error' : 'text-secondary'}`}>
            {product.stockQuantity}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        disabled={isOutOfStock}
        onClick={() => addToCart(product)}
        className="mt-auto inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
        {isOutOfStock ? 'Out of stock' : 'Add to cart'}
      </button>
    </article>
  );
}

export const ProductResults = memo(ProductResultsComponent);
