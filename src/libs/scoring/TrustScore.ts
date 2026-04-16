type TrustScoreTransaction = {
  date: Date | string;
  inputMethod: "MANUAL" | "VOICE" | "OCR";
  type: "INCOME" | "EXPENSE";
  totalAmount: number | string;
  latitudeCaptured: string | null;
  longitudeCaptured: string | null;
};

type TrustScoreBusiness = {
  latitudeHome: string | null;
  longitudeHome: string | null;
};

export function calculateTrustScore(
  transactions: TrustScoreTransaction[],
  business: TrustScoreBusiness,
): number {
  if (!transactions || transactions.length === 0) return 0;

  // 1. Consistency: Hari berturut-turut transaksi dicatat (maks 30 poin)
  const uniqueDays = new Set(
    transactions.map((t) => new Date(t.date).toDateString()),
  ).size;
  const consistencyScore = Math.min(30, uniqueDays * 2);

  // 2. Validity: Penggunaan AI/OCR vs Manual & GPS (maks 40 poin)
  const autoTransactions = transactions.filter(
    (t) => t.inputMethod === "OCR" || t.inputMethod === "VOICE",
  ).length;
  const validityRatio = autoTransactions / transactions.length;
  const gpsCapturedCount = transactions.filter(
    (t) => Boolean(t.latitudeCaptured) && Boolean(t.longitudeCaptured),
  ).length;
  const hasBusinessHomeLocation =
    Boolean(business.latitudeHome) && Boolean(business.longitudeHome);
  const gpsRatio = hasBusinessHomeLocation
    ? gpsCapturedCount / transactions.length
    : 1;
  const validityScore = Math.min(
    40,
    (validityRatio * 0.7 + gpsRatio * 0.3) * 40,
  );

  // 3. Growth: Profil Risiko Laba Rugi Dasar (maks 30 poin)
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

  const profitMargin =
    totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  const growthScore = Math.max(0, Math.min(30, profitMargin * 100)); // Anggap margin ideal 30%

  return Math.round(consistencyScore + validityScore + growthScore);
}
