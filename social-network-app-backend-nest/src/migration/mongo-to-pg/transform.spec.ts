import {
  analyzeSource,
  countBlockingIssues,
  planPosts,
  planUsers,
} from './transform';
import type { MongoPostDoc, MongoUserDoc } from './types';

function user(partial: Partial<MongoUserDoc> & { _id: string }): MongoUserDoc {
  return {
    email: 'a@test.com',
    password: '$2a$12$abcdefghijklmnopqrstuv', // length ok for pattern check
    name: 'Alice',
    status: 'I am new!',
    ...partial,
    _id: { toString: () => partial._id },
  };
}

function post(
  partial: Partial<MongoPostDoc> & { _id: string; creator: string },
): MongoPostDoc {
  return {
    title: 'Hello World Title',
    content: 'Content that is long enough',
    imageUrl: 'images/abc-.jpg',
    ...partial,
    _id: { toString: () => partial._id },
    creator: { toString: () => partial.creator },
  };
}

describe('mongo-to-pg transform', () => {
  const cost12 =
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oQeG5Y5Y5Y5Yu';

  it('flags duplicate emails and orphans as blocking', () => {
    const users = [
      user({ _id: 'u1', email: 'Dup@Test.com', password: cost12 }),
      user({ _id: 'u2', email: 'dup@test.com', password: cost12 }),
    ];
    const posts = [
      post({ _id: 'p1', creator: 'missing' }),
      post({ _id: 'p2', creator: 'u1' }),
    ];

    const issues = analyzeSource(users, posts);
    expect(issues.duplicateEmails).toEqual([
      { email: 'dup@test.com', count: 2 },
    ]);
    expect(issues.orphanedCreatorPostIds).toEqual(['p1']);
    expect(countBlockingIssues(issues, false)).toBeGreaterThan(0);
  });

  it('plans normalized users and preserves hashes', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const planned = planUsers([
      user({
        _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
        email: '  MixEd@Example.COM ',
        password: cost12,
        name: 'Bob',
        status: 'Online',
        createdAt,
        updatedAt: createdAt,
      }),
    ]);

    expect(planned[0]).toMatchObject({
      mongoId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      email: 'mixed@example.com',
      password: cost12,
      name: 'Bob',
      status: 'Online',
      createdAt,
    });
  });

  it('plans posts with creator mongo ids', () => {
    const planned = planPosts([
      post({
        _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        creator: 'aaaaaaaaaaaaaaaaaaaaaaaa',
        title: 'Post Title Here',
      }),
    ]);
    expect(planned[0].creatorMongoId).toBe('aaaaaaaaaaaaaaaaaaaaaaaa');
    expect(planned[0].title).toBe('Post Title Here');
  });

  it('allows nonstandard hashes when opted in', () => {
    const issues = analyzeSource(
      [user({ _id: 'u1', password: '$2a$10$short' })],
      [],
    );
    expect(countBlockingIssues(issues, false)).toBe(1);
    expect(countBlockingIssues(issues, true)).toBe(0);
  });
});
