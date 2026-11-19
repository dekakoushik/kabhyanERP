<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FileSanitizerService
{
    /**
     * Globally allowed safe file extensions for business documents and images.
     */
    protected const ALLOWED_EXTENSIONS = [
        // Standard Documents
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'rtf', 'ppt', 'pptx',
        // Images (strictly raster formats; SVG is intentionally omitted due to embedded XML/scripting risks)
        'jpg', 'jpeg', 'png', 'webp',
        // Compressed archives
        'zip', 'rar', '7z',
    ];

    /**
     * Strictly banned extensions (executables, scripts, web payloads, config files).
     */
    protected const BANNED_EXTENSIONS = [
        'php', 'phtml', 'php3', 'php4', 'php5', 'phps', 'phar', 'inc',
        'exe', 'dll', 'so', 'bin', 'com', 'msi', 'msp', 'scr', 'pif', 'cpl',
        'bat', 'cmd', 'sh', 'bash', 'zsh', 'ps1', 'psm1', 'vbs', 'vbe', 'wsf', 'wsh', 'hta',
        'js', 'mjs', 'jsx', 'ts', 'tsx', 'jar', 'gadget', 'reg',
        'py', 'pyc', 'pyw', 'pl', 'pm', 'cgi', 'asp', 'aspx', 'cer', 'csr', 'jsp', 'jspx',
        'htm', 'html', 'xhtml', 'shtml', 'svg', 'svgz', 'xml', 'json',
        'htaccess', 'htpasswd', 'ini', 'conf', 'env', 'config', 'yml', 'yaml',
    ];

    /**
     * Safely log security events without throwing if logger is unavailable.
     */
    protected function logSecurityAlert(string $level, string $message): void
    {
        try {
            if ($level === 'alert') {
                Log::alert($message);
            } else {
                Log::warning($message);
            }
        } catch (\Throwable) {
            // Logging failure should never disrupt security defense
        }
    }
    protected const EXTENSION_MIME_MAP = [
        'pdf'  => ['application/pdf', 'application/x-pdf'],
        'jpg'  => ['image/jpeg', 'image/pjpeg'],
        'jpeg' => ['image/jpeg', 'image/pjpeg'],
        'png'  => ['image/png', 'image/x-png'],
        'webp' => ['image/webp'],
        'doc'  => ['application/msword', 'application/vnd.ms-office', 'application/octet-stream'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'xls'  => ['application/vnd.ms-excel', 'application/vnd.ms-office', 'application/octet-stream'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
        'ppt'  => ['application/vnd.ms-powerpoint', 'application/vnd.ms-office'],
        'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
        'csv'  => ['text/csv', 'text/plain', 'application/csv', 'text/x-csv', 'application/vnd.ms-excel'],
        'txt'  => ['text/plain'],
        'rtf'  => ['application/rtf', 'text/rtf', 'text/plain'],
        'zip'  => ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
        'rar'  => ['application/x-rar-compressed', 'application/vnd.rar', 'application/x-rar'],
        '7z'   => ['application/x-7z-compressed'],
    ];

    /**
     * Perform comprehensive sanitization, validation, malware scanning, and safe extraction.
     *
     * @param UploadedFile $file
     * @param string|null $allowedTypeConstraint PM configured type (e.g. 'pdf', 'image', 'any')
     * @return array [
     *     'sanitized_original_name' => string,
     *     'clean_extension' => string,
     *     'safe_stored_filename' => string,
     *     'verified_mime_type' => string,
     *     'file_size' => int
     * ]
     * @throws ValidationException
     */
    public function sanitizeAndValidate(UploadedFile $file, ?string $allowedTypeConstraint = 'any'): array
    {
        if (!$file->isValid()) {
            throw ValidationException::withMessages([
                'file' => ['The uploaded file failed transfer or is corrupted.']
            ]);
        }

        $realPath = $file->getRealPath();
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();

        // 1. Sanitize original filename (strip path traversal, null bytes, control chars)
        $sanitizedName = $this->sanitizeFilename($originalName);

        // 2. Validate multi-extensions and double-extension attacks (e.g. evil.php.pdf)
        $this->detectDangerousMultiExtensions($sanitizedName);

        // 3. Extract and validate extension against whitelist & blacklist
        $extension = strtolower(pathinfo($sanitizedName, PATHINFO_EXTENSION));
        if (empty($extension)) {
            $extension = strtolower($file->guessExtension() ?? '');
        }

        $this->validateExtension($extension, $allowedTypeConstraint);

        // 4. Verify true binary MIME type using PHP fileinfo (never trust client header)
        $detectedMime = $this->detectTrueMimeType($realPath);
        $this->verifyMimeConsistency($extension, $detectedMime);

        // 5. Deep binary heuristic scan (PE/ELF executables, web shells, polyglots, script tags)
        $this->scanBinaryHeuristics($realPath, $extension);

        // 6. Antivirus scan via ClamAV (if present on the host/container)
        $this->scanWithClamAvIfAvailable($realPath, $sanitizedName);

        // 7. Generate cryptographically safe randomized filename for disk storage
        $safeDiskFilename = Str::uuid()->toString() . '.' . $extension;

        return [
            'sanitized_original_name' => $sanitizedName,
            'clean_extension' => $extension,
            'safe_stored_filename' => $safeDiskFilename,
            'verified_mime_type' => $detectedMime,
            'file_size' => $fileSize,
        ];
    }

    /**
     * Sanitize filename: strip path traversal, null bytes, non-printable characters.
     */
    public function sanitizeFilename(string $filename): string
    {
        // Extract basename first to discard any directory prefixes
        $name = basename(str_replace('\\', '/', $filename));

        // Strip null bytes and directory traversal
        $name = str_replace(["\0", '../', '..\\', '/', '\\'], '', $name);

        // Only allow safe alphanumeric characters, dashes, underscores, and single dots
        $name = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $name);

        // Collapse multiple consecutive dots (e.g. "doc...pdf" -> "doc.pdf")
        $name = preg_replace('/\.{2,}/', '.', $name);

        // Trim leading and trailing dots/underscores
        $name = trim($name, " ._");

        // Fallback if name becomes empty
        if (empty($name)) {
            $name = 'document_' . time();
        }

        // Limit maximum filename length to 150 chars
        if (strlen($name) > 150) {
            $ext = pathinfo($name, PATHINFO_EXTENSION);
            $base = pathinfo($name, PATHINFO_FILENAME);
            $name = substr($base, 0, 140) . ($ext ? '.' . $ext : '');
        }

        return $name;
    }

    /**
     * Detect and reject double/multi-extension attacks (e.g. malware.php.pdf, script.sh.docx).
     */
    protected function detectDangerousMultiExtensions(string $filename): void
    {
        $parts = explode('.', strtolower($filename));
        if (count($parts) > 2) {
            // Check all segments preceding the final extension
            array_pop($parts); // Remove final extension
            foreach ($parts as $part) {
                if (in_array($part, self::BANNED_EXTENSIONS, true)) {
                    $this->logSecurityAlert('warning', "[Security Alert] Blocked suspicious multi-extension upload: {$filename}");
                    throw ValidationException::withMessages([
                        'file' => ['Suspicious filename pattern detected. Files with executable extensions disguised as documents are strictly prohibited.']
                    ]);
                }
            }
        }
    }

    /**
     * Validate file extension against allowed whitelist and project constraint.
     */
    protected function validateExtension(string $extension, ?string $constraint): void
    {
        // Check global banned list
        if (in_array($extension, self::BANNED_EXTENSIONS, true)) {
            $this->logSecurityAlert('warning', "[Security Alert] Attempted upload of banned extension: .{$extension}");
            throw ValidationException::withMessages([
                'file' => ["The file format (.{$extension}) is not permitted for security reasons."]
            ]);
        }

        // Check global allowed list
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw ValidationException::withMessages([
                'file' => ["Unsupported file format (.{$extension}). Please upload a valid document (PDF, Word, Excel) or image (JPG, PNG, WEBP)."]
            ]);
        }

        // Check project-specific constraint if configured by the Project Manager
        if ($constraint && $constraint !== 'any') {
            $allowedSubset = $this->resolveConstraintExtensions($constraint);
            if (!empty($allowedSubset) && !in_array($extension, $allowedSubset, true)) {
                $listStr = strtoupper(implode(', ', $allowedSubset));
                throw ValidationException::withMessages([
                    'file' => ["This document request specifically requires one of the following formats: {$listStr}."]
                ]);
            }
        }
    }

    /**
     * Resolve PM constraint string into an array of allowed extensions.
     */
    protected function resolveConstraintExtensions(string $constraint): array
    {
        $c = strtolower(trim($constraint));

        if ($c === 'pdf') {
            return ['pdf'];
        }
        if (in_array($c, ['image', 'images', 'photo', 'photos'])) {
            return ['jpg', 'jpeg', 'png', 'webp'];
        }
        if (in_array($c, ['document', 'documents', 'doc'])) {
            return ['pdf', 'doc', 'docx', 'txt', 'rtf'];
        }
        if (in_array($c, ['spreadsheet', 'excel', 'sheet'])) {
            return ['xlsx', 'xls', 'csv'];
        }
        if (in_array($c, ['archive', 'zip'])) {
            return ['zip', 'rar', '7z'];
        }

        // Comma-separated list (e.g. "pdf,docx,xlsx")
        if (str_contains($c, ',')) {
            $parts = array_map('trim', explode(',', $c));
            return array_filter($parts, fn($ext) => in_array($ext, self::ALLOWED_EXTENSIONS, true));
        }

        return in_array($c, self::ALLOWED_EXTENSIONS, true) ? [$c] : [];
    }

    /**
     * Detect true binary MIME type using PHP fileinfo.
     */
    protected function detectTrueMimeType(string $filePath): string
    {
        $normalizedPath = str_replace('\\', '/', $filePath);
        $finfo = @finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mime = @finfo_file($finfo, $normalizedPath);
            @finfo_close($finfo);
            if ($mime) {
                return strtolower($mime);
            }
        }

        if (function_exists('mime_content_type')) {
            $mime = @mime_content_type($normalizedPath);
            if ($mime) {
                return strtolower($mime);
            }
        }

        return 'application/octet-stream';
    }

    /**
     * Verify that detected binary MIME matches the file extension.
     */
    protected function verifyMimeConsistency(string $extension, string $detectedMime): void
    {
        // Immediately reject known executable / script MIME types regardless of extension
        $dangerousMimes = [
            'text/x-php', 'application/x-httpd-php', 'application/x-php',
            'application/x-dosexec', 'application/x-executable', 'application/x-sharedlib',
            'text/html', 'text/javascript', 'application/javascript', 'application/x-javascript',
            'application/x-shellscript', 'text/x-shellscript', 'application/x-msdos-program',
        ];

        if (in_array($detectedMime, $dangerousMimes, true)) {
            $this->logSecurityAlert('warning', "[Security Alert] Blocked file with executable MIME type: {$detectedMime} for .{$extension}");
            throw ValidationException::withMessages([
                'file' => ['Security verification failed: File content does not match a valid document or contains executable scripts.']
            ]);
        }

        if (isset(self::EXTENSION_MIME_MAP[$extension])) {
            $validMimes = self::EXTENSION_MIME_MAP[$extension];
            if (!in_array($detectedMime, $validMimes, true)) {
                // If it's a zip-based office doc (docx, xlsx, pptx), octet-stream or application/zip is acceptable
                $isZipOffice = in_array($extension, ['docx', 'xlsx', 'pptx']) &&
                    in_array($detectedMime, ['application/zip', 'application/octet-stream', 'application/x-zip']);

                if (!$isZipOffice) {
                    $this->logSecurityAlert('warning', "[Security Alert] MIME mismatch detected: extension .{$extension} with MIME {$detectedMime}");
                    throw ValidationException::withMessages([
                        'file' => ["File integrity verification failed. The file format header does not match its .{$extension} extension."]
                    ]);
                }
            }
        }
    }

    /**
     * Inspect file binary for embedded malware headers, web shells, and script polyglots.
     */
    protected function scanBinaryHeuristics(string $filePath, string $extension): void
    {
        $handle = @fopen($filePath, 'rb');
        if (!$handle) {
            return;
        }

        // Read initial header block (first 4KB)
        $header = fread($handle, 4096);
        fclose($handle);

        if ($header === false || strlen($header) === 0) {
            throw ValidationException::withMessages([
                'file' => ['The uploaded file is empty or unreadable.']
            ]);
        }

        // 1. Windows PE Executable check: begins with "MZ" (\x4D\x5A)
        if (str_starts_with($header, "MZ")) {
            $this->logSecurityAlert('warning', "[Security Alert] Windows PE binary header (MZ) detected in upload.");
            throw ValidationException::withMessages([
                'file' => ['Executable program binaries are strictly forbidden.']
            ]);
        }

        // 2. Linux ELF binary check: begins with \x7F\x45\x4C\x46 (\x7fELF)
        if (str_starts_with($header, "\x7FELF")) {
            $this->logSecurityAlert('warning', "[Security Alert] Linux ELF binary header detected in upload.");
            throw ValidationException::withMessages([
                'file' => ['Linux executable binaries are strictly forbidden.']
            ]);
        }

        // 3. Mach-O macOS binary check
        $magic4 = substr($header, 0, 4);
        if (in_array($magic4, ["\xFE\xED\xFA\xCE", "\xFE\xED\xFA\xCF", "\xCE\xFA\xED\xFE", "\xCF\xFA\xED\xFE"], true)) {
            $this->logSecurityAlert('warning', "[Security Alert] Mach-O executable header detected in upload.");
            throw ValidationException::withMessages([
                'file' => ['Executable application files are strictly forbidden.']
            ]);
        }

        // 4. Shell Script check: begins with shebang
        if (str_starts_with($header, "#!/bin/") || str_starts_with($header, "#!/usr/bin/")) {
            $this->logSecurityAlert('warning', "[Security Alert] Shell script shebang detected in upload.");
            throw ValidationException::withMessages([
                'file' => ['Shell scripts cannot be uploaded as project documents.']
            ]);
        }

        // 5. Deep inspection for PHP tags & web shells in non-PHP files
        // Read up to first 512KB to catch polyglot payloads
        $sample = file_get_contents($filePath, false, null, 0, 524288);
        if ($sample !== false) {
            $dangerousPatterns = [
                '<?php',
                '<?=',
                '<script language="php"',
                '<script language=\'php\'',
                '__halt_compiler()',
            ];

            foreach ($dangerousPatterns as $pattern) {
                if (stripos($sample, $pattern) !== false) {
                    $this->logSecurityAlert('warning', "[Security Alert] PHP tag ({$pattern}) detected inside uploaded file.");
                    throw ValidationException::withMessages([
                        'file' => ['Security verification failed: embedded script tags detected in file payload.']
                    ]);
                }
            }

            // PDF-specific dangerous action streams: /Launch (arbitrary command execution)
            if ($extension === 'pdf') {
                if (preg_match('/\/Launch\s*<</i', $sample) || preg_match('/\/Launch\s*\[/i', $sample)) {
                    $this->logSecurityAlert('warning', "[Security Alert] Malicious PDF /Launch command execution action detected.");
                    throw ValidationException::withMessages([
                        'file' => ['The PDF document contains high-risk active executable actions (/Launch) and cannot be accepted.']
                    ]);
                }
            }
        }

        // 6. Image validity verification
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $imageInfo = @getimagesize($filePath);
            if ($imageInfo === false || empty($imageInfo[0]) || empty($imageInfo[1])) {
                throw ValidationException::withMessages([
                    'file' => ['The uploaded image file is corrupt or not a valid image.']
                ]);
            }
        }
    }

    /**
     * Run ClamAV antivirus scan if clamdscan or clamscan binary is available in the environment.
     */
    protected function scanWithClamAvIfAvailable(string $filePath, string $filename): void
    {
        // Check if ClamAV daemon scanner (clamdscan) or CLI scanner (clamscan) is available
        $scannerBinary = null;

        if (PHP_OS_FAMILY === 'Linux') {
            if (is_executable('/usr/bin/clamdscan')) {
                $scannerBinary = '/usr/bin/clamdscan --no-summary';
            } elseif (is_executable('/usr/bin/clamscan')) {
                $scannerBinary = '/usr/bin/clamscan --no-summary';
            }
        }

        if (!$scannerBinary) {
            // ClamAV not installed on this host; heuristic engine provided the protection layer
            return;
        }

        try {
            $escapedPath = escapeshellarg($filePath);
            $output = [];
            $returnCode = 0;
            exec("{$scannerBinary} {$escapedPath} 2>&1", $output, $returnCode);

            $outputStr = implode(' ', $output);

            // ClamAV return code: 0 = clean, 1 = virus found, >1 = error
            if ($returnCode === 1 || str_contains($outputStr, 'FOUND')) {
                $this->logSecurityAlert('alert', "[VIRUS DETECTED] ClamAV identified malware in client upload '{$filename}': {$outputStr}");
                throw ValidationException::withMessages([
                    'file' => ['Antivirus security check failed: Malicious content was detected in this file.']
                ]);
            }
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $this->logSecurityAlert('warning', "[ClamAV] Antivirus scanner scan error (falling back to heuristic): " . $e->getMessage());
        }
    }
}
