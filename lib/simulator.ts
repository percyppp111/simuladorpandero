export const TOTAL_TERM_MONTHS = 60;
export const MIN_SIMULATOR_VALUE = 1;
export const MAX_GROUP_PROGRESS = 20;
export const MAX_AUCTION_MONTH = 20;
export const MAX_AUCTION_PAYMENTS = TOTAL_TERM_MONTHS - MIN_SIMULATOR_VALUE;
export const DEFAULT_EXCHANGE_RATE = 3.4;
export const QUICK_AUCTION_MONTHS = [1, 3, 6, 9, 12] as const;
export const QUICK_AUCTION_PAYMENTS = [5, 10, 15, 20, 25] as const;
export const SCENARIO_NAMES = ['Opción A', 'Opción B', 'Opción C'] as const;

export const GROUP_PROGRESS_OPTIONS = Array.from(
  { length: MAX_GROUP_PROGRESS },
  (_, index) => index + MIN_SIMULATOR_VALUE,
);

export type Certificate = {
  id: string;
  amountUsd: number;
  termMonths: number;
};

export const CERTIFICATES: Certificate[] = [
  12934.77, 14377.3, 15819.84, 17743.23, 19666.61, 21590, 23513.38, 25869.53,
  27312.07, 28754.61, 30197.14, 31639.68, 32120.53, 33563.07, 34043.91,
  35486.45, 37409.84, 39333.22, 40246.83, 41689.37, 43612.76, 45536.14,
  47026.76, 49382.91, 51739.06, 53229.68, 55153.06, 57509.21, 59961.53,
  61404.06, 62846.6, 64673.83, 66116.36, 68616.76, 70540.14, 72896.29, 75252.44,
  77608.59, 78666.44, 80589.83, 83378.74, 84917.44, 86359.98, 88283.37,
  90543.36, 92130.14, 94053.52, 96409.67, 99198.59, 103478.12,
].map((amountUsd) => ({
  id: `cert-${amountUsd.toFixed(2).replace('.', '')}`,
  amountUsd,
  termMonths: TOTAL_TERM_MONTHS,
}));

export function calculateRegistrationUsd(amountUsd: number) {
  return amountUsd * 0.04 * 1.18;
}

export function calculateTermMonths(groupProgress: number) {
  return TOTAL_TERM_MONTHS - normalizeGroupProgress(groupProgress) + 1;
}

export function calculateMonthlyFeeUsd(amountUsd: number, termMonths: number) {
  return (
    (amountUsd / TOTAL_TERM_MONTHS) *
    (1 + 0.21 * 1.18) *
    (TOTAL_TERM_MONTHS / termMonths)
  );
}

export function calculateTotalEntryUsd(
  amountUsd: number,
  monthlyFeeUsd: number,
) {
  return calculateRegistrationUsd(amountUsd) + monthlyFeeUsd;
}

export function convertUsdToPen(amountUsd: number, exchangeRate: number) {
  return amountUsd * exchangeRate;
}

export function formatUsd(value: number) {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPen(value: number) {
  return `S/ ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function clampInteger(value: number, minimum: number, maximum: number) {
  const integerValue = Number.isFinite(value) ? Math.trunc(value) : minimum;
  return Math.min(Math.max(integerValue, minimum), maximum);
}

export function normalizeGroupProgress(value: number) {
  return clampInteger(value, MIN_SIMULATOR_VALUE, MAX_GROUP_PROGRESS);
}

export function calculatePlan(
  mesRemate: number,
  cuotasRemate: number,
  groupProgress = MIN_SIMULATOR_VALUE,
) {
  const avanceGrupo =
    normalizeGroupProgress(groupProgress) - MIN_SIMULATOR_VALUE;
  const cuotasPagadas = clampInteger(
    mesRemate,
    MIN_SIMULATOR_VALUE,
    MAX_AUCTION_MONTH,
  );
  const maximoCuotasAdelantadas =
    TOTAL_TERM_MONTHS - avanceGrupo - cuotasPagadas;
  const cuotasAdelantadas = clampInteger(
    cuotasRemate,
    MIN_SIMULATOR_VALUE,
    maximoCuotasAdelantadas,
  );
  const cuotasRestantes =
    TOTAL_TERM_MONTHS - avanceGrupo - cuotasPagadas - cuotasAdelantadas;

  return {
    avanceGrupo,
    cuotasPagadas,
    cuotasAdelantadas,
    cuotasRestantes,
    maximoCuotasAdelantadas,
  };
}

export function calculateProratedPayment(
  mesRemate: number,
  cuotasRemate: number,
  monthlyFeeUsd: number,
  termMonths = TOTAL_TERM_MONTHS,
) {
  const cuotasRestantes = Math.max(termMonths - mesRemate - cuotasRemate, 0);
  const cuotasRestantesProrrateo = Math.max(termMonths - mesRemate, 1);
  const cuotaProrrateadaUsd =
    (cuotasRestantes * monthlyFeeUsd) / cuotasRestantesProrrateo;

  return {
    cuotasRestantes,
    cuotasRestantesProrrateo,
    cuotaProrrateadaUsd,
  };
}
