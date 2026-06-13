import type { CreateProductInput, Product, UpdateProductInput } from '@sol25/shared';
import type { ProductRow } from '../../db/schema.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { ProductsRepository } from './products.repository.js';

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: row.price,
    stockQuantity: row.stockQuantity,
    category: row.category,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async list() {
    const rows = await this.productsRepository.list();
    return rows.map(toProduct);
  }

  async findById(id: string) {
    const row = await this.productsRepository.findById(id);

    if (!row) {
      throw new NotFoundError('Product not found');
    }

    return toProduct(row);
  }

  async create(input: CreateProductInput) {
    try {
      const row = await this.productsRepository.create(input);

      if (!row) {
        throw new Error('Product creation failed');
      }

      return toProduct(row);
    } catch (error) {
      if (error instanceof Error && error.message.includes('products_sku_unique')) {
        throw new ConflictError('Product sku already exists');
      }

      throw error;
    }
  }

  async update(id: string, input: UpdateProductInput) {
    const row = await this.productsRepository.update(id, input);

    if (!row) {
      throw new NotFoundError('Product not found');
    }

    return toProduct(row);
  }

  async delete(id: string) {
    const row = await this.productsRepository.delete(id);

    if (!row) {
      throw new NotFoundError('Product not found');
    }

    return toProduct(row);
  }
}
