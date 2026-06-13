import { eq } from 'drizzle-orm';
import type { CreateProductInput, UpdateProductInput } from '@sol25/shared';
import type { Database } from '../../db/index.js';
import { products } from '../../db/schema.js';

export class ProductsRepository {
  constructor(private readonly db: Database) {}

  list() {
    return this.db.select().from(products).orderBy(products.name);
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
