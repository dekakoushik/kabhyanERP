<?php

namespace App\Services;

use App\Models\Client;
use App\Models\SystemNotification;
use App\Models\SystemSetting;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class MailNotificationService
{
    /**
     * Resolve the active public base URL for frontend links in emails.
     */
    public static function getBaseUrl(): string
    {
        try {
            if (request()) {
                $origin = request()->header('origin');
                if ($origin && filter_var($origin, FILTER_VALIDATE_URL)) {
                    return rtrim($origin, '/');
                }
                $host = request()->getSchemeAndHttpHost();
                if ($host && filter_var($host, FILTER_VALIDATE_URL)) {
                    return rtrim($host, '/');
                }
            }
        } catch (\Throwable $e) {
            // Ignore in CLI/cron
        }

        $configured = SystemSetting::get('company_website');
        if (!empty($configured) && filter_var($configured, FILTER_VALIDATE_URL)) {
            return rtrim($configured, '/');
        }

        return rtrim(config('app.url', 'http://localhost:3000'), '/');
    }

    /**
     * Build an active ESMTP transport dynamically from SystemSettings.
     */
    public static function createTransport(): EsmtpTransport
    {
        $host = SystemSetting::get('mail_host', config('mail.mailers.smtp.host', 'mail.kabhyan.com'));
        $port = (int) SystemSetting::get('mail_port', config('mail.mailers.smtp.port', 587));
        $username = SystemSetting::get('mail_username', config('mail.mailers.smtp.username'));
        $password = SystemSetting::get('mail_password', config('mail.mailers.smtp.password'));
        $encryption = SystemSetting::get('mail_encryption', config('mail.mailers.smtp.scheme', 'tls'));

        $isDirectTls = ($encryption === 'ssl' || $port === 465);
        $transport = new EsmtpTransport($host, $port, $isDirectTls);

        $streamOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];

        $stream = $transport->getStream();
        if (method_exists($stream, 'setStreamOptions')) {
            $stream->setStreamOptions($streamOptions);
        }

        if (!empty($username)) {
            $transport->setUsername($username);
        }
        if (!empty($password)) {
            $transport->setPassword($password);
        }

        return $transport;
    }

    /**
     * Send email wrapped in standard Kabhyan branded layout.
     */
    public static function send(
        string $toEmail,
        string $subject,
        string $contentHtml,
        ?string $toName = null,
        ?string $actionUrl = null,
        ?string $actionText = null
    ): bool {
        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            Log::warning("MailNotificationService: Invalid recipient email '{$toEmail}'. Skipping email.");
            return false;
        }

        try {
            $fromAddress = SystemSetting::get('mail_from_address', config('mail.from.address', 'alerts@kabhyan.com'));
            $fromName = SystemSetting::get('mail_from_name', config('mail.from.name', 'Kabhyan Technologies ERP'));
            $companyName = SystemSetting::get('company_name', 'Kabhyan Technologies Pvt. Ltd.');
            $companyAddress = SystemSetting::get('company_address', 'West Bengal, India');

            $fullHtml = self::renderLayout($subject, $contentHtml, $actionUrl, $actionText, $companyName, $companyAddress);

            $transport = self::createTransport();
            $mailer = new Mailer($transport);

            $email = (new Email())
                ->from(new Address($fromAddress, $fromName))
                ->to(new Address($toEmail, $toName ?? ''))
                ->subject($subject)
                ->html($fullHtml)
                ->text(strip_tags(str_replace(['<br>', '<p>', '</p>', '</div>'], ["\n", "\n\n", "", "\n"], $fullHtml)));

            $mailer->send($email);

            Log::info("MailNotificationService: Successfully sent email '{$subject}' to {$toEmail}.");
            return true;
        } catch (\Throwable $e) {
            Log::error("MailNotificationService: Failed sending '{$subject}' to {$toEmail}. Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Modern HTML email template layout.
     */
    protected static function renderLayout(
        string $subject,
        string $contentHtml,
        ?string $actionUrl,
        ?string $actionText,
        string $companyName,
        string $companyAddress
    ): string {
        $btnHtml = '';
        if ($actionUrl && $actionText) {
            $btnHtml = '
                <div style="margin: 32px 0 24px; text-align: center;">
                    <a href="' . htmlspecialchars($actionUrl) . '" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                        ' . htmlspecialchars($actionText) . ' &rarr;
                    </a>
                </div>
            ';
        }

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($subject) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 26px 32px; text-align: left;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <div style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">KABHYAN TECHNOLOGIES</div>
                                        <div style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">Enterprise Resource Planning & Client Workspace</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                        <td style="padding: 36px 32px 28px;">
                            ' . $contentHtml . '
                            ' . $btnHtml . '
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 20px;" />
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                                If the button above does not work, copy and paste this URL into your browser:<br />
                                <a href="' . htmlspecialchars($actionUrl ?? '') . '" style="color: #2563eb; word-break: break-all;">' . htmlspecialchars($actionUrl ?? '') . '</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 500;">
                                ' . htmlspecialchars($companyName) . '
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                ' . htmlspecialchars($companyAddress) . ' • Automated System Notification
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }

    /**
     * 1. Send Welcome Email to Client with Portal Credentials.
     */
    public static function sendClientWelcome(Client $client, string $plainPassword): bool
    {
        $baseUrl = self::getBaseUrl();
        $portalUrl = "{$baseUrl}/login";

        $subject = "Welcome to Kabhyan Technologies - Client Portal Access";

        $html = '
            <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Hello ' . htmlspecialchars($client->name) . ',</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                Your client portal account for <strong>' . htmlspecialchars($client->company_name) . '</strong> has been activated in our enterprise platform. You can now access your project deliverables, view estimates and invoices, and submit support tickets directly.
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Your Portal Login Credentials</div>
                <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px; color: #334155;">
                    <tr>
                        <td width="130" style="font-weight: 600; color: #64748b;">Client Code:</td>
                        <td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: 600;">' . htmlspecialchars($client->client_code) . '</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #64748b;">Login Email:</td>
                        <td><strong>' . htmlspecialchars($client->email) . '</strong></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #64748b;">Temporary Password:</td>
                        <td><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: 700;">' . htmlspecialchars($plainPassword) . '</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #64748b;">Access Portal:</td>
                        <td><a href="' . htmlspecialchars($portalUrl) . '" style="color: #2563eb;">' . htmlspecialchars($portalUrl) . '</a></td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 16px 0 0;">
                For security reasons, please sign in and change your password upon your initial visit. If you experience any issues, reply to this email or reach out to your account manager.
            </p>
        ';

        // Also record an in-app notification for ERP admins
        SystemNotification::createNotification(
            null,
            'client',
            'New Client Onboarded',
            "{$client->name} ({$client->company_name}) has been created with client portal access.",
            '/dashboard/clients'
        );

        return self::send($client->email, $subject, $html, $client->name, $portalUrl, "Access Client Portal");
    }

    /**
     * 2. Send Onboarding Email to New User/Staff Member.
     */
    public static function sendUserWelcome(User $user, string $plainPassword): bool
    {
        $baseUrl = self::getBaseUrl();
        $loginUrl = "{$baseUrl}/login";

        $subject = "Welcome to Kabhyan ERP - Your Staff Account Credentials";

        $html = '
            <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Welcome ' . htmlspecialchars($user->name) . ',</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                You have been onboarded to the <strong>Kabhyan Technologies Enterprise ERP</strong>. Your administrative and team workspace credentials have been provisioned as follows:
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Account Information</div>
                <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px; color: #334155;">
                    <tr>
                        <td width="130" style="font-weight: 600; color: #64748b;">Assigned Role:</td>
                        <td><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">' . htmlspecialchars($user->role) . '</span></td>
                    </tr>
                    ' . ($user->department ? '<tr><td style="font-weight: 600; color: #64748b;">Department:</td><td>' . htmlspecialchars($user->department) . '</td></tr>' : '') . '
                    <tr>
                        <td style="font-weight: 600; color: #64748b;">Corporate Email:</td>
                        <td><strong>' . htmlspecialchars($user->email) . '</strong></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: #64748b;">Initial Password:</td>
                        <td><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-weight: 700;">' . htmlspecialchars($plainPassword) . '</span></td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 16px 0 0;">
                Please log in to your workspace promptly. Sessions are protected with Redis and role-based access control.
            </p>
        ';

        // In-app notification
        SystemNotification::createNotification(
            null,
            'user',
            'New Team Member Added',
            "{$user->name} joined Kabhyan ERP as {$user->role}.",
            '/dashboard/users'
        );

        return self::send($user->email, $subject, $html, $user->name, $loginUrl, "Enter ERP Workspace");
    }

    /**
     * 3. Send Notification when a Support Ticket is Raised (Both Client and Staff).
     */
    public static function sendTicketCreated(Ticket $ticket, string $origin = 'client'): void
    {
        $baseUrl = self::getBaseUrl();
        $ticket->loadMissing(['client', 'project', 'assignee']);

        $client = $ticket->client;
        $clientEmail = $client?->email;
        $clientName = $client?->name ?? 'Valued Client';
        $companyName = $client?->company_name ?? 'Client';

        $adminDashboardUrl = "{$baseUrl}/dashboard/tickets";
        $clientPortalUrl = "{$baseUrl}/portal";

        // Notification to Staff/Admins
        $staffSubject = "[Ticket #{$ticket->ticket_number}] New Support Request: {$ticket->subject}";
        $staffHtml = '
            <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">New Support Ticket Raised</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                A new ticket has been submitted by <strong>' . htmlspecialchars($clientName) . ' (' . htmlspecialchars($companyName) . ')</strong>.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px; color: #334155;">
                    <tr><td width="130" style="font-weight: 600; color: #64748b;">Ticket #:</td><td><strong>' . htmlspecialchars($ticket->ticket_number) . '</strong></td></tr>
                    <tr><td style="font-weight: 600; color: #64748b;">Type:</td><td><span style="text-transform: capitalize;">' . htmlspecialchars(str_replace('_', ' ', $ticket->type)) . '</span></td></tr>
                    <tr><td style="font-weight: 600; color: #64748b;">Priority:</td><td><span style="font-weight: 700; color: ' . ($ticket->priority === 'critical' ? '#dc2626' : '#2563eb') . '; text-transform: uppercase;">' . htmlspecialchars($ticket->priority) . '</span></td></tr>
                    <tr><td style="font-weight: 600; color: #64748b;">Subject:</td><td><strong>' . htmlspecialchars($ticket->subject) . '</strong></td></tr>
                    ' . ($ticket->project ? '<tr><td style="font-weight: 600; color: #64748b;">Project:</td><td>' . htmlspecialchars($ticket->project->title) . '</td></tr>' : '') . '
                </table>
                <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; line-height: 1.6;">
                    <strong>Description:</strong><br />' . nl2br(htmlspecialchars($ticket->description)) . '
                </div>
            </div>
        ';

        // Target assigned staff if assigned, otherwise notify ERP admin inbox
        $staffRecipient = $ticket->assignee?->email ?? SystemSetting::get('mail_from_address', 'alerts@kabhyan.com');
        self::send($staffRecipient, $staffSubject, $staffHtml, $ticket->assignee?->name ?? 'Admin', $adminDashboardUrl, "View Ticket in ERP");

        // Record In-App Notification for Admin / Assigned Staff
        SystemNotification::createNotification(
            $ticket->assigned_to,
            'ticket',
            "New Ticket: {$ticket->ticket_number}",
            "{$companyName} created ticket '{$ticket->subject}' ({$ticket->priority} priority)",
            '/dashboard/tickets',
            ['ticket_id' => $ticket->id, 'ticket_number' => $ticket->ticket_number]
        );

        // Acknowledgment Email to Client
        if ($clientEmail) {
            $clientSubject = "[Ticket #{$ticket->ticket_number}] We have received your support ticket: {$ticket->subject}";
            $clientHtml = '
                <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Hello ' . htmlspecialchars($clientName) . ',</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                    Thank you for reaching out to Kabhyan Technologies. We have logged your support request under ticket reference <strong>' . htmlspecialchars($ticket->ticket_number) . '</strong>.
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px; color: #334155;">
                        <tr><td width="130" style="font-weight: 600; color: #64748b;">Ticket Reference:</td><td><strong>' . htmlspecialchars($ticket->ticket_number) . '</strong></td></tr>
                        <tr><td style="font-weight: 600; color: #64748b;">Subject:</td><td>' . htmlspecialchars($ticket->subject) . '</td></tr>
                        <tr><td style="font-weight: 600; color: #64748b;">Status:</td><td><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Open</span></td></tr>
                    </table>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 16px 0 0;">
                    Our operations and engineering specialists are reviewing your request and will respond shortly. You can follow updates and reply at any time via your client portal.
                </p>
            ';

            self::send($clientEmail, $clientSubject, $clientHtml, $clientName, $clientPortalUrl, "Track Ticket Status");
        }
    }

    /**
     * 4. Send Notification on Ticket Reply (Both Client and Staff).
     */
    public static function sendTicketReply(Ticket $ticket, TicketReply $reply, bool $isStaffReply): void
    {
        $baseUrl = self::getBaseUrl();
        $ticket->loadMissing(['client', 'project', 'assignee']);

        $client = $ticket->client;
        $clientEmail = $client?->email;
        $clientName = $client?->name ?? 'Valued Client';
        $companyName = $client?->company_name ?? 'Client';

        if ($isStaffReply) {
            // Staff replied -> Notify Client
            if ($clientEmail) {
                $subject = "[Update #{$ticket->ticket_number}] New reply on: {$ticket->subject}";
                $portalUrl = "{$baseUrl}/portal";

                $html = '
                    <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Hello ' . htmlspecialchars($clientName) . ',</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                        The Kabhyan Technologies support team has posted an update to your ticket <strong>#' . htmlspecialchars($ticket->ticket_number) . '</strong>.
                    </p>
                    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 18px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                        <div style="font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 8px;">Response from Support:</div>
                        <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                            ' . nl2br(htmlspecialchars($reply->message)) . '
                        </div>
                    </div>
                    <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 16px 0 0;">
                        You can view the complete discussion thread and submit further clarifications through your portal.
                    </p>
                ';

                self::send($clientEmail, $subject, $html, $clientName, $portalUrl, "Reply via Portal");
            }
        } else {
            // Client replied -> Notify Staff / Assignee / Admin
            $staffRecipient = $ticket->assignee?->email ?? SystemSetting::get('mail_from_address', 'alerts@kabhyan.com');
            $subject = "[Client Reply #{$ticket->ticket_number}] {$companyName} replied: {$ticket->subject}";
            $adminUrl = "{$baseUrl}/dashboard/tickets";

            $html = '
                <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Client Replied on Ticket #' . htmlspecialchars($ticket->ticket_number) . '</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                    <strong>' . htmlspecialchars($clientName) . ' (' . htmlspecialchars($companyName) . ')</strong> has submitted a response to ticket <em>"' . htmlspecialchars($ticket->subject) . '"</em>.
                </p>
                <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 18px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                    <div style="font-size: 12px; font-weight: 700; color: #059669; margin-bottom: 8px;">Client Message:</div>
                    <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                        ' . nl2br(htmlspecialchars($reply->message)) . '
                    </div>
                </div>
            ';

            self::send($staffRecipient, $subject, $html, $ticket->assignee?->name ?? 'Admin', $adminUrl, "Open Ticket in ERP");

            // In-app notification
            SystemNotification::createNotification(
                $ticket->assigned_to,
                'reply',
                "Reply on {$ticket->ticket_number}",
                "{$companyName} replied on '{$ticket->subject}'",
                '/dashboard/tickets',
                ['ticket_id' => $ticket->id, 'ticket_number' => $ticket->ticket_number]
            );
        }
    }

    /**
     * 5. Send Password Reset Email.
     */
    public static function sendPasswordReset(User $user, string $token): bool
    {
        $baseUrl = self::getBaseUrl();
        $resetUrl = "{$baseUrl}/reset-password?token={$token}&email=" . urlencode($user->email);

        $subject = "Reset Your Password - Kabhyan Technologies ERP";

        $html = '
            <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">Hello ' . htmlspecialchars($user->name) . ',</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                We received a request to reset the password for your Kabhyan ERP account associated with <strong>' . htmlspecialchars($user->email) . '</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                Click the button below to choose a new password. This reset link is cryptographically signed and will expire in <strong>60 minutes</strong>.
            </p>
            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #991b1b;">
                <strong>Security Alert:</strong> If you did not request this password reset, please disregard this email or immediately alert your system administrator. Your existing credentials remain secure.
            </div>
        ';

        return self::send($user->email, $subject, $html, $user->name, $resetUrl, "Reset My Password");
    }
}

