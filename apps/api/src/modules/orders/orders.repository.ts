import { desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { orderItems, orders, payments, products } from '../../db/schema.js';

const orderSelect = {
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
  paymentId: payments.id,
  paymentAmount: payments.amount,
  paymentStatus: payments.status,
  cardLast4: payments.cardLast4,
  failureReason: payments.failureReason,
  paymentCreatedAt: payments.createdAt,
  paymentUpdatedAt: payments.updatedAt,
  paidAt: payments.paidAt,
};

export type OrderWithItemsRow = Awaited<ReturnType<OrdersRepository['list']>>[number];

export class OrdersRepository {
  constructor(private readonly db: Database) {}

  list() {
    return this.db
      .select(orderSelect)
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .leftJoin(payments, eq(payments.orderId, orders.id))
      .orderBy(desc(orders.createdAt), orderItems.id);
  }

  findWithItems(id: string) {
    return this.db
      .select(orderSelect)
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .leftJoin(payments, eq(payments.orderId, orders.id))
      .where(eq(orders.id, id))
      .orderBy(orderItems.id);
  }
}
