import Image from 'next/image';
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Clock3,
  Coins,
  Flag,
  Leaf,
  Star,
} from 'lucide-react';

import { MIN_SIMULATOR_VALUE } from '@/lib/simulator';

const AUCTION_MONTH_OPTIONS = Array.from(
  { length: 18 },
  (_, index) => index + MIN_SIMULATOR_VALUE,
);
const AUCTION_PAYMENT_OPTIONS = Array.from(
  { length: 35 },
  (_, index) => index + MIN_SIMULATOR_VALUE,
);

type AuctionSimulationSectionProps = {
  advisorName: string;
  advisorPhone: string;
  auctionMonth: number;
  onMonthChange: (month: number) => void;
  auctionPayments: number;
  onPaymentsChange: (payments: number) => void;
  auctionAmountUsd: string;
  auctionAmountPen: string;
  paidPayments: number;
  remainingPayments: number;
  optionARemainingPayments: number;
  optionAPaymentUsd: string;
  optionAPaymentPen: string;
  optionBRemainingPayments: number;
  optionBPaymentUsd: string;
  optionBPaymentPen: string;
};

export function AuctionSimulationSection({
  advisorName,
  advisorPhone,
  auctionMonth,
  onMonthChange,
  auctionPayments,
  onPaymentsChange,
  auctionAmountUsd,
  auctionAmountPen,
  paidPayments,
  remainingPayments,
  optionARemainingPayments,
  optionAPaymentUsd,
  optionAPaymentPen,
  optionBRemainingPayments,
  optionBPaymentUsd,
  optionBPaymentPen,
}: AuctionSimulationSectionProps) {
  const controls = [
    {
      id: 'auctionPayments',
      label: 'Cuotas a adelantar',
      value: auctionPayments,
      options: AUCTION_PAYMENT_OPTIONS,
      onChange: onPaymentsChange,
      Icon: CalendarDays,
      optionLabel: (value: number) => `${value} cuotas`,
    },
    {
      id: 'auctionMonth',
      label: 'Mes de remate',
      value: auctionMonth,
      options: AUCTION_MONTH_OPTIONS,
      onChange: onMonthChange,
      Icon: Flag,
      optionLabel: (value: number) => `Mes ${value}`,
    },
  ];
  const options = [
    {
      name: 'A',
      label: 'Termina antes',
      remaining: optionARemainingPayments,
      usd: optionAPaymentUsd,
      pen: optionAPaymentPen,
      Icon: Star,
      green: false,
    },
    {
      name: 'B',
      label: 'Cuota más cómoda',
      remaining: optionBRemainingPayments,
      usd: optionBPaymentUsd,
      pen: optionBPaymentPen,
      Icon: Leaf,
      green: true,
    },
  ];

  return (
    <section
      aria-labelledby="auctionSimulationTitle"
      className="order-1 min-w-0 border border-sky-200/80 bg-white shadow-[0_8px_22px_rgb(15_73_122/12%)]"
      style={{
        containerType: 'inline-size',
        fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
      }}
    >
      <header className="px-[5.5cqw] pt-[3.5cqw]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[3cqw]">
          <div className="relative min-h-[10.1cqw] min-w-0 pb-px pl-[3.4cqw]">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[0.75cqw] -translate-y-[1cqw] rounded-full bg-[#08a7e8]"
            />
            <strong className="block break-words text-[3.8cqw] font-bold leading-[1.1] text-slate-950">
              {advisorName || '—'}
            </strong>
            <span className="mt-[0.65cqw] block text-[3.75cqw] font-bold leading-none text-slate-900">
              {advisorPhone || '—'}
            </span>
          </div>
          <div className="relative -mt-[3.4cqw] h-[14.7cqw] w-[32cqw] shrink-0 translate-y-[1.8cqw]">
            <Image
              src="/assets/pandero-auto-logo.png"
              alt="Pandero AUTO"
              fill
              sizes="128px"
              className="object-contain object-right"
            />
          </div>
        </div>
        <h2
          id="auctionSimulationTitle"
          className="mt-[2.2cqw] text-center text-[6.8cqw] font-extrabold leading-[1.12] tracking-[-0.035em] text-black"
        >
          Remate y Últimas Cuotas
        </h2>
        <p className="mt-[0.6cqw] text-center text-[3.5cqw] font-medium leading-tight tracking-[-0.025em] text-[#737fa9]">
          ¡Acorta tu plazo o reduce tu cuota!
        </p>
        <span
          aria-hidden="true"
          className="mx-auto mb-[2.6cqw] mt-[2cqw] block h-[1.2cqw] w-[19cqw] rounded-full bg-[#0454ff]"
        />
      </header>

      <div className="px-[3.2cqw] pb-[4.2cqw]">
        <div className="grid grid-cols-2 gap-[1.6cqw]">
          <div className="grid gap-[1.6cqw]">
            {controls.map(
              ({ id, label, value, options, onChange, Icon, optionLabel }) => (
                <div
                  key={id}
                  className="flex items-center gap-[1.5cqw] rounded-[2.4cqw] bg-gradient-to-br from-[#e7f3ff] to-[#deecfa] p-[2cqw]"
                >
                  <span className="flex size-[9.5cqw] shrink-0 items-center justify-center rounded-full border border-white bg-gradient-to-br from-white/70 to-blue-200/50 text-[#034aff]">
                    <Icon
                      aria-hidden="true"
                      className={`size-[5.4cqw] ${id === 'auctionMonth' ? 'fill-sky-400' : ''}`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={id}
                      className="mb-[1cqw] block whitespace-nowrap text-[3.2cqw] font-extrabold leading-tight tracking-[-0.045em] text-black"
                    >
                      {label}
                    </label>
                    <div className="relative">
                      <select
                        id={id}
                        name={id}
                        value={value}
                        onChange={(event) =>
                          onChange(Number(event.target.value))
                        }
                        className="h-[5.4cqw] min-h-7 w-full appearance-none rounded-[1.2cqw] border border-blue-300 bg-white pl-[1.6cqw] pr-[4cqw] text-[3.2cqw] font-medium text-black shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {optionLabel(option)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[1.4cqw] top-1/2 size-[3cqw] -translate-y-1/2 text-[#38375f]"
                      />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
          <section
            aria-labelledby="auctionCapitalTitle"
            className="flex flex-col justify-center rounded-[3.2cqw] border-2 border-cyan-400 bg-gradient-to-br from-[#f2fbff] to-[#cfe8fb] px-[2.2cqw] py-[1.8cqw] text-center shadow-[0_5px_8px_#00bfff20]"
          >
            <div className="flex items-center justify-center gap-[1.4cqw] border-b-2 border-cyan-400 pb-[1cqw]">
              <span className="flex size-[9.5cqw] shrink-0 items-center justify-center rounded-full border border-white bg-sky-100 text-[#034aff]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 32 36"
                  className="size-[6cqw]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9 9 4Q8 0 12 2L16 4 20 2Q24 0 23 4L20 9M12 9H20C23 12 29 17 29 24C29 38 3 38 3 24C3 17 9 12 12 9Z" />
                  <path d="M20 18C18 15 12 16 12 19C12 23 20 21 20 25C20 29 13 29 12 26M16 14V31" />
                </svg>
              </span>
              <h3
                id="auctionCapitalTitle"
                className="whitespace-nowrap text-[3.9cqw] font-extrabold tracking-[-0.045em] text-black"
              >
                Capital de Remate
              </h3>
            </div>
            <strong
              className={`mt-[1.4cqw] block whitespace-nowrap font-extrabold leading-tight tracking-[-0.045em] text-[#003dce] ${auctionAmountUsd.length > 9 ? 'text-[6.5cqw]' : 'text-[8cqw]'}`}
            >
              {auctionAmountUsd}
            </strong>
            <span className="block whitespace-nowrap text-[5.2cqw] font-semibold leading-tight tracking-[-0.03em] text-[#333554]">
              {auctionAmountPen}
            </span>
          </section>
        </div>

        <div className="mt-[3cqw]" aria-labelledby="auctionOptionsTitle">
          <div className="relative overflow-hidden rounded-[1.8cqw] bg-gradient-to-r from-[#0454f5] via-[#052ec7] to-[#0744db] px-[3.6cqw] py-[1.8cqw] text-white shadow-sm">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-[16cqw] bg-gradient-to-r from-[#0878ff] to-[#3fa7ff] [clip-path:polygon(42%_0,100%_0,100%_100%,0_100%)]"
            />
            <h3
              id="auctionOptionsTitle"
              className="relative flex items-center gap-[2.2cqw] whitespace-nowrap text-[4.8cqw] font-extrabold leading-tight tracking-[-0.03em]"
            >
              <ChartNoAxesColumnIncreasing
                aria-hidden="true"
                className="size-[6.3cqw] shrink-0 border-r border-white/80 pr-[1.5cqw]"
              />
              Resumen de tu simulación
            </h3>
          </div>

          <dl className="mt-[2.2cqw] grid grid-cols-3 gap-[1.7cqw]">
            {[
              {
                label: 'Pagadas',
                value: paidPayments,
                Icon: Coins,
                tone: 'from-[#f2f9ff] to-[#dceeff]',
                border: 'border-blue-200',
                icon: 'text-blue-600',
                accent: 'bg-blue-600',
                divider: 'border-blue-500',
              },
              {
                label: 'Adelantadas',
                value: auctionPayments,
                Icon: CalendarDays,
                tone: 'from-[#fffaf0] to-[#fff0c9]',
                border: 'border-amber-200',
                icon: 'text-orange-500',
                accent: 'bg-orange-500',
                divider: 'border-orange-400',
              },
              {
                label: 'Restantes',
                value: remainingPayments,
                Icon: Clock3,
                tone: 'from-[#f4fcf8] to-[#e7f7ef]',
                border: 'border-emerald-200',
                icon: 'text-green-700',
                accent: 'bg-green-700',
                divider: 'border-green-600',
              },
            ].map(
              ({ label, value, Icon, tone, border, icon, accent, divider }) => (
                <div
                  key={label}
                  className={`relative grid min-w-0 grid-cols-[auto_1fr] items-center gap-[1.2cqw] overflow-hidden rounded-[2.1cqw] border bg-gradient-to-br ${border} ${tone} px-[1.4cqw] py-[2cqw] shadow-[0_4px_8px_rgb(15_73_122/12%)]`}
                >
                  <span
                    className={`flex size-[7cqw] shrink-0 items-center justify-center rounded-full bg-white shadow-md ${icon}`}
                  >
                    <Icon aria-hidden="true" className="size-[4.2cqw]" />
                  </span>
                  <div
                    className={`min-w-0 border-l ${divider} pl-[1.2cqw] text-center`}
                  >
                    <dt className="whitespace-nowrap text-[2.4cqw] font-bold leading-tight tracking-[-0.04em] text-[#12125a]">
                      {label}
                    </dt>
                    <dd>
                      <strong className="block text-[6.4cqw] font-extrabold leading-none text-black">
                        {value}
                      </strong>
                      <span className="block text-[2.8cqw] font-semibold leading-tight text-[#17175c]">
                        cuotas
                      </span>
                    </dd>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-[0.8cqw] ${accent}`}
                  />
                </div>
              ),
            )}
          </dl>

          <dl className="mt-[3cqw] space-y-[2.8cqw] pb-[1.2cqw]">
            {options.map(
              ({ name, label, remaining, usd, pen, Icon, green }) => (
                <div
                  key={name}
                  className={`grid grid-cols-[1.25fr_1fr_1.04fr] items-center rounded-[2.6cqw] border-2 px-[1.8cqw] py-[3cqw] ${green ? 'border-green-500 bg-gradient-to-br from-[#effcf3] to-[#cdf4e4]' : 'border-sky-400 bg-gradient-to-br from-[#eff9ff] to-[#cbe5fc]'}`}
                >
                  <dt className="flex min-w-0 items-center gap-[1.2cqw]">
                    <span
                      className={`flex size-[7.6cqw] shrink-0 items-center justify-center rounded-full bg-white shadow-md ${green ? 'text-green-700' : 'text-[#004bff]'}`}
                    >
                      <Icon
                        aria-hidden="true"
                        className={`size-[4.5cqw] ${green ? '' : 'fill-current'}`}
                      />
                    </span>
                    <span className="min-w-0">
                      <strong
                        className={`block whitespace-nowrap text-[4.6cqw] font-extrabold leading-tight tracking-[-0.04em] ${green ? 'text-green-800' : 'text-[#0718db]'}`}
                      >
                        Opción {name}
                      </strong>
                      <span
                        className={`mt-[0.7cqw] block whitespace-nowrap rounded-full border px-[1.1cqw] py-[0.5cqw] text-center font-bold leading-tight tracking-[-0.035em] ${green ? 'border-emerald-300 bg-emerald-100 text-[2.45cqw] text-green-800' : 'border-sky-300 bg-sky-100 text-[2.8cqw] text-blue-700'}`}
                      >
                        {label}
                      </span>
                    </span>
                  </dt>
                  <dd
                    className={`border-x text-center ${green ? 'border-emerald-600' : 'border-blue-500'}`}
                  >
                    <strong className="block text-[6.8cqw] font-extrabold leading-none text-black">
                      {remaining}
                    </strong>
                    <span className="block whitespace-nowrap text-[2.7cqw] leading-tight tracking-[-0.03em] text-[#292747]">
                      cuotas restantes
                    </span>
                  </dd>
                  <dd className="min-w-0 pl-[1.6cqw] text-right">
                    <strong
                      className={`block whitespace-nowrap font-extrabold leading-tight tracking-[-0.045em] text-[#034aff] ${usd.length > 8 ? 'text-[4.9cqw]' : 'text-[5.9cqw]'}`}
                    >
                      {usd}
                    </strong>
                    <span
                      className={`block whitespace-nowrap font-semibold leading-tight tracking-[-0.035em] text-[#33314f] ${pen.length > 9 ? 'text-[3.1cqw]' : 'text-[3.6cqw]'}`}
                    >
                      {pen}
                    </span>
                  </dd>
                </div>
              ),
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
