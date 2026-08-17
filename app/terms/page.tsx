import type { Metadata } from "next";
import { buildMetadata, SITE } from "@/lib/seo";
import { OFFICIAL_LINKS } from "@/lib/menu";

export const metadata: Metadata = buildMetadata({
  path: "/terms",
  title: `이용약관 | ${SITE.name}`,
  description:
    "어린이집 정보 서비스의 이용 조건, 정보의 성격과 한계, 저작권과 책임 범위를 안내합니다.",
});

export default function TermsPage() {
  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>📄</span>
          이용약관
        </h1>
        <p>{SITE.name} 서비스 이용에 관한 조건을 안내합니다.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">제1조 (목적)</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          이 약관은 {SITE.name}(이하 &ldquo;사이트&rdquo;)가 제공하는 정보 서비스의
          이용 조건과 절차, 사이트와 이용자의 권리·의무를 정하는 것을 목적으로
          합니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">제2조 (서비스의 성격)</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            사이트는 공공기관이 공개한 데이터와 일반적인 제도 정보를 정리해
            제공합니다. <strong>참고용 정보</strong>이며, 의료·법률·재정에 관한
            전문적인 조언이 아닙니다.
          </li>
          <li>
            사이트는 특정 어린이집을 추천하거나 평가하지 않으며, 어린이집과
            보호자 사이의 관계에 관여하지 않습니다.
          </li>
          <li>
            평가 결과와 입소 대기는{" "}
            <a
              href={OFFICIAL_LINKS.childcare}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              어린이집 정보공개 포털
            </a>
            과 해당 어린이집에서 확인해야 합니다.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">제3조 (정보의 정확성과 면책)</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            사이트는 정확한 정보를 제공하기 위해 노력하지만, 원본 데이터의 오류나
            갱신 지연으로 실제와 다를 수 있습니다.
          </li>
          <li>
            현원은 아이가 들어오고 나가면 계속 바뀌므로, 표시된 값은 해당
            <strong>기준일</strong>의 공개 자료이며 현재 상태를 보장하지 않습니다.
            교사 1인당 아동 수는 원장·조리원이 분모에 포함된 값이라 법정 교사 대
            아동 비율과 다릅니다.
          </li>
          <li>
            사이트의 정보를 근거로 한 판단과 그 결과에 대한 책임은 이용자에게
            있으며, 사이트는 이에 대해 법적 책임을 지지 않습니다.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">제4조 (저작권)</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          사이트가 작성한 글과 편집물의 저작권은 사이트에 있습니다. 다만 공공기관이
          제공한 원본 데이터는 해당 기관의 이용 조건을 따릅니다. 사이트의 콘텐츠를
          무단으로 복제·배포하거나 상업적으로 이용할 수 없습니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">제5조 (금지 행위)</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>자동화된 수단으로 사이트에 과도한 부하를 주는 행위</li>
          <li>사이트의 정보를 사실과 다르게 가공해 유포하는 행위</li>
          <li>사이트의 정상적인 운영을 방해하는 일체의 행위</li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">제6조 (약관의 변경)</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          사이트는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 이
          페이지에 게시한 시점부터 효력이 발생합니다.
        </p>
      </section>
    </>
  );
}
