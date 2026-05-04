import { ImageResponse } from 'next/og';

/**
 * Shared 1200x630 OG image template used by per-route opengraph-image.tsx files.
 * Pass the calculator title + a short kicker; renders a consistent
 * QuantOracle-branded share card.
 */

export const SIZE = { width: 1200, height: 630 };
export const CONTENT_TYPE = 'image/png';

interface Opts {
  /** Bold one-line title — usually matches the calculator title. */
  title: string;
  /** Short kicker label, e.g. 'Black-Scholes', 'VaR', 'Kelly'. */
  kicker: string;
  /** 1-2 sentence subtitle, shown below the title in muted text. */
  subtitle: string;
}

export function makeOgImage({ title, kicker, subtitle }: Opts) {
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
        {/* Header: logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: '#5eead4',
              color: '#0a0e17',
              fontSize: 38,
              fontWeight: 700,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '-2px',
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-1px' }}>
            QuantOracle
          </div>
          <div style={{ flexGrow: 1 }} />
          <div
            style={{
              background: 'rgba(94,234,212,0.12)',
              border: '1px solid rgba(94,234,212,0.3)',
              color: '#5eead4',
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 500,
              display: 'flex',
            }}
          >
            {kicker}
          </div>
        </div>

        {/* Title + subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-2px',
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#94a3b8',
              lineHeight: 1.3,
              maxWidth: 950,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Footer chips */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {['Free, no signup', 'Sub-70 ms', 'Powered by quantoracle.dev API'].map((chip) => (
            <div
              key={chip}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 20,
                display: 'flex',
              }}
            >
              {chip}
            </div>
          ))}
          <div style={{ flexGrow: 1 }} />
          <div style={{ fontSize: 22, color: '#5eead4' }}>quantoracle.dev</div>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
