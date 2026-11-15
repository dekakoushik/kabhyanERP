<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title')</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5pt;
            color: #0f172a;
            line-height: 1.4;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
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
        .company-legal-name {
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 3px;
        }
        .company-tagline {
            font-size: 8pt;
            color: #64748b;
            margin-top: 1px;
        }
        .company-contact {
            font-size: 7.5pt;
            color: #64748b;
            margin-top: 2px;
        }
        .company-statutory {
            font-size: 7pt;
            color: #64748b;
            margin-top: 2px;
            line-height: 1.35;
        }

        /* Badge Pills */
        .badge-estimate {
            background-color: #eff6ff;
            color: #2563eb;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
        }
        .badge-proforma {
            background-color: #f5f3ff;
            color: #7c3aed;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
        }
        .badge-invoice {
            background-color: #ecfdf5;
            color: #059669;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            display: inline-block;
        }

        .doc-number {
            font-size: 20pt;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin-top: 4px;
            margin-bottom: 2px;
        }
        .doc-meta {
            font-size: 8pt;
            color: #64748b;
            line-height: 1.45;
        }

        /* Items Table */
        .items-table {
            margin-top: 16px;
            margin-bottom: 18px;
        }
        .items-table th {
            font-size: 7.5pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 8px 4px;
            border-bottom: 1.5px solid #e2e8f0;
        }
        .items-table td {
            padding: 11px 4px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }

        /* Bottom Section Notes Cards */
        .note-card {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 8px;
            padding: 10px 12px;
            margin-bottom: 8px;
        }
        .note-card-title {
            font-size: 7pt;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 3px;
        }
        .note-card-body {
            font-size: 7.5pt;
            color: #475569;
            line-height: 1.35;
        }

        /* Totals */
        .totals-table td {
            padding: 3px 0;
            font-size: 8.5pt;
        }
        .grand-total-label {
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            padding-top: 4px;
        }
        .grand-total-amount {
            font-size: 13.5pt;
            font-weight: bold;
            color: #2563eb;
            text-align: right;
            padding-top: 4px;
        }

        /* Signatures */
        .sign-title {
            font-size: 8.5pt;
            font-weight: bold;
            color: #0f172a;
        }
        .sign-sub {
            font-size: 7.5pt;
            color: #64748b;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <!-- Header Table: Logo & Company (Left) + Document Badge & Info (Right) -->
    <table>
        <tr>
            <td style="width: 58%; vertical-align: top;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" style="height: 38px; width: auto; margin-bottom: 4px;"/><br/>
                @else
                    <div style="font-size: 16pt; font-weight: bold; color: #2563eb; letter-spacing: -0.5px;">KABHYAN</div>
                    <div style="font-size: 6.5pt; font-weight: bold; color: #64748b; letter-spacing: 2px; margin-bottom: 4px;">TECHNOLOGIES</div>
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
            <td style="width: 42%; vertical-align: top;" class="text-right">
                <div style="margin-bottom: 4px;">
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
    <table style="margin-top: 24px;">
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
