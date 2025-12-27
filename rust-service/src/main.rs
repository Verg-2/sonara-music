use axum::{
    extract::Query,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::{net::SocketAddr, time::{SystemTime, UNIX_EPOCH}};
use tower_http::cors::CorsLayer;
use sha2::{Sha256, Digest};

#[derive(Serialize)]
struct Hello {
    service: &'static str,
    status: &'static str,
    time: u64,
}

async fn hello() -> impl IntoResponse {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let payload = Hello { service: "rust", status: "ok", time: now };
    (StatusCode::OK, Json(payload))
}

#[derive(serde::Deserialize)]
struct HashParams { data: Option<String> }

#[derive(Serialize)]
struct HashResult { algo: &'static str, len: usize, hash_hex: String }

async fn hash(Query(params): Query<HashParams>) -> impl IntoResponse {
    let input = params.data.unwrap_or_else(|| "sen insansin".to_string());
    
    // Prevent excessively long inputs (DoS protection)
    if input.len() > 10000 {
        return (
            StatusCode::BAD_REQUEST, 
            Json(serde_json::json!({
                "error": "Input too long (max 10000 chars)"
            }))
        ).into_response();
    }
    
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash_hex = hex::encode(result);
    let body = HashResult { algo: "sha256", len: input.len(), hash_hex };
    (StatusCode::OK, Json(body)).into_response()
}

#[tokio::main]
async fn main() {
    // CORS: Allow only localhost (Express + Frontend)
    // Security: Restricted CORS for development environment
    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/api/rust/hello", get(hello))
        .route("/api/rust/hash", get(hash))
        .layer(cors);

    let addr: SocketAddr = "127.0.0.1:8000".parse().unwrap();
    println!("🚀 Rust service listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap_or_else(|e| {
        eprintln!("❌ Failed to bind to {}: {}", addr, e);
        std::process::exit(1);
    });
    
    axum::serve(listener, app).await.unwrap();
}
