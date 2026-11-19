<?php

namespace Tests\Unit;

use App\Services\FileSanitizerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FileSanitizerServiceTest extends TestCase
{
    protected FileSanitizerService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new FileSanitizerService();
    }

    public function test_sanitizes_filename_and_strips_traversal(): void
    {
        $dirty = '../../malicious/path/../../Invoice#1 [Final]?.pdf';
        $cleaned = $this->service->sanitizeFilename($dirty);

        $this->assertStringNotContainsString('../', $cleaned);
        $this->assertStringNotContainsString('/', $cleaned);
        $this->assertStringNotContainsString('\\', $cleaned);
        $this->assertStringEndsWith('.pdf', $cleaned);
    }

    public function test_rejects_dangerous_multi_extensions(): void
    {
        $this->expectException(ValidationException::class);

        $tempFile = tempnam(sys_get_temp_dir(), 'test');
        file_put_contents($tempFile, "%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
        $uploaded = new UploadedFile($tempFile, 'exploit.php.pdf', 'application/pdf', null, true);

        $this->service->sanitizeAndValidate($uploaded);
    }

    public function test_rejects_banned_executable_extension(): void
    {
        $this->expectException(ValidationException::class);

        $tempFile = tempnam(sys_get_temp_dir(), 'test');
        file_put_contents($tempFile, "echo 'hello'");
        $uploaded = new UploadedFile($tempFile, 'script.sh', 'application/x-sh', null, true);

        $this->service->sanitizeAndValidate($uploaded);
    }

    public function test_rejects_windows_pe_executable_disguised_as_pdf(): void
    {
        $this->expectException(ValidationException::class);

        $tempFile = tempnam(sys_get_temp_dir(), 'test');
        // Begins with MZ executable header
        file_put_contents($tempFile, "MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF");
        $uploaded = new UploadedFile($tempFile, 'document.pdf', 'application/pdf', null, true);

        $this->service->sanitizeAndValidate($uploaded);
    }

    public function test_rejects_php_script_polyglot(): void
    {
        $this->expectException(ValidationException::class);

        $tempFile = tempnam(sys_get_temp_dir(), 'test');
        file_put_contents($tempFile, "%PDF-1.4\n<?php phpinfo(); ?>\n%%EOF");
        $uploaded = new UploadedFile($tempFile, 'document.pdf', 'application/pdf', null, true);

        $this->service->sanitizeAndValidate($uploaded);
    }

    public function test_accepts_clean_pdf_file(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'test');
        file_put_contents($tempFile, "%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
        $uploaded = new UploadedFile($tempFile, 'Verified_Requirement_Specs.pdf', 'application/pdf', null, true);

        $result = $this->service->sanitizeAndValidate($uploaded);

        $this->assertEquals('Verified_Requirement_Specs.pdf', $result['sanitized_original_name']);
        $this->assertEquals('pdf', $result['clean_extension']);
        $this->assertEquals('application/pdf', $result['verified_mime_type']);
        $this->assertStringEndsWith('.pdf', $result['safe_stored_filename']);
    }
}
