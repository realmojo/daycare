import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  findRegion,
  REGION_HUB_SLUG,
  REGIONS,
  type Region,
} from "@/lib/regions";
import { getAllRegionStats, isPublishable } from "@/lib/daycare-data";
import { buildMetadata, SITE } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";
import RegionHubView from "./RegionHubView";
import RegionView from "./RegionView";

/**
 * 한 라우트가 두 화면을 맡는다.
 *
 *   /지역          → 지역 허브
 *   /서울-강남구    → 지역 상세  (lib/regions.ts)
 *
 * 나중에 단지 상세(`/서울-강남구/{단지}-{단지코드}`)가 붙는다. yoyang 과 같은
 * 구조라 그쪽 `app/[slug]/[facility]/page.tsx` 를 그대로 가져오면 된다.
 *
 * **Next 16 은 라우트 파라미터를 자동으로 디코딩하지 않는다.** 한글 슬러그가
 * 퍼센트 인코딩된 채로 넘어오므로 decodeSlug 를 반드시 거쳐야 한다.
 * 이걸 빼면 한글 경로가 전부 404 가 된다 (yoyang 에서 실제로 겪었다).
 */
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);

  if (slug === REGION_HUB_SLUG) {
    return buildMetadata({
      path: `/${REGION_HUB_SLUG}`,
      title: `지역별 어린이집 | ${SITE.name}`,
      description:
        "전국 시군구별 어린이집을 교사 1인당 아동 수와 정원·현원으로 정리했습니다. 우리 동네 어린이집을 나란히 놓고 견줘 보세요.",
      keywords: ["어린이집", "지역별 어린이집", "국공립 어린이집", "동네 어린이집"],
    });
  }


  const region = findRegion(slug);
  if (region) return regionMetadata(region);

  return {};
}

async function regionMetadata(region: Region): Promise<Metadata> {
  const stats = (await getAllRegionStats()).get(region.slug) ?? null;

  // 보여줄 값이 없는 지역은 색인시키지 않는다. 단지 목록만 있고 관리비가
  // 없거나 표본이 얇으면 빈 페이지나 다름없고, 그게 색인되면 사이트 전체
  // 품질 평가가 내려간다.
  if (!isPublishable(stats)) {
    return {
      ...buildMetadata({
        path: `/${region.slug}`,
        title: `${region.name} 어린이집 | ${SITE.name}`,
        description: `${region.name} 어린이집 자료를 준비하고 있습니다.`,
      }),
      robots: { index: false, follow: true },
    };
  }

  return buildMetadata({
    path: `/${region.slug}`,
    title: `${region.name} 어린이집 ${stats.center_count}곳 - 국공립·민간·가정 한눈에 | ${SITE.name}`,
    description: `${region.name} 어린이집 ${stats.center_count}곳의 정원·현원과 교사 1인당 아동 수를 한 표에 정리했습니다. 교사 1인당 아동 수 중간값은 ${stats.median_per_staff ? `${Math.round(stats.median_per_staff * 10) / 10}명` : "-"}입니다. 국공립·민간·가정을 나란히 놓고 견줘 보세요.`,
    keywords: [
      `${region.name} 어린이집`,
      `${region.name} 국공립 어린이집`,
      `${region.sigungu || region.sido} 어린이집 추천`,
      "어린이집 찾기",
      "어린이집 정원 현원",
    ],
  });
}

export default async function SlugPage({ params }: Props) {
  const slug = decodeSlug((await params).slug);

  if (slug === REGION_HUB_SLUG) return <RegionHubView />;


  const region = findRegion(slug);
  if (region) return <RegionView region={region} />;

  notFound();
}

export function generateStaticParams(): { slug: string }[] {
  return [
    { slug: REGION_HUB_SLUG },
    ...REGIONS.map((r) => ({ slug: r.slug })),
  ];
}
