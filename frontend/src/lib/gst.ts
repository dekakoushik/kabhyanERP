// Official Indian GST State Codes (37 States & Union Territories)
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

// Official IT & Software Engineering SAC Codes
export const STANDARD_IT_SAC_CODES = [
  { code: "998314", name: "IT Design and Development Services (Software Architecture, Web Apps, APIs)" },
  { code: "998313", name: "IT Consulting and Support Services (Advisory, Cloud Infrastructure Planning)" },
  { code: "998315", name: "Hosting and IT Infrastructure Provisioning (VPS, Database Cluster Management)" },
  { code: "998316", name: "IT Infrastructure and Network Management Services" },
  { code: "998717", name: "Maintenance and Repair of Commercial Computers & Server Equipment" },
  { code: "998311", name: "Management Consulting Services" },
];

/**
 * Extract 2-digit Indian State Code from a 15-character GSTIN.
 */
export function extractStateCode(gstin?: string | null): string | null {
  if (!gstin || typeof gstin !== "string") return null;
  const clean = gstin.trim().toUpperCase();
  if (clean.length < 2) return null;
  const prefix = clean.substring(0, 2);
  return GST_STATE_CODES[prefix] ? prefix : null;
}

/**
 * Get State Name from 2-digit state code or GSTIN.
 */
export function getStateName(codeOrGstin?: string | null): string | null {
  if (!codeOrGstin) return null;
  const clean = codeOrGstin.trim().toUpperCase();
  if (clean.length === 2 && GST_STATE_CODES[clean]) {
    return GST_STATE_CODES[clean];
  }
  const code = extractStateCode(clean);
  return code ? GST_STATE_CODES[code] : null;
}

export interface GSTSplitResult {
  isInterState: boolean;
  supplyType: "INTRA_STATE" | "INTER_STATE";
  supplierStateCode: string;
  supplierStateName: string;
  recipientStateCode: string;
  recipientStateName: string;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

/**
 * Dissect tax into CGST + SGST (Intra-state) or IGST (Inter-state)
 * as mandated by Section 7 & 8 of the IGST Act 2017.
 */
export function calculateGSTSplit({
  subtotal,
  taxRate = 18,
  supplierGstin,
  recipientGstin,
  placeOfSupplyCode,
}: {
  subtotal: number;
  taxRate?: number;
  supplierGstin?: string | null;
  recipientGstin?: string | null;
  placeOfSupplyCode?: string | null;
}): GSTSplitResult {
  const supplierCode = extractStateCode(supplierGstin) || "19"; // Default: 19 (West Bengal)
  const recipientCode = placeOfSupplyCode || extractStateCode(recipientGstin) || supplierCode;

  const isInterState = supplierCode !== recipientCode;
  const baseRate = Number(taxRate) || 0;
  const baseSubtotal = Number(subtotal) || 0;

  if (isInterState) {
    const igstAmount = (baseSubtotal * baseRate) / 100;
    return {
      isInterState: true,
      supplyType: "INTER_STATE",
      supplierStateCode: supplierCode,
      supplierStateName: GST_STATE_CODES[supplierCode] || "Supplier State",
      recipientStateCode: recipientCode,
      recipientStateName: GST_STATE_CODES[recipientCode] || "Recipient State",
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: baseRate,
      igstAmount,
      totalTax: igstAmount,
    };
  } else {
    const halfRate = baseRate / 2;
    const halfAmount = (baseSubtotal * halfRate) / 100;
    return {
      isInterState: false,
      supplyType: "INTRA_STATE",
      supplierStateCode: supplierCode,
      supplierStateName: GST_STATE_CODES[supplierCode] || "Supplier State",
      recipientStateCode: recipientCode,
      recipientStateName: GST_STATE_CODES[recipientCode] || "Recipient State",
      cgstRate: halfRate,
      cgstAmount: halfAmount,
      sgstRate: halfRate,
      sgstAmount: halfAmount,
      igstRate: 0,
      igstAmount: 0,
      totalTax: halfAmount * 2,
    };
  }
}

/**
 * Format a number into formal Indian numbering words format
 * (e.g., Crores, Lakhs, Thousands, Hundreds, Rupees, Paise).
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num < 0) return "Zero Rupees Only";
  if (num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatSection = (n: number): string => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let output = "";

  const crore = Math.floor(integerPart / 10000000);
  const remainderCrore = integerPart % 10000000;
  const lakh = Math.floor(remainderCrore / 100000);
  const remainderLakh = remainderCrore % 100000;
  const thousand = Math.floor(remainderLakh / 1000);
  const remainderThousand = remainderLakh % 1000;

  if (crore > 0) output += formatSection(crore) + " Crore ";
  if (lakh > 0) output += formatSection(lakh) + " Lakh ";
  if (thousand > 0) output += formatSection(thousand) + " Thousand ";
  if (remainderThousand > 0) output += formatSection(remainderThousand) + " ";

  output = output.trim();
  if (!output) output = "Zero";

  output += " Rupees";

  if (decimalPart > 0) {
    output += " and " + formatSection(decimalPart) + " Paise";
  }

  output += " Only";
  return output.replace(/\s+/g, " ");
}

