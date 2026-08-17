import type { Metadata } from "next";
import { REGIONS } from "@/lib/regions";
import { buildMetadata, SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    path: "/search",
    title: `검색 | ${SITE.name}`,
    description: "지역을 검색합니다.",
  }),
  robots: { index: false, follow: true },
};

/**
 * 지금은 지역만 찾는다. 단지 데이터가 들어오면 단지 이름 검색이 여기 붙는다
 * (사람들이 실제로 치는 말은 "○○아파트 관리비"이므로 그때가 본게임이다).
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = (q ?? "").trim();
  const key = keyword.replace(/\s+/g, "");

  const regions = keyword
    ? REGIONS.filter((r) => r.name.replace(/\s+/g, "").includes(key)).slice(0, 40)
    : [];

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🔍</span>
          검색
        </h1>
        <p>
          {keyword
            ? `"${keyword}" 검색 결과 ${regions.length}건`
            : "지역 이름을 입력해주세요."}
        </p>
      </div>

      {regions.length > 0 && (
        <section className="sido-block">
          <h2 className="sido-block__title">
            지역
            <span className="sido-block__count">{regions.length}곳</span>
          </h2>
          <div className="region-chips">
            {regions.map((r) => (
              <a target="_self" key={r.slug} href={`/${r.slug}`}>
                {r.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {keyword && regions.length === 0 && (
        <div className="empty-box">검색 결과가 없습니다.</div>
      )}
    </>
  );
}
