<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CashfreeService
{
    protected string $appId;
    protected string $secretKey;
    protected string $environment;
    protected string $apiVersion;
    protected string $baseUrl;

    public function __construct()
    {
        $this->appId = (string) config('services.cashfree.app_id', env('CASHFREE_APP_ID', ''));
        $this->secretKey = (string) config('services.cashfree.secret_key', env('CASHFREE_SECRET_KEY', ''));
        $this->environment = strtolower((string) config('services.cashfree.env', env('CASHFREE_ENV', 'sandbox')));
        $this->apiVersion = (string) config('services.cashfree.api_version', env('CASHFREE_API_VERSION', '2023-08-01'));

        $this->baseUrl = $this->environment === 'production'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';
    }

    /**
     * Check if Cashfree is configured with valid credentials.
     */
    public function isConfigured(): bool
    {
        return !empty($this->appId) && !empty($this->secretKey);
    }

    /**
     * Create or retrieve an existing Cashfree Payment Link for an invoice.
     */
    public function createPaymentLink(Invoice $invoice, ?string $returnUrl = null): array
    {
        $amount = (float) ($invoice->due_amount > 0 ? $invoice->due_amount : $invoice->total_amount);
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Invoice has no outstanding balance.');
        }

        // Clean customer phone number (ensure 10 digits for Indian standard)
        $rawPhone = preg_replace('/[^0-9]/', '', (string) $invoice->client_phone);
        if (str_starts_with($rawPhone, '91') && strlen($rawPhone) === 12) {
            $rawPhone = substr($rawPhone, 2);
        }
        $customerPhone = strlen($rawPhone) >= 10 ? substr($rawPhone, -10) : '9876543210';

        $customerEmail = filter_var($invoice->client_email, FILTER_VALIDATE_EMAIL)
            ? $invoice->client_email
            : 'finance@kabhyan.com';

        $customerName = !empty($invoice->client_name)
            ? $invoice->client_name
            : (!empty($invoice->client_company) ? $invoice->client_company : 'Corporate Client');

        // Unique link ID for this transaction session
        $linkId = 'INV_' . $invoice->id . '_' . date('YmdHis');

        $resolvedReturnUrl = $returnUrl ?: url("/portal/invoices/{$invoice->id}?payment=completed&link_id={$linkId}");

        $payload = [
            'link_id' => $linkId,
            'link_amount' => round($amount, 2),
            'link_currency' => $invoice->currency ?: 'INR',
            'link_purpose' => "Invoice {$invoice->invoice_number} Payment - Kabhyan Technologies",
            'customer_details' => [
                'customer_phone' => $customerPhone,
                'customer_email' => $customerEmail,
                'customer_name' => $customerName,
            ],
            'link_notify' => [
                'send_sms' => true,
                'send_email' => true,
            ],
            'link_meta' => [
                'return_url' => $resolvedReturnUrl,
                'notify_url' => url('/api/v1/webhooks/cashfree'),
                'upi_intent' => true,
            ],
        ];

        // If credentials are not yet set in production, provide a simulated fallback link for seamless testing
        if (!$this->isConfigured()) {
            $simulatedUrl = "https://payments.kabhyan.com/checkout/cf_simulated_{$invoice->id}?amount=" . urlencode((string) $amount);
            $invoice->update([
                'cashfree_link_id' => $linkId,
                'cashfree_link_url' => $simulatedUrl,
            ]);

            return [
                'success' => true,
                'link_id' => $linkId,
                'link_url' => $simulatedUrl,
                'link_status' => 'ACTIVE',
                'is_simulated' => true,
                'amount' => $amount,
                'currency' => $invoice->currency ?: 'INR',
            ];
        }

        try {
            $response = Http::withHeaders([
                'x-client-id' => $this->appId,
                'x-client-secret' => $this->secretKey,
                'x-api-version' => $this->apiVersion,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(15)->post("{$this->baseUrl}/links", $payload);

            if ($response->successful()) {
                $data = $response->json();
                $linkUrl = $data['link_url'] ?? '';
                $qrcode = $data['link_qrcode'] ?? null;

                $invoice->update([
                    'cashfree_link_id' => $linkId,
                    'cashfree_link_url' => $linkUrl,
                    'cashfree_link_qrcode' => $qrcode,
                ]);

                return [
                    'success' => true,
                    'link_id' => $linkId,
                    'link_url' => $linkUrl,
                    'link_qrcode' => $qrcode,
                    'link_status' => $data['link_status'] ?? 'ACTIVE',
                    'amount' => $amount,
                    'currency' => $data['link_currency'] ?? 'INR',
                ];
            }

            Log::error('Cashfree link generation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException($response->json('message') ?? 'Cashfree API responded with an error.');
        } catch (\Throwable $e) {
            Log::error('Cashfree Service Exception: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Verify Cashfree webhook HMAC-SHA256 signature.
     */
    public function verifyWebhookSignature(?string $signature, ?string $timestamp, string $rawBody): bool
    {
        if (empty($signature) || empty($timestamp) || !$this->isConfigured()) {
            return false;
        }

        $signatureData = $timestamp . $rawBody;
        $expectedSignature = base64_encode(hash_hmac('sha256', $signatureData, $this->secretKey, true));

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Autonomous processing of payment success payload from Cashfree webhook.
     */
    public function processWebhookPayload(array $payload): array
    {
        $type = $payload['type'] ?? '';
        $data = $payload['data'] ?? [];

        Log::info('Processing Cashfree webhook: ' . $type, ['event_id' => $payload['event_time'] ?? null]);

        // Extract order or payment details
        $link = $data['link'] ?? [];
        $payment = $data['payment'] ?? [];
        $linkId = $link['link_id'] ?? ($payment['link_id'] ?? ($data['order']['order_id'] ?? null));

        if (!$linkId) {
            return ['status' => 'ignored', 'reason' => 'No link_id found in payload'];
        }

        // Locate corresponding invoice via link_id or invoice id prefix
        $invoice = Invoice::where('cashfree_link_id', $linkId)->first();
        if (!$invoice && str_starts_with($linkId, 'INV_')) {
            $parts = explode('_', $linkId);
            $invId = (int) ($parts[1] ?? 0);
            if ($invId > 0) {
                $invoice = Invoice::find($invId);
            }
        }

        if (!$invoice) {
            return ['status' => 'ignored', 'reason' => "Invoice not found for link {$linkId}"];
        }

        $paymentStatus = strtoupper((string) ($payment['payment_status'] ?? ($data['payment_status'] ?? 'SUCCESS')));

        if (in_array($paymentStatus, ['SUCCESS', 'PAID', 'COMPLETED'])) {
            $paidAmount = (float) ($payment['payment_amount'] ?? ($link['link_amount'] ?? $invoice->due_amount));
            $reference = $payment['cf_payment_id'] ?? ($payment['bank_reference'] ?? ('CF-' . time()));
            $paymentMethod = strtolower((string) ($payment['payment_group'] ?? 'upi'));

            // Record invoice payment idempotently
            $existing = InvoicePayment::where('transaction_reference', (string) $reference)->first();
            if (!$existing) {
                InvoicePayment::create([
                    'invoice_id' => $invoice->id,
                    'recorded_by' => $invoice->created_by,
                    'amount' => $paidAmount,
                    'payment_date' => now()->toDateString(),
                    'payment_method' => $paymentMethod,
                    'transaction_reference' => (string) $reference,
                    'notes' => 'Settled autonomously via Cashfree Online Gateway',
                ]);
            }

            // Sync invoice amounts
            $newPaid = (float) $invoice->payments()->sum('amount');
            $newDue = max(0, (float) $invoice->total_amount - $newPaid);
            $newStatus = $newDue <= 0 ? 'paid' : ($newPaid > 0 ? 'partially_paid' : 'sent');

            $invoice->update([
                'paid_amount' => $newPaid,
                'due_amount' => $newDue,
                'status' => $newStatus,
            ]);

            return [
                'status' => 'settled',
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'amount_paid' => $paidAmount,
                'current_status' => $newStatus,
            ];
        }

        return ['status' => 'unsettled', 'payment_status' => $paymentStatus];
    }
}
