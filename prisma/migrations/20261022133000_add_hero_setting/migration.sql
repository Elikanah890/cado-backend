-- CreateTable
CREATE TABLE IF NOT EXISTS "HeroSetting" (
    "id" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT 'Build. Market. Automate. Grow.',
    "heading" TEXT NOT NULL DEFAULT 'We Build Brands & Smart Systems That Drive Real Growth.',
    "subtext" TEXT NOT NULL DEFAULT 'Tailored digital solutions for ambitious businesses in Tanzania and beyond.',
    "primaryButtonText" TEXT NOT NULL DEFAULT 'Chat on WhatsApp',
    "primaryButtonUrl" TEXT NOT NULL DEFAULT 'https://wa.me/255716168903',
    "secondaryButtonText" TEXT NOT NULL DEFAULT 'View Portfolio',
    "secondaryButtonUrl" TEXT NOT NULL DEFAULT '/portfolio',
    "stat1Value" TEXT NOT NULL DEFAULT '6+',
    "stat1Label" TEXT NOT NULL DEFAULT 'Happy Clients',
    "stat2Value" TEXT NOT NULL DEFAULT '10+',
    "stat2Label" TEXT NOT NULL DEFAULT 'Projects Delivered',
    "heroImages" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSetting_pkey" PRIMARY KEY ("id")
);
