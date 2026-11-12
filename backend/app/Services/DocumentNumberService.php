<?php

namespace App\Services;

use App\Models\Estimate;
use App\Models\Invoice;
use App\Models\ProformaInvoice;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Build document number from prefix, year, number, padding, and suffix.
     */
    public static function formatNumber(
        string $prefix,
        bool $includeYear,
        int $number,
        int $padding = 3,
        string $suffix = ''
    ): string {
        $yearPart = $includeYear ? date('Y') . '-' : '';
        $paddedNumber = str_pad((string) $number, max(1, $padding), '0', STR_PAD_LEFT);
        return "{$prefix}{$yearPart}{$paddedNumber}{$suffix}";
    }

    /**
     * Preview the next document numbers based on current or proposed settings.
     */
    public static function previewAll(?array $overrides = null): array
    {
        return [
            'estimate' => self::getNextEstimateNumber(false, $overrides),
            'proforma' => self::getNextProformaNumber(false, $overrides),
            'invoice' => self::getNextInvoiceNumber(false, $overrides),
        ];
    }

    /**
     * Get next Estimate / Quotation number.
     */
    public static function getNextEstimateNumber(bool $increment = false, ?array $overrides = null): string
    {
        $prefix = $overrides['estimate_prefix'] ?? SystemSetting::get('estimate_prefix', 'EST-');
        $suffix = $overrides['estimate_suffix'] ?? SystemSetting::get('estimate_suffix', '');
        $padding = (int) ($overrides['estimate_padding'] ?? SystemSetting::get('estimate_padding', 3));
        $includeYear = filter_var($overrides['estimate_include_year'] ?? SystemSetting::get('estimate_include_year', true), FILTER_VALIDATE_BOOLEAN);
        $nextNum = (int) ($overrides['estimate_next_number'] ?? SystemSetting::get('estimate_next_number', 1));

        // Ensure unique against database
        $candidate = self::formatNumber($prefix, $includeYear, $nextNum, $padding, $suffix);
        while (Estimate::where('estimate_number', $candidate)->exists()) {
            $nextNum++;
            $candidate = self::formatNumber($prefix, $includeYear, $nextNum, $padding, $suffix);
        }

        if ($increment) {
            SystemSetting::set('estimate_next_number', $nextNum + 1, 'document_numbering', 'integer');
        }

        return $candidate;
    }

    /**
     * Get next Proforma Invoice number.
     */
    public static function getNextProformaNumber(bool $increment = false, ?array $overrides = null): string
    {
        $prefix = $overrides['proforma_prefix'] ?? SystemSetting::get('proforma_prefix', 'PI-');
        $suffix = $overrides['proforma_suffix'] ?? SystemSetting::get('proforma_suffix', '');
        $padding = (int) ($overrides['proforma_padding'] ?? SystemSetting::get('proforma_padding', 3));
        $includeYear = filter_var($overrides['proforma_include_year'] ?? SystemSetting::get('proforma_include_year', true), FILTER_VALIDATE_BOOLEAN);
        $nextNum = (int) ($overrides['proforma_next_number'] ?? SystemSetting::get('proforma_next_number', 1));

        $candidate = self::formatNumber($prefix, $includeYear, $nextNum, $padding, $suffix);
        while (ProformaInvoice::where('proforma_number', $candidate)->exists()) {
            $nextNum++;
            $candidate = self::formatNumber($prefix, $includeYear, $nextNum, $padding, $suffix);
        }

        if ($increment) {
            SystemSetting::set('proforma_next_number', $nextNum + 1, 'document_numbering', 'integer');
        }

        return $candidate;
    }

    /**
     * Get next GST Tax Invoice number.
     */
    public static function getNextInvoiceNumber(bool $increment = false, ?array $overrides = null): string
    {
        $prefix = $overrides['invoice_prefix'] ?? SystemSetting::get('invoice_prefix', 'INV-');
        $suffix = $overrides['invoice_suffix'] ?? SystemSetting::get('invoice_suffix', '');
        $padding = (int) ($overrides['invoice_padding'] ?? SystemSetting::get('invoice_padding', 3));
        $includeYear = filter_var($overrides['invoice_include_year'] ?? SystemSetting::get('invoice_include_year', true), FILTER_VALIDATE_BOOLEAN);
        $nextNum = (int) ($overrides['invoice_next_number'] ?? SystemSetting::get('invoice_next_number', 1));

        $candidate = self::formatNumber($prefix, $includeYear, $nextNum, $padding, $suffix);
        while (Invoice::where('invoice_number', $candidate)->exists()) {
            $nextNum++;
            $candidate = self::formatNumber($prefix, $includeYear, $nextNum, $padding, $suffix);
        }

        if ($increment) {
            SystemSetting::set('invoice_next_number', $nextNum + 1, 'document_numbering', 'integer');
        }

        return $candidate;
    }
}
