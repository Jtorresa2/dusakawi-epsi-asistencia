-- =============================================
-- PostgreSQL Schema — Password Reset Tokens
-- =============================================
-- Token plano NUNCA se guarda; solo su hash SHA-256 hex (64 chars).
-- Los tokens se invalidan (usado = true) antes de emitir uno nuevo.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expira_en   TIMESTAMP NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
