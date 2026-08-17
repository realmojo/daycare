import { siblingRegions, REGION_HUB_SLUG, type Region } from "@/lib/regions";
import {
  formatPerStaff,
  formatRate,
  getAllRegionStats,
  isPublishable,
  listRegionCenters,
  withParticle,
} from "@/lib/daycare-data";
import { ageText, centerSlug } from "@/lib/center";
import { breadcrumbJsonLd, datasetJsonLd } from "@/lib/seo";
import StatTile from "@/components/region/StatTile";
import DataNotice from "@/components/region/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * 지역 상세 `/서울-강남구`.
 *
 * 어린이집을 **교사 1인당 아동 수가 적은 순**으로 놓는다. 관리비(apt)와 달리
 * 여기서는 낮은 쪽이 여유가 있다는 뜻이라 그게 자연스러운 순서다.
 */
export default async function RegionView({ region }: { region: Region }) {
  const [statsMap, centers] = await Promise.all([
    getAllRegionStats(),
    listRegionCenters(region.slug),
  ]);
  const stats = statsMap.get(region.slug) ?? null;
  const ready = isPublishable(stats);
  const median = stats?.median_per_staff ?? null;
  const total = stats?.center_count ?? 0;
  const rated = stats?.rated_count ?? 0;
  const siblings = siblingRegions(region);

  // per_staff 는 적재할 때 계산해 둔 값을 읽기만 한다.
  const rows = centers
    .filter((c) => c.status === "정상" && c.per_staff !== null)
    .map((c) => ({ center: c, perStaff: c.per_staff as number }))
    .sort((a, b) => a.perStaff - b.perStaff);

  const description = `${region.name}의 어린이집 ${total}곳을 교사 1인당 아동 수와 정원·현원으로 정리했습니다.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "지역별", path: `/${REGION_HUB_SLUG}` },
              { name: region.name, path: `/${region.slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${region.name} 어린이집`,
              path: `/${region.slug}`,
              description,
            }),
          ),
        }}
      />

      <div className="page-head">
        <span className="cat-badge cat-badge--region">{region.sidoName}</span>
        <h1>{region.name} 어린이집</h1>
        <p>
          {withParticle(region.name, "은는")} 어린이집이 {total.toLocaleString()}
          곳 있습니다. 교사 1인당 아동 수가 적은 곳부터 놓았습니다.
        </p>
      </div>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {ready ? (
        <section className="stat-grid">
          <StatTile label="어린이집" value={`${total.toLocaleString()}곳`} />
          <StatTile
            label="교사 1인당 아동"
            value={formatPerStaff(median)}
            sub={`${rated.toLocaleString()}곳 기준`}
          />
          <StatTile
            label="충원율"
            value={formatRate(stats.enrolled_sum, stats.capacity_sum)}
            sub={`정원 ${(stats.capacity_sum ?? 0).toLocaleString()}명`}
          />
          <StatTile label="출처" value="사회보장정보원" sub="공개 자료" />
        </section>
      ) : (
        <div className="empty-box">
          {region.name}은 표본이 얇아 지역 중간값을 내보내지 않습니다
          {total > 0 ? ` (현재 ${rated}/${total}곳)` : ""}. 몇 곳으로 낸 중간값은
          사실과 다릅니다.
        </div>
      )}

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.middle} />
      </div>

      {rows.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">
            어린이집별 교사 1인당 아동 수
            <span className="sido-block__count">{rows.length}곳</span>
          </h2>
          <p className="panel__desc">
            적은 순입니다. <strong>이 값은 법정 교사 대 아동 비율이 아닙니다</strong>{" "}
            — 분모인 보육교직원수에 원장·조리원이 함께 들어갑니다. 어린이집
            사이의 상대적인 여유를 견주는 용도로만 보세요.
          </p>
          <div className="table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">어린이집</th>
                  <th scope="col" className="is-num">
                    교사 1인당
                  </th>
                  <th scope="col" className="is-num">
                    정원 대비
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ center: c, perStaff }) => (
                  <tr key={c.center_id}>
                    <td>
                      <a
                        target="_self"
                        href={`/${region.slug}/${centerSlug(c.name, c.center_id)}`}
                        className="pr-table__name pr-table__link"
                      >
                        {c.name}
                      </a>
                      <span className="pr-table__meta">
                        {[
                          c.kind,
                          c.capacity ? `정원 ${c.capacity}명` : null,
                          c.approved_at ? ageText(c.approved_at).split(" · ")[0] : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>
                    <td className="is-num">
                      <span className="pr-table__value">
                        {formatPerStaff(perStaff)}
                      </span>
                    </td>
                    <td className="is-num">
                      {formatRate(c.enrolled, c.capacity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="sido-block">
          <h2 className="sido-block__title">
            {region.sidoName}의 다른 지역
            <span className="sido-block__count">{siblings.length}곳</span>
          </h2>
          <div className="region-chips">
            {siblings.map((r) => (
              <a target="_self" key={r.slug} href={`/${r.slug}`}>
                {r.sigungu || r.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}
