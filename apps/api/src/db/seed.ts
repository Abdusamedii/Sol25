import { hashPassword } from '../lib/password.js';
import { createDatabase } from './index.js';
import { products, users } from './schema.js';

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

    await db
      .insert(products)
      .values([
        {
          name: 'Coffee Beans',
          sku: 'COFFEE-1',
          price: 12.5,
          stockQuantity: 25,
          category: 'Grocery',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
        },
        {
          name: 'Ceramic Mug',
          sku: 'MUG-1',
          price: 8,
          stockQuantity: 40,
          category: 'Kitchen',
          imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
        },
        {
          name: 'Notebook',
          sku: 'NOTE-1',
          price: 5.75,
          stockQuantity: 60,
          category: 'Stationery',
          imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57',
        },
      ])
      .onConflictDoNothing({ target: products.sku });

    console.log('Seed complete');
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
