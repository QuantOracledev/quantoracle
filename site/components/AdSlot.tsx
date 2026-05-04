/**
 * Ad slot placeholder + AdSense renderer.
 *
 * Modes (controlled by env vars):
 *   - Production (env.NEXT_PUBLIC_ADSENSE_CLIENT set): renders Google AdSense
 *     <ins> tag with the configured client + slot id. AdSense JS in
 *     layout.tsx auto-fills it.
 *   - Preview (env.NEXT_PUBLIC_AD_SLOTS_VISIBLE === 'true'): renders a
 *     dashed-border "Ad slot will appear here" placeholder so you can SEE
 *     the layout effect without serving ads. Useful while waiting for
 *     AdSense approval.
 *   - Dev / production-without-AdSense (default): renders nothing. Zero
 *     visual or layout impact.
 *
 * Usage:
 *   <AdSlot slot="POST_RESULT" format="responsive" />
 *   <AdSlot slot="MID_LONGFORM" format="rectangle" />
 *
 * Slot IDs:
 *   POST_RESULT    — between the calculator output and the FAQ. Highest CTR.
 *   MID_LONGFORM   — inside the long-form explainer, after a few paragraphs.
 *   ABOVE_RELATED  — between long-form and the related-calculators block.
 *
 * To wire up AdSense after approval, replace the AD_UNITS constant
 * below with your actual AdSense slot IDs (publisher gives you one
 * per ad unit you create in the AdSense dashboard).
 */

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SHOW_PLACEHOLDERS = process.env.NEXT_PUBLIC_AD_SLOTS_VISIBLE === 'true';

// Map of named slots → AdSense ad-unit slot ids (numeric strings).
// Populate these from the AdSense dashboard once you've created the units.
// Example: '1234567890'
const AD_UNITS: Record<string, string | undefined> = {
  POST_RESULT: process.env.NEXT_PUBLIC_AD_SLOT_POST_RESULT,
  MID_LONGFORM: process.env.NEXT_PUBLIC_AD_SLOT_MID_LONGFORM,
  ABOVE_RELATED: process.env.NEXT_PUBLIC_AD_SLOT_ABOVE_RELATED,
};

type Format = 'responsive' | 'rectangle' | 'leaderboard';

interface Props {
  slot: keyof typeof AD_UNITS;
  format?: Format;
  /** Optional className to set width / max-width / margins on the wrapper. */
  className?: string;
}

const FORMAT_STYLE: Record<Format, React.CSSProperties> = {
  responsive: { display: 'block', minHeight: 90 },
  rectangle: { display: 'inline-block', width: 300, height: 250 },
  leaderboard: { display: 'inline-block', width: 728, height: 90 },
};

export function AdSlot({ slot, format = 'responsive', className }: Props) {
  const adUnitId = AD_UNITS[slot];
  const wrapperCls = `my-8 mx-auto text-center ${className ?? ''}`;

  // Real AdSense unit ready: render the <ins> tag.
  if (ADSENSE_CLIENT && adUnitId) {
    return (
      <div className={wrapperCls} aria-label="Advertisement">
        <ins
          className="adsbygoogle"
          style={FORMAT_STYLE[format]}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={adUnitId}
          data-ad-format={format === 'responsive' ? 'auto' : undefined}
          data-full-width-responsive={format === 'responsive' ? 'true' : undefined}
        />
        {/* Initialize this ad unit. Each <ins> needs its own push. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: '(adsbygoogle = window.adsbygoogle || []).push({});',
          }}
        />
      </div>
    );
  }

  // Preview mode: show a placeholder block so you can see the layout impact.
  if (SHOW_PLACEHOLDERS) {
    const sizeText = format === 'responsive' ? 'responsive' : `${FORMAT_STYLE[format].width}×${FORMAT_STYLE[format].height}`;
    return (
      <div className={wrapperCls}>
        <div
          className="border border-dashed border-slate-600 rounded text-slate-500 text-xs uppercase tracking-wider flex items-center justify-center"
          style={{
            ...FORMAT_STYLE[format],
            minHeight: format === 'responsive' ? 90 : undefined,
            margin: '0 auto',
          }}
        >
          Ad slot · {slot} · {sizeText}
        </div>
      </div>
    );
  }

  // Default: render nothing. No layout impact, no visual residue.
  return null;
}
