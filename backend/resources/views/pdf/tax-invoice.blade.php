@extends('pdf.layout')

@section('title', 'Tax Invoice - ' . $invoice->invoice_number)

@section('badge')
    <span class="badge-invoice">TAX INVOICE</span>
@endsection

@section('doc-number', $invoice->invoice_number)
@section('doc-date', \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y'))

@section('doc-meta-right')
    Payment Due: <strong style="color: #0f172a;">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</strong><br/>
    @if($invoice->proformaInvoice)
        Proforma Ref: <strong style="color: #059669;">{{ $invoice->proformaInvoice->proforma_number }}</strong>
    @endif
@endsection

@section('signature-right')
    <div class="sign-title">Client Acceptance Signature</div>
    <div class="sign-sub">Name & Corporate Seal</div>
@endsection

@section('content')

    <!-- Recipient Client & Project Info Cards -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 14px;">
        <tr>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">BILLED TO (CLIENT)</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 2px;">{{ $invoice->client_name }}</div>
                <div style="font-size: 8pt; font-weight: 500; color: #475569; margin-bottom: 2px;">{{ $invoice->client_company ?? 'Direct Client' }}</div>
                <div style="font-size: 7.5pt; color: #64748b; line-height: 1.35;">
                    {{ $invoice->client_email }}<br/>
                    @if(!empty($invoice->client_phone))
                        {{ $invoice->client_phone }}<br/>
                    @endif
                    @if(!empty($invoice->client_address))
                        {{ $invoice->client_address }}<br/>
                    @endif
                    @if(!empty($invoice->client_gstin))
                        <strong style="color: #059669;">GSTIN: {{ $invoice->client_gstin }}</strong>
                    @else
                        <span style="color: #94a3b8; font-size: 7.2pt;">Unregistered Consumer (B2C)</span>
                    @endif
                </div>
            </td>
            <td style="width: 3%;"></td>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">PROJECT REFERENCE</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 3px;">{{ $invoice->project?->name ?? 'Corporate Engagement' }}</div>
                <div style="font-size: 7.5pt; color: #64748b; line-height: 1.4;">
                    @if(!empty($invoice->project?->code))
                        <span style="color: #059669; font-weight: bold;">Project Code: {{ $invoice->project->code }}</span><br/>
                    @endif
                    Currency: <strong style="color: #0f172a;">{{ $invoice->currency ?? 'INR' }}</strong><br/>
                    Place of Supply: <span style="color: #0f172a;">{{ $placeOfSupply }}</span><br/>
                    Status: <strong style="text-transform: uppercase; color: {{ $invoice->status === 'paid' ? '#059669' : ($invoice->status === 'overdue' ? '#dc2626' : '#d97706') }};">{{ $invoice->status }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 52%; text-align: left;">ITEM DESCRIPTION &amp; SCOPE</th>
                <th style="width: 16%; text-align: right;">QTY / HOURS</th>
                <th style="width: 16%; text-align: right;">UNIT RATE</th>
                <th style="width: 16%; text-align: right;">TAXABLE AMOUNT ({{ $invoice->currency ?? 'INR' }})</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoice->items as $item)
            <tr>
                <td style="text-align: left;">
                    <div style="font-size: 8pt; font-weight: bold; color: #0f172a;">{{ $item->item_name }}</div>
                    @if(!empty($item->description))
                        <div style="font-size: 7.2pt; color: #64748b; margin-top: 1px; line-height: 1.3;">{{ $item->description }}</div>
                    @endif
                    <div style="font-size: 6.8pt; color: #94a3b8; margin-top: 1px;">
                        SAC: {{ $item->sac_code ?? $company['sac_code'] }}
                    </div>
                </td>
                <td style="text-align: right; color: #334155; font-size: 8pt;">
                    {{ number_format($item->quantity, 2) }} {{ $item->unit ?? 'hours' }}
                </td>
                <td style="text-align: right; color: #334155; font-size: 8pt;">
                    {{ number_format($item->unit_price, 2) }}
                </td>
                <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 8pt;">
                    {{ number_format($item->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px;">No line items recorded.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Bank / Terms (Left) & Totals (Right) -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; page-break-inside: avoid;">
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 14px;">
                <!-- Bank Coordinates Card -->
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

                <!-- Terms Card -->
                <div class="note-card">
                    <div class="note-card-title">STATUTORY GST DECLARATION &amp; TERMS</div>
                    <div class="note-card-body">
                        {{ $invoice->terms_and_conditions ?: 'Invoice issued under Section 31 of CGST Act 2017 for supply of IT & Software Engineering Services (SAC 998314). All disputes subject to Guwahati, Assam jurisdiction.' }}
                    </div>
                </div>
            </td>
            <td style="width: 48%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td style="width: 55%; color: #64748b;">Subtotal:</td>
                        <td style="width: 45%; text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($invoice->subtotal, 2) }}
                        </td>
                    </tr>
                    @if((float)$invoice->discount_amount > 0)
                    <tr>
                        <td style="color: #059669;">
                            Discount ({{ number_format((float)$invoice->discount_rate, 2) }}%):
                        </td>
                        <td style="text-align: right; color: #059669;">
                            -&#8377;{{ number_format((float)$invoice->discount_amount, 2) }}
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
                        <td colspan="2" style="border-top: 1.5px solid #cbd5e1; padding-top: 4px; margin-top: 3px;"></td>
                    </tr>
                    <tr>
                        <td class="grand-total-label">Grand Total:</td>
                        <td class="grand-total-amount">
                            &#8377;{{ number_format($invoice->total_amount, 2) }}
                        </td>
                    </tr>
                    @if(!empty($amountInWords))
                    <tr>
                        <td colspan="2" style="text-align: right; font-size: 7pt; color: #64748b; font-style: italic; padding-top: 2px;">
                            ({{ $amountInWords }})
                        </td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

@endsection
