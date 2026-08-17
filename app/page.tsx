import { REGION_HUB_SLUG, SIDOS } from "@/lib/regions";
import {
  formatPerStaff,
  getAllRegionStats,
  isPublishable,
} from "@/lib/daycare-data";
import { OFFICIAL_LINKS } from "@/lib/menu";
import StatTile from "@/components/region/StatTile";
import DataNotice from "@/components/region/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

export const revalidate = 300;

export default async function HomePage() {
  const stats = await getAllRegionStats();
  const all = [...stats.values()];
  const filled = all.filter(isPublishable);        // 금액을 낼 수 있는 지역
  const totalCenters = all.reduce((sum, s) => sum + s.center_count, 0);

  const medians = filled
    .map((s) => s.median_per_staff)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const nationalMedian = medians.length
    ? medians[Math.floor(medians.length / 2)]
    : null;

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🏢</span>
          우리 동네 어린이집, 선생님 한 명이 몇 명을 볼까
        </h1>
        <p>
          어린이집을 고를 때 가장 궁금한 건 <strong>우리 아이를 몇 명 중 하나로
          봐 주는가</strong>입니다. 한국사회보장정보원이 공개한 자료로{" "}
          <strong>교사 1인당 아동 수</strong>와 정원·현원을 정리했습니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile
          label="어린이집"
          value={totalCenters > 0 ? `${totalCenters.toLocaleString()}곳` : "준비 중"}
        />
        <StatTile
          label="금액 공개 시군구"
          value={filled.length > 0 ? `${filled.length}곳` : "수집 중"}
        />
        <StatTile
          label="교사 1인당 아동"
          value={
            nationalMedian !== null ? formatPerStaff(nationalMedian) : "준비 중"
          }
        />
        <StatTile label="출처" value="사회보장정보원" sub="공개 자료" />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.home} />
      </div>

      <section style={{ marginBottom: 36 }}>
        <div className="sec-head">
          <h2 className="sec-title">지역으로 찾기</h2>
          <a target="_self" href={`/${REGION_HUB_SLUG}`} className="sec-more">
            전체 지역 보기
          </a>
        </div>
        <div className="sido-block">
          <div className="region-chips">
            {SIDOS.map((s) => (
              <a
                target="_self"
                key={s.short}
                href={`/${REGION_HUB_SLUG}#${s.short}`}
              >
                <span aria-hidden>{s.emoji}</span>
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">이 숫자를 어떻게 봐야 하나</h2>
        <p className="panel__desc">
          <strong>교사 1인당 아동 수는 법정 교사 대 아동 비율이 아닙니다.</strong>{" "}
          공개 자료의 보육교직원수에 원장·조리원·사무원이 함께 들어가기
          때문입니다. 이 값이 낮다고 법을 지킨 것도 높다고 어긴 것도 아니며,
          어린이집 사이의 <strong>상대적인 여유</strong>를 견주는 용도입니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <strong>숫자가 좋다고 좋은 곳도 아닙니다.</strong> 아이가 잘 지내는지는
          교사와 아이의 관계, 프로그램, 분위기에서 나오고 그건 표에 안 담깁니다.
          평가 결과와 입소 대기는{" "}
          <a
            href={OFFICIAL_LINKS.childcare}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            정보공개 포털
          </a>
          에서 확인하시고, <strong>반드시 직접 가 보세요.</strong>
        </p>
      </section>

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.home} />
      </div>
    </>
  );
}
