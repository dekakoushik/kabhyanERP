<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title')</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 20mm 18mm 20mm 18mm;
        }
        * {
            box-sizing: border-box;
        }
        html, body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 9.5pt;
            color: #0f172a;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-mono { font-family: 'DejaVu Sans Mono', monospace; }

        /* Corporate Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 22px;
        }
        .company-legal-name {
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 4px;
        }
        .company-tagline {
            font-size: 9pt;
            color: #64748b;
            margin-top: 2px;
        }
        .company-contact {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 3px;
        }
        .company-statutory {
            font-size: 7.8pt;
            color: #64748b;
            margin-top: 4px;
            line-height: 1.4;
        }

        /* Badge Pills */
        .badge-estimate {
            background-color: #eff6ff;
            color: #2563eb;
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 1px;
            padding: 5px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
        }
        .badge-proforma {
            background-color: #f5f3ff;
            color: #7c3aed;
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 1px;
            padding: 5px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
        }
        .badge-invoice {
            background-color: #ecfdf5;
            color: #059669;
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 1px;
            padding: 5px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
        }

        .doc-number {
            font-size: 24pt;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin-top: 6px;
            margin-bottom: 4px;
        }
        .doc-meta {
            font-size: 9pt;
            color: #64748b;
            line-height: 1.5;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 24px;
        }
        .items-table th {
            font-size: 8.5pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 11px 8px;
            border-bottom: 2px solid #cbd5e1;
        }
        .items-table td {
            padding: 15px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }

        /* Bottom Section Notes Cards */
        .note-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 15px;
            margin-bottom: 10px;
        }
        .note-card-title {
            font-size: 7.5pt;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .note-card-body {
            font-size: 8.5pt;
            color: #475569;
            line-height: 1.45;
        }

        /* Totals */
        .totals-table td {
            padding: 5px 0;
            font-size: 9.5pt;
        }
        .grand-total-label {
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            padding-top: 8px;
        }
        .grand-total-amount {
            font-size: 15pt;
            font-weight: bold;
            color: #2563eb;
            text-align: right;
            padding-top: 8px;
        }

        /* Status Colors */
        .status-paid { color: #059669; }
        .status-overdue { color: #dc2626; }
        .status-sent, .status-pending { color: #d97706; }
        .status-draft { color: #64748b; }

        /* Signatures */
        .sign-title {
            font-size: 9.5pt;
            font-weight: bold;
            color: #0f172a;
        }
        .sign-sub {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 4px;
        }
    </style>
</head>
<body>

    <!-- Header Table: Logo & Company (Left) + Document Badge & Info (Right) -->
    <table class="header-table">
        <tr>
            <td style="width: 58%; vertical-align: top; padding-bottom: 18px;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="height: 42px; width: auto; margin-bottom: 6px;"/><br/>
                @else
                    <div style="font-size: 18pt; font-weight: bold; color: #2563eb; letter-spacing: -0.5px;">KABHYAN</div>
                    <div style="font-size: 7pt; font-weight: bold; color: #64748b; letter-spacing: 2px; margin-bottom: 6px;">TECHNOLOGIES</div>
                @endif
                <div class="company-legal-name">{{ $company['name'] }}</div>
                <div class="company-tagline">{{ $company['tagline'] }}</div>
                <div class="company-contact">
                    {{ $company['email'] }} &bull; {{ str_replace(['https://', 'http://'], '', $company['website']) }}
                    @if(!empty($company['phone']))
                        &bull; {{ $company['phone'] }}
                    @endif
                </div>
                <div class="company-statutory">
                    GSTIN: <strong style="color: #334155;">{{ $company['gstin'] }}</strong> &bull; CIN: <strong style="color: #334155;">{{ $company['cin'] }}</strong> &bull; State: <strong>18 (Assam)</strong><br/>
                    Regd. Office: {{ $company['registered_office'] }}
                </div>
            </td>
            <td style="width: 42%; vertical-align: top; padding-bottom: 18px;" class="text-right">
                <div style="margin-bottom: 5px;">
                    @yield('badge')
                </div>
                <div class="doc-number">#@yield('doc-number')</div>
                <div class="doc-meta">
                    Date: <strong style="color: #0f172a;">@yield('doc-date')</strong><br/>
                    @yield('doc-meta-right')
                </div>
            </td>
        </tr>
    </table>

    <!-- Main Dynamic Content (Cards, Items Table, Totals & Notes) -->
    @yield('content')

    <!-- Signatures & Acceptance Footer -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 48px; page-break-inside: avoid;">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <div class="sign-title">Authorized Signatory</div>
                <div class="sign-sub">Kabhyan Technologies Pvt. Ltd.</div>
            </td>
            <td style="width: 50%; vertical-align: top;" class="text-right">
                @yield('signature-right')
            </td>
        </tr>
    </table>

</body>
</html>
