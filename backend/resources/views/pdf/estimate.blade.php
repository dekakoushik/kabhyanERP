@extends('pdf.layout')

@section('title', 'Quotation / Estimate - ' . $estimate->estimate_number)
@section('doc-title', 'QUOTATION / ESTIMATE')
@section('doc-number-label', 'Estimate Number')
@section('doc-number', $estimate->estimate_number)
@section('doc-date', \Carbon\Carbon::parse($estimate->estimate_date)->format('d M Y'))
@section('doc-due-date', \Carbon\Carbon::parse($estimate->expiry_date)->format('d M Y'))

@section('doc-additional-meta')
    <strong>Proposal Nature:</strong> <span style="font-weight: bold; color: #1e3a8a;">Commercial Scope & Budget</span><br/>
    <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: {{ $estimate->status === 'accepted' ? '#15803d' : ($estimate->status === 'rejected' ? '#b91c1c' : '#b45309') }};">{{ $estimate->status }}</span>
@endsection

@section('content')

    <!-- Billed To & Contract Information -->
    <table class="meta-table" style="margin-bottom: 8px;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 6px;">
                <div class="info-card">
                    <div class="info-card-header">PROPOSAL RECIPIENT CLIENT</div>
                    <div style="font-size: 10pt; font-weight: bold; color: #0f172a;">{{ $estimate->client_company ?? $estimate->client_name }}</div>
                    <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
                        Attn: <strong>{{ $estimate->client_name }}</strong><br/>
                        {{ $estimate->client_address ?? 'Address on file' }}<br/>
                        Email: {{ $estimate->client_email }} | Phone: {{ $estimate->client_phone ?? 'N/A' }}<br/>
                        GSTIN: <strong class="font-mono" style="color: #1e3a8a;">{{ $estimate->client_gstin ?? 'UNREGISTERED' }}</strong>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 6px;">
                <div class="info-card">
                    <div class="info-card-header">COMMERCIAL TERMS & TIMELINE</div>
                    <table style="width: 100%; font-size: 8pt; color: #475569;">
                        <tr>
                            <td style="width: 45%;"><strong>Place of Supply:</strong></td>
                            <td>{{ $placeOfSupply }}</td>
                        </tr>
                        <tr>
                            <td><strong>Applicable Tax Rate:</strong></td>
                            <td style="font-weight: bold; color: #1e3a8a;">{{ $isInterState ? '18% IGST' : '18% GST (9% CGST + 9% SGST)' }}</td>
                        </tr>
                        @if($estimate->project)
                        <tr>
                            <td><strong>Target Project:</strong></td>
                            <td>{{ $estimate->project->name }} ({{ $estimate->project->code }})</td>
                        </tr>
                        @endif
                        <tr>
                            <td><strong>Estimate Validity:</strong></td>
                            <td>Until {{ \Carbon\Carbon::parse($estimate->expiry_date)->format('d M Y') }}</td>
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
                <th style="width: 47%; text-align: left;">Scope & Deliverable Description</th>
                <th style="width: 12%; text-align: center;">SAC / HSN</th>
                <th style="width: 8%; text-align: center;">Qty</th>
                <th style="width: 13%; text-align: right;">Unit Rate (₹)</th>
                <th style="width: 15%; text-align: right;">Total Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($estimate->items as $index => $item)
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

    <!-- Bottom Section -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 8px;">
                <!-- Terms & Acceptance Card -->
                <div class="info-card" style="font-size: 7.5pt; color: #475569; line-height: 1.35;">
                    <div class="info-card-header">PROPOSAL ACCEPTANCE TERMS</div>
                    1. Deliverables will be initiated upon formal acceptance and signing of the Statement of Work (SOW).<br/>
                    2. Payment terms: 50% advance milestone initiation, 50% upon sprint delivery.<br/>
                    3. Taxes: Applicable GST is calculated as per prevailing statutory norms at time of invoice.<br/>
                    @if($estimate->notes)
                    <strong>Notes:</strong> {{ $estimate->notes }}<br/>
                    @endif
                </div>
            </td>

            <td style="width: 48%; vertical-align: top; padding-left: 8px;">
                <!-- Totals Box with Moiré Texture -->
                <div class="moire-summary-box">
                    <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 2.5px 0; color: #475569;">Taxable Subtotal:</td>
                            <td style="padding: 2.5px 0; text-align: right;" class="font-mono">₹ {{ number_format($estimate->subtotal, 2) }}</td>
                        </tr>
                        @if($estimate->discount_amount > 0)
                        <tr>
                            <td style="padding: 2.5px 0; color: #047857;">Discount ({{ $estimate->discount_percentage }}%):</td>
                            <td style="padding: 2.5px 0; text-align: right; color: #047857;" class="font-mono">- ₹ {{ number_format($estimate->discount_amount, 2) }}</td>
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

                        <tr class="grand-total-row">
                            <td style="padding: 5px 0; font-size: 10pt; font-weight: bold; color: #1e3a8a;">ESTIMATED TOTAL:</td>
                            <td style="padding: 5px 0; text-align: right;" class="grand-total-val font-mono">₹ {{ number_format($estimate->total_amount, 2) }}</td>
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
