import { faker } from '@faker-js/faker';
import { productCategories } from '@sol25/shared';
import { hashPassword } from '../lib/password.js';
import { createDatabase } from './index.js';
import { products, users } from './schema.js';

const PRODUCT_COUNT = 10_000;
const BATCH_SIZE = 500;

function buildProduct(index: number) {
  const price = Number(faker.commerce.price({ min: 1, max: 500, dec: 2 }));
  const createdAt = new Date(Date.UTC(2020, 0, 1) + index);

  return {
    name: faker.commerce.productName(),
    sku: `SKU-${String(index).padStart(6, '0')}`,
    price,
    stockQuantity: faker.number.int({ min: 0, max: 500 }),
    category: faker.helpers.arrayElement(productCategories),
    imageUrl: faker.image.url({ width: 640, height: 480 }),
    createdAt,
    updatedAt: createdAt,
  };
}

async function seedProducts(db: ReturnType<typeof createDatabase>['db'], client: ReturnType<typeof createDatabase>['client']) {
  await client`TRUNCATE order_items, products RESTART IDENTITY CASCADE`;

  for (let offset = 1; offset <= PRODUCT_COUNT; offset += BATCH_SIZE) {
    const batch = Array.from(
      { length: Math.min(BATCH_SIZE, PRODUCT_COUNT - offset + 1) },
      (_, batchIndex) => buildProduct(offset + batchIndex),
    );

    await db.insert(products).values(batch).onConflictDoNothing({ target: products.sku });
  }
}

async function seed() {
  const { client, db } = createDatabase();

  try {
    await db
      .insert(users)
      .values([
        { username: 'admin', passwordHash: hashPassword('admin'), role: 'admin' },
        { username: 'customer', passwordHash: hashPassword('customer'), role: 'customer' },
      ])
      .onConflictDoNothing({ target: users.username });

    console.log(`Seeding ${PRODUCT_COUNT} products...`);
    await seedProducts(db, client);
    console.log('Seed complete');
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
