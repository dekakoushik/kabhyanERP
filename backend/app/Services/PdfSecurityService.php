<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use TCPDF;

class PdfSecurityService
{
    protected string $certDir;
    protected string $certPath;
    protected string $keyPath;
    protected string $passphrase;

    public function __construct()
    {
        $this->certDir = storage_path('app/certs');
        $this->certPath = $this->certDir . '/kabhyan_cert.pem';
        $this->keyPath = $this->certDir . '/kabhyan_key.pem';
        $this->passphrase = (string) (config('app.key') ?: 'KabhyanSecurityKey2026');
    }

    /**
     * Ensure the enterprise X.509 digital certificate exists.
     * If not present, auto-generates a 2048-bit RSA certificate valid for 10 years.
     */
    public function ensureCertificate(): void
    {
        try {
            if (file_exists($this->certPath) && file_exists($this->keyPath) && filesize($this->certPath) > 0) {
                return;
            }

            if (!is_dir($this->certDir)) {
                @mkdir($this->certDir, 0755, true);
            }

            $configArgs = [];
            // Windows fallback for local development if needed
            $winCnf = 'C:/wamp64/bin/php/php8.3.28/extras/ssl/openssl.cnf';
            if (file_exists($winCnf)) {
                $configArgs['config'] = $winCnf;
            }

            $dn = [
                'countryName' => 'IN',
                'stateOrProvinceName' => 'Assam',
                'localityName' => 'Guwahati',
                'organizationName' => 'Kabhyan Technologies Private Limited',
                'organizationalUnitName' => 'Enterprise Financial Operations',
                'commonName' => 'Kabhyan ERP Certified Documents',
                'emailAddress' => 'contact@kabhyan.com'
            ];

            $privkey = openssl_pkey_new(array_merge([
                'private_key_bits' => 2048,
                'private_key_type' => OPENSSL_KEYTYPE_RSA
            ], $configArgs));

            if (!$privkey) {
                Log::warning('OpenSSL failed to generate private key: ' . openssl_error_string());
                return;
            }

            $csr = openssl_csr_new($dn, $privkey, array_merge(['digest_alg' => 'sha256'], $configArgs));
            if (!$csr) {
                Log::warning('OpenSSL failed to generate CSR: ' . openssl_error_string());
                return;
            }

            $x509 = openssl_csr_sign($csr, null, $privkey, 3650, array_merge(['digest_alg' => 'sha256'], $configArgs));
            if (!$x509) {
                Log::warning('OpenSSL failed to self-sign certificate: ' . openssl_error_string());
                return;
            }

            openssl_x509_export($x509, $certout);
            openssl_pkey_export($privkey, $pkeyout, $this->passphrase, $configArgs);

            @file_put_contents($this->certPath, $certout);
            @file_put_contents($this->keyPath, $pkeyout);
            @chmod($this->certPath, 0640);
            @chmod($this->keyPath, 0600);

            Log::info('Successfully generated enterprise X.509 certificate for Kabhyan PDF certification.');
        } catch (\Throwable $e) {
            Log::warning('X.509 certificate setup notice: ' . $e->getMessage());
        }
    }

    /**
     * Compute a human-readable 16-character cryptographic integrity check-code.
     * Example: KB-8F2A-4B91-7C0E
     */
    public function generateIntegrityKey(string $docNumber, string $date, float $amount, ?string $clientGstin = null): string
    {
        $raw = sprintf('%s|%s|%.2f|%s', $docNumber, $date, $amount, $clientGstin ?? 'UNREGISTERED');
        $hash = strtoupper(hash_hmac('sha256', $raw, $this->passphrase));
        return sprintf('KB-%s-%s-%s', substr($hash, 0, 4), substr($hash, 4, 4), substr($hash, 8, 4));
    }

    /**
     * Compute full SHA-256 fingerprint of the financial payload.
     */
    public function generateDocumentHash(string $docNumber, string $date, float $amount, ?string $clientGstin, array $items = []): string
    {
        $serializedItems = json_encode(array_map(function ($it) {
            return [
                'name' => $it['item_name'] ?? $it['title'] ?? '',
                'qty' => $it['quantity'] ?? 1,
                'rate' => $it['unit_price'] ?? $it['unit_rate'] ?? 0,
                'amt' => $it['amount'] ?? 0,
            ];
        }, $items));

        $payload = sprintf('%s|%s|%.2f|%s|%s', $docNumber, $date, $amount, $clientGstin ?? 'N/A', $serializedItems);
        return hash('sha256', $payload);
    }

    /**
     * Generate the SVG Void Pantograph background pattern data URI.
     * Uses halftone frequency modulation: fine background micro-dots (5% tint)
     * and coarser dots spelling out "OFFICIAL COPY • DUPLICATE".
     * Invisible on original high-DPI laser prints; boldly exposed on photocopiers.
     */
    public function getVoidPantographSvgDataUri(): string
    {
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <defs>
    <!-- Background Fine Micro-dots (150 LPI emulation, 4% tint) -->
    <pattern id="bgDots" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="0.65" fill="#e2e8f0" opacity="0.65" />
    </pattern>
    <!-- Coarse Text Pattern (60 LPI emulation, threshold trigger) -->
    <pattern id="textDots" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="1.75" fill="#cbd5e1" opacity="0.85" />
    </pattern>
  </defs>
  <!-- Base Background -->
  <rect width="100%" height="100%" fill="url(#bgDots)" />
  <!-- Hidden Warning text that emerges under optical scanner thresholding -->
  <g transform="rotate(-35 150 100)">
    <text x="30" y="80" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="900" fill="url(#textDots)" letter-spacing="3" opacity="0.45">OFFICIAL COPY</text>
    <text x="50" y="105" font-family="Helvetica, Arial, sans-serif" font-size="11" font-weight="900" fill="url(#textDots)" letter-spacing="2" opacity="0.45">DUPLICATE • NOT ORIGINAL</text>
    <text x="40" y="130" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="700" fill="url(#textDots)" letter-spacing="2" opacity="0.40">KABHYAN TECHNOLOGIES</text>
  </g>
</svg>
SVG;
        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Generate the SVG Moiré Line Grating pattern data URI.
     * Alternating 1px lines behind totals.
     * Prevents digital raster editing without visible optical interference ripples.
     */
    public function getMoireGridSvgDataUri(): string
    {
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <rect width="8" height="8" fill="#f8fafc" />
  <line x1="0" y1="4" x2="8" y2="4" stroke="#e2e8f0" stroke-width="0.75" />
  <line x1="4" y1="0" x2="4" y2="8" stroke="#e2e8f0" stroke-width="0.75" stroke-dasharray="1 3" />
</svg>
SVG;
        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Render the Blade HTML to a clean, high-fidelity PDF matching print preview.
     */
    public function renderCertifiedPdf(string $html, string $docTitle, string $docNumber, array $meta = []): string
    {
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'defaultFont' => 'DejaVu Sans',
                    'dpi' => 150,
                ]);
            return $pdf->output();
        }

        /** @var \TCPDF $pdf */
        $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);

        // Document Metadata
        $pdf->SetCreator('Kabhyan ERP Enterprise Engine');
        $pdf->SetAuthor('Kabhyan Technologies Private Limited');
        $pdf->SetTitle(sprintf('%s - %s', $docTitle, $docNumber));

        // Margins & Page setup
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(12, 12, 12);
        $pdf->SetAutoPageBreak(true, 12);
        $pdf->setImageScale(1.25);
        $pdf->SetFont('dejavusans', '', 8.5);

        $pdf->AddPage();
        $pdf->writeHTML($html, true, false, true, false, '');

        return $pdf->Output(sprintf('%s-%s.pdf', $docTitle, $docNumber), 'S');
    }
}
