import type { Metadata } from "next";
import { LockIcon, MailIcon, UndoIcon } from "@/components/icons.tsx";
import {
  BODY_MAX_CHARS,
  defaultDeliverOn,
  HORIZON_MAX_YEARS,
  maxDeliverOn,
  minDeliverOn,
  todayIso,
} from "@/lib/letters.ts";
import { occasionFor } from "@/lib/occasions.ts";
import { breakdown, formatEur } from "@/lib/pricing.ts";
import { ComposeForm } from "./compose-form.tsx";

export const metadata: Metadata = {
  title: "Write your letter",
  description:
    "Write a letter, choose the date, and we post it on paper on the day.",
};

/** ISO 3166-1 alpha-2. Names come from Intl so they are never misspelt. */
const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );

function countryOptions(): [string, string][] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const all = COUNTRY_CODES.map(
    (code): [string, string] => [code, names.of(code) ?? code],
  ).sort((a, b) => a[1].localeCompare(b[1], "en"));
  // Germany first: it is where most letters go and where we post from.
  return [
    ...all.filter(([code]) => code === "DE"),
    ...all.filter(([code]) => code !== "DE"),
  ];
}

export default async function WritePage({ searchParams }: PageProps<"/write">) {
  const { occasion, cancelled, sku } = await searchParams;
  const chosen = occasionFor(occasion);

  // Computed per request, not at build time: reading searchParams makes this
  // page dynamic, so the date bounds never go stale between deploys. The
  // action re-checks them, and a database CHECK backs both up.
  const today = todayIso();

  return (
    <main className="flex-1">
      <section className="paper-grain border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="eyebrow">
            {occasion ? chosen.title : "A letter for later"}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            Write your letter
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            We seal it, keep it encrypted, and post it on the date you choose,
            any day from tomorrow up to {HORIZON_MAX_YEARS} years from now.
          </p>
          <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted">
            <li className="flex items-center gap-2">
              <LockIcon className="size-4 text-seal" />
              Encrypted as soon as you submit
            </li>
            <li className="flex items-center gap-2">
              <MailIcon className="size-4 text-seal" />
              Address check one week before posting
            </li>
            <li className="flex items-center gap-2">
              <UndoIcon className="size-4 text-seal" />
              Cancel before printing for a full refund
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {cancelled ? (
          <p
            role="status"
            className="mb-10 rounded-lg border border-line bg-surface px-5 py-4 text-sm"
          >
            Payment was not completed and nothing was charged. Your letter is
            still here if you wrote it in this tab.
          </p>
        ) : null}

        <ComposeForm
          today={today}
          minDate={minDeliverOn(today)}
          defaultDate={defaultDeliverOn(today)}
          maxDate={maxDeliverOn(today)}
          bodyMaxChars={BODY_MAX_CHARS}
          prices={{
            single: formatEur(breakdown("single").grossCents),
            pair: formatEur(breakdown("pair").grossCents),
          }}
          vat={{
            single: formatEur(breakdown("single").vatCents),
            pair: formatEur(breakdown("pair").vatCents),
          }}
          prompts={chosen.prompts}
          countries={countryOptions()}
          initialSku={sku === "pair" ? "pair" : "single"}
        />
      </div>
    </main>
  );
}
