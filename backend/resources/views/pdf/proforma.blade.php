@extends('pdf.layout')

@section('title', 'Proforma Invoice - ' . $proforma->proforma_number)

@section('badge')
    <span class="badge-pill-purple">PROFORMA INVOICE</span>
@endsection

@section('doc-number', $proforma->proforma_number)
@section('doc-date', \Carbon\Carbon::parse($proforma->invoice_date)->format('d M Y'))

@section('doc-meta-right')
    Due Date: <span class="doc-value">{{ \Carbon\Carbon::parse($proforma->due_date)->format('d M Y') }}</span><br/>
    @if($proforma->estimate || $proforma->estimate_number)
        Source Quote: <span class="doc-value font-mono" style="color: #7c3aed;">{{ $proforma->estimate?->estimate_number ?? $proforma->estimate_number }}</span>
    @endif
@endsection

@section('signature-right')
    <div class="sign-title">Client Acceptance Signature</div>
    <div class="sign-sub">Name & Corporate Seal</div>
@endsection

@section('content')

    <!-- Recipient Client & Project Info Cards -->
    <table>
        <tr>
            <td style="width: 48.5%; vertical-align: top;" class="card-box">
                <div class="card-header-label">BILLED TO (CLIENT)</div>
                <div class="card-main-title">{{ $proforma->client_name }}</div>
                <div class="card-sub-title">{{ $proforma->client_company ?? 'Direct Client' }}</div>
                <div class="card-body-text">
                    {{ $proforma->client_email }}<br/>
                    @if(!empty($proforma->client_phone))
                        {{ $proforma->client_phone }}<br/>
                    @endif
                    @if(!empty($proforma->client_address))
                        {{ $proforma->client_address }}<br/>
                    @endif
                    @if(!empty($proforma->client_gstin))
                        <span style="color: #7c3aed; font-weight: bold; font-family: monospace;">GSTIN: {{ $proforma->client_gstin }}</span>
                    @endif
                </div>
            </td>
            <td style="width: 3%;"></td>
            <td style="width: 48.5%; vertical-align: top;" class="card-box">
                <div class="card-header-label">PROJECT ENGAGEMENT</div>
                <div class="card-main-title">{{ $proforma->project?->name ?? 'Corporate Engagement' }}</div>
                <div class="card-body-text" style="margin-top: 4px;">
                    @if(!empty($proforma->project?->code))
                        <span style="color: #7c3aed; font-weight: bold; font-family: monospace;">Project Code: {{ $proforma->project->code }}</span><br/>
                    @endif
                    Currency: <span class="doc-value">{{ $proforma->currency ?? 'INR' }}</span><br/>
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
                <th style="width: 52%; text-align: left;">ITEM DESCRIPTION & SCOPE</th>
                <th style="width: 16%; text-align: right;">QTY / HOURS</th>
                <th style="width: 16%; text-align: right;">UNIT RATE</th>
                <th style="width: 16%; text-align: right;">AMOUNT ({{ $proforma->currency ?? 'INR' }})</th>
            </tr>
        </thead>
        <tbody>
            @forelse($proforma->items as $item)
            <tr>
                <td style="width: 52%; text-align: left; vertical-align: top;">
                    <span style="font-size: 8.5pt; font-weight: bold; color: #0f172a;">{{ $item->item_name }}</span>
                    @if(!empty($item->description))
                        <br/><span style="font-size: 7.5pt; color: #64748b;">{{ $item->description }}</span>
                    @endif
                </td>
                <td style="width: 16%; text-align: right; vertical-align: top; color: #334155; font-size: 8.5pt;">
                    {{ number_format($item->quantity, 2) }} {{ $item->unit ?? 'hours' }}
                </td>
                <td style="width: 16%; text-align: right; vertical-align: top; color: #334155; font-size: 8.5pt;">
                    {{ number_format($item->unit_price, 2) }}
                </td>
                <td style="width: 16%; text-align: right; vertical-align: top; font-weight: bold; color: #0f172a; font-size: 8.5pt;">
                    {{ number_format($item->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 15px;">No line items specified.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Bank / Terms (Left) & Totals (Right) -->
    <table>
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 12px;">
                <!-- Bank Details Card -->
                <div class="note-card">
                    <div class="note-card-title">BANK SETTLEMENT COORDINATES</div>
                    <div class="note-card-body">
                        Bank: <strong>{{ $bank['name'] }}</strong><br/>
                        A/C Name: <strong>{{ $bank['account_name'] }}</strong><br/>
                        Account Number: <strong class="font-mono" style="color: #0f172a;">{{ $bank['account_number'] }}</strong><br/>
                        IFSC Code: <strong class="font-mono" style="color: #0f172a;">{{ $bank['ifsc_code'] }}</strong> &bull; Branch: {{ $bank['branch'] }}
                        @if(!empty($bank['upi_id']))
                            <br/>UPI ID: <strong class="font-mono">{{ $bank['upi_id'] }}</strong>
                        @endif
                    </div>
                </div>

                <!-- Commercial Terms Card -->
                <div class="note-card">
                    <div class="note-card-title">COMMERCIAL TERMS & NOTES</div>
                    <div class="note-card-body">
                        {{ $proforma->terms_and_conditions ?: 'This Proforma Invoice serves as an advance demand notice for milestone initiation. Valid for 30 days.' }}
                    </div>
                </div>
            </td>
            <td style="width: 48%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td style="width: 55%; color: #64748b;">Subtotal:</td>
                        <td style="width: 45%; text-align: right; font-family: monospace; color: #0f172a;">
                            ₹{{ number_format($proforma->subtotal, 2) }}
                        </td>
                    </tr>
                    @if((float)$proforma->discount_amount > 0)
                    <tr>
                        <td style="color: #059669;">
                            Discount ({{ number_format((float)$proforma->discount_rate, 2) }}%):
                        </td>
                        <td style="text-align: right; font-family: monospace; color: #059669;">
                            -₹{{ number_format((float)$proforma->discount_amount, 2) }}
                        </td>
                    </tr>
                    @endif
                    @if($isInterState)
                    <tr>
                        <td style="color: #64748b;">IGST (18.00%):</td>
                        <td style="text-align: right; font-family: monospace; color: #0f172a;">
                            ₹{{ number_format($igstAmount, 2) }}
                        </td>
                    </tr>
                    @else
                    <tr>
                        <td style="color: #64748b;">CGST (9.00%):</td>
                        <td style="text-align: right; font-family: monospace; color: #0f172a;">
                            ₹{{ number_format($cgstAmount, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #64748b;">SGST (9.00%):</td>
                        <td style="text-align: right; font-family: monospace; color: #0f172a;">
                            ₹{{ number_format($sgstAmount, 2) }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td colspan="2" style="border-top: 1.5px solid #e2e8f0; padding-top: 6px; margin-top: 4px;"></td>
                    </tr>
                    <tr>
                        <td class="grand-total-label">Grand Total:</td>
                        <td class="grand-total-amount text-right font-mono" style="color: #7c3aed;">
                            ₹{{ number_format($proforma->total_amount, 2) }}
                        </td>
                    </tr>
                    @if(!empty($amountInWords))
                    <tr>
                        <td colspan="2" style="padding-top: 3px; font-size: 7.2pt; color: #64748b; font-style: italic;">
                            ({{ $amountInWords }})
                        </td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

@endsection
