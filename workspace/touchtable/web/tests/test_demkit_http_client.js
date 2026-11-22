"use strict";

// Run: node tests/test_demkit_http_client.js
// Uses a temporary loopback mock, not a live DEMKit simulation.
const assert = require("assert");
const http = require("http");
const request = require("../demkitHttpClient");

function invoke(fn, url, options) {
  return new Promise((resolve) => {
    const cb = (error, response, body) => resolve({ error, response, body });
    if (options === undefined) fn(url, cb);
    else fn(url, options, cb);
  });
}

async function main() {
  let requestsSeen = 0;
  const server = http.createServer(async (req, res) => {
    requestsSeen++;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    if (req.url === "/tick") {
      assert.strictEqual(req.method, "GET");
      assert.deepStrictEqual(JSON.parse(body), { clientId: "student" });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ tick: 42 }));
    } else if (req.url === "/synccmds") {
      assert.strictEqual(req.method, "POST");
      assert.deepStrictEqual(JSON.parse(body), [{ cmd: "hello" }]);
      res.statusCode = 202;
      res.end(JSON.stringify({ ok: true }));
    } else if (req.url === "/plain") {
      res.end("plain text");
    } else if (req.url === "/failed") {
      res.statusCode = 503;
      res.end("Backend unavailable");
    } else if (req.url === "/slow") {
      setTimeout(() => {
        if (!res.writableEnded) res.end("too late");
      }, 200);
    } else {
      res.statusCode = 404;
      res.end("not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.DEM_HOST = "127.0.0.1";
  process.env.DEM_PORT = String(server.address().port);
  const base = "http://127.0.0.1:" + process.env.DEM_PORT + "/";

  try {
    const plain = await invoke(request.get, base + "plain");
    assert.ifError(plain.error);
    assert.strictEqual(plain.response.statusCode, 200);
    assert.strictEqual(plain.body, "plain text");

    const posted = await invoke(request.post, base + "synccmds", { json: [{ cmd: "hello" }] });
    assert.ifError(posted.error);
    assert.strictEqual(posted.response.statusCode, 202);
    assert.deepStrictEqual(posted.body, { ok: true });

    const tick = await invoke(request, base + "tick", { json: { clientId: "student" } });
    assert.ifError(tick.error);
    assert.deepStrictEqual(tick.body, { tick: 42 });

    const unavailable = await invoke(request.get, base + "failed");
    assert.ifError(unavailable.error);
    assert.strictEqual(unavailable.response.statusCode, 503);
    assert.strictEqual(unavailable.body, "Backend unavailable");

    const before = requestsSeen;
    const forbidden = await invoke(request.get, "http://example.com:3001/private");
    assert(forbidden.error);
    assert.strictEqual(forbidden.response, null);
    assert.strictEqual(requestsSeen, before);

    const timedOut = await invoke(request.get, base + "slow", { timeout: 30 });
    assert(timedOut.error);
    assert.strictEqual(timedOut.error.code, "ETIMEDOUT");

    console.log("DEMKit HTTP adapter: 6 local tests passed.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
