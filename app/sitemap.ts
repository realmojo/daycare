import { MetadataRoute } from "next";
import { SITE_LINKS } from "@/lib/menu";
import { REGION_HUB_SLUG, REGIONS } from "@/lib/regions";
import {
  getAllRegionStats,
  isPublishable,
  listPublishedCenters,
} from "@/lib/daycare-data";
import { absoluteUrl } from "@/lib/seo";
import { centerSlug } from "@/lib/center";

/**
 * 사이트맵 하나에 URL 5만 개까지 넣을 수 있다. 단지가 다 채워져도 2.2만 개라
 * 아직 한 파일로 된다. 그 위로 늘면 쪼개야 한다.
 *
 * 단지 조회는 **1000개씩 나눠 받는다.** Supabase 가 한 번에 1000행까지만
 * 주므로 한 번에 다 달라고 하면 조용히 잘린 채로 제출된다 (yoyang 에서 실제로
 * 겪었다 — 21,216개 중 5,000개만 올라갈 뻔했다).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const stats = await getAllRegionStats();

  const statics = ["/", `/${REGION_HUB_SLUG}`, ...SITE_LINKS.map((l) => l.href)].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: (path === "/" ? "daily" : "monthly") as
        | "daily"
        | "monthly",
      priority: path === "/" ? 1 : 0.6,
    }),
  );

  // 보여줄 값이 있는 지역만 넣는다. 단지가 있다는 것과 값이 있다는 것은 다르다.
  // 빈 페이지를 제출하면 사이트 전체 색인 품질이 깎인다.
  const regions = REGIONS.filter((r) => isPublishable(stats.get(r.slug))).map(
    (r) => ({
      url: absoluteUrl(`/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }),
  );

  // 지표가 있는 어린이집만. 값 없는 페이지는 noindex 이므로 넣으면 어긋난다.
  const centers = (await listPublishedCenters()).map((c) => ({
    url: absoluteUrl(`/${c.region_slug}/${centerSlug(c.name, c.center_id)}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...statics, ...regions, ...centers];
}
