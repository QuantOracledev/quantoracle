import { ImageResponse } from 'next/og';

// Apple touch icon — 180x180 served at /apple-icon and registered automatically.
// Used when someone adds the site to their iOS home screen.

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0e17 0%, #1a2233 100%)',
          color: '#5eead4',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 700, letterSpacing: '-4px', lineHeight: 1 }}>Q</div>
        <div style={{ fontSize: 20, marginTop: 6, color: '#94a3b8', letterSpacing: '2px' }}>
          ORACLE
        </div>
      </div>
    ),
    { ...size },
  );
}
