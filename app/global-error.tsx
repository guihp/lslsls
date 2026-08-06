"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background:
            "radial-gradient(circle at top, rgba(255,107,0,0.16), transparent 55%), #fafafa",
          color: "#18181b",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            borderRadius: "1rem",
            border: "1px solid #e4e4e7",
            background: "#fff",
            padding: "2rem 1.5rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(255,107,0,0.08)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/LogoIAFE-transparent.png"
            alt="IAFÉ"
            width={56}
            height={56}
            style={{ margin: "0 auto 1rem", display: "block", objectFit: "contain" }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#ea580c",
            }}
          >
            IAFÉ Daily
          </p>
          <h1
            style={{
              margin: "0.5rem 0 0",
              fontSize: "1.25rem",
              fontWeight: 600,
            }}
          >
            Algo deu errado
          </h1>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              color: "#71717a",
            }}
          >
            Ocorreu um erro inesperado. Tente novamente ou volte ao início.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "0.75rem 0 0",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#a1a1aa",
              }}
            >
              Ref: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                border: "none",
                borderRadius: "0.75rem",
                background: "#f97316",
                color: "#fff",
                padding: "0.625rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
            <a
              href="/dashboard"
              style={{
                borderRadius: "0.75rem",
                border: "1px solid #fed7aa",
                color: "#c2410c",
                padding: "0.625rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Ir ao dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
