import type { Metadata } from "next";
import { buildMetadata, SITE } from "@/lib/seo";
import { OFFICIAL_LINKS } from "@/lib/menu";

export const metadata: Metadata = buildMetadata({
  path: "/contact",
  title: `문의하기 | ${SITE.name}`,
  description:
    "데이터 오류 제보, 제휴 문의, 정보 삭제 요청을 받습니다. 입소 상담과 대기 신청은 해당 어린이집이나 아이사랑으로 문의하세요.",
});

export default function ContactPage() {
  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>✉️</span>
          문의하기
        </h1>
        <p>
          잘못된 정보를 발견하셨다면 알려주세요. 확인 후 바로잡겠습니다.
        </p>
      </div>

      <section className="panel">
        <h2 className="panel__title">이메일</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <strong>support@keywordegg.com</strong>
          <br />
          평일 기준 2~3일 안에 답변드립니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">이런 문의를 받습니다</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            <strong>데이터 오류 제보</strong> — 기관명·등급·평가일자가 실제와 다른
            경우. 어느 페이지의 어떤 항목인지 함께 알려주시면 빠릅니다.
          </li>
          <li>
            <strong>어린이집 정보 관련 요청</strong> — 원장님이나 관계자께서 게시
            내용에 정정이 필요하다고 판단하신 경우.
          </li>
          <li>
            <strong>제휴·광고 문의</strong>
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">이런 문의는 답변드리기 어렵습니다</h2>
        <p className="panel__desc">
          이 사이트는 공개 데이터를 정리해 보여줄 뿐, 보육 업무를 대행하지
          않습니다. 아래 내용은 해당 창구를 이용해 주세요.
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>보육료·정부 지원금 문의</li>
          <li>입소 대기 순번·빈자리 문의</li>
          <li>보육 관련 민원·분쟁</li>
        </ul>
        <p className="panel__desc" style={{ margin: "12px 0 0" }}>
          위 내용은{" "}
          <a
            href={OFFICIAL_LINKS.ilove}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            아이사랑
          </a>{" "}
          에서 입소 대기를 신청하고 순번을 확인할 수 있습니다. 빈자리와 반 편성은
          해당 어린이집에 직접 물어보시는 편이 정확합니다.
        </p>
      </section>
    </>
  );
}
