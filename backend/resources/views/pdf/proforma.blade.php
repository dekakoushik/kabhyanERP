@extends('pdf.layout')

@section('title', 'Proforma Invoice - ' . $proforma->proforma_number)

@section('badge')
    <span class="badge-proforma">PROFORMA INVOICE</span>
@endsection

@section('doc-number', $proforma->proforma_number)
@section('doc-date', \Carbon\Carbon::parse($proforma->invoice_date)->format('d M Y'))

@section('doc-meta-right')
    Due Date: <strong style="color: #0f172a;">{{ \Carbon\Carbon::parse($proforma->due_date)->format('d M Y') }}</strong><br/>
    @if($proforma->estimate || $proforma->estimate_number)
        Source Quote: <strong style="color: #7c3aed;">{{ $proforma->estimate?->estimate_number ?? $proforma->estimate_number }}</strong>
    @endif
@endsection

@section('signature-right')
    <div class="sign-title">Client Acceptance Signature</div>
    <div class="sign-sub">Name & Corporate Seal</div>
@endsection

@section('content')

    <!-- Recipient Client & Project Info Cards -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 16px;">
        <tr>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">BILLED TO (CLIENT)</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 2px;">{{ $proforma->client_name }}</div>
                <div style="font-size: 8.5pt; font-weight: 500; color: #475569; margin-bottom: 3px;">{{ $proforma->client_company ?? 'Direct Client' }}</div>
                <div style="font-size: 7.8pt; color: #64748b; line-height: 1.4;">
                    {{ $proforma->client_email }}<br/>
                    @if(!empty($proforma->client_phone))
                        {{ $proforma->client_phone }}<br/>
                    @endif
                    @if(!empty($proforma->client_address))
                        {{ $proforma->client_address }}<br/>
                    @endif
                    @if(!empty($proforma->client_gstin))
                        <strong style="color: #7c3aed;">GSTIN: {{ $proforma->client_gstin }}</strong>
                    @endif
                </div>
            </td>
            <td style="width: 3%;"></td>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">PROJECT ENGAGEMENT</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 3px;">{{ $proforma->project?->name ?? 'Corporate Engagement' }}</div>
                <div style="font-size: 7.8pt; color: #64748b; line-height: 1.45;">
                    @if(!empty($proforma->project?->code))
                        <span style="color: #7c3aed; font-weight: bold;">Project Code: {{ $proforma->project->code }}</span><br/>
                    @endif
                    Currency: <strong style="color: #0f172a;">{{ $proforma->currency ?? 'INR' }}</strong><br/>
                    Place of Supply: <span style="color: #0f172a;">{{ $placeOfSupply }}</span><br/>
                    @if($proforma->estimate || $proforma->estimate_number)
                        Derived from Quote: <strong style="color: #7c3aed;">{{ $proforma->estimate?->estimate_number ?? $proforma->estimate_number }}</strong>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%; text-align: left;">ITEM DESCRIPTION &amp; SCOPE</th>
                <th style="width: 16%; text-align: right;">QTY / HOURS</th>
                <th style="width: 17%; text-align: right;">UNIT RATE</th>
                <th style="width: 17%; text-align: right;">AMOUNT ({{ $proforma->currency ?? 'INR' }})</th>
            </tr>
        </thead>
        <tbody>
            @forelse($proforma->items as $item)
            <tr>
                <td style="text-align: left;">
                    <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a;">{{ $item->item_name }}</div>
                    @if(!empty($item->description))
                        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px; line-height: 1.35;">{{ $item->description }}</div>
                    @endif
                </td>
                <td style="text-align: right; color: #334155; font-size: 8.5pt;">
                    {{ number_format($item->quantity, 2) }} {{ $item->unit ?? 'hours' }}
                </td>
                <td style="text-align: right; color: #334155; font-size: 8.5pt;">
                    {{ number_format($item->unit_price, 2) }}
                </td>
                <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 8.5pt;">
                    {{ number_format($item->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 16px;">No line items specified.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Bank / Terms (Left) & Totals (Right) -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 18px; page-break-inside: avoid;">
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 14px;">
                <!-- Bank Details Card -->
                <div class="note-card">
                    <div class="note-card-title">BANK SETTLEMENT COORDINATES</div>
                    <div class="note-card-body">
                        Bank: <strong>{{ $bank['name'] }}</strong><br/>
                        A/C Name: <strong>{{ $bank['account_name'] }}</strong><br/>
                        Account Number: <strong style="color: #0f172a;">{{ $bank['account_number'] }}</strong><br/>
                        IFSC Code: <strong style="color: #0f172a;">{{ $bank['ifsc_code'] }}</strong> &bull; Branch: {{ $bank['branch'] }}
                        @if(!empty($bank['upi_id']))
                            <br/>UPI ID: <strong>{{ $bank['upi_id'] }}</strong>
                        @endif
                    </div>
                </div>

                <!-- Commercial Terms Card -->
                <div class="note-card">
                    <div class="note-card-title">COMMERCIAL TERMS &amp; NOTES</div>
                    <div class="note-card-body">
                        {{ $proforma->terms_and_conditions ?: 'This Proforma Invoice serves as an advance demand notice for milestone initiation. Valid for 30 days.' }}
                    </div>
                </div>
            </td>
            <td style="width: 48%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td style="width: 55%; color: #64748b;">Subtotal:</td>
                        <td style="width: 45%; text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($proforma->subtotal, 2) }}
                        </td>
                    </tr>
                    @if((float)$proforma->discount_amount > 0)
                    <tr>
                        <td style="color: #059669;">
                            Discount ({{ number_format((float)$proforma->discount_rate, 2) }}%):
                        </td>
                        <td style="text-align: right; color: #059669;">
                            -&#8377;{{ number_format((float)$proforma->discount_amount, 2) }}
                        </td>
                    </tr>
                    @endif
                    @if($isInterState)
                    <tr>
                        <td style="color: #64748b;">IGST (18.00%):</td>
                        <td style="text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($igstAmount, 2) }}
                        </td>
                    </tr>
                    @else
                    <tr>
                        <td style="color: #64748b;">CGST (9.00%):</td>
                        <td style="text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($cgstAmount, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #64748b;">SGST (9.00%):</td>
                        <td style="text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($sgstAmount, 2) }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td colspan="2" style="border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 3px;"></td>
                    </tr>
                    <tr>
                        <td class="grand-total-label">Grand Total:</td>
                        <td class="grand-total-amount">
                            &#8377;{{ number_format($proforma->total_amount, 2) }}
                        </td>
                    </tr>
                    @if(!empty($amountInWords))
                    <tr>
                        <td colspan="2" style="text-align: right; font-size: 7.5pt; color: #64748b; font-style: italic; padding-top: 3px;">
                            ({{ $amountInWords }})
                        </td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

@endsection
