@extends('pdf.layout')

@section('title', 'GST Receipt Voucher - ' . $voucher->voucher_number)

@section('badge')
    <span class="badge-voucher">RECEIPT VOUCHER</span>
@endsection

@section('doc-number', $voucher->voucher_number)
@section('doc-date', \Carbon\Carbon::parse($voucher->voucher_date)->format('d M Y'))

@section('doc-meta-right')
    @if($voucher->proformaInvoice)
        Proforma Ref: <strong style="color: #7c3aed;">{{ $voucher->proformaInvoice->proforma_number }}</strong><br/>
    @elseif($voucher->estimate)
        Quotation Ref: <strong style="color: #2563eb;">{{ $voucher->estimate->estimate_number }}</strong><br/>
    @endif
    Payment Mode: <strong style="color: #0f172a;">{{ strtoupper(str_replace('_', ' ', $voucher->payment_mode)) }}</strong><br/>
    @if($voucher->payment_reference)
        Txn / Ref: <strong style="color: #059669;">{{ $voucher->payment_reference }}</strong><br/>
    @endif
    Place of Supply: <strong style="color: #0f172a;">{{ $voucher->place_of_supply ?: '18 - Intra-State' }}</strong>
@endsection

@section('content')
@php
    $hasProject = !empty($voucher->project_id) && !empty($voucher->project);
@endphp

    <!-- Recipient Client & Project Info Cards -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 14px;">
        <tr>
            @if($hasProject)
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
            @else
            <td style="width: 100%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
            @endif
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">RECEIVED FROM (CLIENT)</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 2px;">{{ $voucher->client_name }}</div>
                <div style="font-size: 8.5pt; font-weight: 500; color: #475569; margin-bottom: 3px;">{{ $voucher->client_company ?? 'Direct Client' }}</div>
                <div style="font-size: 7.8pt; color: #64748b; line-height: 1.4;">
                    @if(!empty($voucher->client_email))
                        {{ $voucher->client_email }}<br/>
                    @endif
                    @if(!empty($voucher->client_phone))
                        {{ $voucher->client_phone }}<br/>
                    @endif
                    @if(!empty($voucher->client_address))
                        {{ $voucher->client_address }}<br/>
                    @endif
                    @if(!empty($voucher->client_gstin))
                        <strong style="color: #059669;">GSTIN: {{ $voucher->client_gstin }}</strong>
                    @else
                        <span style="color: #94a3b8; font-size: 7.5pt;">Unregistered Recipient (Consumer / B2C)</span>
                    @endif
                </div>
            </td>
            @if($hasProject)
            <td style="width: 3%;"></td>
            <td style="width: 48.5%; vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 13px;">
                <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">PROJECT CONTEXT</div>
                <div style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 2px;">{{ $voucher->project->name }}</div>
                <div style="font-size: 8pt; color: #64748b; line-height: 1.4; margin-top: 4px;">
                    Project Code: <strong style="color: #334155;">{{ $voucher->project->code ?? 'N/A' }}</strong><br/>
                    Status: <strong style="text-transform: uppercase; color: #2563eb;">{{ str_replace('_', ' ', $voucher->project->status) }}</strong>
                </div>
            </td>
            @endif
        </tr>
    </table>

    <!-- Statutory GST Notice -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 7.8pt; color: #166534;">
        <strong>Statutory Notice (Section 31(3)(d) of CGST Act, 2017 & Rule 50):</strong> This voucher acknowledges receipt of an advance towards the supply of IT Consultancy & Software Development Services (SAC 998314). Tax liability has been computed and accounted for under GSTR-1 Table 11A. When the final tax invoice is issued, this advance will be adjusted against the gross project turnover.
    </div>

    <!-- Advance Receipt Schedule Table -->
    <table class="items-table" style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
                <th style="padding: 7px 8px; text-align: left; font-size: 8pt; color: #475569; width: 45%;">Description of Service Scope</th>
                <th style="padding: 7px 8px; text-align: center; font-size: 8pt; color: #475569; width: 12%;">SAC Code</th>
                <th style="padding: 7px 8px; text-align: right; font-size: 8pt; color: #475569; width: 15%;">Taxable Advance</th>
                <th style="padding: 7px 8px; text-align: right; font-size: 8pt; color: #475569; width: 13%;">GST Rate</th>
                <th style="padding: 7px 8px; text-align: right; font-size: 8pt; color: #475569; width: 15%;">Total Received</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 8px; vertical-align: top;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 8.5pt;">
                        Advance Payment Received for IT Development Services
                    </div>
                    <div style="font-size: 7.5pt; color: #64748b; margin-top: 3px;">
                        @if($voucher->proformaInvoice)
                            Received against Proforma Invoice {{ $voucher->proformaInvoice->proforma_number }}.
                        @elseif($voucher->estimate)
                            Received against approved Quotation {{ $voucher->estimate->estimate_number }}.
                        @endif
                        {{ $voucher->notes ?: 'Statutory advance receipt voucher prior to service completion.' }}
                    </div>
                </td>
                <td style="padding: 10px 8px; text-align: center; font-family: monospace; font-size: 8pt; color: #334155;">
                    998314
                </td>
                <td style="padding: 10px 8px; text-align: right; font-size: 8.5pt; color: #0f172a;">
                    &#8377;{{ number_format($voucher->taxable_amount, 2) }}
                </td>
                <td style="padding: 10px 8px; text-align: right; font-size: 8pt; color: #64748b;">
                    {{ number_format($voucher->tax_rate, 2) }}%
                </td>
                <td style="padding: 10px 8px; text-align: right; font-weight: 700; font-size: 8.5pt; color: #0f172a;">
                    &#8377;{{ number_format($voucher->amount_received, 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Totals & GST Summary Row -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 18px; page-break-inside: avoid;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 14px;">
                <div class="note-card" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                    <div style="font-weight: 700; font-size: 8pt; color: #1e293b; margin-bottom: 4px;">Advance Accounting Status:</div>
                    <div style="font-size: 7.5pt; color: #475569; line-height: 1.4;">
                        Status: <strong style="text-transform: uppercase; color: #2563eb;">{{ str_replace('_', ' ', $voucher->status) }}</strong><br/>
                        Total Advance: &#8377;{{ number_format($voucher->amount_received, 2) }}<br/>
                        Adjusted on Invoices: &#8377;{{ number_format($voucher->adjusted_amount, 2) }}<br/>
                        Remaining Unadjusted: <strong>&#8377;{{ number_format($voucher->remaining_advance, 2) }}</strong>
                    </div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 14px;">
                <table class="totals-table" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 55%; color: #64748b; padding: 3px 0;">Taxable Amount:</td>
                        <td style="width: 45%; text-align: right; color: #0f172a; padding: 3px 0;">
                            &#8377;{{ number_format($voucher->taxable_amount, 2) }}
                        </td>
                    </tr>
                    @if($voucher->is_inter_state)
                    <tr>
                        <td style="color: #64748b; padding: 3px 0;">Integrated GST (IGST {{ $voucher->tax_rate }}%):</td>
                        <td style="text-align: right; color: #0f172a; padding: 3px 0;">
                            &#8377;{{ number_format($voucher->igst_amount, 2) }}
                        </td>
                    </tr>
                    @else
                    <tr>
                        <td style="color: #64748b; padding: 3px 0;">Central GST (CGST {{ $voucher->tax_rate / 2 }}%):</td>
                        <td style="text-align: right; color: #0f172a; padding: 3px 0;">
                            &#8377;{{ number_format($voucher->cgst_amount, 2) }}
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; padding: 3px 0;">State GST (SGST {{ $voucher->tax_rate / 2 }}%):</td>
                        <td style="text-align: right; color: #0f172a; padding: 3px 0;">
                            &#8377;{{ number_format($voucher->sgst_amount, 2) }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td colspan="2" style="border-top: 1.5px solid #0f172a; padding-top: 5px; margin-top: 3px;"></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; font-size: 9.5pt; color: #0f172a;">Total Advance Received:</td>
                        <td style="text-align: right; font-weight: 800; font-size: 10.5pt; color: #059669;">
                            &#8377;{{ number_format($voucher->amount_received, 2) }}
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
