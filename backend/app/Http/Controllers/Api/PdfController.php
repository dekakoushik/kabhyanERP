<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estimate;
use App\Models\Invoice;
use App\Models\ProformaInvoice;
use App\Models\SystemSetting;
use App\Services\PdfSecurityService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PdfController extends Controller
{
    protected PdfSecurityService $pdfSecurityService;

    public function __construct(PdfSecurityService $pdfSecurityService)
    {
        $this->pdfSecurityService = $pdfSecurityService;
    }

    /**
     * Download or view certified PDF for Tax Invoice.
     */
    public function downloadInvoice(Request $request, $id): Response
    {
        $invoice = Invoice::with(['items', 'project'])
            ->where('id', $id)
            ->orWhere('invoice_number', $id)
            ->firstOrFail();

        $company = $this->getCompanySettings();
        $bank = $this->getBankSettings();

        // GST Place of supply and state check
        $clientGstin = $invoice->client_gstin;
        $isInterState = $this->isInterStateSupply($clientGstin, $invoice->client_address);
        $placeOfSupply = $isInterState ? 'Inter-State (IGST Applicable)' : 'Assam (State Code: 18)';

        // GST Calculation
        $taxableAmount = (float) $invoice->subtotal - (float) $invoice->discount_amount;
        $gstRate = (float) ($invoice->tax_rate ?? 18);
        $totalTax = (float) $invoice->tax_amount;

        $cgstAmount = !$isInterState ? round($totalTax / 2, 2) : 0;
        $sgstAmount = !$isInterState ? round($totalTax / 2, 2) : 0;
        $igstAmount = $isInterState ? $totalTax : 0;

        // Security Anti-Tamper Artifacts
        $itemsArray = $invoice->items ? $invoice->items->toArray() : [];
        $documentHash = $this->pdfSecurityService->generateDocumentHash(
            $invoice->invoice_number,
            $invoice->invoice_date,
            (float) $invoice->total_amount,
            $clientGstin,
            $itemsArray
        );

        $integrityKey = $this->pdfSecurityService->generateIntegrityKey(
            $invoice->invoice_number,
            $invoice->invoice_date,
            (float) $invoice->total_amount,
            $clientGstin
        );

        $voidPantographUrl = $this->pdfSecurityService->getVoidPantographSvgDataUri();
        $moireGridUrl = $this->pdfSecurityService->getMoireGridSvgDataUri();
        $amountInWords = $this->amountToWords((float) $invoice->total_amount);

        $html = view('pdf.tax-invoice', [
            'invoice' => $invoice,
            'company' => $company,
            'bank' => $bank,
            'isInterState' => $isInterState,
            'placeOfSupply' => $placeOfSupply,
            'cgstAmount' => $cgstAmount,
            'sgstAmount' => $sgstAmount,
            'igstAmount' => $igstAmount,
            'documentHash' => $documentHash,
            'integrityKey' => $integrityKey,
            'voidPantographUrl' => $voidPantographUrl,
            'moireGridUrl' => $moireGridUrl,
            'amountInWords' => $amountInWords,
        ])->render();

        $pdfBytes = $this->pdfSecurityService->renderCertifiedPdf(
            $html,
            'Tax-Invoice',
            $invoice->invoice_number,
            ['subject' => 'Official GST Tax Invoice']
        );

        $filename = sprintf('Tax-Invoice-%s.pdf', $invoice->invoice_number);
        $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';

        return response($pdfBytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('%s; filename="%s"', $disposition, $filename),
            'Cache-Control' => 'private, max-age=0, must-revalidate',
            'Pragma' => 'public',
        ]);
    }

    /**
     * Download or view certified PDF for Proforma Invoice.
     */
    public function downloadProforma(Request $request, $id): Response
    {
        $proforma = ProformaInvoice::with(['items', 'project'])
            ->where('id', $id)
            ->orWhere('proforma_number', $id)
            ->firstOrFail();

        $company = $this->getCompanySettings();
        $bank = $this->getBankSettings();

        $clientGstin = $proforma->client_gstin;
        $isInterState = $this->isInterStateSupply($clientGstin, $proforma->client_address);
        $placeOfSupply = $isInterState ? 'Inter-State (IGST Applicable)' : 'Assam (State Code: 18)';

        $taxableAmount = (float) $proforma->subtotal - (float) $proforma->discount_amount;
        $totalTax = (float) $proforma->tax_amount;

        $cgstAmount = !$isInterState ? round($totalTax / 2, 2) : 0;
        $sgstAmount = !$isInterState ? round($totalTax / 2, 2) : 0;
        $igstAmount = $isInterState ? $totalTax : 0;

        $itemsArray = $proforma->items ? $proforma->items->toArray() : [];
        $documentHash = $this->pdfSecurityService->generateDocumentHash(
            $proforma->proforma_number,
            $proforma->invoice_date,
            (float) $proforma->total_amount,
            $clientGstin,
            $itemsArray
        );

        $integrityKey = $this->pdfSecurityService->generateIntegrityKey(
            $proforma->proforma_number,
            $proforma->invoice_date,
            (float) $proforma->total_amount,
            $clientGstin
        );

        $voidPantographUrl = $this->pdfSecurityService->getVoidPantographSvgDataUri();
        $moireGridUrl = $this->pdfSecurityService->getMoireGridSvgDataUri();
        $amountInWords = $this->amountToWords((float) $proforma->total_amount);

        $html = view('pdf.proforma', [
            'proforma' => $proforma,
            'company' => $company,
            'bank' => $bank,
            'isInterState' => $isInterState,
            'placeOfSupply' => $placeOfSupply,
            'cgstAmount' => $cgstAmount,
            'sgstAmount' => $sgstAmount,
            'igstAmount' => $igstAmount,
            'documentHash' => $documentHash,
            'integrityKey' => $integrityKey,
            'voidPantographUrl' => $voidPantographUrl,
            'moireGridUrl' => $moireGridUrl,
            'amountInWords' => $amountInWords,
        ])->render();

        $pdfBytes = $this->pdfSecurityService->renderCertifiedPdf(
            $html,
            'Proforma-Invoice',
            $proforma->proforma_number,
            ['subject' => 'Advance Commercial Proforma Invoice']
        );

        $filename = sprintf('Proforma-%s.pdf', $proforma->proforma_number);
        $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';

        return response($pdfBytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('%s; filename="%s"', $disposition, $filename),
            'Cache-Control' => 'private, max-age=0, must-revalidate',
            'Pragma' => 'public',
        ]);
    }

    /**
     * Download or view certified PDF for Estimate / Quotation.
     */
    public function downloadEstimate(Request $request, $id): Response
    {
        $estimate = Estimate::with(['items', 'project'])
            ->where('id', $id)
            ->orWhere('estimate_number', $id)
            ->firstOrFail();

        $company = $this->getCompanySettings();
        $bank = $this->getBankSettings();

        $clientGstin = $estimate->client_gstin;
        $isInterState = $this->isInterStateSupply($clientGstin, $estimate->client_address);
        $placeOfSupply = $isInterState ? 'Inter-State (IGST Applicable)' : 'Assam (State Code: 18)';

        $taxableAmount = (float) $estimate->subtotal - (float) $estimate->discount_amount;
        $totalTax = (float) $estimate->tax_amount;

        $cgstAmount = !$isInterState ? round($totalTax / 2, 2) : 0;
        $sgstAmount = !$isInterState ? round($totalTax / 2, 2) : 0;
        $igstAmount = $isInterState ? $totalTax : 0;

        $itemsArray = $estimate->items ? $estimate->items->toArray() : [];
        $documentHash = $this->pdfSecurityService->generateDocumentHash(
            $estimate->estimate_number,
            $estimate->estimate_date,
            (float) $estimate->total_amount,
            $clientGstin,
            $itemsArray
        );

        $integrityKey = $this->pdfSecurityService->generateIntegrityKey(
            $estimate->estimate_number,
            $estimate->estimate_date,
            (float) $estimate->total_amount,
            $clientGstin
        );

        $voidPantographUrl = $this->pdfSecurityService->getVoidPantographSvgDataUri();
        $moireGridUrl = $this->pdfSecurityService->getMoireGridSvgDataUri();
        $amountInWords = $this->amountToWords((float) $estimate->total_amount);

        $html = view('pdf.estimate', [
            'estimate' => $estimate,
            'company' => $company,
            'bank' => $bank,
            'isInterState' => $isInterState,
            'placeOfSupply' => $placeOfSupply,
            'cgstAmount' => $cgstAmount,
            'sgstAmount' => $sgstAmount,
            'igstAmount' => $igstAmount,
            'documentHash' => $documentHash,
            'integrityKey' => $integrityKey,
            'voidPantographUrl' => $voidPantographUrl,
            'moireGridUrl' => $moireGridUrl,
            'amountInWords' => $amountInWords,
        ])->render();

        $pdfBytes = $this->pdfSecurityService->renderCertifiedPdf(
            $html,
            'Estimate',
            $estimate->estimate_number,
            ['subject' => 'Official Commercial Quotation']
        );

        $filename = sprintf('Estimate-%s.pdf', $estimate->estimate_number);
        $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';

        return response($pdfBytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('%s; filename="%s"', $disposition, $filename),
            'Cache-Control' => 'private, max-age=0, must-revalidate',
            'Pragma' => 'public',
        ]);
    }

    /**
     * Resolve company details from settings with sensible fallbacks.
     */
    protected function getCompanySettings(): array
    {
        return [
            'name' => SystemSetting::get('company_legal_name', 'Kabhyan Technologies Private Limited'),
            'tagline' => SystemSetting::get('company_legal_tagline', 'Enterprise IT & Software Engineering Solutions'),
            'email' => SystemSetting::get('company_email', 'contact@kabhyan.com'),
            'phone' => SystemSetting::get('company_phone', '+91 70869 59737'),
            'registered_office' => SystemSetting::get('company_registered_office', 'Ward No. 9, Rangia-Tamulpur Rd, near Padum Pukhuri Park, Rangia, Assam 781354'),
            'corporate_office' => SystemSetting::get('company_corporate_office', 'GMCH Road, near Dispur College Road, Kachari Basti, Ganeshguri, Guwahati, Assam 781005'),
            'address' => SystemSetting::get('company_address', 'GMCH Road, near Dispur College Road, Kachari Basti, Ganeshguri, Guwahati, Assam 781005'),
            'website' => SystemSetting::get('company_website', 'https://www.kabhyan.com'),
            'cin' => SystemSetting::get('company_cin', 'U62012AS2026PTC030422'),
            'incorporation_date' => SystemSetting::get('company_incorporation_date', 'May 11, 2026'),
            'company_status' => SystemSetting::get('company_status', 'Active (Non-government private company)'),
            'authorized_capital' => SystemSetting::get('company_share_capital', '₹100,000'),
            'gstin' => SystemSetting::get('company_gstin', '18AAGCK2934D1Z2'),
            'pan' => SystemSetting::get('company_pan', 'AAGCK2934D'),
            'sac_code' => SystemSetting::get('default_sac_code', '998314'),
            'state_code' => '18',
            'state_name' => 'Assam',
        ];
    }

    /**
     * Resolve corporate bank partner settings with sensible fallbacks.
     */
    protected function getBankSettings(): array
    {
        return [
            'name' => SystemSetting::get('bank_name', 'HDFC Bank Limited'),
            'account_name' => SystemSetting::get('bank_account_name', 'Kabhyan Technologies Private Limited'),
            'account_number' => SystemSetting::get('bank_account_number', '50200084729184'),
            'ifsc_code' => SystemSetting::get('bank_ifsc_code', 'HDFC0001234'),
            'branch' => SystemSetting::get('bank_branch', 'Ganeshguri, Guwahati, Assam'),
            'upi_id' => SystemSetting::get('bank_upi_id', 'kabhyan.tech@hdfcbank'),
        ];
    }

    /**
     * Check if supply is inter-state (IGST) or intra-state (CGST + SGST).
     * State code 18 is Assam.
     */
    protected function isInterStateSupply(?string $gstin, ?string $address): bool
    {
        // Kabhyan Technologies is registered in Assam (State Code: 18)
        if ($gstin && strlen(trim($gstin)) >= 2) {
            $stateCode = substr(trim($gstin), 0, 2);
            return $stateCode !== '18';
        }

        if ($address) {
            $lower = strtolower($address);
            if (str_contains($lower, 'assam') || str_contains($lower, 'guwahati') || str_contains($lower, 'rangia')) {
                return false;
            }
        }

        return true;
    }

    /**
     * Convert currency number to Indian Rupees in words.
     */
    protected function amountToWords(float $number): string
    {
        $no = (int) floor($number);
        $decimal = (int) round(($number - $no) * 100);
        $words = [
            0 => '', 1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
            6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
            11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen', 15 => 'Fifteen',
            16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen', 19 => 'Nineteen',
            20 => 'Twenty', 30 => 'Thirty', 40 => 'Forty', 50 => 'Fifty',
            60 => 'Sixty', 70 => 'Seventy', 80 => 'Eighty', 90 => 'Ninety'
        ];
        
        $result = '';

        if ($no === 0) {
            $result = 'Zero';
        } else {
            // Indian numbering format: Crore, Lakh, Thousand, Hundred
            $crores = intdiv($no, 10000000);
            $no %= 10000000;
            $lakhs = intdiv($no, 100000);
            $no %= 100000;
            $thousands = intdiv($no, 1000);
            $no %= 1000;
            $hundreds = intdiv($no, 100);
            $remaining = $no % 100;

            if ($crores > 0) {
                $result .= $this->twoDigitsToWords($crores, $words) . ' Crore ';
            }
            if ($lakhs > 0) {
                $result .= $this->twoDigitsToWords($lakhs, $words) . ' Lakh ';
            }
            if ($thousands > 0) {
                $result .= $this->twoDigitsToWords($thousands, $words) . ' Thousand ';
            }
            if ($hundreds > 0) {
                $result .= $words[$hundreds] . ' Hundred ';
            }
            if ($remaining > 0) {
                $result .= $this->twoDigitsToWords($remaining, $words) . ' ';
            }
        }

        $result = 'INR ' . trim($result) . ' Only';
        if ($decimal > 0) {
            $result .= ' and ' . $this->twoDigitsToWords($decimal, $words) . ' Paise';
        }

        return $result;
    }

    protected function twoDigitsToWords(int $num, array $words): string
    {
        if ($num <= 20) {
            return $words[$num];
        }
        $tens = (int) (floor($num / 10) * 10);
        $units = $num % 10;
        return $words[$tens] . ($units > 0 ? ' ' . $words[$units] : '');
    }
}
