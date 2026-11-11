<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Company Profile Settings
            [
                'key' => 'company_name',
                'value' => 'Kabhyan Technologies Private Limited',
                'group' => 'company',
                'type' => 'string',
                'description' => 'Official registered corporate entity name',
            ],
            [
                'key' => 'company_legal_tagline',
                'value' => 'Enterprise IT & Software Engineering Solutions',
                'group' => 'company',
                'type' => 'string',
                'description' => 'Sub-heading printed on estimates and tax invoices',
            ],
            [
                'key' => 'company_email',
                'value' => 'contact@kabhyan.com',
                'group' => 'company',
                'type' => 'string',
                'description' => 'Primary corporate email address',
            ],
            [
                'key' => 'company_phone',
                'value' => '+91 33 2357 1234',
                'group' => 'company',
                'type' => 'string',
                'description' => 'HQ official contact line',
            ],
            [
                'key' => 'company_address',
                'value' => 'Technopolis Commercial Complex, 12th Floor, Sector V, Bidhannagar, Kolkata, West Bengal 700091, India',
                'group' => 'company',
                'type' => 'text',
                'description' => 'Principal place of business address',
            ],
            [
                'key' => 'company_website',
                'value' => 'https://www.kabhyan.com',
                'group' => 'company',
                'type' => 'string',
                'description' => 'Company public portal URL',
            ],

            // Tax & Statutory Compliance
            [
                'key' => 'company_gstin',
                'value' => '19AABCK9876Q1Z2',
                'group' => 'tax_compliance',
                'type' => 'string',
                'description' => 'Goods & Services Tax Identification Number (West Bengal)',
            ],
            [
                'key' => 'company_pan',
                'value' => 'AABCK9876Q',
                'group' => 'tax_compliance',
                'type' => 'string',
                'description' => 'Income Tax Permanent Account Number',
            ],
            [
                'key' => 'default_sac_code',
                'value' => '998314',
                'group' => 'tax_compliance',
                'type' => 'string',
                'description' => 'Default Services Accounting Code for IT Software & Consulting',
            ],
            [
                'key' => 'default_gst_rate',
                'value' => '18',
                'group' => 'tax_compliance',
                'type' => 'number',
                'description' => 'Standard GST rate applied across client invoices (%)',
            ],

            // Banking & Remittance
            [
                'key' => 'bank_name',
                'value' => 'HDFC Bank Limited',
                'group' => 'banking',
                'type' => 'string',
                'description' => 'Corporate account bank partner',
            ],
            [
                'key' => 'bank_account_name',
                'value' => 'Kabhyan Technologies Private Limited',
                'group' => 'banking',
                'type' => 'string',
                'description' => 'Exact account holder title',
            ],
            [
                'key' => 'bank_account_number',
                'value' => '50200084729184',
                'group' => 'banking',
                'type' => 'string',
                'description' => 'Current account number',
            ],
            [
                'key' => 'bank_ifsc_code',
                'value' => 'HDFC0001234',
                'group' => 'banking',
                'type' => 'string',
                'description' => 'RTGS / NEFT Branch IFSC Code',
            ],
            [
                'key' => 'bank_branch',
                'value' => 'Salt Lake Sector V, Kolkata, West Bengal',
                'group' => 'banking',
                'type' => 'string',
                'description' => 'Branch location',
            ],
            [
                'key' => 'bank_upi_id',
                'value' => 'kabhyan@hdfcbank',
                'group' => 'banking',
                'type' => 'string',
                'description' => 'Corporate merchant VPA / UPI ID',
            ],

            // Localization & Defaults
            [
                'key' => 'default_currency',
                'value' => 'INR',
                'group' => 'localization',
                'type' => 'string',
                'description' => 'System currency symbol and ledger denomination',
            ],
            [
                'key' => 'currency_symbol',
                'value' => '₹',
                'group' => 'localization',
                'type' => 'string',
                'description' => 'Currency symbol for invoices & quotes',
            ],
            [
                'key' => 'date_format',
                'value' => 'YYYY-MM-DD',
                'group' => 'localization',
                'type' => 'string',
                'description' => 'Standard date format across ERP modules',
            ],
            [
                'key' => 'time_zone',
                'value' => 'Asia/Kolkata',
                'group' => 'localization',
                'type' => 'string',
                'description' => 'Corporate timezone',
            ],

            // Security & Portal Policies
            [
                'key' => 'client_portal_enabled',
                'value' => 'true',
                'group' => 'security_policy',
                'type' => 'boolean',
                'description' => 'Enable or disable customer self-service portal (/portal)',
            ],
            [
                'key' => 'auto_notify_client_on_reply',
                'value' => 'true',
                'group' => 'security_policy',
                'type' => 'boolean',
                'description' => 'Send email alerts when engineering staff responds to tickets',
            ],
            [
                'key' => 'session_timeout_minutes',
                'value' => '120',
                'group' => 'security_policy',
                'type' => 'number',
                'description' => 'Redis Sanctum session lifetime before re-authentication',
            ],

            // SMTP & Email Configuration
            [
                'key' => 'mail_mailer',
                'value' => 'smtp',
                'group' => 'email_smtp',
                'type' => 'string',
                'description' => 'Mail protocol / transport driver (e.g. smtp, sendmail, log)',
            ],
            [
                'key' => 'mail_host',
                'value' => 'smtp.gmail.com',
                'group' => 'email_smtp',
                'type' => 'string',
                'description' => 'SMTP server hostname (e.g. smtp.gmail.com, smtp.office365.com, email-smtp.us-east-1.amazonaws.com)',
            ],
            [
                'key' => 'mail_port',
                'value' => '587',
                'group' => 'email_smtp',
                'type' => 'number',
                'description' => 'SMTP port (587 for TLS, 465 for SSL, or 25)',
            ],
            [
                'key' => 'mail_username',
                'value' => 'contact@kabhyan.com',
                'group' => 'email_smtp',
                'type' => 'string',
                'description' => 'SMTP account username or sender email',
            ],
            [
                'key' => 'mail_password',
                'value' => '',
                'group' => 'email_smtp',
                'type' => 'password',
                'description' => 'SMTP account password or app-specific password',
            ],
            [
                'key' => 'mail_encryption',
                'value' => 'tls',
                'group' => 'email_smtp',
                'type' => 'string',
                'description' => 'Transport layer security protocol: tls, ssl, or null',
            ],
            [
                'key' => 'mail_from_address',
                'value' => 'no-reply@kabhyan.com',
                'group' => 'email_smtp',
                'type' => 'string',
                'description' => 'Default sender email address shown to recipients',
            ],
            [
                'key' => 'mail_from_name',
                'value' => 'Kabhyan Technologies ERP',
                'group' => 'email_smtp',
                'type' => 'string',
                'description' => 'Default sender display name',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}

