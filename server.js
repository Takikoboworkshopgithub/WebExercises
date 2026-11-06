const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const HOST = "127.0.0.1";
const PORT = 8000;

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".yaml": "text/yaml; charset=utf-8",
    ".yml": "text/yaml; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405);
        return res.end("Method Not Allowed");
    }

    let pathname;

    try {
        pathname = decodeURIComponent(
            new URL(req.url, "http://localhost").pathname
        );
    } catch {
        res.writeHead(400);
        return res.end("Bad Request");
    }

    // ルートへのアクセスはindex.htmlにする
    if (pathname === "/") {
        pathname = "/index.html";
    }

    const filePath = path.resolve(ROOT, "." + pathname);
    const relativePath = path.relative(ROOT, filePath);

    // ドキュメントルート外へのアクセスを拒否
    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404);
            return res.end("Not Found");
        }

        // ディレクトリへのアクセスはindex.htmlに誘導
        if (stats.isDirectory()) {
            if (!pathname.endsWith("/")) {
                res.writeHead(301, {
                    Location: pathname + "/"
                });
                return res.end();
            }

            return serveFile(
                path.join(filePath, "index.html"),
                req,
                res
            );
        }

        serveFile(filePath, req, res);
    });
});

function serveFile(filePath, req, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("Not Found");
        }

        const ext = path.extname(filePath);
        const contentType =
            mimeTypes[ext] || "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        });

        res.end(req.method === "HEAD" ? undefined : data);
    });
}

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log("Press Ctrl+C to stop the server.");
});
