import { ImageResponse } from 'next/og';

// Default OG / Twitter card image: 1200x630, served at /opengraph-image.
// Next.js automatically wires this into the metadata.openGraph.images and
// metadata.twitter.images for the root route. Per-route overrides go in
// the route's folder as another opengraph-image.tsx.

export const alt = 'QuantOracle — Free Quant Finance Calculators';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 60,
          background:
            'linear-gradient(135deg, #0a0e17 0%, #0f1420 50%, #1a2233 100%)',
          color: '#f1f5f9',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: '#5eead4',
              color: '#0a0e17',
              fontSize: 44,
              fontWeight: 700,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '-2px',
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px' }}>
            QuantOracle
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.05 }}>
            Free quant finance
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: '-2px',
              lineHeight: 1.05,
            }}
          >
            <span style={{ color: '#5eead4' }}>calculators</span>
            <span>, backed by an API.</span>
          </div>
        </div>

        {/* Footer chips */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Black-Scholes', 'Kelly', 'VaR', 'Crypto liquidation', 'Impermanent loss'].map(
            (chip) => (
              <div
                key={chip}
                style={{
                  background: 'rgba(94,234,212,0.12)',
                  border: '1px solid rgba(94,234,212,0.3)',
                  color: '#5eead4',
                  padding: '10px 18px',
                  borderRadius: 999,
                  fontSize: 24,
                  fontWeight: 500,
                }}
              >
                {chip}
              </div>
            ),
          )}
          <div style={{ flexGrow: 1 }} />
          <div style={{ fontSize: 24, color: '#94a3b8', letterSpacing: '0.5px' }}>
            quantoracle.dev
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
