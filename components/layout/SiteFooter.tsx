import { SITE_LINKS, OFFICIAL_LINKS } from "@/lib/menu";
import { SIDOS, REGION_HUB_SLUG } from "@/lib/regions";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <div className="site-footer__logo">
              <span aria-hidden>🧸</span> 어린이집 정보
            </div>
            <p className="site-footer__desc">
              전국 시군구별 어린이집을 교사 1인당 아동 수와 정원·현원으로
              정리했습니다. 우리 동네 어린이집을 나란히 놓고 견줄 수 있습니다.
            </p>
          </div>

          <div className="site-footer__col">
            <h3>지역별</h3>
            <ul>
              <li>
                <a target="_self" href={`/${REGION_HUB_SLUG}`}>
                  전체 지역 보기
                </a>
              </li>
              {SIDOS.slice(0, 7).map((s) => (
                <li key={s.short}>
                  <a target="_self" href={`/${REGION_HUB_SLUG}#${s.short}`}>
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__col">
            <h3>사이트</h3>
            <ul>
              {SITE_LINKS.map((item) => (
                <li key={item.href}>
                  <a target="_self" href={item.href}>
                    {item.name}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={OFFICIAL_LINKS.childcare}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  어린이집 정보공개 포털
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_LINKS.dataset}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  데이터 원본
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            © {new Date().getFullYear()} 어린이집 정보. All rights reserved.
          </p>
          <p className="site-footer__note">
            한국사회보장정보원이 공개한 자료를 정리한 것입니다. 교사 1인당 아동
            수의 분모인 보육교직원수에는 원장·조리원이 함께 들어가므로 법정 교사
            대 아동 비율과 다릅니다. 현원은 계속 바뀌고 공개까지 시차가 있습니다.
            입소 상담과 평가 결과는 아이사랑·정보공개 포털에서 확인하세요.
          </p>
        </div>
      </div>
    </footer>
  );
}
