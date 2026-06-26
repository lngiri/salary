import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';

interface LegalInfoIconProps {
  legalReference?: string | null;
}

const DISCLAIMER =
  'यहाँ प्रस्तुत जानकारी जानकारीमूलक उद्देश्यका लागि मात्र हो। कुनै पनि कानुनी विवादमा आधिकारिक कानुनी पाठलाई नै मान्यता दिइनेछ।';

export function LegalInfoIcon({ legalReference }: LegalInfoIconProps) {
  if (!legalReference || legalReference.trim() === '') {
    return null;
  }

  const tooltipId = `legal-info-${Math.random().toString(36).slice(2, 11)}`;

  return (
    <>
      <span
        data-tooltip-id={tooltipId}
        className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white"
        aria-label="legal reference"
      >
        i
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        className="max-w-xs !bg-gray-900 !text-white"
      >
        <div className="space-y-2 text-xs">
          <p className="font-medium leading-relaxed">{legalReference}</p>
          <p className="border-t border-gray-700 pt-2 text-[10px] text-gray-400">
            {DISCLAIMER}
          </p>
        </div>
      </Tooltip>
    </>
  );
}
