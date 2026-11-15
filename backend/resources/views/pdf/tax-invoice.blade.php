@extends('pdf.layout')

@section('title', 'Tax Invoice - ' . $invoice->invoice_number)

@section('badge')
    <span class="badge-pill-blue">TAX INVOICE</span>
@endsection

@section('doc-number', $invoice->invoice_number)
@section('doc-date', \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y'))

@section('doc-meta-right')
    Payment Due: <span class="doc-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</span><br/>
    @if($invoice->proformaInvoice)
        Proforma Ref: <span class="doc-value font-mono" style="color: #2563eb;">{{ $invoice->proformaInvoice->proforma_number }}</span>
    @endif
@endsection

@section('signature-right')
    <div class="sign-title">Client Seal & Acceptance</div>
    <div class="sign-sub">PAdES Digitally Signed & Sealed</div>
@endsection

@section('content')

    <!-- Recipient Client & Project Info Cards -->
    <table>
        <tr>
            <td style="width: 48.5%; vertical-align: top;" class="card-box">
                <div class="card-header-label">BILLED TO (CLIENT)</div>
                <div class="card-main-title">{{ $invoice->client_name }}</div>
                <div class="card-sub-title">{{ $invoice->client_company ?? 'Direct Client' }}</div>
                <div class="card-body-text">
                    {{ $invoice->client_email }}<br/>
                    @if(!empty($invoice->client_phone))
                        {{ $invoice->client_phone }}<br/>
                    @endif
                    @if(!empty($invoice->client_address))
                        {{ $invoice->client_address }}<br/>
                    @endif
                    @if(!empty($invoice->client_gstin))
                        <span style="color: #2563eb; font-weight: bold; font-family: monospace;">GSTIN: {{ $invoice->client_gstin }}</span>
                    @else
                        <span style="color: #94a3b8; font-size: 7.5pt;">Unregistered Consumer (B2C)</span>
                    @endif
                </div>
            </td>
            <td style="width: 3%;"></td>
            <td style="width: 48.5%; vertical-align: top;" class="card-box">
                <div class="card-header-label">PROJECT REFERENCE</div>
                <div class="card-main-title">{{ $invoice->project?->name ?? 'Corporate Engagement' }}</div>
                <div class="card-body-text" style="margin-top: 4px;">
                    @if(!empty($invoice->project?->code))
                        <span style="color: #2563eb; font-weight: bold; font-family: monospace;">Project Code: {{ $invoice->project->code }}</span><br/>
                    @endif
                    Currency: <span class="doc-value">{{ $invoice->currency ?? 'INR' }}</span><br/>
                    Place of Supply: <span style="color: #0f172a;">{{ $placeOfSupply }}</span><br/>
                    Status: <strong class="status-{{ $invoice->status === 'paid' ? 'paid' : ($invoice->status === 'overdue' ? 'overdue' : 'pending') }}" style="text-transform: uppercase;">{{ $invoice->status }}</strong>
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
                <th style="width: 16%; text-align: right;">TAXABLE AMOUNT ({{ $invoice->currency ?? 'INR' }})</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoice->items as $item)
            <tr>
                <td style="text-align: left;">
                    <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">{{ $item->item_name }}</div>
                    @if(!empty($item->description))
                        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">{{ $item->description }}</div>
                    @endif
                    <div style="font-size: 7pt; color: #94a3b8; font-family: monospace; margin-top: 1px;">
                        SAC: {{ $item->sac_code ?? $company['sac_code'] }}
                    </div>
                </td>
                <td style="text-align: right; color: #334155; font-size: 8.5pt;">
                    {{ number_format($item->quantity, 2) }} {{ $item->unit ?? 'hours' }}
                </td>
                <td style="text-align: right; color: #334155; font-size: 8.5pt; font-family: monospace;">
                    {{ number_format($item->unit_price, 2) }}
                </td>
                <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 9pt; font-family: monospace;">
                    {{ number_format($item->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 15px;">No line items recorded.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Bank / Terms (Left) & Totals (Right) -->
    <table>
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 12px;">
                <!-- Bank Coordinates Card -->
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

                <!-- Terms Card -->
                <div class="note-card">
                    <div class="note-card-title">STATUTORY GST DECLARATION & TERMS</div>
                    <div class="note-card-body">
                        {{ $invoice->terms_and_conditions ?: 'Invoice issued under Section 31 of CGST Act 2017 for supply of IT & Software Engineering Services (SAC 998314). All disputes subject to Guwahati, Assam jurisdiction.' }}
                    </div>
                </div>
            </td>
            <td style="width: 48%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td style="width: 55%; color: #64748b;">Subtotal:</td>
                        <td style="width: 45%; text-align: right; font-family: monospace; color: #0f172a;">
                            ₹{{ number_format($invoice->subtotal, 2) }}
                        </td>
                    </tr>
                    @if((float)$invoice->discount_amount > 0)
                    <tr>
                        <td style="color: #059669;">
                            Discount ({{ number_format((float)$invoice->discount_rate, 2) }}%):
                        </td>
                        <td style="text-align: right; font-family: monospace; color: #059669;">
                            -₹{{ number_format((float)$invoice->discount_amount, 2) }}
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
                        <td class="grand-total-amount text-right font-mono">
                            ₹{{ number_format($invoice->total_amount, 2) }}
                        </td>
                    </tr>
                    @if((float)$invoice->paid_amount > 0)
                    <tr>
                        <td style="color: #059669; font-size: 8pt;">Paid Amount:</td>
                        <td style="text-align: right; font-family: monospace; color: #059669; font-size: 8pt;">
                            -₹{{ number_format((float)$invoice->paid_amount, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #dc2626; font-weight: bold; font-size: 8.5pt;">Balance Due:</td>
                        <td style="text-align: right; font-family: monospace; color: #dc2626; font-weight: bold; font-size: 8.5pt;">
                            ₹{{ number_format((float)$invoice->due_amount, 2) }}
                        </td>
                    </tr>
                    @endif
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
