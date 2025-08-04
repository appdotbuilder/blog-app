
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Technology',
  slug: 'technology'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Technology');
    expect(result.slug).toEqual('technology');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Technology');
    expect(categories[0].slug).toEqual('technology');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different category names and slugs', async () => {
    const inputs = [
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Machine Learning', slug: 'machine-learning' },
      { name: 'DevOps', slug: 'devops' }
    ];

    for (const input of inputs) {
      const result = await createCategory(input);
      expect(result.name).toEqual(input.name);
      expect(result.slug).toEqual(input.slug);
      expect(result.id).toBeDefined();
    }

    // Verify all categories were saved
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(3);
  });
});
