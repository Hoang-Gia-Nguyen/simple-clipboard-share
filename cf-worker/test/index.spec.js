import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Quick Note worker — Password Auth', () => {
  const VALID_SECRET = env.EXPECTED_SECRET || 'test-secret';
  const INVALID_SECRET = 'wrong-password';

  it('serves HTML page on GET /', async () => {
    const request = new Request('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
  });

  it('serves HTML page on any non-special path', async () => {
    const request = new Request('http://example.com/some-random-path');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
  });

  it('returns 401 for /auth with wrong password', async () => {
    const fd = new FormData();
    fd.append('password', INVALID_SECRET);
    const request = new Request('http://example.com/auth', {
      method: 'POST',
      body: fd
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it('returns 200 + note content for /auth with correct password', async () => {
    const fd = new FormData();
    fd.append('password', VALID_SECRET);
    const request = new Request('http://example.com/auth', {
      method: 'POST',
      body: fd
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
  });

  it('returns 401 for /save without auth header', async () => {
    const fd = new FormData();
    fd.append('text', 'test content');
    const request = new Request('http://example.com/save', {
      method: 'POST',
      body: fd
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it('returns 401 for /save with wrong password in auth header', async () => {
    const fd = new FormData();
    fd.append('text', 'test content');
    const request = new Request('http://example.com/save', {
      method: 'POST',
      body: fd,
      headers: { 'Authorization': 'Bearer ' + INVALID_SECRET }
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it('can save and load content with correct auth', async () => {
    // Save
    const saveFd = new FormData();
    saveFd.append('text', 'Hello World');
    const saveReq = new Request('http://example.com/save', {
      method: 'POST',
      body: saveFd,
      headers: { 'Authorization': 'Bearer ' + VALID_SECRET }
    });
    const saveCtx = createExecutionContext();
    const saveRes = await worker.fetch(saveReq, env, saveCtx);
    await waitOnExecutionContext(saveCtx);
    expect(saveRes.status).toBe(200);

    // Load via /auth
    const authFd = new FormData();
    authFd.append('password', VALID_SECRET);
    const authReq = new Request('http://example.com/auth', {
      method: 'POST',
      body: authFd
    });
    const authCtx = createExecutionContext();
    const authRes = await worker.fetch(authReq, env, authCtx);
    await waitOnExecutionContext(authCtx);
    expect(authRes.status).toBe(200);
    expect(await authRes.text()).toBe('Hello World');
  });

  it('returns 405 for GET /auth', async () => {
    const request = new Request('http://example.com/auth');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(405);
  });

  it('returns 405 for GET /save', async () => {
    const request = new Request('http://example.com/save');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(405);
  });

  it('handles OPTIONS request', async () => {
    const request = new Request('http://example.com/', { method: 'OPTIONS' });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it('returns 500 when EXPECTED_SECRET is not set', async () => {
    const emptyEnv = { ...env, EXPECTED_SECRET: undefined };
    const request = new Request('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, emptyEnv, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("EXPECTED_SECRET");
  });
});
