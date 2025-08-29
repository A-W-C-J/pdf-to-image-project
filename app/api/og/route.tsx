import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get("title") || "PDF Processing Tech Blog"
    const subtitle = searchParams.get("subtitle") || "Expert tips and tutorials"

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          backgroundImage: "linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)",
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "20px",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a0a0a0",
              marginBottom: "30px",
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 20,
              color: "#60a5fa",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#60a5fa",
                borderRadius: "8px",
                marginRight: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: "#1a1a1a",
                fontWeight: "bold",
              }}
            >
              P
            </div>
            PDF Tech Blog
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: unknown) {
    // Error generating OG image
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
