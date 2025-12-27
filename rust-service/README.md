# Rust Service (Axum)

A minimal Rust microservice that exposes a single endpoint.

## Endpoint
- `GET /api/rust/hello` → `{ service: "rust", status: "ok", time: <unix> }`

## Run
```bash
cd rust-service
cargo run
```
Service listens on `http://127.0.0.1:8000`.

## Notes
- CORS is enabled to allow calls from your frontend and Express backend.
- You can proxy this endpoint from Express to keep a single API base.
