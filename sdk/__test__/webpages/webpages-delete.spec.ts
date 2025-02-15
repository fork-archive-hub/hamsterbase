import { join } from 'path';
require('isomorphic-fetch');
import { HamsterBase } from '../../src/hamsterbase';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { Fixtures, getBase64Fixture, getPort, resolveRoot } from '../utils';
import { createTestServer } from '../server';
import { WebsiteExt } from '../../src/webpages/types';

describe('test webpages', () => {
  let hamsterbase: HamsterBase;
  let dispose: () => void;
  let port: number;
  beforeAll(() => {
    port = getPort();
  });

  beforeEach(async () => {
    const server = await createTestServer({
      port,
      database: join(resolveRoot('temp'), `${Math.random()}`),
    });
    hamsterbase = new HamsterBase({
      endpoint: server.endpoint,
      token: server.token,
      requestLib: fetch,
    });
    await hamsterbase.webpages.create({
      content: await getBase64Fixture(Fixtures.HamsterBaseDocument_01_mht),
      ext: WebsiteExt.mhtml,
    });
    dispose = server.dispose;
  });
  afterEach(async () => {
    await dispose();
  });

  it('001: should get webpage stat when delete', async () => {
    const webpage = await hamsterbase.webpages.get('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    const result = await hamsterbase.webpages.delete('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    expect(result).toEqual(webpage);
    try {
      await hamsterbase.webpages.delete('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    } catch (error: any) {
      expect(error.status).toBe(404);
      expect(error.message).toEqual('webpage not found');
    }
  });

  it('002: should throw not found error when delete multiple times', async () => {
    await hamsterbase.webpages.delete('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    try {
      await hamsterbase.webpages.delete('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    } catch (error: any) {
      expect(error.status).toBe(404);
      expect(error.message).toEqual('webpage not found');
    }
  });

  it('003: should throw error when id is empty', async () => {
    try {
      await hamsterbase.webpages.delete('');
    } catch (error: any) {
      expect(error.message).toEqual('invalid webpage id');
    }
  });

  it('004: should throw not found error when id is invalid', async () => {
    try {
      await hamsterbase.webpages.delete('123');
    } catch (error: any) {
      expect(error.status).toBe(404);
      expect(error.message).toEqual('webpage not found');
    }
  });

  it('005: should ignore params when upload a deleted webpage', async () => {
    await hamsterbase.webpages.delete('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    const result = await hamsterbase.webpages.create({
      content: await getBase64Fixture(Fixtures.HamsterBaseDocument_01_mht),
      ext: WebsiteExt.mhtml,
      title: 'new title',
    });
    expect(result).toContain({
      id: 'bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f',
      link: 'https://hamsterbase.com/docs/what-is-hamsterbase.html',
      title: 'What is HamsterBase | HamsterBase',
    });
  });

  it('006: should update properties when ext are changed, even if the page is deleted', async () => {
    await hamsterbase.webpages.delete('bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f');
    const result = await hamsterbase.webpages.create({
      content: await getBase64Fixture(Fixtures.HamsterBaseDocument_01_mht),
      ext: WebsiteExt.html,
      title: 'new title',
      link: 'https://hamsterbase.com',
    });
    expect(result).toContain({
      id: 'bcf1e35729685a87ce18733080eaf0f80fec0c81a5a4608ef5b3f0272a37851f',
      link: 'https://hamsterbase.com',
      title: 'new title',
    });
  });
});
