"use strict";

// Only used to speak to the existing local DEMKit HTTP API.
// This replaces the deprecated "request" package without new dependencies.
// The callback signature remains (error, response, body).
const http = require("http");

function requestWithMethod(method, target, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || {};
  if (typeof callback !== "function") {
    throw new TypeError("DEMKit HTTP callback is required");
  }

  const allowedHost = process.env.DEM_HOST || "localhost";
  const allowedPort = String(process.env.DEM_PORT || "3001");
  let parsed;

  try {
    parsed = new URL(target);
    // Restrict the client to exactly the configured DEMKit backend.
    // Students' desktop installations use 127.0.0.1:3001.
    const normalHost = (host) => host === "localhost" ? "127.0.0.1" : host;
    if (parsed.protocol !== "http:" ||
        normalHost(parsed.hostname) !== normalHost(allowedHost) ||
        (parsed.port || "80") !== allowedPort ||
        parsed.username || parsed.password) {
      throw new Error("DEMKit HTTP client rejected a non-backend destination");
    }
  } catch (error) {
    process.nextTick(() => callback(error, null, undefined));
    return null;
  }

  const sendJson = Object.prototype.hasOwnProperty.call(options, "json");
  const body = sendJson ? JSON.stringify(options.json) : null;
  const headers = {};
  if (sendJson) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = Buffer.byteLength(body);
    headers["Accept"] = "application/json";
  }

  let completed = false;
  const complete = (err, response, responseBody) => {
    if (completed) return;
    completed = true;
    callback(err, response, responseBody);
  };

  const req = http.request({
    protocol: "http:",
    hostname: normalHostname(parsed.hostname),
    port: Number(allowedPort),
    path: parsed.pathname + parsed.search,
    method,
    headers,
  }, (response) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("error", (error) => complete(error, response, undefined));
    response.on("end", () => {
      const responseText = Buffer.concat(chunks).toString("utf8");
      let responseBody = responseText;
      if (sendJson && responseText) {
        try {
          responseBody = JSON.parse(responseText);
        } catch (_) {
          // The inherited backend sometimes returns plain text.
        }
      }
      complete(null, response, responseBody);
    });
  });

  req.once("error", (error) => complete(error, null, undefined));
  if (Number.isFinite(options.timeout) && options.timeout > 0) {
    req.setTimeout(options.timeout, () => {
      const error = new Error("DEMKit HTTP request timed out");
      error.code = "ETIMEDOUT";
      req.destroy(error);
    });
  }
  if (body !== null) req.write(body);
  req.end();
  return req;
}

function normalHostname(host) {
  return host === "localhost" ? "127.0.0.1" : host;
}

function demkitRequest(target, options, callback) {
  return requestWithMethod("GET", target, options, callback);
}

demkitRequest.get = (target, options, callback) =>
  requestWithMethod("GET", target, options, callback);

demkitRequest.post = (target, options, callback) =>
  requestWithMethod("POST", target, options, callback);

module.exports = demkitRequest;
