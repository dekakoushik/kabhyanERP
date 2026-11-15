<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title')</title>
    <style>
        @page {
            margin: 10mm 12mm 10mm 12mm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 8.5pt;
            color: #0f172a;
            line-height: 1.35;
            background-color: #ffffff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .font-mono { font-family: 'Courier', monospace; }

        /* Colors */
        .text-primary-blue { color: #2563eb; }
        .text-slate-900 { color: #0f172a; }
        .text-slate-700 { color: #334155; }
        .text-slate-500 { color: #64748b; }
        .text-slate-400 { color: #94a3b8; }
        .text-emerald { color: #059669; }

        .status-paid { color: #059669; }
        .status-overdue { color: #dc2626; }
        .status-pending { color: #d97706; }

        /* Header Elements */
        .company-legal-name {
            font-size: 10.5pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 4px;
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
            color: #475569;
            margin-top: 2px;
            line-height: 1.3;
        }

        /* Top Right Badge Pills */
        .badge-pill-blue {
            background-color: #eff6ff;
            color: #2563eb;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            padding: 4px 10px;
            text-transform: uppercase;
            border-radius: 9999px;
            display: inline-block;
        }
        .badge-pill-purple {
            background-color: #f5f3ff;
            color: #7c3aed;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            padding: 4px 10px;
            text-transform: uppercase;
            border-radius: 9999px;
            display: inline-block;
        }
        .badge-pill-green {
            background-color: #ecfdf5;
            color: #059669;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            padding: 4px 10px;
            text-transform: uppercase;
            border-radius: 9999px;
            display: inline-block;
        }

        .doc-number {
            font-size: 18pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 3px;
            margin-bottom: 2px;
            letter-spacing: -0.5px;
        }
        .doc-meta {
            font-size: 8pt;
            color: #64748b;
            line-height: 1.45;
        }
        .doc-value {
            color: #0f172a;
            font-weight: bold;
        }

        /* Modern Information Cards */
        .card-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .card-header-label {
            font-size: 7pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        .card-main-title {
            font-size: 10.5pt;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .card-sub-title {
            font-size: 8.5pt;
            font-weight: 500;
            color: #334155;
            margin-bottom: 2px;
        }
        .card-body-text {
            font-size: 8pt;
            color: #64748b;
            line-height: 1.4;
        }

        /* Items Table */
        .items-table {
            margin-top: 14px;
            margin-bottom: 14px;
        }
        .items-table th {
            font-size: 7.5pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 7px 4px;
            border-bottom: 1.5px solid #e2e8f0;
        }
        .items-table td {
            padding: 8px 4px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }

        /* Notes Card */
        .note-card {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 6px;
        }
        .note-card-title {
            font-size: 7pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
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
        }
        .grand-total-amount {
            font-size: 13.5pt;
            font-weight: bold;
            color: #2563eb;
        }

        /* Footer Signatures */
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

        /* Security Micro-Footer */
        .security-footer {
            font-size: 4.5pt;
            color: #94a3b8;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 14px;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- Header Table: Logo & Company (Left) + Document Badge & Info (Right) -->
    <table>
        <tr>
            <td style="width: 55%; vertical-align: top;">
                @if(!empty($logoPath) && file_exists($logoPath))
                    <img src="{{ $logoPath }}" height="36" style="margin-bottom: 4px;"/><br/>
                @else
                    <div style="font-size: 15pt; font-weight: bold; color: #2563eb; letter-spacing: -0.5px;">KABHYAN</div>
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
                    GSTIN: <strong>{{ $company['gstin'] }}</strong> &bull; CIN: <strong>{{ $company['cin'] }}</strong> &bull; State Code: <strong>{{ $company['state_code'] ?? '18' }} ({{ $company['state_name'] ?? 'Assam' }})</strong><br/>
                    Regd. Office: {{ $company['registered_office'] }}
                </div>
            </td>
            <td style="width: 45%; vertical-align: top;" class="text-right">
                <!-- Pill Badge -->
                <div style="margin-bottom: 4px;">
                    @yield('badge')
                </div>
                <!-- Document Number -->
                <div class="doc-number">#@yield('doc-number')</div>
                <!-- Document Dates -->
                <div class="doc-meta">
                    Date: <span class="doc-value">@yield('doc-date')</span><br/>
                    @yield('doc-meta-right')
                </div>
            </td>
        </tr>
    </table>

    <div style="height: 12px;"></div>

    <!-- Main Dynamic Content (Cards, Items Table, Totals & Notes) -->
    @yield('content')

    <div style="height: 14px;"></div>

    <!-- Signatures & Acceptance Footer -->
    <table>
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
