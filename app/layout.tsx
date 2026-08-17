import type { Metadata } from "next";
import "./globals.css";
import { SITE, buildMetadata } from "@/lib/seo";
import { AD_CLIENT } from "@/lib/ads";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

const title = "어린이집 정보 - 시군구별 교사 1인당 아동 수 비교";
const description =
  "전국 시군구별 어린이집을 교사 1인당 아동 수와 정원·현원으로 정리했습니다. 우리 동네 어린이집을 나란히 놓고 견줘 보세요.";

/**
 * 구글 서치콘솔 소유확인 코드.
 *
 * 서브도메인은 별도 속성이라 keywordegg 의 값을 그대로 쓸 수 없다.
 * daycare.keywordegg.com 을 등록한 뒤 환경변수로 넣는다.
 * 비어 있으면 해당 메타 태그를 아예 넣지 않는다.
 */
const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? "";

export const metadata: Metadata = {
  ...buildMetadata({
    path: "/",
    title,
    description,
    keywords: [
      "어린이집",
      "어린이집 정보",
      "국공립 어린이집",
      "어린이집 교사 대 아동 비율",
      "어린이집 정원 현원",
      "동네 어린이집",
    ],
  }),
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "health",
  formatDetection: { telephone: false, email: false, address: false },
  verification: {
    ...(GOOGLE_VERIFICATION ? { google: GOOGLE_VERIFICATION } : {}),
    other: {
      "google-adsense-account": AD_CLIENT,
    },
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  alternateName: SITE.nameEn,
  url: SITE.url,
  inLanguage: "ko-KR",
  description,
  publisher: { "@id": `${SITE.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE.url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  alternateName: SITE.nameEn,
  url: SITE.url,
  description,
  logo: {
    "@type": "ImageObject",
    url: `${SITE.url}/opengraph-image`,
    width: 1200,
    height: 630,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          id="json-ld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script type="text/javascript" src="//wcs.pstatic.net/wcslog.js" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html:
              'if(!wcs_add) var wcs_add = {}; wcs_add["wa"] = "159f7184d59b700"; if(window.wcs) {wcs_do();}',
          }}
        />
        <script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
        />
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-5BM9W5BC3P"
        />
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag() {
              dataLayer.push(arguments);
            }
            gtag('js', new Date());

            gtag('config', 'G-5BM9W5BC3P');
          `,
          }}
        />
      </head>
      <body>
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
