import { ImageResponse } from 'next/og';

// Next.js automatically serves this at /icon (replacing the missing favicon.ico).
// Browsers also map it to <link rel="icon">. Single source for all favicon sizes.

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e17',
          color: '#5eead4',
          fontFamily: 'sans-serif',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '-1px',
          borderRadius: 6,
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}
