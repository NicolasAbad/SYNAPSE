// Pre-launch audit Day 1 — Legal section row primitive.
// Renders a Privacy Policy / Terms / EULA button. When the URL is empty
// (Nico hasn't filled `src/config/legalUrls.ts` yet), the button renders
// disabled with a hint line explaining the link isn't configured.

import { isLegalUrlConfigured } from '../../../config/legalUrls';
import { openExternalUrl } from '../../../platform/externalUrl';
import { buttonStyle, disabledButtonStyle, statusLineStyle } from './styles';

export function LegalLinkButton({
  label, url, testId, missingLabel,
}: { label: string; url: string; testId: string; missingLabel: string }) {
  const configured = isLegalUrlConfigured(url);
  const onClick = () => { if (configured) openExternalUrl(url); };
  return (
    <div>
      <button
        type="button"
        data-testid={testId}
        disabled={!configured}
        onClick={onClick}
        style={configured ? buttonStyle : disabledButtonStyle}
      >
        {label}
      </button>
      {!configured && <p style={statusLineStyle}>{missingLabel}</p>}
    </div>
  );
}
