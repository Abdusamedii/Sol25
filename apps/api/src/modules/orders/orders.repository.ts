import { desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { orderItems, orders, products } from '../../db/schema.js';

export class OrdersRepository {
  constructor(private readonly db: Database) {}

  list() {
    return this.db
      .select({
        orderId: orders.id,
        userId: orders.userId,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        itemId: orderItems.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .orderBy(desc(orders.createdAt), orderItems.id);
  }

  findWithItems(id: string) {
    return this.db
      .select({
        orderId: orders.id,
        userId: orders.userId,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        itemId: orderItems.id,
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orders.id, id))
      .orderBy(orderItems.id);
  }
}
