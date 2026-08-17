import { regionsBySido } from "@/lib/regions";
import {
  formatPerStaff,
  getAllRegionStats,
  isPublishable,
} from "@/lib/daycare-data";
import StatTile from "@/components/region/StatTile";
import DataNotice from "@/components/region/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * 지역 허브 `/지역`.
 *
 * 시도별로 시군구를 나열한다. 아직 데이터가 없는 지역도 목록에는 남기되
 * 흐리게 표시해서, 크롤러와 사람 모두 어디가 채워졌는지 알 수 있게 한다.
 */
export default async function RegionHubView() {
  const stats = await getAllRegionStats();
  const groups = regionsBySido();

  // 단지가 있다는 것과 보여줄 값이 있다는 것은 다르다
  const publishable = [...stats.values()].filter(isPublishable);
  const totalCenters = [...stats.values()].reduce(
    (sum, s) => sum + s.center_count,
    0,
  );
  const medians = publishable
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
          <span aria-hidden>📍</span>
          지역별 어린이집
        </h1>
        <p>
          시군구를 고르면 그 지역 어린이집을 교사 1인당 아동 수와 정원·현원으로
          나란히 놓고 볼 수 있습니다.
        </p>
      </div>

      {publishable.length > 0 ? (
        <section className="stat-grid">
          <StatTile
            label="어린이집"
            value={`${totalCenters.toLocaleString()}곳`}
          />
          <StatTile
            label="금액 공개 시군구"
            value={`${publishable.length.toLocaleString()}곳`}
            sub={`전체 ${stats.size}곳`}
          />
          <StatTile
            label="교사 1인당 아동"
            value={
              nationalMedian !== null ? formatPerStaff(nationalMedian) : "-"
            }
            sub="전국 시군구 중간값"
          />
          <StatTile label="출처" value="사회보장정보원" sub="공개 자료" />
        </section>
      ) : (
        <div className="empty-box">
          어린이집 데이터를 아직 적재하지 않았습니다. 지역 페이지 구조만 먼저
          열어 두었습니다.
        </div>
      )}

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {groups.map(({ sido, regions }) => {
        const filled = regions.filter((r) =>
          isPublishable(stats.get(r.slug)),
        ).length;

        return (
          <section className="sido-block" key={sido.short} id={sido.short}>
            <h2 className="sido-block__title">
              <span aria-hidden>{sido.emoji}</span>
              {sido.name}
              <span className="sido-block__count">
                {filled > 0 ? `${filled}개 지역 금액 공개` : "수집 중"}
              </span>
            </h2>
            <div className="region-chips">
              {regions.map((region) => {
                const s = stats.get(region.slug);
                const ready = isPublishable(s);
                return (
                  <a
                    target="_self"
                    key={region.slug}
                    href={`/${region.slug}`}
                    data-empty={ready ? undefined : "true"}
                  >
                    {region.sigungu || region.name}
                    {ready && (
                      <span style={{ fontSize: 11, color: "#8b9184" }}>
                        {formatPerStaff(s.median_per_staff)}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}
