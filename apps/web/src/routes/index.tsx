import { createFileRoute, Link } from '@tanstack/react-router';
import { useProducts } from '../hooks/useProducts';

export const Route = createFileRoute('/')({
  component: ProductListPage,
});

function ProductListPage() {
  const products = useProducts();

  if (products.isPending) {
    return <section className="panel">Loading products...</section>;
  }

  if (products.isError) {
    return <section className="panel error">{products.error.message}</section>;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Products</p>
          <h2>Available stock</h2>
        </div>
        <Link to="/order" className="button">
          Create order
        </Link>
      </div>

      {products.data.length === 0 ? (
        <div className="empty-state">No products yet. Add sample products through the API.</div>
      ) : (
        <div className="product-grid">
          {products.data.map((product) => (
            <article key={product.id} className="product-card">
              {product.imageUrl ? (
                <img className="product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
              ) : null}
              <div>
                <h3>{product.name}</h3>
                <p>{product.sku}</p>
              </div>
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{product.category}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>${product.price.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Stock</dt>
                  <dd>{product.stockQuantity}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
