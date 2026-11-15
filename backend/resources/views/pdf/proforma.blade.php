@extends('pdf.layout')

@section('title', 'Proforma Invoice - ' . $proforma->proforma_number)
@section('doc-title', 'PROFORMA INVOICE')
@section('doc-number-label', 'Proforma Number')
@section('doc-number', $proforma->proforma_number)
@section('doc-date', \Carbon\Carbon::parse($proforma->invoice_date)->format('d M Y'))
@section('doc-due-date', \Carbon\Carbon::parse($proforma->due_date)->format('d M Y'))

@section('doc-additional-meta')
    @if($proforma->estimate_number)
        <strong>Estimate Ref:</strong> <span class="font-mono">{{ $proforma->estimate_number }}</span><br/>
    @endif
    <strong>Billing Nature:</strong> <span style="font-weight: bold; color: #1e3a8a;">Advance Milestone Initiation</span><br/>
    <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: {{ $proforma->status === 'paid' || $proforma->status === 'fully_invoiced' ? '#15803d' : '#b45309' }};">{{ str_replace('_', ' ', $proforma->status) }}</span>
@endsection

@section('content')

    <!-- Billed To & Contract Information -->
    <table class="meta-table" style="margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 6px;">
                <div class="info-card">
                    <div class="info-card-header">BILLED TO (RECIPIENT CLIENT)</div>
                    <div style="font-size: 10pt; font-weight: bold; color: #0f172a;">{{ $proforma->client_company ?? $proforma->client_name }}</div>
                    <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
                        Attn: <strong>{{ $proforma->client_name }}</strong><br/>
                        {{ $proforma->client_address ?? 'Address on file' }}<br/>
                        Email: {{ $proforma->client_email }} | Phone: {{ $proforma->client_phone ?? 'N/A' }}<br/>
                        GSTIN: <strong class="font-mono" style="color: #1e3a8a;">{{ $proforma->client_gstin ?? 'UNREGISTERED' }}</strong>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 6px;">
                <div class="info-card">
                    <div class="info-card-header">COMMERCIAL CONTRACT SPECIFICATIONS</div>
                    <table style="width: 100%; font-size: 8pt; color: #475569;">
                        <tr>
                            <td style="width: 45%;"><strong>Place of Supply:</strong></td>
                            <td>{{ $placeOfSupply }}</td>
                        </tr>
                        <tr>
                            <td><strong>Estimated GST Class:</strong></td>
                            <td style="font-weight: bold; color: #1e3a8a;">{{ $isInterState ? 'IGST (Integrated Tax 18%)' : 'CGST (9%) + SGST (9%)' }}</td>
                        </tr>
                        @if($proforma->project)
                        <tr>
                            <td><strong>Target Project:</strong></td>
                            <td>{{ $proforma->project->name }} ({{ $proforma->project->code }})</td>
                        </tr>
                        @endif
                        <tr>
                            <td><strong>Invoice Class:</strong></td>
                            <td>Advance Demand Notice (Non-Tax Commercial)</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 47%; text-align: left;">Scope & Milestone Deliverable</th>
                <th style="width: 12%; text-align: center;">SAC / HSN</th>
                <th style="width: 8%; text-align: center;">Qty</th>
                <th style="width: 13%; text-align: right;">Unit Rate (₹)</th>
                <th style="width: 15%; text-align: right;">Taxable Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($proforma->items as $index => $item)
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
                <!-- Banking Remittance Card -->
                <div class="bank-box">
                    <div style="font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; font-size: 8pt;">
                        BANK WIRE & REMITTANCE DETAILS
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

                <!-- Terms -->
                <div style="font-size: 7pt; color: #64748b; margin-top: 6px; line-height: 1.3;">
                    <strong>Advance Billing Notice:</strong> This Proforma Invoice is issued for initiating advance milestone remittance. Formal Tax Invoice under Section 31 of CGST Act will be issued upon realization of funds or delivery.
                    @if($proforma->notes)
                    <br/><strong>Notes:</strong> {{ $proforma->notes }}
                    @endif
                </div>
            </td>

            <td style="width: 48%; vertical-align: top; padding-left: 8px;">
                <!-- Totals Box with Moiré Texture -->
                <div class="moire-summary-box">
                    <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">Taxable Subtotal:</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">₹ {{ number_format($proforma->subtotal, 2) }}</td>
                        </tr>
                        @if($proforma->discount_amount > 0)
                        <tr>
                            <td style="padding: 2.5px 0; color: #047857;">Discount ({{ $proforma->discount_percentage }}%):</td>
                            <td style="padding: 2.5px 0; text-align: right; color: #047857;" class="font-mono">- ₹ {{ number_format($proforma->discount_amount, 2) }}</td>
                        </tr>
                        @endif

                        @if(!$isInterState)
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">CGST (9%):</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">+ ₹ {{ number_format($cgstAmount, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">SGST (9%):</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">+ ₹ {{ number_format($sgstAmount, 2) }}</td>
                        </tr>
                        @else
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">IGST (18%):</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">+ ₹ {{ number_format($igstAmount, 2) }}</td>
                        </tr>
                        @endif

                        @if($proforma->round_off != 0)
                        <tr>
                            <td style="padding: 2.5px 0; color: #64748b;">Round Off Adjustment:</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">₹ {{ number_format($proforma->round_off, 2) }}</td>
                        </tr>
                        @endif

                        <tr class="grand-total-row">
                            <td style="padding: 5px 0; font-size: 10pt; font-weight: bold; color: #1e3a8a;">TOTAL PROFORMA AMOUNT:</td>
                            <td style="padding: 5px 0; text-align: right;" class="grand-total-val font-mono">₹ {{ number_format($proforma->total_amount, 2) }}</td>
                        </tr>
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
