
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type CreateTagInput } from '../schema';
import { createTag } from '../handlers/create_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTagInput = {
  name: 'Test Tag'
};

describe('createTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a tag', async () => {
    const result = await createTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save tag to database', async () => {
    const result = await createTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple tags with different names', async () => {
    const tag1 = await createTag({ name: 'JavaScript' });
    const tag2 = await createTag({ name: 'TypeScript' });

    expect(tag1.name).toEqual('JavaScript');
    expect(tag2.name).toEqual('TypeScript');
    expect(tag1.id).not.toEqual(tag2.id);

    // Verify both exist in database
    const allTags = await db.select().from(tagsTable).execute();
    expect(allTags).toHaveLength(2);
    
    const tagNames = allTags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['JavaScript', 'TypeScript']);
  });
});
