import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "InstaShift | Qui ne me suit pas sur Instagram (Gratuit & Sécurisé)",
  description: "Découvrez les non-abonnés en retour et suivez l'évolution de vos followers sans mot de passe. Analyseur Instagram gratuit, 100% sécurisé et local.",
  keywords: [
    "qui ne me suit pas sur instagram",
    "qui ne me suit plus instagram",
    "analyseur abonnes instagram gratuit",
    "instagram unfollow gratuit",
    "unfollow tracker instagram",
    "analyse followers instagram sans mot de passe",
    "analyseur audience instagram prive",
    "comparer abonnes instagram",
    "instashift"
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
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "InstaShift | Qui ne me suit pas sur Instagram (Gratuit & Sécurisé)",
    description: "Découvrez gratuitement et sans mot de passe qui ne vous suit pas en retour sur Instagram. Analysez vos abonnés de façon 100% sécurisée et locale.",
    url: "https://instashift.croney-tech.fr",
    siteName: "InstaShift",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InstaShift | Qui ne me suit pas sur Instagram (Gratuit & Sécurisé)",
    description: "Analysez vos followers sans risquer le piratage ou le blocage de votre compte. 100% client-side, gratuit et sans mot de passe.",
    creator: "@CroneyTech",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Graph linking to Croney Technology Group
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "InstaShift",
        "url": "https://instashift.croney-tech.fr",
        "publisher": {
          "@type": "Organization",
          "name": "InstaShift"
        }
      },
      {
        "@type": "Organization",
        "name": "InstaShift",
        "url": "https://instashift.croney-tech.fr",
        "description": "Analyseur gratuit et privé d'abonnés Instagram. Comparez l'évolution de vos abonnés à partir de vos exports de données locaux.",
        "parentOrganization": {
          "@type": "Organization",
          "name": "Croney Technology Group",
          "url": "https://group.croney-technology.com"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "dev@croney-tech.fr",
          "contactType": "customer service"
        },
        "sameAs": [
          "https://github.com/Dev-Croney-Tech/instashift",
          "https://x.com/CroneyTech"
        ]
      }
    ]
  };

  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${inter.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-deep text-text-primary flex flex-col selection:bg-brand-purple/30">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
