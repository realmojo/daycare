import { REGION_HUB_SLUG } from "./regions";

export interface MenuItem {
  name: string;
  href: string;
}

/** 상단 GNB */
export const NAV: MenuItem[] = [
  { name: "홈", href: "/" },
  { name: "지역별", href: `/${REGION_HUB_SLUG}` },
];

/** 푸터에 노출하는 안내 페이지 */
export const SITE_LINKS: MenuItem[] = [
  { name: "사이트 소개", href: "/about" },
  { name: "문의하기", href: "/contact" },
  { name: "개인정보처리방침", href: "/privacy" },
  { name: "이용약관", href: "/terms" },
];

/**
 * 공식 창구.
 *
 * 이 사이트는 공개 데이터를 정리해 보여줄 뿐이다. 입소 신청·대기 순번·보육료
 * 같은 것은 공식 창구에서 확인해야 한다. 확인되지 않은 것을 쓰는 대신 여기로
 * 넘긴다.
 */
export const OFFICIAL_LINKS = {
  /** 어린이집 정보공개 포털 — 평가결과·상세 정보 */
  childcare: "https://info.childcare.go.kr/",
  /** 아이사랑 — 입소 대기 신청 */
  ilove: "https://www.childcare.go.kr/",
  /** 공공데이터포털 — 이 사이트 데이터 원본 */
  dataset: "https://www.data.go.kr/data/15013108/standard.do",
} as const;
