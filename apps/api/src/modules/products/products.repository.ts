import { and, asc, count, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from '@sol25/shared';
import type { Database } from '../../db/index.js';
import { products } from '../../db/schema.js';

const sortColumns = {
  createdAt: products.createdAt,
  price: products.price,
  name: products.name,
  sku: products.sku,
} as const;

function buildWhereClause(query: ProductListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q?.trim()) {
    const searchTerm = query.q.trim();
    const pattern = `%${searchTerm}%`;

    conditions.push(sql`(
      ${products.name} ILIKE ${pattern}
      OR ${products.sku} ILIKE ${pattern}
      OR (char_length(${searchTerm}) >= 3 AND ${products.name} % ${searchTerm})
    )`);
  }

  if (query.category) {
    conditions.push(eq(products.category, query.category));
  }

  if (query.minPrice !== undefined) {
    conditions.push(gte(products.price, query.minPrice));
  }

  if (query.maxPrice !== undefined) {
    conditions.push(lte(products.price, query.maxPrice));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function buildOrderBy(query: ProductListQuery) {
  const direction = query.sortOrder === 'desc' ? desc : asc;
  const sortColumn = sortColumns[query.sortBy];
  const orderBy: SQL[] = [];

  if (query.q?.trim()) {
    const searchTerm = query.q.trim();
    const pattern = `%${searchTerm}%`;

    orderBy.push(
      sql`GREATEST(
        word_similarity(${searchTerm}, ${products.name}),
        CASE WHEN ${products.sku} ILIKE ${pattern} THEN 1 ELSE 0 END
      ) DESC`,
    );
  }

  orderBy.push(direction(sortColumn), asc(products.id));

  return orderBy;
}

export class ProductsRepository {
  constructor(private readonly db: Database) {}

  async listPaginated(query: ProductListQuery) {
    const offset = (query.page - 1) * query.limit;
    const whereClause = buildWhereClause(query);
    const orderBy = buildOrderBy(query);

    const [rows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(query.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(products).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totalResult[0]?.total ?? 0),
    };
  }

  findById(id: string) {
    return this.db.query.products.findFirst({
      where: eq(products.id, id),
    });
  }

  async create(input: CreateProductInput) {
    const [product] = await this.db.insert(products).values(input).returning();
    return product;
  }

  async update(id: string, input: UpdateProductInput) {
    const [product] = await this.db
      .update(products)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return product;
  }

  async delete(id: string) {
    const [product] = await this.db.delete(products).where(eq(products.id, id)).returning();
    return product;
  }
}
