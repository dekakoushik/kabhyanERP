@extends('pdf.layout')

@section('title', 'Tax Invoice - ' . $invoice->invoice_number)
@section('doc-title', 'TAX INVOICE')
@section('doc-number-label', 'Invoice Number')
@section('doc-number', $invoice->invoice_number)
@section('doc-date', \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y'))
@section('doc-due-date', \Carbon\Carbon::parse($invoice->due_date)->format('d M Y'))

@section('doc-additional-meta')
    @if($invoice->proforma_number)
        <strong>Proforma Ref:</strong> <span class="font-mono">{{ $invoice->proforma_number }}</span><br/>
    @endif
    @if($invoice->estimate_number)
        <strong>Estimate Ref:</strong> <span class="font-mono">{{ $invoice->estimate_number }}</span><br/>
    @endif
    <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: {{ $invoice->payment_status === 'paid' ? '#15803d' : ($invoice->payment_status === 'partially_paid' ? '#b45309' : '#b91c1c') }};">{{ str_replace('_', ' ', $invoice->payment_status) }}</span>
@endsection

@section('content')

    <!-- Billed To & Supply Information -->
    <table class="meta-table" style="margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 6px;">
                <div class="info-card">
                    <div class="info-card-header">BILLED TO (RECIPIENT CLIENT)</div>
                    <div style="font-size: 10pt; font-weight: bold; color: #0f172a;">{{ $invoice->client_company ?? $invoice->client_name }}</div>
                    <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
                        Attn: <strong>{{ $invoice->client_name }}</strong><br/>
                        {{ $invoice->client_address ?? 'Address on file' }}<br/>
                        Email: {{ $invoice->client_email }} | Phone: {{ $invoice->client_phone ?? 'N/A' }}<br/>
                        GSTIN: <strong class="font-mono" style="color: #1e3a8a;">{{ $invoice->client_gstin ?? 'UNREGISTERED' }}</strong>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 6px;">
                <div class="info-card">
                    <div class="info-card-header">DISPATCH & CONTRACT DETAILS</div>
                    <table style="width: 100%; font-size: 8pt; color: #475569;">
                        <tr>
                            <td style="width: 45%;"><strong>Place of Supply:</strong></td>
                            <td>{{ $placeOfSupply }}</td>
                        </tr>
                        <tr>
                            <td><strong>Applicable Tax Type:</strong></td>
                            <td style="font-weight: bold; color: #1e3a8a;">{{ $isInterState ? 'IGST (Integrated Tax)' : 'CGST + SGST (Intra-State)' }}</td>
                        </tr>
                        @if($invoice->project)
                        <tr>
                            <td><strong>Linked Project:</strong></td>
                            <td>{{ $invoice->project->name }} ({{ $invoice->project->code }})</td>
                        </tr>
                        @endif
                        <tr>
                            <td><strong>Continuous Supply:</strong></td>
                            <td>CGST Act Sec 13(2) & 31(5)</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 47%; text-align: left;">Item & Scope Description</th>
                <th style="width: 12%; text-align: center;">SAC / HSN</th>
                <th style="width: 8%; text-align: center;">Qty</th>
                <th style="width: 13%; text-align: right;">Unit Rate (₹)</th>
                <th style="width: 15%; text-align: right;">Taxable Subtotal (₹)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoice->items as $index => $item)
            <tr class="{{ $index % 2 === 1 ? 'alt' : '' }}">
                <td style="text-align: center; vertical-align: top;">{{ $index + 1 }}</td>
                <td style="vertical-align: top;">
                    <div style="font-weight: bold; color: #0f172a;">{{ $item->item_name }}</div>
                    @if($item->description)
                    <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">{{ $item->description }}</div>
                    @endif
                </td>
                <td style="text-align: center; vertical-align: top;" class="font-mono">{{ $company['sac_code'] }}</td>
                <td style="text-align: center; vertical-align: top;">{{ $item->quantity }} {{ $item->unit ?? 'units' }}</td>
                <td style="text-align: right; vertical-align: top;" class="font-mono">{{ number_format($item->unit_price, 2) }}</td>
                <td style="text-align: right; vertical-align: top; font-weight: bold;" class="font-mono">{{ number_format($item->amount, 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 15px;">No individual line items recorded.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Bank Remittance + Financial Calculation -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 8px;">
                <!-- Banking Remittance Card with Moiré Grating Background -->
                <div class="bank-box">
                    <div style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; font-size: 8pt;">
                        BANK WIRE REMITTANCE INSTRUCTIONS
                    </div>
                    <table style="width: 100%; font-size: 7.5pt; color: #334155; line-height: 1.35;">
                        <tr>
                            <td style="width: 32%;">Beneficiary:</td>
                            <td><strong>{{ $bank['account_name'] }}</strong></td>
                        </tr>
                        <tr>
                            <td>Bank Partner:</td>
                            <td><strong>{{ $bank['name'] }}</strong></td>
                        </tr>
                        <tr>
                            <td>Account Number:</td>
                            <td><strong class="font-mono" style="font-size: 8.5pt; color: #1e3a8a;">{{ $bank['account_number'] }}</strong></td>
                        </tr>
                        <tr>
                            <td>IFSC Code:</td>
                            <td><strong class="font-mono">{{ $bank['ifsc_code'] }}</strong></td>
                        </tr>
                        <tr>
                            <td>Branch & City:</td>
                            <td>{{ $bank['branch'] }}</td>
                        </tr>
                        <tr>
                            <td>Instant UPI:</td>
                            <td><strong class="font-mono">{{ $bank['upi_id'] }}</strong></td>
                        </tr>
                    </table>
                </div>

                <!-- Terms & Instructions -->
                <div style="font-size: 7pt; color: #64748b; margin-top: 6px; line-height: 1.3;">
                    <strong>Payment Terms:</strong> {{ $invoice->payment_terms ?? 'Payment due within 15 calendar days from date of invoice.' }}<br/>
                    @if($invoice->notes)
                    <strong>Notes:</strong> {{ $invoice->notes }}<br/>
                    @endif
                    <em>This Tax Invoice is issued under Section 31 of the Central Goods and Services Tax Act, 2017. Continuous supply milestone deliverable.</em>
                </div>
            </td>

            <td style="width: 48%; vertical-align: top; padding-left: 8px;">
                <!-- Financial Totals Box with Moiré Anti-Rasterization Texture -->
                <div class="moire-summary-box">
                    <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">Taxable Subtotal:</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">₹ {{ number_format($invoice->subtotal, 2) }}</td>
                        </tr>
                        @if($invoice->discount_amount > 0)
                        <tr>
                            <td style="padding: 2.5px 0; color: #047857;">Discount ({{ $invoice->discount_percentage }}%):</td>
                            <td style="padding: 2.5px 0; text-align: right; color: #047857;" class="font-mono">- ₹ {{ number_format($invoice->discount_amount, 2) }}</td>
                        </tr>
                        @endif

                        @if(!$isInterState)
                        <!-- CGST + SGST Split (Intra-state) -->
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">Central GST (CGST 9%):</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">+ ₹ {{ number_format($cgstAmount, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">State GST (SGST 9%):</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">+ ₹ {{ number_format($sgstAmount, 2) }}</td>
                        </tr>
                        @else
                        <!-- IGST (Inter-state) -->
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">Integrated GST (IGST 18%):</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">+ ₹ {{ number_format($igstAmount, 2) }}</td>
                        </tr>
                        @endif

                        @if($invoice->round_off != 0)
                        <tr>
                            <td style="padding: 2.5px 0; color: #64748b;">Round Off Adjustment:</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">₹ {{ number_format($invoice->round_off, 2) }}</td>
                        </tr>
                        @endif

                        <tr class="grand-total-row">
                            <td style="padding: 5px 0; font-size: 10pt; font-weight: bold; color: #1e3a8a;">TOTAL INVOICE AMOUNT:</td>
                            <td style="padding: 5px 0; text-align: right;" class="grand-total-val font-mono">₹ {{ number_format($invoice->total_amount, 2) }}</td>
                        </tr>
                        @if($invoice->paid_amount > 0)
                        <tr>
                            <td style="padding: 2px 0; color: #15803d; font-size: 8pt;">Amount Paid / Settled:</td>
                            <td style="padding: 2px 0; text-align: right; color: #15803d; font-weight: bold;" class="font-mono">₹ {{ number_format($invoice->paid_amount, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 2px 0; color: #b91c1c; font-size: 8.5pt; font-weight: bold;">Balance Due:</td>
                            <td style="padding: 2px 0; text-align: right; color: #b91c1c; font-weight: bold;" class="font-mono">₹ {{ number_format($invoice->due_amount, 2) }}</td>
                        </tr>
                        @endif
                    </table>
                </div>

                <!-- Amount In Words -->
                <div style="font-size: 7.5pt; color: #475569; margin-top: 5px; background: #ffffff; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                    <strong>Amount in Words:</strong> {{ $amountInWords }}
                </div>
            </td>
        </tr>
    </table>

@endsection
