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

@section('content')
@php
    $hasProject = !empty($estimate->project_id) && !empty($estimate->project);
    $taxType = $estimate->tax_calculation_type ?? 'exclusive';
    $isInclusive = ($taxType === 'inclusive');
    $defaultSac = $company['sac_code'] ?? '998314';
@endphp

    <!-- Recipient Client & Project Info Cards -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 16px;">
        <tr>
            @if($hasProject)
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
            @else
            <td style="width: 100%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
            @endif
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">PREPARED FOR CLIENT</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 2px;">{{ $estimate->client_name }}</div>
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
                    @else
                        <span style="color: #94a3b8;">Unregistered Client / Consumer</span>
                    @endif
                </div>
                @if(!$hasProject)
                    <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 7.8pt; color: #64748b;">
                        Currency: <strong style="color: #0f172a;">{{ $estimate->currency ?? 'INR' }}</strong> &bull;
                        Place of Supply: <strong style="color: #0f172a;">{{ $placeOfSupply }}</strong> &bull;
                        Pricing Basis: <strong style="color: #0f172a;">{{ $isInclusive ? 'Rates Inclusive of GST' : 'Rates Exclusive of GST' }}</strong>
                    </div>
                @endif
            </td>
            @if($hasProject)
                <td style="width: 3%;"></td>
                <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
                    <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">PROJECT ENGAGEMENT</div>
                    <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 3px;">{{ $estimate->project->name }}</div>
                    <div style="font-size: 7.8pt; color: #64748b; line-height: 1.45;">
                        @if(!empty($estimate->project->code))
                            <span style="color: #2563eb; font-weight: bold;">Project Code: {{ $estimate->project->code }}</span><br/>
                        @endif
                        Currency: <strong style="color: #0f172a;">{{ $estimate->currency ?? 'INR' }}</strong><br/>
                        Place of Supply: <span style="color: #0f172a;">{{ $placeOfSupply }}</span><br/>
                        Pricing Basis: <span style="color: #0f172a;">{{ $isInclusive ? 'Rates Inclusive of GST' : 'Rates Exclusive of GST' }}</span>
                    </div>
                </td>
            @endif
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 48%; text-align: left;">ITEM DESCRIPTION &amp; SCOPE</th>
                <th style="width: 14%; text-align: right;">QTY / UNIT</th>
                <th style="width: 18%; text-align: right;">{{ $isInclusive ? 'GROSS RATE' : 'UNIT RATE' }}</th>
                <th style="width: 20%; text-align: right;">AMOUNT ({{ $estimate->currency ?? 'INR' }})</th>
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
                    <div style="font-size: 7pt; color: #94a3b8; margin-top: 2px;">
                        SAC: {{ $item->sac_code ?? $defaultSac }}
                    </div>
                </td>
                <td style="text-align: right; color: #334155; font-size: 8.5pt;">
                    {{ number_format($item->quantity, 2) }} {{ $item->unit ?? 'units' }}
                </td>
                <td style="text-align: right; color: #334155; font-size: 8.5pt;">
                    &#8377;{{ number_format($item->unit_price, 2) }}
                    @if($isInclusive)
                        <div style="font-size: 6.8pt; color: #94a3b8;">Incl. GST</div>
                    @endif
                </td>
                <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 8.5pt;">
                    &#8377;{{ number_format($item->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 16px;">No line items specified.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Bottom Section: Commercial Terms (Left) & Totals (Right) -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 18px; page-break-inside: avoid;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 14px;">
                <!-- Commercial Terms Card -->
                @php
                    $rawTerms = $estimate->terms_and_conditions ?: "• Payment Terms: 50% mobilization advance upon project agreement sign-off.\n• Balance 50% upon successful completion and User Acceptance Testing (UAT) deployment.";
                    $rawTerms = preg_replace('/(?<!^|\n)\s*•\s*/u', "\n• ", $rawTerms);
                    $termsList = array_filter(array_map('trim', explode("\n", $rawTerms)));
                @endphp
                <div class="note-card">
                    <div class="note-card-title">COMMERCIAL TERMS OF ENGAGEMENT</div>
                    <div class="note-card-body">
                        @foreach($termsList as $termLine)
                            <div style="margin-bottom: 3px; line-height: 1.45;">{{ $termLine }}</div>
                        @endforeach
                    </div>
                </div>

                <!-- Statutory GST Declaration -->
                <div style="margin-top: 8px; font-size: 7.2pt; color: #64748b; line-height: 1.4;">
                    Tax is payable on reverse charge: <strong style="color: #334155;">No</strong> &bull;
                    Services classified under SAC: <strong style="color: #334155;">{{ $defaultSac }}</strong> (IT &amp; Software Design Services).
                </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <table class="totals-table">
                    <tr>
                        <td style="width: 55%; color: #64748b;">Subtotal ({{ $isInclusive ? 'Gross Turnover' : 'Deliverables' }}):</td>
                        <td style="width: 45%; text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($estimate->subtotal, 2) }}
                        </td>
                    </tr>
                    @if((float)$estimate->discount_amount > 0)
                    <tr>
                        <td style="color: #059669;">
                            @if(($estimate->discount_type ?? 'percentage') === 'fixed')
                                Discount (Fixed Amount):
                            @else
                                Discount ({{ number_format((float)$estimate->discount_rate, 2) }}%):
                            @endif
                        </td>
                        <td style="text-align: right; color: #059669;">
                            -&#8377;{{ number_format((float)$estimate->discount_amount, 2) }}
                        </td>
                    </tr>
                    @endif
                    @if($isInclusive)
                    <tr>
                        <td style="color: #64748b;">
                            Taxable Turnover:
                        </td>
                        <td style="text-align: right; color: #0f172a;">
                            &#8377;{{ number_format($taxableAmount, 2) }}
                        </td>
                    </tr>
                    @endif
                    @if($isInterState)
                    <tr>
                        <td style="color: #64748b;">
                            IGST ({{ number_format((float)($estimate->tax_rate ?? 18), 2) }}%{{ $isInclusive ? ' Incl.' : '' }}):
                        </td>
                        <td style="text-align: right; color: #0f172a;">
                            {{ $isInclusive ? '' : '+' }}&#8377;{{ number_format($igstAmount, 2) }}
                        </td>
                    </tr>
                    @else
                    <tr>
                        <td style="color: #64748b;">
                            CGST ({{ number_format(((float)($estimate->tax_rate ?? 18)) / 2, 2) }}%{{ $isInclusive ? ' Incl.' : '' }}):
                        </td>
                        <td style="text-align: right; color: #0f172a;">
                            {{ $isInclusive ? '' : '+' }}&#8377;{{ number_format($cgstAmount, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #64748b;">
                            SGST ({{ number_format(((float)($estimate->tax_rate ?? 18)) / 2, 2) }}%{{ $isInclusive ? ' Incl.' : '' }}):
                        </td>
                        <td style="text-align: right; color: #0f172a;">
                            {{ $isInclusive ? '' : '+' }}&#8377;{{ number_format($sgstAmount, 2) }}
                        </td>
                    </tr>
                    @endif
                    @if((float)($estimate->round_off ?? 0) != 0)
                    <tr>
                        <td style="color: #64748b;">Round Off:</td>
                        <td style="text-align: right; color: #0f172a;">
                            {{ (float)$estimate->round_off > 0 ? '+' : '' }}&#8377;{{ number_format((float)$estimate->round_off, 2) }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td colspan="2" style="border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 3px;"></td>
                    </tr>
                    <tr>
                        <td class="grand-total-label">Grand Total:</td>
                        <td class="grand-total-amount">
                            &#8377;{{ number_format($estimate->total_amount, 2) }}
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
