<?php

/**
 * IDE Type Definition Stub for TCPDF.
 * This file is only used by IDE language servers (Intelephense, PHP Tools)
 * for symbol indexing, autocomplete, and static analysis.
 */
if (!class_exists('TCPDF')) {
    class TCPDF
    {
        public function __construct(
            string $orientation = 'P',
            string $unit = 'mm',
            mixed $format = 'A4',
            bool $unicode = true,
            string $encoding = 'UTF-8',
            bool $diskcache = false,
            bool $pdfa = false
        ) {}

        public function setSignature(
            string $signing_cert = '',
            string $private_key = '',
            string $private_key_password = '',
            string $extracerts = '',
            int $mode = 2,
            array $info = [],
            string $approval = ''
        ): void {}

        public function SetCreator(string $creator): void {}
        public function SetAuthor(string $author): void {}
        public function SetTitle(string $title): void {}
        public function SetSubject(string $subject): void {}
        public function SetKeywords(string $keywords): void {}
        public function setPrintHeader(bool $val = true): void {}
        public function setPrintFooter(bool $val = true): void {}
        public function SetMargins(float $left, float $top, float $right = -1, bool $keepmargins = false): void {}
        public function SetAutoPageBreak(bool $auto, float $margin = 0): void {}
        public function setImageScale(float $scale): void {}
        public function AddPage(string $orientation = '', mixed $format = '', bool $keepmargins = false, bool $tocpage = false): void {}
        public function writeHTML(string $html, bool $ln = true, bool $fill = false, bool $reseth = false, bool $cell = false, string $align = ''): void {}
        public function Output(string $name = 'doc.pdf', string $dest = 'I'): string {}
    }
}
