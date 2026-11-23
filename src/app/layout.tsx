import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FAQ_ITEMS } from "@/lib/constants";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://instashift.croney-tech.fr"),
  title:
    "InstaShift — Analyseur d'audience Instagram local & open-source (Sans mot de passe)",
  description:
    "Inspectez vos abonnés Instagram, identifiez les comptes non-réciproques et comparez vos snapshots dans le temps (Git Diff). Exécution 100% locale via JSZip et IndexedDB.",
  keywords: [
    "qui ne me suit pas sur instagram",
    "qui ne me suit plus instagram",
    "analyseur abonnes instagram gratuit",
    "instagram unfollow gratuit",
    "unfollow tracker instagram",
    "analyse followers instagram sans mot de passe",
    "analyseur audience instagram prive",
    "comparer abonnes instagram",
    "instashift",
  ],
  authors: [{ name: "Dev.Croney-Tech", url: "https://dev.croney-tech.fr" }],
  alternates: {
    canonical: "https://instashift.croney-tech.fr",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title:
      "InstaShift — Analyseur d'audience Instagram local & open-source",
    description:
      "Identifiez qui ne vous suit pas en retour sur Instagram et comparez vos archives ZIP localement sans jamais saisir vos identifiants.",
    url: "https://instashift.croney-tech.fr",
    siteName: "InstaShift",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/logo_instashift.png",
        width: 512,
        height: 512,
        alt: "InstaShift — Client-Side Instagram Audience Workbench",
      },
    ],
  },
  twitter: {
    card: "summary",
    title:
      "InstaShift — Analyseur d'audience Instagram local & open-source",
    description:
      "Analysez vos abonnés Instagram et vos désabonnements localement via votre export ZIP officiel. Zéro serveur, zéro mot de passe.",
    creator: "@CroneyTech",
    images: ["/logo_instashift.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "InstaShift",
        url: "https://instashift.croney-tech.fr",
        publisher: {
          "@type": "Organization",
          name: "Dev.Croney-Tech",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "InstaShift",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web Browser (Client-Side JSZip & IndexedDB)",
        url: "https://instashift.croney-tech.fr",
        license: "https://opensource.org/licenses/MIT",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        author: {
          "@type": "Organization",
          name: "Dev.Croney-Tech",
          url: "https://dev.croney-tech.fr",
        },
      },
      {
        "@type": "Organization",
        name: "InstaShift",
        url: "https://instashift.croney-tech.fr",
        description:
          "Workbench open-source d'analyse différentielle d'audience Instagram exécuté 100% localement dans le navigateur.",
        parentOrganization: {
          "@type": "Organization",
          name: "Croney Technology Group",
          url: "https://group.croney-technology.com",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "dev@croney-tech.fr",
          contactType: "customer service",
        },
        sameAs: [
          "https://github.com/Dev-Croney-Tech/instashift",
          "https://x.com/CroneyTech",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <html
      lang="fr"
      className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#010102] text-[#f7f8f8] flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
