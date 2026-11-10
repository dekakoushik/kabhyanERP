<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $catCloud = ExpenseCategory::where('slug', 'cloud-hosting')->first();
        $catSal = ExpenseCategory::where('slug', 'salaries-contractors')->first();
        $catSoft = ExpenseCategory::where('slug', 'software-tools')->first();
        $catOff = ExpenseCategory::where('slug', 'office-utilities')->first();
        $catLegal = ExpenseCategory::where('slug', 'compliance-legal')->first();

        Expense::firstOrCreate(
            ['expense_number' => 'EXP-2026-001'],
            [
                'expense_category_id' => $catCloud->id,
                'title' => 'AWS Cloud Infrastructure (Production Clusters & RDS)',
                'vendor_name' => 'Amazon Web Services India Pvt Ltd',
                'vendor_gstin' => '27AAECF5398P1ZI',
                'expense_date' => '2026-10-15',
                'amount' => 38000,
                'tax_amount' => 6840,
                'total_amount' => 44840,
                'currency' => 'INR',
                'payment_method' => 'corporate_card',
                'transaction_reference' => 'TXN-AWS-OCT2026',
                'status' => 'paid',
                'notes' => 'Production ECS and Redis cache cluster',
            ]
        );

        Expense::firstOrCreate(
            ['expense_number' => 'EXP-2026-002'],
            [
                'expense_category_id' => $catSoft->id,
                'title' => 'GitHub Enterprise & Figma Team Seats Renewal',
                'vendor_name' => 'GitHub Inc / Figma Inc',
                'expense_date' => '2026-10-28',
                'amount' => 18500,
                'tax_amount' => 3330,
                'total_amount' => 21830,
                'currency' => 'INR',
                'payment_method' => 'corporate_card',
                'transaction_reference' => 'TXN-GH-FIG-2026',
                'status' => 'paid',
                'notes' => 'Engineering tooling subscriptions',
            ]
        );

        Expense::firstOrCreate(
            ['expense_number' => 'EXP-2026-003'],
            [
                'expense_category_id' => $catOff->id,
                'title' => 'Salt Lake Sector V Office Hub Lease & High-Speed Fiber',
                'vendor_name' => 'Technopolis Commercial Park & Airtel Business',
                'expense_date' => '2026-11-01',
                'amount' => 55000,
                'tax_amount' => 9900,
                'total_amount' => 64900,
                'currency' => 'INR',
                'payment_method' => 'bank_transfer',
                'transaction_reference' => 'HDFC-RTGS-LEASE1126',
                'status' => 'paid',
                'notes' => 'Monthly facility lease and redundant gigabit ISP',
            ]
        );

        Expense::firstOrCreate(
            ['expense_number' => 'EXP-2026-004'],
            [
                'expense_category_id' => $catLegal->id,
                'title' => 'Quarterly GST Audit & MCA Compliance Filing Retainer',
                'vendor_name' => 'Mukherjee & Associates Chartered Accountants',
                'vendor_gstin' => '19AAFFM9918M1Z7',
                'expense_date' => '2026-11-05',
                'amount' => 22000,
                'tax_amount' => 3960,
                'total_amount' => 25960,
                'currency' => 'INR',
                'payment_method' => 'neft',
                'transaction_reference' => 'NEFT-CA-AUDIT-2026',
                'status' => 'paid',
                'notes' => 'CA Retainer for Q2 GST returns and tax filing',
            ]
        );

        // Also ensure an invoice has payment recorded for realistic Income inflow
        $firstInv = Invoice::first();
        if ($firstInv && $firstInv->payments()->count() === 0) {
            $firstInv->recordPayment(150000, 'bank_transfer', '2026-11-08', 'HDFC-UTR-KOLFIN8892', 'Mobilization advance realization');
        }
    }
}

