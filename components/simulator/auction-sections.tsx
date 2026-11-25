import Image from 'next/image';
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Clock3,
  Coins,
  Flag,
  Leaf,
  Zap,
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
  proposalDate: string;
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
  proposalDate,
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
      label: 'Menor plazo',
      badge: 'Mantén tu cuota',
      remaining: optionARemainingPayments,
      usd: optionAPaymentUsd,
      pen: optionAPaymentPen,
      Icon: Zap,
      green: false,
    },
    {
      name: 'B',
      label: 'Menor cuota',
      badge: 'Mantén tu plazo',
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
      <header className="px-[4.5cqw] pt-[3cqw]">
        <div className="grid grid-cols-[0.9fr_1.2fr_0.9fr] items-center gap-[1.6cqw]">
          <div className="relative min-w-0 pl-[3cqw]">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[0.75cqw] rounded-full bg-[#12b9e9]"
            />
            <strong className="block whitespace-nowrap text-[2.8cqw] font-extrabold leading-none tracking-[-0.025em] text-slate-950">
              {advisorName || '—'}
            </strong>
            <span className="mt-[0.6cqw] block whitespace-nowrap text-[2.8cqw] font-extrabold leading-none text-slate-950">
              {advisorPhone || '—'}
            </span>
          </div>
          <div className="flex min-h-[7.4cqw] items-center gap-[1.8cqw] border-l border-[#0875e6] pl-[3.5cqw]">
            <CalendarDays className="size-[5.2cqw] shrink-0 text-[#0875e6]" aria-hidden="true" />
            <span className="text-[2.1cqw] font-extrabold leading-[1.05] tracking-[-0.025em] text-slate-950">
              Fecha:
              <strong className="mt-[0.35cqw] block whitespace-nowrap text-[2.8cqw] font-extrabold leading-none">{proposalDate}</strong>
            </span>
          </div>
          <div className="relative h-[9.4cqw] w-full">
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
              className={`mt-[1.4cqw] block whitespace-nowrap font-extrabold leading-tight tracking-[-0.045em] text-[#003dce] ${auctionAmountUsd.length > 9 ? 'text-[6cqw]' : 'text-[7.3cqw]'}`}
            >
              {auctionAmountUsd}
            </strong>
            <span className="block whitespace-nowrap text-[4.8cqw] font-semibold leading-tight tracking-[-0.03em] text-[#333554]">
              {auctionAmountPen}
            </span>
          </section>
        </div>

        <div className="mx-[1cqw] mt-[3cqw]" aria-labelledby="auctionOptionsTitle">
          <div className="relative flex h-[7.4cqw] items-center overflow-hidden rounded-[1.8cqw] bg-[linear-gradient(105deg,#043dff_0%,#0035c5_40%,#0065db_100%)] px-[3.6cqw] text-white shadow-sm">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-[15cqw] bg-gradient-to-r from-[#1687f8] to-[#37aaff] [clip-path:polygon(42%_0,100%_0,100%_100%,0_100%)]"
            />
            <h3
              id="auctionOptionsTitle"
              className="relative flex items-center gap-[2.2cqw] whitespace-nowrap text-[4.2cqw] font-extrabold leading-tight tracking-[-0.03em]"
            >
              <ChartNoAxesColumnIncreasing
                aria-hidden="true"
                className="size-[5.4cqw] shrink-0 border-r border-white/80 pr-[1.5cqw]"
              />
              Resumen de tu simulación
            </h3>
          </div>

          <dl className="mt-[2cqw] grid grid-cols-3 divide-x divide-[#3984ff] rounded-[2.2cqw] border-[0.15cqw] border-[#c4e5ff] bg-[linear-gradient(115deg,#f2f9ff_0%,#f9fcff_55%,#edf5fa_100%)] px-[1cqw] py-[1.6cqw] shadow-[0_2px_5px_#1689e609]">
            {[
              {
                label: 'Pagadas',
                value: paidPayments,
                Icon: Coins,
                icon: 'bg-gradient-to-br from-[#e1f4ff] to-[#c9eaff] text-[#008cff]',
              },
              {
                label: 'Adelantadas',
                value: auctionPayments,
                Icon: CalendarDays,
                icon: 'bg-gradient-to-br from-[#fff9ec] to-[#ffeed3] text-[#ff7900]',
              },
              {
                label: 'Restantes',
                value: remainingPayments,
                Icon: Clock3,
                icon: 'bg-gradient-to-br from-[#e9fff4] to-[#d1f8e8] text-[#00953a]',
              },
            ].map(
              ({ label, value, Icon, icon }) => (
                <div
                  key={label}
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-[2cqw] px-[2cqw]"
                >
                  <span
                    className={`flex size-[6.8cqw] shrink-0 items-center justify-center rounded-full shadow-[0_0.5cqw_0.7cqw_#243f5620] ${icon}`}
                  >
                    <Icon aria-hidden="true" className="size-[4cqw]" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <dt className="whitespace-nowrap text-[2.55cqw] font-bold leading-tight tracking-[-0.035em] text-[#090c34]">
                      {label}
                    </dt>
                    <dd className="mt-[0.3cqw] flex items-baseline gap-[1cqw] whitespace-nowrap">
                      <strong className="text-[4.6cqw] font-extrabold leading-none tracking-tight text-black">
                        {value}
                      </strong>
                      <span className="text-[3.4cqw] font-medium leading-none tracking-tight text-[#090c24]">
                        cuotas
                      </span>
                    </dd>
                  </div>
                </div>
              ),
            )}
          </dl>

          <h4 id="auctionChoiceTitle" className="mt-[2.8cqw] flex items-center gap-[1.7cqw] whitespace-nowrap text-center text-[4cqw] font-bold leading-tight tracking-[-0.035em] text-[#0c51b6]">
            <span aria-hidden="true" className="h-[0.25cqw] min-w-0 flex-1 bg-[#095bd4] shadow-[0_0.3cqw_0_#dbeafe]" />
            Elige cómo prefieres continuar
            <span aria-hidden="true" className="h-[0.25cqw] min-w-0 flex-1 bg-[#095bd4] shadow-[0_0.3cqw_0_#dbeafe]" />
          </h4>

          <dl aria-labelledby="auctionChoiceTitle" className="mt-[4cqw] space-y-[4cqw] pb-[1.2cqw]">
            {options.map(
              ({ name, label, badge, remaining, usd, pen, Icon, green }) => (
                <div
                  key={name}
                  className={`relative grid min-h-[20.6cqw] grid-cols-[40%_24%_36%] items-center rounded-[2.6cqw] border-[0.3cqw] border-b-[0.45cqw] px-[2.3cqw] py-[2.2cqw] shadow-[0_0.4cqw_0.6cqw_#1689e612] ${green ? 'border-[#08c54b] bg-[linear-gradient(120deg,#e2faed_0%,#f8fffb_55%,#e9fcf1_100%)]' : 'border-[#069af7] bg-[linear-gradient(120deg,#e9f6ff_0%,#f7fcff_55%,#e2f2ff_100%)]'}`}
                >
                  <span aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 h-[14cqw] w-[10cqw] rounded-tl-[2.3cqw] [clip-path:polygon(0_0,100%_0,0_100%)] ${green ? 'bg-gradient-to-br from-[#a8f2ad] to-[#dcfbe0]' : 'bg-gradient-to-br from-[#9ed4fa] to-[#def1ff]'}`} />
                  <span className={`absolute left-[6.6cqw] top-0 z-10 flex -translate-y-1/2 items-center overflow-hidden rounded-full text-white shadow-[0_0.4cqw_0.6cqw_#123e5f30] ${green ? 'bg-[linear-gradient(100deg,#00b400_0%,#009843_100%)]' : 'bg-[linear-gradient(100deg,#009cff_0%,#0048dc_100%)]'}`}>
                    <span className="flex h-[5cqw] w-[5.5cqw] items-center justify-center bg-white/10">
                      <Icon aria-hidden="true" className={`size-[3.6cqw] ${green ? '' : 'fill-current'}`} />
                    </span>
                    <span className="whitespace-nowrap px-[1.4cqw] text-[3cqw] font-extrabold leading-none tracking-[-0.03em]">
                      {badge}
                    </span>
                  </span>
                  <dt className="relative min-w-0 pl-[2.2cqw]">
                    <strong
                      className="mt-[0.9cqw] block whitespace-nowrap text-[4.7cqw] font-extrabold leading-[1.1] tracking-[-0.035em] text-black"
                    >
                      {label}
                    </strong>
                    <span className="mt-[0.5cqw] block text-[3cqw] font-medium leading-tight text-[#737d9c]">
                      Opción {name}
                    </span>
                  </dt>
                  <dd
                    className={`relative border-x py-[0.6cqw] text-center ${green ? 'border-[#09ba53]' : 'border-[#126bff]'}`}
                  >
                    <strong className="block text-[7.5cqw] font-extrabold leading-none tracking-tight text-black">
                      {remaining}
                    </strong>
                    <span className="mt-[0.7cqw] block whitespace-nowrap text-[2.4cqw] leading-tight tracking-[-0.03em] text-[#4e5270]">
                      cuotas restantes
                    </span>
                  </dd>
                  <dd className="relative min-w-0 px-[1cqw] text-center">
                    <strong
                      className={`block whitespace-nowrap font-extrabold leading-[1.1] tracking-[-0.045em] text-[#034aff] ${usd.length > 8 ? 'text-[4.9cqw]' : 'text-[6cqw]'}`}
                    >
                      {usd}
                    </strong>
                    <span
                      className={`mt-[0.8cqw] block whitespace-nowrap font-semibold leading-[1.1] tracking-[-0.035em] text-[#44445e] ${pen.length > 9 ? 'text-[3.5cqw]' : 'text-[4cqw]'}`}
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
