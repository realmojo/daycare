import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findRegion, REGION_HUB_SLUG, type Region } from "@/lib/regions";
import {
  formatPerStaff,
  formatRate,
  getAllRegionStats,
  getCenter,
  listRegionCenters,
  withParticle,
  type Center,
} from "@/lib/daycare-data";
import { ageText, centerIdFromSlug, centerSlug } from "@/lib/center";
import { OFFICIAL_LINKS } from "@/lib/menu";
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd, SITE } from "@/lib/seo";
import DataNotice from "@/components/region/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";
import { decodeSlug } from "@/lib/slug";

/**
 * 어린이집 상세 `/서울-강남구/햇살어린이집-a1b2c3d4e5f6a7b8`.
 *
 * **사람들이 실제로 치는 말이 "○○어린이집" 이다.** 시군구까지만 있으면 그
 * 검색을 못 받는다. 이 화면이 이 사이트의 주축이다.
 *
 * 하나의 글로 읽히도록 짠다 — h2 로 문단을 나누고 표는 그 안에 둔다.
 */
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; center: string }>;
}

async function load(params: Props["params"]) {
  const { slug, center } = await params;
  const region = findRegion(decodeSlug(slug));
  const id = centerIdFromSlug(decodeSlug(center));
  if (!region || !id) return null;

  const item = await getCenter(id);
  // 주소의 지역과 실제 지역이 다르면 그 주소는 이 어린이집의 것이 아니다.
  // 놔두면 같은 곳이 여러 주소로 색인된다.
  if (!item || item.region_slug !== region.slug) return null;
  return { region, center: item };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { robots: { index: false, follow: false } };

  const { region, center } = found;

  // 지표가 없거나 운영 중이 아니면 보여줄 것이 없다. 색인시키지 않는다.
  if (center.per_staff === null || center.status !== "정상") {
    return {
      title: `${center.name} - ${region.name} 어린이집 | ${SITE.name}`,
      robots: { index: false, follow: true },
    };
  }

  // 사람들이 치는 말 그대로 — 이름이 먼저다. 거기에 지역과 유형을 붙여
  // 같은 이름의 다른 어린이집과 갈리게 하고, 정원·현원으로 "○○어린이집 정원"
  // 검색까지 받는다. 키워드를 늘어놓는 것보다 이 쪽이 클릭이 붙는다.
  const bits = [
    `${region.sigungu || region.sido}`,
    center.kind ?? null,
    center.capacity ? `정원 ${center.capacity}명` : null,
    center.enrolled !== null ? `현원 ${center.enrolled}명` : null,
  ].filter(Boolean);
  const title = `${center.name} - ${bits.join(" · ")} | ${SITE.name}`;

  const median = (await getAllRegionStats()).get(region.slug)?.median_per_staff ?? null;
  const diff =
    center.per_staff !== null && median
      ? Math.round(((center.per_staff - median) / median) * 100)
      : null;

  const description = [
    `${center.name}은 ${region.name}의 ${center.kind ?? ""} 어린이집으로 정원 ${center.capacity ?? "?"}명, 현원 ${center.enrolled ?? "?"}명입니다`,
    center.capacity && center.enrolled !== null
      ? ` (충원율 ${formatRate(center.enrolled, center.capacity)})`
      : "",
    `. 보육교직원 ${center.staff ?? "?"}명 기준 1인당 ${formatPerStaff(center.per_staff)}으로`,
    diff !== null
      ? ` ${region.name} 중간값보다 ${diff > 0 ? `${diff}% 많은` : diff < 0 ? `${-diff}% 적은` : "같은"} 수준입니다.`
      : " 집계했습니다.",
  ].join("");

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE.url}/${encodeURIComponent(region.slug)}/${encodeURIComponent(
        centerSlug(center.name, center.center_id),
      )}`,
    },
    keywords: [
      center.name,
      `${center.name} 정원`,
      `${center.name} 현원`,
      `${region.name} 어린이집`,
      `${region.sigungu || region.sido} ${center.kind ?? ""} 어린이집`.trim(),
      center.kind ? `${center.kind} 어린이집` : "어린이집",
    ],
    openGraph: { title, description, type: "article" },
    robots: { index: true, follow: true },
  };
}

export default async function CenterPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();

  const { region, center } = found;
  const [siblings, statsMap] = await Promise.all([
    listRegionCenters(region.slug),
    getAllRegionStats(),
  ]);

  const median = statsMap.get(region.slug)?.median_per_staff ?? null;
  const perStaff = center.per_staff;
  const diff =
    perStaff !== null && median
      ? Math.round(((perStaff - median) / median) * 100)
      : null;

  const others = siblings
    .filter((c) => c.center_id !== center.center_id && c.status === "정상")
    .slice(0, 16);

  const name = center.name;
  const baseLabel = center.base_date
    ? `${center.base_date.slice(0, 4)}년 ${Number(center.base_date.slice(4, 6))}월`
    : "최근";

  const faq = buildFaq({ name, region, center, median, diff, baseLabel });

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "지역별", path: `/${REGION_HUB_SLUG}` },
              { name: region.name, path: `/${region.slug}` },
              {
                name,
                path: `/${region.slug}/${centerSlug(name, center.center_id)}`,
              },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${name} 기본정보`,
              path: `/${region.slug}/${centerSlug(name, center.center_id)}`,
              description: `${region.name} ${name}의 정원·현원·보육교직원 수`,
            }),
          ),
        }}
      />
      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              faqJsonLd(faq.map((f) => ({ question: f.q, answer: f.a }))),
            ),
          }}
        />
      )}

      <article className="single-article">
        <div className="single-article__inner">
          <nav className="crumbs" aria-label="이동 경로">
            <a target="_self" href={`/${REGION_HUB_SLUG}`}>
              지역별
            </a>
            <span aria-hidden>›</span>
            <a target="_self" href={`/${region.slug}`}>
              {region.name}
            </a>
          </nav>

          <header className="entry-header">
            <h1 className="entry-title">{name}</h1>
            <p className="entry-subtitle">
              {[
                region.name,
                center.kind ? `${center.kind} 어린이집` : null,
                center.capacity ? `정원 ${center.capacity}명` : null,
                center.enrolled !== null ? `현원 ${center.enrolled}명` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>{baseLabel} 기준</span>
              </div>
              <span className="entry-cat cat-badge cat-badge--region">
                {center.kind ?? region.name}
              </span>
            </div>
          </header>

          <div className="entry-content">
            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.top} />
            </div>

            <p className="entry-lead">
              {withParticle(name, "은는")} {region.name}에 있는{" "}
              {center.kind ? `${center.kind} ` : ""}어린이집입니다. 정원{" "}
              {center.capacity ?? "?"}명에 현원 {center.enrolled ?? "?"}명이고,
              {perStaff !== null ? (
                <>
                  {" "}
                  보육교직원 한 명이 <strong>{formatPerStaff(perStaff)}</strong>
                  을 맡는 셈입니다
                  {median && diff !== null && (
                    <>
                      {" "}
                      — {region.name} 중간값 {formatPerStaff(median)}보다{" "}
                      <strong>
                        {diff > 0
                          ? `${diff}% 많습니다`
                          : diff < 0
                            ? `${-diff}% 적습니다`
                            : "같습니다"}
                      </strong>
                    </>
                  )}
                  .
                </>
              ) : (
                " 교직원 수가 공개되지 않아 1인당 아동 수는 낼 수 없습니다."
              )}
            </p>

            <div className="cta-row">
              <a
                className="cta-btn"
                href={OFFICIAL_LINKS.childcare}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                🔎 평가 결과 보기 (정보공개 포털)
              </a>
              <a
                className="cta-btn cta-btn--ghost"
                href={`/${region.slug}`}
                target="_self"
              >
                📍 {region.name}의 다른 어린이집
              </a>
              <p className="cta-row__note">
                아래 숫자는 공개 자료를 옮긴 것입니다. 입소 상담과 대기 신청은
                해당 어린이집·아이사랑에서 하셔야 합니다.
              </p>
            </div>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            <h2 id="info">기본 정보</h2>
            <table>
              <tbody>
                <tr>
                  <th scope="row">어린이집</th>
                  <td>{name}</td>
                </tr>
                <tr>
                  <th scope="row">유형</th>
                  <td>{center.kind ?? "-"}</td>
                </tr>
                {center.address && (
                  <tr>
                    <th scope="row">주소</th>
                    <td>{center.address}</td>
                  </tr>
                )}
                {center.tel && (
                  <tr>
                    <th scope="row">전화</th>
                    <td>
                      <a href={`tel:${center.tel.replace(/[^0-9+]/g, "")}`}>
                        {center.tel}
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <th scope="row">정원 · 현원</th>
                  <td>
                    {center.capacity ?? "-"}명 · {center.enrolled ?? "-"}명
                    {center.capacity && center.enrolled !== null
                      ? ` (${formatRate(center.enrolled, center.capacity)})`
                      : ""}
                  </td>
                </tr>
                <tr>
                  <th scope="row">보육교직원</th>
                  <td>{center.staff ?? "-"}명</td>
                </tr>
                <tr>
                  <th scope="row">보육실</th>
                  <td>
                    {center.rooms ?? "-"}실
                    {center.room_area
                      ? ` · ${Math.round(center.room_area).toLocaleString()}㎡`
                      : ""}
                  </td>
                </tr>
                <tr>
                  <th scope="row">놀이터</th>
                  <td>{center.playgrounds ?? "-"}개</td>
                </tr>
                <tr>
                  <th scope="row">CCTV</th>
                  <td>{center.cctv ?? "-"}대</td>
                </tr>
                <tr>
                  <th scope="row">통학차량</th>
                  <td>{center.bus === null ? "-" : center.bus ? "운영" : "미운영"}</td>
                </tr>
                <tr>
                  <th scope="row">인가</th>
                  <td>{ageText(center.approved_at)}</td>
                </tr>
                <tr>
                  <th scope="row">기준</th>
                  <td>{baseLabel} · 한국사회보장정보원 공개 자료</td>
                </tr>
              </tbody>
            </table>

            {perStaff !== null && (
              <>
                <h2 id="ratio">교사 1인당 아동 수, 어떻게 읽나</h2>
                <p>
                  현원을 보육교직원 수로 나눈 값입니다. {region.name} 중간값은{" "}
                  {formatPerStaff(median)}입니다.
                </p>
                <table>
                  <tbody>
                    <tr>
                      <th scope="row">{name}</th>
                      <td>
                        <strong>{formatPerStaff(perStaff)}</strong>
                      </td>
                    </tr>
                    {median && (
                      <tr>
                        <th scope="row">{region.name} 중간값</th>
                        <td>
                          {formatPerStaff(median)}
                          {diff !== null && (
                            <>
                              {" "}
                              <span
                                className={`rel rel--${diff > 0 ? "up" : diff < 0 ? "down" : "flat"}`}
                              >
                                {diff > 0
                                  ? `+${diff}%`
                                  : diff < 0
                                    ? `−${-diff}%`
                                    : "±0%"}
                              </span>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="notice notice--muted">
                  <strong>법정 교사 대 아동 비율과 다릅니다.</strong> 분모인
                  보육교직원 수에는 <strong>원장·조리원·사무원이 함께</strong>{" "}
                  들어갑니다. 담임교사만 센 값이 아니므로, 이 숫자가 낮다고 법을
                  지킨 것도 높다고 어긴 것도 아닙니다. 어린이집 사이의 상대적인
                  여유를 견주는 용도로만 보세요.
                </p>
              </>
            )}

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.bottom} />
            </div>

            <h2 id="visit">가 보기 전에 확인할 것</h2>
            <ol>
              <li>
                <strong>반별 담임 수를 물어보세요.</strong> 위 숫자로는 우리
                아이 반에 선생님이 몇 분인지 알 수 없습니다. 그게 가장 중요한
                숫자입니다
              </li>
              <li>
                <strong>평가 결과를 확인하세요.</strong>{" "}
                <a
                  href={OFFICIAL_LINKS.childcare}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  어린이집 정보공개 포털
                </a>
                에서 이 어린이집의 평가 등급과 이력을 볼 수 있습니다
              </li>
              <li>
                <strong>대기 신청은 아이사랑에서</strong> —{" "}
                <a
                  href={OFFICIAL_LINKS.ilove}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  아이사랑
                </a>
                에서 온라인으로 넣을 수 있습니다. 인기 있는 곳은 몇 달씩 걸립니다
              </li>
              <li>
                <strong>직접 가 보세요.</strong> 아이가 잘 지내는지는 표에 안
                담깁니다. 등·하원 시간에 한 번 들러 보시는 편이 낫습니다
              </li>
            </ol>

            {faq.length > 0 && (
              <section className="faq">
                <h2 className="faq__title" id="faq">
                  자주 묻는 질문
                </h2>
                {faq.map((f, i) => (
                  <div className="faq__item" key={i}>
                    <h3 className="faq__q">{f.q}</h3>
                    <div className="faq__a">
                      <p>{f.a}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>

          <footer className="entry-footer">
            <span>출처: 한국사회보장정보원 어린이집 기본정보</span>
            <span>현원은 계속 바뀌며 공개까지 시차가 있습니다</span>
          </footer>
        </div>
      </article>

      {others.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div className="sec-head">
            <h2 className="sec-title">{region.name}의 다른 어린이집</h2>
            <a target="_self" href={`/${region.slug}`} className="sec-more">
              전체 보기
            </a>
          </div>
          <div className="sido-block">
            <div className="region-chips">
              {others.map((c) => (
                <a
                  target="_self"
                  key={c.center_id}
                  href={`/${region.slug}/${centerSlug(c.name, c.center_id)}`}
                >
                  {c.name}
                  {c.kind ? (
                    <span style={{ fontSize: 11, color: "#8b9184" }}>
                      {c.kind}
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </div>
  );
}

function buildFaq({
  name,
  region,
  center,
  median,
  diff,
  baseLabel,
}: {
  name: string;
  region: Region;
  center: Center;
  median: number | null;
  diff: number | null;
  baseLabel: string;
}): Array<{ q: string; a: string }> {
  if (center.per_staff === null) return [];

  return [
    {
      q: `${name} 정원과 현원은 얼마인가요?`,
      a: `${baseLabel} 기준 정원 ${center.capacity ?? "?"}명에 현원 ${center.enrolled ?? "?"}명입니다${center.capacity && center.enrolled !== null ? ` (정원 대비 ${formatRate(center.enrolled, center.capacity)})` : ""}. 현원은 아이가 들어오고 나가면 바뀌고 공개 자료에 반영되기까지 시차가 있어, 지금 이 순간의 값은 아닙니다. 빈자리가 있는지는 어린이집에 직접 물어보시는 편이 정확합니다.`,
    },
    {
      q: `${name}은 선생님 한 명이 몇 명을 보나요?`,
      a: `공개 자료로 계산하면 보육교직원 한 명당 ${formatPerStaff(center.per_staff)}입니다${median && diff !== null ? `. ${region.name} 중간값 ${formatPerStaff(median)}과 견주면 ${diff > 0 ? `${diff}% 많은` : diff < 0 ? `${-diff}% 적은` : "같은"} 편입니다` : ""}. 다만 이 값의 분모에는 원장·조리원·사무원이 함께 들어가 있어 법정 교사 대 아동 비율과 다릅니다. 우리 아이 반의 담임이 몇 분인지는 어린이집에 직접 물어보셔야 합니다.`,
    },
    {
      q: `${name} 입소 대기는 어떻게 넣나요?`,
      a: "아이사랑(www.childcare.go.kr)에서 온라인으로 신청합니다. 여러 곳에 동시에 넣을 수 있고 대기 순번도 거기서 확인합니다. 인기 있는 곳은 몇 달에서 해를 넘기기도 하므로 미리 넣어 두는 편이 낫습니다. 이 사이트는 공개 자료를 정리해 보여줄 뿐이라 대기 신청을 받지 않습니다.",
    },
  ];
}
