import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import net from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';

const root = fileURLToPath(new URL('../', import.meta.url));
const fields = (row) => Object.keys(row).sort();
const articleFields = ['content', 'createdAt', 'id', 'title'];
const commentFields = ['content', 'createdAt', 'id'];
const productFields = ['createdAt', 'description', 'id', 'name', 'price', 'tags'];

async function availablePort() {
    const listener = net.createServer();
    try {
        listener.listen(0, '127.0.0.1');
        await once(listener, 'listening');
        return listener.address().port;
    } finally {
        await new Promise((done) => listener.close(done));
    }
}

function expectDate(value) {
    assert.equal(typeof value, 'string');
    assert.ok(Number.isFinite(Date.parse(value)), 'Expected an ISO date');
}

test('Mission 6 — isolated PostgreSQL database and real HTTP server', { timeout: 150_000 }, async (t) => {
    assert.ok(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to a dedicated PostgreSQL test database');
    const url = new URL(process.env.TEST_DATABASE_URL);
    assert.ok(['postgres:', 'postgresql:'].includes(url.protocol), 'TEST_DATABASE_URL must use PostgreSQL');
    const schema = 'panda_test_' + randomUUID().replaceAll('-', '');
    // 테스트 전용 스키마
    const admin = new PrismaClient({ datasourceUrl: url.href });
    url.searchParams.set('schema', schema);
    const env = { ...process.env, DATABASE_URL: url.href, DIRECT_URL: url.href };
    const db = new PrismaClient({ datasourceUrl: url.href });
    const sentinel = randomUUID();
    let createdSchema = false;
    let server;
    let base;
    let marker;

    async function stopServer() {
        if (!server || server.exitCode !== null || server.signalCode !== null) return;
        const done = once(server, 'exit');
        server.kill();
        await done;
    }

    t.after(async () => {
        try {
            await stopServer();
            await db.$disconnect();
            if (createdSchema) await admin.$executeRawUnsafe('DROP SCHEMA "' + schema + '" CASCADE');
        } finally {
            await admin.$disconnect();
        }
    });

    async function runTool(...args) {
        const process = spawn(globalThis.process.execPath, args, {
            cwd: root, env, windowsHide: true, stdio: 'ignore', timeout: 60_000,
        });
        const [code] = await once(process, 'exit');
        assert.equal(code, 0, 'The local tool failed: ' + args.map((v) => v.split(/[\\/]/).pop()).join(' '));
    }

    async function startServer() {
        const port = await availablePort();
        base = 'http://127.0.0.1:' + port;
        server = spawn(process.execPath, ['index.js'], {
            cwd: root, env: { ...env, PORT: String(port) }, windowsHide: true, stdio: 'ignore',
        });
        await once(server, 'spawn');
        const deadline = Date.now() + 12_000;
        while (Date.now() < deadline && server.exitCode === null) {
            try {
                const response = await fetch(base + '/articles/' + marker.id, {signal: AbortSignal.timeout(1000)});
                if (response.ok && (await response.json()).title === sentinel) return;
            } catch (error) {
                if (!(error instanceof TypeError) && error.name !== 'TimeoutError') throw error;
            }
            await delay(75);
        }
        throw new Error('The server did not return the identifying article from this test schema');
    }

    async function request(method, path, status, body) {
        const options = { method, signal: AbortSignal.timeout(6000) };
        if (body !== undefined) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        const result = await fetch(base + path, options);
        assert.equal(result.status, status, method + ' ' + path);
        const text = await result.text();
        if (status === 204) {
            assert.equal(text, '');
            return;
        }
        assert.match(result.headers.get('content-type') || '', /application\/json/);
        return JSON.parse(text);
    }
    const item = (name) => ({ name, description: 'portable item', price: 120, tags: ['sale'] });
    const addArticle = (title, content = 'article text') => request('POST', '/articles', 201, { title, content });
    const addProduct = (name) => request('POST', '/products', 201, item(name));

    await admin.$executeRawUnsafe('CREATE SCHEMA "' + schema + '"');
    createdSchema = true;
    await runTool(resolve(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy');
    marker = await db.article.create({ data: { title: sentinel, content: 'schema marker' } });
    await startServer();

    await t.test('seed is repeatable, preserves user records, covers both parents, and survives restart', async () => {
        const sample = await addProduct('user' + sentinel.slice(0, 5));
        const counts = () => Promise.all([
            db.product.count(), db.article.count(),
            db.comment.count({ where: { productId: { not: null } } }),
            db.comment.count({ where: { articleId: { not: null } } }),
        ]);
        const before = await counts();
        await runTool('seeding/seed.js');
        const first = await counts();
        assert.ok(first.every((n, i) => n > before[i]), 'Seed must supply products, articles, and comments for each parent');
        await runTool('seeding/seed.js');
        assert.deepEqual(await counts(), first);
        await stopServer();
        await startServer();
        assert.equal((await request('GET', '/products/' + sample.id, 200)).name, sample.name);
        assert.deepEqual(await counts(), first);
    });

    await t.test('legacy products — fields, case-insensitive search, offset, zero price, partial update, deletion', async () => {
        const word = 'Pine' + sentinel.slice(0, 5);
        const first = await addProduct(word);
        const second = await request('POST', '/products', 201, { ...item('second'), description: word + ' for sale' });
        assert.deepEqual(fields(first), productFields);
        expectDate(first.createdAt);
        const path = '/products/' + first.id;
        assert.deepEqual(await request('GET', path, 200), first);
        const qry = '/products?orderBy=recent&keyword=' + word.toLowerCase() + '&limit=1&offset=';
        const head = await request('GET', qry + '0', 200);
        const tail = await request('GET', qry + '1', 200);
        assert.equal(head.totalCount, 2);
        assert.deepEqual(fields(head.list[0]), ['createdAt', 'id', 'name', 'price']);
        assert.deepEqual(head.list.map((p) => p.id), [second.id]);
        assert.deepEqual(tail.list.map((p) => p.id), [first.id]);
        const patched = await request('PATCH', path, 200, {price: 0});
        assert.equal(patched.price, 0);
        assert.equal(patched.name, first.name);
        assert.deepEqual(patched.tags, first.tags);
        assert.equal(patched.createdAt, first.createdAt);
        assert.equal((await request('GET', path, 200)).price, 0);
        await request('DELETE', path, 204);
        await request('GET', path, 404);
        await request('PATCH', path, 404, {price: 1});
        await request('DELETE', path, 404);
    });


    await t.test('mission 5 registration, health and CORS', async () => {
        const plain = await request('POST', '/products', 201, { ...item('form item'), price: '120' });
        assert.deepEqual(fields(plain), productFields);
        assert.equal(plain.price, 120);
        assert.equal(typeof plain.id, 'string');
        assert.deepEqual(await request('GET', '/health', 200), { connected: true });
        const preflight = await fetch(base + '/products', {method:'OPTIONS', headers:{
            'Origin':'http://localhost:5173', 'Access-Control-Request-Method':'POST',
            'Access-Control-Request-Headers':'Content-Type',
        }});
        assert.equal(preflight.status, 204);
        assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173');
        assert.match(preflight.headers.get('access-control-allow-methods') || '', /POST/);
    });

    await t.test('articles — exact read fields, keyword in title or content, latest first, offset and last page', async () => {
        const a = await addArticle('Orange' + sentinel);
        const b = await addArticle('second article', 'Orange' + sentinel);
        await db.article.updateMany({where: {id: {in: [a.id, b.id]}}, data: {createdAt: new Date('2025-01-01T00:00:00Z')}});
        const url = '/articles/' + a.id;
        const row = await request('GET', url, 200);
        assert.deepEqual(fields(row), articleFields);
        expectDate(row.createdAt);
        assert.equal(row.title, a.title);
        const query = '/articles?orderBy=recent&word=orange' + sentinel + '&take=1&skip=';
        for (const [offset, ids] of [[0, [b.id]], [1, [a.id]], [2, []]]) {
            const page = await request('GET', query + offset, 200);
            assert.equal(page.count, 2);
            assert.deepEqual(page.data.map((article) => article.id), ids);
            page.data.forEach((article) => assert.deepEqual(fields(article), articleFields));
        }
        const special = await addArticle('100%_of_' + sentinel);
        const literal = encodeURIComponent('%_of_' + sentinel);
        const plain = await addArticle('100xxofx' + sentinel);
        assert.notEqual(plain.id, special.id);
        const matched = await request('GET', '/articles?keyword=' + literal, 200);
        assert.equal(matched.count, 1);
        assert.equal(matched.data[0].id, special.id);
        await request('PATCH', url, 200, {content: 'new article text'});
        assert.deepEqual(await request('GET', url, 200), {...row, content: 'new article text'});
        await request('DELETE', url, 204);
        await request('GET', url, 404);
        await request('PATCH', url, 404, {title: 'missing'});
        await request('DELETE', url, 404);
    });

    await t.test('comments — isolated product/article lists, stable successive cursors, edit/delete and scoped cascading deletion', async () => {
        const product = await addProduct('parent');
        const article = await addArticle('parent');
        const productPath = '/products/' + product.id;
        const articlePath = '/articles/' + article.id;
        const byPath = new Map();
        for (const path of [productPath, articlePath]) {
            const thread = path + '/comments';
            assert.deepEqual((await request('GET', thread, 200)).list, []);
            const ids = [];
            for (const msg of ['first','second','third']) {
                const added = await request('POST', thread, 201, {content: msg});
                ids.push(added.id);
            }
            byPath.set(path, ids);
            const page1 = await request('GET', thread + '?limit=2', 200);
            assert.deepEqual(page1.list.map((c) => c.id), [ids[2],ids[1]]);
            for (const c of page1.list) {assert.deepEqual(fields(c), commentFields); expectDate(c.createdAt);}
            assert.equal(String(page1.nextCursor), String(ids[1]));
            await request('POST', thread, 201, {content: 'arrived after first page'});
            const page2 = await request('GET', thread + '?limit=2&cursor=' + page1.nextCursor, 200);
            assert.deepEqual(page2.list.map((c) => c.id), [ids[0]]);
            assert.equal(page2.nextCursor, null);
            const commentPath = '/comments/' + ids[1];
            await request('PATCH', commentPath, 200, {content:'edited'});
            const edited = (await request('GET', thread, 200)).list.find((c) => c.id === ids[1]);
            assert.equal(edited.content, 'edited');
            await request('DELETE', commentPath, 204);
            const afterRemoval = await request('GET', thread + '?limit=2&cursor=' + ids[1], 200);
            assert.deepEqual(afterRemoval.list.map((c) => c.id), [ids[0]]);
            await request('PATCH', commentPath, 404, {content:'missing'});
            await request('DELETE', commentPath, 404);
        }
        for (const parents of [{}, {articleId: article.id, productId: Number(product.id)}]) {
            await assert.rejects(db.comment.create({data: {content: 'invalid owner', ...parents}}),
                (error) => error.code === 'P2004' || /check constraint|23514/i.test(error.message));
        }
        const productComment = byPath.get(productPath)[0];
        const articleComment = byPath.get(articlePath)[0];
        await request('GET', articlePath + '/comments?cursor=' + productComment, 400);
        await request('GET', productPath + '/comments?cursor=' + articleComment, 400);
        await request('DELETE', productPath, 204);
        await request('GET', productPath + '/comments', 404);
        await request('POST', productPath + '/comments', 404, {content:'orphan'});
        await request('PATCH', '/comments/' + productComment, 404, {content:'gone'});
        assert.ok((await request('GET', articlePath + '/comments', 200)).list.some((c) => c.id === articleComment));
        await request('DELETE', articlePath, 204);
        await request('GET', articlePath + '/comments', 404);
        await request('POST', articlePath + '/comments', 404, {content:'orphan'});
        await request('DELETE', '/comments/' + articleComment, 404);
    });

    await t.test('invalid inputs return client errors through every route', async () => {
        for (const path of ['/products','/articles']) {
            await request('GET', path + '/invalid', 400);
            await request('GET', path + '/1x', 400);
            await request('GET', path + '?offset=-1', 400);
            await request('GET', path + '?limit=2x', 400);
            await request('GET', path + '?orderBy=wrong', 400);
        }
        await request('POST', '/products', 400, {...item('bad price'),price:-1});
        await request('POST', '/articles', 400, {title:'missing content'});
        await request('PATCH', '/articles/' + marker.id, 400, {});
        await request('POST', '/articles/' + marker.id + '/comments', 400, {content:' '});
        await request('GET', '/articles/' + marker.id + '/comments?cursor=1x', 400);
        await request('GET', '/articles/' + marker.id + '/comments?limit=0', 400);
        await request('PATCH', '/comments/x', 400, {content:'x'});
        await request('DELETE', '/comments/0', 400);
        await request('GET', '/articles/2147483648', 400);
        const malformed = await fetch(base + '/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{"title":',
            signal: AbortSignal.timeout(6000),
        });
        assert.equal(malformed.status, 400);
        assert.match(malformed.headers.get('content-type') || '', /application\/json/);
        for (const headers of [
            { 'Content-Type': 'application/json; charset=iso-8859-1' },
            { 'Content-Type': 'application/json', 'Content-Encoding': 'unknown' },
        ]) {
            const unsupported = await fetch(base + '/articles', {
                method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(6000),
            });
            assert.equal(unsupported.status, 415);
            assert.equal((await unsupported.json()).name, 'Unsupported media type');
        }
        await request('GET', '/missing-route', 404);
    });
});
