@extends('pdf.layout')

@section('title', 'Commercial Estimate - ' . $estimate->estimate_number)

@section('badge')
    <span class="badge-estimate">COMMERCIAL ESTIMATE</span>
@endsection

@section('doc-number', $estimate->estimate_number)
@section('doc-date', \Carbon\Carbon::parse($estimate->estimate_date)->format('d M Y'))

@section('doc-meta-right')
    Valid Until: <strong style="color: #0f172a;">{{ \Carbon\Carbon::parse($estimate->expiry_date)->format('d M Y') }}</strong>
@endsection

@section('signature-right')
    <div class="sign-title">Client Acceptance Signature</div>
    <div class="sign-sub">Name & Corporate Seal</div>
@endsection

@section('content')

    <!-- Recipient Client & Project Info Cards -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 18px;">
        <tr>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
                <div style="font-size: 7.2pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">PREPARED FOR CLIENT</div>
                <div style="font-size: 11pt; font-weight: bold; color: #0f172a; margin-bottom: 3px;">{{ $estimate->client_name }}</div>
                <div style="font-size: 8.5pt; font-weight: 500; color: #475569; margin-bottom: 3px;">{{ $estimate->client_company ?? 'Direct Client' }}</div>
                <div style="font-size: 7.8pt; color: #64748b; line-height: 1.4;">
                    {{ $estimate->client_email }}<br/>
                    @if(!empty($estimate->client_phone))
                        {{ $estimate->client_phone }}<br/>
                    @endif
                    @if(!empty($estimate->client_address))
                        {{ $estimate->client_address }}<br/>
                    @endif
                    @if(!empty($estimate->client_gstin))
                        <strong style="color: #2563eb;">GSTIN: {{ $estimate->client_gstin }}</strong>
                    @endif
                </div>
            </td>
            <td style="width: 3%;"></td>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
                <div style="font-size: 7.2pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">PROJECT ENGAGEMENT</div>
                <div style="font-size: 11pt; font-weight: bold; color: #0f172a; margin-bottom: 4px;">{{ $estimate->project?->name ?? 'General IT Deliverables' }}</div>
                <div style="font-size: 7.8pt; color: #64748b; line-height: 1.45;">
                    @if(!empty($estimate->project?->code))
                        <span style="color: #2563eb; font-weight: bold;">Project Code: {{ $estimate->project->code }}</span><br/>
                    @endif
                    Currency: <strong style="color: #0f172a;">{{ $estimate->currency ?? 'INR' }}</strong><br/>
                    Place of Supply: <span style="color: #0f172a;">{{ $placeOfSupply }}</span>
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
                <th style="width: 16%; text-align: right;">AMOUNT ({{ $estimate->currency ?? 'INR' }})</th>
            </tr>
        </thead>
        <tbody>
            @forelse($estimate->items as $item)
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
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 15px;">No line items specified.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Scope Notes / Commercial Terms (Left) & Totals (Right) -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 20px; page-break-inside: avoid;">
        <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 16px;">
                <!-- Scope Notes Card -->
                <div class="note-card">
                    <div class="note-card-title">SCOPE NOTES</div>
                    <div class="note-card-body">
                        {{ $estimate->notes ?: 'Proposal includes 3 months warranty, architecture documentation, and staging deployment.' }}
                    </div>
                </div>

                <!-- Commercial Terms Card -->
                <div class="note-card">
                    <div class="note-card-title">COMMERCIAL TERMS</div>
                    <div class="note-card-body">
                        {{ $estimate->terms_and_conditions ?: 'Payment terms: 50% mobilization advance, 50% upon final acceptance testing. Valid for 30 days.' }}
                    </div>
                </div>
            </td>
            <td style="width: 48%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td style="width: 55%; color: #64748b;">Subtotal:</td>
                        <td style="width: 45%; text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($estimate->subtotal, 2) }}
                        </td>
                    </tr>
                    @if((float)$estimate->discount_amount > 0)
                    <tr>
                        <td style="color: #059669;">
                            Discount ({{ number_format((float)$estimate->discount_rate, 2) }}%):
                        </td>
                        <td style="text-align: right; color: #059669;">
                            -&#8377;{{ number_format((float)$estimate->discount_amount, 2) }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td style="color: #64748b;">
                            GST / Tax ({{ number_format((float)($estimate->tax_rate ?? 18), 2) }}%):
                        </td>
                        <td style="text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($estimate->tax_amount, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 4px;"></td>
                    </tr>
                    <tr>
                        <td class="grand-total-label">Grand Total:</td>
                        <td class="grand-total-amount">
                            &#8377;{{ number_format($estimate->total_amount, 2) }}
                        </td>
                    </tr>
                    @if(!empty($amountInWords))
                    <tr>
                        <td colspan="2" style="text-align: right; font-size: 7.2pt; color: #64748b; font-style: italic; padding-top: 3px;">
                            ({{ $amountInWords }})
                        </td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

@endsection
