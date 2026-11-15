<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title')</title>
    <style>
        @page {
            margin: 12mm 14mm 16mm 14mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9.5pt;
            color: #1e293b;
            line-height: 1.35;
            background-color: #ffffff;
            background-image: url('{{ $voidPantographUrl }}');
            background-repeat: repeat;
        }
        .header-table, .meta-table, .items-table, .totals-table, .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .font-mono { font-family: 'Courier', monospace; }
        
        .primary-color { color: #1e3a8a; }
        .text-slate { color: #64748b; }
        .text-dark { color: #0f172a; }
        
        /* Top Banner */
        .company-title {
            font-size: 15pt;
            font-weight: bold;
            color: #1e3a8a;
            letter-spacing: -0.3px;
            margin: 0;
            padding: 0;
        }
        .company-sub {
            font-size: 8pt;
            color: #475569;
            margin-top: 2px;
            margin-bottom: 5px;
        }
        .doc-title-badge {
            display: inline-block;
            font-size: 13pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: right;
            margin-bottom: 2px;
        }
        .doc-badge-original {
            font-size: 7.5pt;
            color: #047857;
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
        }
        
        .divider {
            height: 1.5px;
            background-color: #cbd5e1;
            margin: 8px 0;
        }

        /* Micro-print anti-tamper security border */
        .micro-security-border {
            font-size: 3pt;
            color: #94a3b8;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            overflow: hidden;
            white-space: nowrap;
            line-height: 4pt;
            margin: 4px 0 8px 0;
        }
        
        /* Section Cards */
        .info-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            border-radius: 5px;
        }
        .info-card-header {
            font-size: 7.5pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 2px;
        }

        /* Items Table */
        .items-table {
            margin-top: 10px;
            margin-bottom: 10px;
        }
        .items-table th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 8px;
            border: 1px solid #1e3a8a;
        }
        .items-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            font-size: 8.5pt;
            background-color: #ffffff;
        }
        .items-table tr.alt td {
            background-color: #f8fafc;
        }

        /* Moiré Anti-Rasterization Background for Totals */
        .moire-summary-box {
            background-color: #f8fafc;
            background-image: url('{{ $moireGridUrl }}');
            background-repeat: repeat;
            border: 1.5px solid #cbd5e1;
            padding: 8px 10px;
            border-radius: 5px;
        }
        .grand-total-row {
            border-top: 2px solid #1e3a8a;
            padding-top: 5px;
            margin-top: 5px;
        }
        .grand-total-val {
            font-size: 13pt;
            font-weight: bold;
            color: #1e3a8a;
        }

        /* Digital Security Certificate Box */
        .cert-box {
            background-color: #f0fdf4;
            border: 1.5px solid #86efac;
            padding: 6px 10px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .cert-title {
            font-size: 8pt;
            font-weight: bold;
            color: #15803d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .cert-text {
            font-size: 7pt;
            color: #166534;
            line-height: 1.25;
            margin-top: 2px;
        }

        /* Bank Remittance Box */
        .bank-box {
            background-color: #ffffff;
            background-image: url('{{ $moireGridUrl }}');
            border: 1px solid #cbd5e1;
            padding: 7px 9px;
            border-radius: 4px;
            font-size: 7.5pt;
        }
    </style>
</head>
<body>

    <!-- Micro-print security strip (Top) -->
    <div class="micro-security-border">
        KABHYAN-SECURE-DOCUMENT • PAdES-CERTIFIED • HASH: {{ $documentHash }} • SECTION 31 CGST ACT 2017 • INTEGRITY-KEY: {{ $integrityKey }} • AUTHENTIC CORPORATE BILLING RECORD • KABHYAN TECHNOLOGIES PRIVATE LIMITED •
    </div>

    <!-- Corporate Header & Document Title -->
    <table class="header-table">
        <tr>
            <td style="width: 62%; vertical-align: top;">
                <div class="company-title">{{ $company['name'] }}</div>
                <div class="company-sub">{{ $company['tagline'] }}</div>
                <div style="font-size: 7.2pt; color: #475569; line-height: 1.35;">
                    CIN: <strong class="font-mono" style="color: #1e3a8a;">{{ $company['cin'] }}</strong> | State Code: <strong>18 (Assam)</strong><br/>
                    <strong>Regd. Office:</strong> {{ $company['registered_office'] }}<br/>
                    <strong>Corp. Office:</strong> {{ $company['corporate_office'] }}<br/>
                    Phone: <strong>{{ $company['phone'] }}</strong> | Email: <strong>{{ $company['email'] }}</strong> | Web: {{ $company['website'] }}<br/>
                    GSTIN: <strong style="color: #1e3a8a;">{{ $company['gstin'] }}</strong> | PAN: <strong>{{ $company['pan'] }}</strong>
                </div>
            </td>
            <td style="width: 38%; vertical-align: top;" class="text-right">
                <div class="doc-title-badge">@yield('doc-title')</div><br/>
                <div class="doc-badge-original">Original for Recipient</div>
                <div style="margin-top: 6px; font-size: 8pt; line-height: 1.4;">
                    <strong>@yield('doc-number-label'):</strong> <span class="font-mono" style="font-size: 9.5pt; font-weight: bold; color: #1e3a8a;">@yield('doc-number')</span><br/>
                    <strong>Issue Date:</strong> @yield('doc-date')<br/>
                    <strong>Due / Expiry Date:</strong> @yield('doc-due-date')<br/>
                    @yield('doc-additional-meta')
                </div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <!-- Main Content Yield -->
    @yield('content')

    <!-- Micro-print security strip (Bottom) -->
    <div class="micro-security-border" style="margin-top: 12px;">
        ORIGINAL SECURE BILLING MANIFEST • ENCRYPTED PAdES X.509 DIGITAL CERTIFICATE APPLIED • TAMPERING OR ALTERING THIS RECORD CONSTITUTES STATUTORY OFFENCE • VERIFICATION KEY: {{ $integrityKey }} • KABHYAN TECHNOLOGIES •
    </div>

    <!-- Digital Certification Seal & Cryptographic Keys -->
    <table class="footer-table" style="margin-top: 4px;">
        <tr>
            <td style="width: 70%; vertical-align: top;">
                <div class="cert-box">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 24px; vertical-align: top; font-size: 14pt; color: #16a34a;">✔</td>
                            <td style="vertical-align: top;">
                                <div class="cert-title">PAdES Digitally Certified & Cryptographically Signed Document</div>
                                <div class="cert-text">
                                    Signed by: <strong>Kabhyan Technologies Private Limited</strong> | Algorithm: <strong>RSA-2048 / SHA-256 (RFC 3161)</strong><br/>
                                    Integrity Key: <strong class="font-mono" style="color: #047857;">{{ $integrityKey }}</strong> | Checksum: <span class="font-mono" style="font-size: 6.5pt;">{{ substr($documentHash, 0, 32) }}...</span><br/>
                                    <em>This PDF is cryptographically sealed. Opening in Adobe Acrobat Reader verifies the digital signature. Any post-issuance alteration invalidates the document.</em>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="width: 30%; vertical-align: middle;" class="text-right">
                <div style="font-size: 8pt; color: #475569; font-weight: bold;">For Kabhyan Technologies Pvt. Ltd.</div>
                <div style="margin-top: 25px; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 2px;">
                    <span style="font-size: 7.5pt; font-weight: bold; color: #1e3a8a;">Authorized Signatory</span><br/>
                    <span style="font-size: 6.5pt; color: #64748b;">(Digitally Generated & Certified)</span>
                </div>
            </td>
        </tr>
    </table>

</body>
</html>
