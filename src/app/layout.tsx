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
  title: "InstaShift 🔄 | Analyseur d'audience Instagram Privé & Open-Source",
  description: "Analysez vos abonnés Instagram, repérez qui ne vous suit pas en retour et comparez l'évolution temporelle de votre compte de façon 100% sécurisée et locale.",
  keywords: ["Instagram", "Followers", "Analyseur", "Qui ne me suit pas", "Unfollow", "Instagram Data Export", "Privé", "Open-Source"],
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
    title: "InstaShift 🔄 | Analyseur d'audience Instagram Privé & Open-Source",
    description: "Comparez l'évolution de vos abonnés et analysez les non-abonnés en retour à partir de vos exports ZIP locaux. Zéro serveur, confidentialité absolue.",
    url: "https://instashift.croney-tech.fr",
    siteName: "InstaShift",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InstaShift 🔄 | Analyseur d'audience Instagram Privé & Open-Source",
    description: "Analysez vos followers sans risquer le piratage ou le blocage de votre compte. 100% client-side.",
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
