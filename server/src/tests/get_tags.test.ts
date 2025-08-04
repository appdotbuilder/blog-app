
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { getTags } from '../handlers/get_tags';

describe('getTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getTags();

    expect(result).toEqual([]);
  });

  it('should return all tags', async () => {
    // Create test tags
    await db.insert(tagsTable)
      .values([
        { name: 'JavaScript' },
        { name: 'TypeScript' },
        { name: 'Node.js' }
      ])
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('JavaScript');
    expect(result[1].name).toEqual('TypeScript');
    expect(result[2].name).toEqual('Node.js');
    
    // Verify all tags have required fields
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(typeof tag.id).toBe('number');
      expect(tag.name).toBeDefined();
      expect(typeof tag.name).toBe('string');
      expect(tag.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return tags in creation order', async () => {
    // Create tags with slight delay to ensure different timestamps
    await db.insert(tagsTable)
      .values({ name: 'First Tag' })
      .execute();

    await db.insert(tagsTable)
      .values({ name: 'Second Tag' })
      .execute();

    const result = await getTags();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Tag');
    expect(result[1].name).toEqual('Second Tag');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
