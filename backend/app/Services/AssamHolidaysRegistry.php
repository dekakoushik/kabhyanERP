<?php

namespace App\Services;

class AssamHolidaysRegistry
{
    /**
     * Get official Gazetted Indian National and Government of Assam holidays for 2025-2028.
     *
     * @param int|null $year If specified, returns holidays for that year only; otherwise returns all 2025-2028 holidays.
     * @param string $region 'all', 'assam', or 'national'
     * @return array<int, array{title: string, holiday_date: string, is_optional: bool, description: string, category: string}>
     */
    public static function getHolidays(?int $year = null, string $region = 'all'): array
    {
        $catalog = [
            // ==================== 2025 ====================
            // National & Assam Gazetted Holidays 2025
            ['title' => "New Year's Day", 'holiday_date' => '2025-01-01', 'is_optional' => false, 'category' => 'national', 'description' => 'General / New Year'],
            ['title' => 'Magh Bihu & Tusu Puja (Uruka & Bihu)', 'holiday_date' => '2025-01-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Magh Bihu (Day 2)', 'holiday_date' => '2025-01-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Netaji Subhas Chandra Bose Jayanti / Gwther Bathou San', 'holiday_date' => '2025-01-23', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Republic Day', 'holiday_date' => '2025-01-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Me-Dam-Me-Phi', 'holiday_date' => '2025-01-31', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Ahom Ancestor Festival'],
            ['title' => 'Bir Chilarai Divas', 'holiday_date' => '2025-02-12', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Bir Chilarai Divas'],
            ['title' => 'Ali-Aye-Ligang', 'holiday_date' => '2025-02-19', 'is_optional' => true, 'category' => 'assam', 'description' => 'Assam Festival (Mising Spring Festival)'],
            ['title' => 'Maha Shivratri', 'holiday_date' => '2025-02-26', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Dol Jatra / Holi', 'holiday_date' => '2025-03-14', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Colors'],
            ['title' => 'Id-ul-Fitr', 'holiday_date' => '2025-03-31', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day (Subject to Moon Sighting)'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Goru Bihu)', 'holiday_date' => '2025-04-13', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 1'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Manuh Bihu)', 'holiday_date' => '2025-04-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 2'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Gosai Bihu)', 'holiday_date' => '2025-04-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 3'],
            ['title' => 'Good Friday', 'holiday_date' => '2025-04-18', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Damodardeva Tithi', 'holiday_date' => '2025-04-28', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'May Day / Labour Day', 'holiday_date' => '2025-05-01', 'is_optional' => false, 'category' => 'national', 'description' => 'International Labour Day'],
            ['title' => 'Buddha Purnima', 'holiday_date' => '2025-05-12', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Id-ul-Zuha (Bakrid)', 'holiday_date' => '2025-06-07', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Muharram', 'holiday_date' => '2025-07-06', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Independence Day', 'holiday_date' => '2025-08-15', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Janmashtami', 'holiday_date' => '2025-08-16', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Tithi of Sri Madhabdeva', 'holiday_date' => '2025-08-23', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Madhabdeva'],
            ['title' => 'Tithi of Srimanta Sankardeva', 'holiday_date' => '2025-09-03', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Srimanta Sankardeva'],
            ['title' => 'Fateha-E-Duwaz-Daham', 'holiday_date' => '2025-09-05', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Durga Puja (Maha Saptami)', 'holiday_date' => '2025-09-29', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Maha Ashtami / Navami)', 'holiday_date' => '2025-09-30', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Mahatma Gandhi Jayanti & Vijaya Dashami', 'holiday_date' => '2025-10-02', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day & Vijaya Dashami'],
            ['title' => 'Kati Bihu', 'holiday_date' => '2025-10-18', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Kongali/Kati Bihu'],
            ['title' => 'Kali Puja & Diwali', 'holiday_date' => '2025-10-20', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Lights'],
            ['title' => 'Bhai Dooj / Bhatri Dwitiya', 'holiday_date' => '2025-10-22', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Chhath Puja', 'holiday_date' => '2025-10-27', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Guru Nanak Jayanti', 'holiday_date' => '2025-11-05', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Asom Divas (Sukapha Divas)', 'holiday_date' => '2025-12-02', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Chaolung Sukapha Divas'],
            ['title' => 'Christmas Day', 'holiday_date' => '2025-12-25', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],

            // ==================== 2026 ====================
            // National & Assam Gazetted Holidays 2026
            ['title' => "New Year's Day", 'holiday_date' => '2026-01-01', 'is_optional' => false, 'category' => 'national', 'description' => 'General / New Year'],
            ['title' => 'Magh Bihu & Tusu Puja (Uruka & Bihu)', 'holiday_date' => '2026-01-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Magh Bihu (Day 2)', 'holiday_date' => '2026-01-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Netaji Subhas Chandra Bose Jayanti / Gwther Bathou San', 'holiday_date' => '2026-01-23', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Republic Day', 'holiday_date' => '2026-01-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Me-Dam-Me-Phi', 'holiday_date' => '2026-01-31', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Ahom Ancestor Festival'],
            ['title' => 'Bir Chilarai Divas', 'holiday_date' => '2026-02-02', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Bir Chilarai Divas'],
            ['title' => 'Maha Shivratri', 'holiday_date' => '2026-02-15', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Ali-Aye-Ligang', 'holiday_date' => '2026-02-18', 'is_optional' => true, 'category' => 'assam', 'description' => 'Assam Festival (Mising Spring Festival)'],
            ['title' => 'Dol Jatra / Holi', 'holiday_date' => '2026-03-04', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Colors'],
            ['title' => 'Id-ul-Fitr', 'holiday_date' => '2026-03-20', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day (Subject to Moon Sighting)'],
            ['title' => 'Good Friday', 'holiday_date' => '2026-04-03', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Goru Bihu)', 'holiday_date' => '2026-04-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 1'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Manuh Bihu)', 'holiday_date' => '2026-04-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 2'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Gosai Bihu)', 'holiday_date' => '2026-04-16', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 3'],
            ['title' => 'Damodardeva Tithi', 'holiday_date' => '2026-04-17', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Buddha Purnima & May Day', 'holiday_date' => '2026-05-01', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day & Labour Day'],
            ['title' => 'Id-ul-Zuha (Bakrid)', 'holiday_date' => '2026-05-27', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Muharram', 'holiday_date' => '2026-06-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Independence Day', 'holiday_date' => '2026-08-15', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Fateha-E-Duwaz-Daham', 'holiday_date' => '2026-08-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Tithi of Sri Madhabdeva', 'holiday_date' => '2026-09-01', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Madhabdeva'],
            ['title' => 'Janmashtami', 'holiday_date' => '2026-09-04', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Tithi of Srimanta Sankardeva', 'holiday_date' => '2026-09-12', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Srimanta Sankardeva'],
            ['title' => 'Mahatma Gandhi Jayanti', 'holiday_date' => '2026-10-02', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Durga Puja (Maha Saptami)', 'holiday_date' => '2026-10-18', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Maha Ashtami / Navami)', 'holiday_date' => '2026-10-19', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Vijaya Dashami)', 'holiday_date' => '2026-10-20', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Vijaya Dashami'],
            ['title' => 'Kati Bihu', 'holiday_date' => '2026-10-18', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Kongali/Kati Bihu'],
            ['title' => 'Kali Puja & Diwali', 'holiday_date' => '2026-11-08', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Lights'],
            ['title' => 'Bhai Dooj / Bhatri Dwitiya', 'holiday_date' => '2026-11-10', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Chhath Puja', 'holiday_date' => '2026-11-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Guru Nanak Jayanti', 'holiday_date' => '2026-11-24', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Asom Divas (Sukapha Divas)', 'holiday_date' => '2026-12-02', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Chaolung Sukapha Divas'],
            ['title' => 'Christmas Day', 'holiday_date' => '2026-12-25', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],

            // ==================== 2027 ====================
            // National & Assam Gazetted Holidays 2027
            ['title' => "New Year's Day", 'holiday_date' => '2027-01-01', 'is_optional' => false, 'category' => 'national', 'description' => 'General / New Year'],
            ['title' => 'Magh Bihu & Tusu Puja (Uruka & Bihu)', 'holiday_date' => '2027-01-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Magh Bihu (Day 2)', 'holiday_date' => '2027-01-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Netaji Subhas Chandra Bose Jayanti / Gwther Bathou San', 'holiday_date' => '2027-01-23', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Republic Day', 'holiday_date' => '2027-01-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Me-Dam-Me-Phi', 'holiday_date' => '2027-01-31', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Ahom Ancestor Festival'],
            ['title' => 'Bir Chilarai Divas', 'holiday_date' => '2027-02-21', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Bir Chilarai Divas'],
            ['title' => 'Maha Shivratri', 'holiday_date' => '2027-03-06', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Id-ul-Fitr', 'holiday_date' => '2027-03-10', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day (Subject to Moon Sighting)'],
            ['title' => 'Dol Jatra / Holi', 'holiday_date' => '2027-03-22', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Colors'],
            ['title' => 'Good Friday', 'holiday_date' => '2027-03-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Goru Bihu)', 'holiday_date' => '2027-04-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 1'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Manuh Bihu)', 'holiday_date' => '2027-04-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 2'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Gosai Bihu)', 'holiday_date' => '2027-04-16', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 3'],
            ['title' => 'May Day / Labour Day', 'holiday_date' => '2027-05-01', 'is_optional' => false, 'category' => 'national', 'description' => 'International Labour Day'],
            ['title' => 'Damodardeva Tithi', 'holiday_date' => '2027-05-06', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Id-ul-Zuha (Bakrid)', 'holiday_date' => '2027-05-17', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Buddha Purnima', 'holiday_date' => '2027-05-20', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Muharram', 'holiday_date' => '2027-06-16', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Independence Day & Fateha-E-Duwaz-Daham', 'holiday_date' => '2027-08-15', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Tithi of Sri Madhabdeva', 'holiday_date' => '2027-08-21', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Madhabdeva'],
            ['title' => 'Janmashtami', 'holiday_date' => '2027-08-25', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Tithi of Srimanta Sankardeva', 'holiday_date' => '2027-09-01', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Srimanta Sankardeva'],
            ['title' => 'Mahatma Gandhi Jayanti', 'holiday_date' => '2027-10-02', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Durga Puja (Maha Saptami)', 'holiday_date' => '2027-10-07', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Maha Ashtami / Navami)', 'holiday_date' => '2027-10-08', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Vijaya Dashami)', 'holiday_date' => '2027-10-09', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Vijaya Dashami'],
            ['title' => 'Kati Bihu', 'holiday_date' => '2027-10-18', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Kongali/Kati Bihu'],
            ['title' => 'Kali Puja & Diwali', 'holiday_date' => '2027-10-29', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Lights'],
            ['title' => 'Bhai Dooj / Bhatri Dwitiya', 'holiday_date' => '2027-10-31', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Chhath Puja', 'holiday_date' => '2027-11-04', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Guru Nanak Jayanti', 'holiday_date' => '2027-11-14', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Asom Divas (Sukapha Divas)', 'holiday_date' => '2027-12-02', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Chaolung Sukapha Divas'],
            ['title' => 'Christmas Day', 'holiday_date' => '2027-12-25', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],

            // ==================== 2028 ====================
            // National & Assam Gazetted Holidays 2028 (Leap Year)
            ['title' => "New Year's Day", 'holiday_date' => '2028-01-01', 'is_optional' => false, 'category' => 'national', 'description' => 'General / New Year'],
            ['title' => 'Magh Bihu & Tusu Puja (Uruka & Bihu)', 'holiday_date' => '2028-01-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Magh Bihu (Day 2)', 'holiday_date' => '2028-01-16', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
            ['title' => 'Netaji Subhas Chandra Bose Jayanti / Gwther Bathou San', 'holiday_date' => '2028-01-23', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Republic Day', 'holiday_date' => '2028-01-26', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Me-Dam-Me-Phi', 'holiday_date' => '2028-01-31', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Ahom Ancestor Festival'],
            ['title' => 'Bir Chilarai Divas', 'holiday_date' => '2028-02-10', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Bir Chilarai Divas'],
            ['title' => 'Maha Shivratri', 'holiday_date' => '2028-02-24', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Id-ul-Fitr', 'holiday_date' => '2028-02-28', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day (Subject to Moon Sighting)'],
            ['title' => 'Dol Jatra / Holi', 'holiday_date' => '2028-03-11', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Colors'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Goru Bihu)', 'holiday_date' => '2028-04-14', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 1'],
            ['title' => 'Good Friday', 'holiday_date' => '2028-04-14', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Manuh Bihu)', 'holiday_date' => '2028-04-15', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 2'],
            ['title' => 'Bohag Bihu / Rongali Bihu (Gosai Bihu)', 'holiday_date' => '2028-04-16', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 3'],
            ['title' => 'Damodardeva Tithi', 'holiday_date' => '2028-04-25', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'May Day / Labour Day', 'holiday_date' => '2028-05-01', 'is_optional' => false, 'category' => 'national', 'description' => 'International Labour Day'],
            ['title' => 'Id-ul-Zuha (Bakrid)', 'holiday_date' => '2028-05-05', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Buddha Purnima', 'holiday_date' => '2028-05-08', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Muharram', 'holiday_date' => '2028-06-04', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Fateha-E-Duwaz-Daham', 'holiday_date' => '2028-08-04', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Janmashtami', 'holiday_date' => '2028-08-13', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Independence Day', 'holiday_date' => '2028-08-15', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Tithi of Sri Madhabdeva', 'holiday_date' => '2028-09-08', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Madhabdeva'],
            ['title' => 'Tithi of Srimanta Sankardeva', 'holiday_date' => '2028-09-19', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Mahapurush Srimanta Sankardeva'],
            ['title' => 'Durga Puja (Maha Saptami)', 'holiday_date' => '2028-09-26', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Maha Ashtami / Navami)', 'holiday_date' => '2028-09-27', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Durga Puja'],
            ['title' => 'Durga Puja (Vijaya Dashami)', 'holiday_date' => '2028-09-28', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Vijaya Dashami'],
            ['title' => 'Mahatma Gandhi Jayanti', 'holiday_date' => '2028-10-02', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Kati Bihu', 'holiday_date' => '2028-10-18', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Kongali/Kati Bihu'],
            ['title' => 'Kali Puja & Diwali', 'holiday_date' => '2028-11-16', 'is_optional' => false, 'category' => 'festival', 'description' => 'Govt of Assam Gazetted Holiday - Festival of Lights'],
            ['title' => 'Bhai Dooj / Bhatri Dwitiya', 'holiday_date' => '2028-11-18', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Chhath Puja', 'holiday_date' => '2028-11-23', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
            ['title' => 'Guru Nanak Jayanti', 'holiday_date' => '2028-12-02', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ['title' => 'Asom Divas (Sukapha Divas)', 'holiday_date' => '2028-12-02', 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Chaolung Sukapha Divas'],
            ['title' => 'Christmas Day', 'holiday_date' => '2028-12-25', 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
        ];

        // For any future years beyond 2028, dynamically generate standard recurring Gazetted & Assam holidays
        if ($year !== null && $year > 2028) {
            $isLeap = ($year % 4 === 0 && ($year % 100 !== 0 || $year % 400 === 0));
            $maghBihuDay1 = $isLeap ? "$year-01-15" : "$year-01-14";
            $maghBihuDay2 = $isLeap ? "$year-01-16" : "$year-01-15";

            $futureHolidays = [
                ['title' => "New Year's Day", 'holiday_date' => "$year-01-01", 'is_optional' => false, 'category' => 'national', 'description' => 'General / New Year'],
                ['title' => 'Magh Bihu & Tusu Puja (Uruka & Bihu)', 'holiday_date' => $maghBihuDay1, 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
                ['title' => 'Magh Bihu (Day 2)', 'holiday_date' => $maghBihuDay2, 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Magh Bihu'],
                ['title' => 'Netaji Subhas Chandra Bose Jayanti / Gwther Bathou San', 'holiday_date' => "$year-01-23", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday'],
                ['title' => 'Republic Day', 'holiday_date' => "$year-01-26", 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
                ['title' => 'Me-Dam-Me-Phi', 'holiday_date' => "$year-01-31", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Ahom Ancestor Festival'],
                ['title' => 'Bohag Bihu / Rongali Bihu (Goru Bihu)', 'holiday_date' => "$year-04-14", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 1'],
                ['title' => 'Bohag Bihu / Rongali Bihu (Manuh Bihu)', 'holiday_date' => "$year-04-15", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 2'],
                ['title' => 'Bohag Bihu / Rongali Bihu (Gosai Bihu)', 'holiday_date' => "$year-04-16", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Rongali Bihu Day 3'],
                ['title' => 'May Day / Labour Day', 'holiday_date' => "$year-05-01", 'is_optional' => false, 'category' => 'national', 'description' => 'International Labour Day'],
                ['title' => 'Independence Day', 'holiday_date' => "$year-08-15", 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
                ['title' => 'Mahatma Gandhi Jayanti', 'holiday_date' => "$year-10-02", 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
                ['title' => 'Kati Bihu', 'holiday_date' => "$year-10-18", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Kongali/Kati Bihu'],
                ['title' => 'Asom Divas (Sukapha Divas)', 'holiday_date' => "$year-12-02", 'is_optional' => false, 'category' => 'assam', 'description' => 'Govt of Assam Gazetted Holiday - Chaolung Sukapha Divas'],
                ['title' => 'Christmas Day', 'holiday_date' => "$year-12-25", 'is_optional' => false, 'category' => 'national', 'description' => 'National Gazetted Day'],
            ];

            return array_values(array_filter($futureHolidays, function ($item) use ($region) {
                if ($region === 'assam' && $item['category'] !== 'assam') return false;
                if ($region === 'national' && $item['category'] !== 'national') return false;
                return true;
            }));
        }

        return array_values(array_filter($catalog, function ($item) use ($year, $region) {
            $itemYear = (int) substr($item['holiday_date'], 0, 4);
            if ($year !== null && $itemYear !== $year) {
                return false;
            }
            if ($region === 'assam' && $item['category'] !== 'assam') {
                return false;
            }
            if ($region === 'national' && $item['category'] !== 'national') {
                return false;
            }
            return true;
        }));
    }
}
