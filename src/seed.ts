import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from './utils/auth';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables');
  }

  const passwordHash = await hashPassword(adminPassword);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { password: passwordHash, role: 'admin' },
    create: {
      email: adminEmail,
      password: passwordHash,
      role: 'admin',
    },
  });
  console.log(`Admin upserted: ${adminEmail}`);

  const services = [
    {
      slug: 'brand-identity',
      name: 'Brand Identity',
      description: 'Build a memorable brand that stands out.',
      overview: 'From logo design to complete brand guidelines, we create cohesive brand identities that resonate with your target audience.',
      icon: 'palette',
      sortOrder: 1,
      isActive: true,
    },
    {
      slug: 'website-development',
      name: 'Website Development',
      description: 'Professional websites that drive results.',
      overview: 'Custom-built websites optimized for performance, SEO, and conversions.',
      icon: 'globe',
      sortOrder: 2,
      isActive: true,
    },
    {
      slug: 'digital-marketing',
      name: 'Digital Marketing',
      description: 'Strategic marketing that grows your business.',
      overview: 'Data-driven marketing campaigns across social media, search, and email.',
      icon: 'megaphone',
      sortOrder: 3,
      isActive: true,
    },
    {
      slug: 'ai-automation',
      name: 'AI & Automation',
      description: 'Smart systems that save time and money.',
      overview: 'AI-powered chatbots, workflow automation, and intelligent systems.',
      icon: 'cpu',
      sortOrder: 4,
      isActive: true,
    },
    {
      slug: 'business-solutions',
      name: 'Business Solutions',
      description: 'Enterprise systems for growing organizations.',
      overview: 'Custom ERP, CRM, and business management systems.',
      icon: 'briefcase',
      sortOrder: 5,
      isActive: true,
    },
    {
      slug: 'creative-studio',
      name: 'Creative Studio',
      description: 'Stunning visuals and creative content.',
      overview: 'Photography, videography, animation, and creative content production.',
      icon: 'camera',
      sortOrder: 6,
      isActive: true,
    },
    {
      slug: 'company-registration',
      name: 'Company & Business Registration',
      description: 'Easy business registration in Tanzania.',
      overview: 'Complete company registration, BRELA, and business compliance services.',
      icon: 'building',
      sortOrder: 7,
      isActive: true,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }
  console.log('Services seeded.');

  // Testimonials (seeded once so admin-added testimonials are not overwritten)
  if ((await prisma.testimonial.count()) === 0) {
    const serviceIdBySlug: Record<string, string> = {};
    for (const service of services) {
      const saved = await prisma.service.findUnique({ where: { slug: service.slug } });
      if (saved) serviceIdBySlug[service.slug] = saved.id;
    }
    const testimonials = [
      { clientName: 'Neema Mushi', clientCompany: 'Founder, Safari Adventures Ltd', clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', content: 'CadorDigital built us a website that doubled our direct bookings in four months. Professional, fast and always available.', rating: 5, isApproved: true, isFeatured: true, sortOrder: 1, serviceId: serviceIdBySlug['website-development'] },
      { clientName: 'John Mwakyusa', clientCompany: 'CEO, Dar Express Logistics', clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', content: 'The delivery app they designed transformed our operations. Live tracking and M-Pesa payments made a huge difference.', rating: 5, isApproved: true, isFeatured: true, sortOrder: 2, serviceId: serviceIdBySlug['ai-automation'] },
      { clientName: 'Amina Said', clientCompany: 'Marketing Lead, Mama Zawadi Fashion', clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', content: 'Our brand finally looks as good as our products. Social media engagement tripled after the rebrand.', rating: 5, isApproved: true, isFeatured: true, sortOrder: 3, serviceId: serviceIdBySlug['brand-identity'] },
      { clientName: 'Baraka John', clientCompany: 'Director, Kilimanjaro Coffee Exports', clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', content: 'The company profile they created helped us open doors at international trade fairs. Truly world-class work.', rating: 5, isApproved: true, isFeatured: false, sortOrder: 4, serviceId: serviceIdBySlug['creative-studio'] },
      { clientName: 'Zawadi Mushi', clientCompany: 'Owner, Mbeya Health Clinic', clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', content: 'Our digital marketing campaigns bring in new patients every week. The team is knowledgeable and responsive.', rating: 4, isApproved: true, isFeatured: false, sortOrder: 5, serviceId: serviceIdBySlug['digital-marketing'] },
      { clientName: 'Emmanuel Kipara', clientCompany: 'CTO, Serengeti Tours Co.', clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', content: 'From planning to launch, CadorDigital delivered a booking platform that just works. Highly recommended.', rating: 5, isApproved: true, isFeatured: false, sortOrder: 6, serviceId: serviceIdBySlug['website-development'] },
    ];
    for (const t of testimonials) {
      await prisma.testimonial.create({ data: t });
    }
    console.log('Testimonials seeded.');
  }

  const portfolios = [
    {
      slug: 'safari-adventures-company-profile',
      title: 'Safari Adventures Ltd — Company Profile',
      clientName: 'Safari Adventures Ltd',
      industry: 'Tourism & Travel',
      category: 'Company Profiles (PDF)',
      projectUrl: null,
      challenge: 'Safari Adventures needed a polished company profile to present to international tour operators and corporate partners ahead of the peak season.',
      solution: 'We designed a 24-page company profile document combining custom photography, brand storytelling and a clear service catalogue.',
      results: 'The profile helped Safari Adventures secure partnerships with 3 international tour operators and win a corporate travel retainer.',
      featuredImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      galleryImages: Prisma.JsonNull,
      videoUrl: null,
      pdfUrl: '/uploads/portfolio/safari-adventures-company-profile.pdf',
      pdfName: 'Safari Adventures Company Profile.pdf',
      techStack: ['Adobe InDesign', 'Illustrator', 'Brand Guidelines'],
      status: 'COMPLETED' as const,
      completionDate: new Date('2026-06-15'),
      isFeatured: true,
      publishedAt: new Date('2026-06-20'),
      seo: { metaTitle: 'Safari Adventures Company Profile — CadorDigital', metaDescription: 'A 24-page company profile designed for Safari Adventures Ltd.' },
      sortOrder: 1,
    },
    {
      slug: 'kilimanjaro-coffee-company-profile',
      title: 'Kilimanjaro Coffee Exports — Company Profile',
      clientName: 'Kilimanjaro Coffee Exports',
      industry: 'Agriculture & Export',
      category: 'Company Profiles (PDF)',
      projectUrl: null,
      challenge: 'The exporter wanted a bilingual (English/Swahili) company profile to share with international coffee buyers and trade fairs.',
      solution: 'We produced a bilingual 20-page profile highlighting sourcing, quality control and their farmer network with infographics.',
      results: 'The profile was distributed at the East Africa Coffee Expo and generated several new buyer enquiries.',
      featuredImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
      galleryImages: Prisma.JsonNull,
      videoUrl: null,
      pdfUrl: '/uploads/portfolio/kilimanjaro-coffee-company-profile.pdf',
      pdfName: 'Kilimanjaro Coffee Exports Company Profile.pdf',
      techStack: ['Adobe InDesign', 'Photoshop', 'Infographics'],
      status: 'COMPLETED' as const,
      completionDate: new Date('2026-05-02'),
      isFeatured: true,
      publishedAt: new Date('2026-05-10'),
      seo: { metaTitle: 'Kilimanjaro Coffee Exports Company Profile — CadorDigital' },
      sortOrder: 2,
    },
    {
      slug: 'serengeti-booking-platform',
      title: 'Serengeti Safari Booking Platform',
      clientName: 'Serengeti Tours Co.',
      industry: 'Tourism & Travel',
      category: 'Web Development',
      projectUrl: 'https://serengetitours.example.com',
      challenge: 'Serengeti Tours was losing bookings to international aggregators and needed a direct-booking website with real-time availability.',
      solution: 'We built a custom booking platform with tour listings, availability calendars, M-Pesa payments and WhatsApp confirmation.',
      results: 'Direct bookings increased by 40% within three months and the company reduced commission fees paid to third parties.',
      featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [{ url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', alt: 'Dashboard view' }, { url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80', alt: 'Booking flow' }],
      videoUrl: null,
      pdfUrl: null,
      pdfName: null,
      techStack: ['Next.js', 'Node.js', 'PostgreSQL', 'M-Pesa API', 'Tailwind CSS'],
      status: 'COMPLETED' as const,
      completionDate: new Date('2026-04-18'),
      isFeatured: true,
      publishedAt: new Date('2026-04-25'),
      seo: { metaTitle: 'Serengeti Safari Booking Platform — CadorDigital' },
      sortOrder: 3,
    },
    {
      slug: 'mama-zawadi-brand-identity',
      title: 'Mama Zawadi Fashion Brand Identity',
      clientName: 'Mama Zawadi Fashion House',
      industry: 'Fashion & Retail',
      category: 'Branding',
      projectUrl: null,
      challenge: 'A growing fashion label needed a memorable brand identity to stand out at markets and on social media.',
      solution: 'We created a full identity: logo suite, colour palette, typography, packaging design and social media templates.',
      results: 'The new identity lifted engagement and helped the brand secure shelf space in two retail boutiques.',
      featuredImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [{ url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80', alt: 'Brand collateral' }],
      videoUrl: null,
      pdfUrl: null,
      pdfName: null,
      techStack: ['Adobe Illustrator', 'Photoshop', 'Figma'],
      status: 'COMPLETED' as const,
      completionDate: new Date('2026-03-30'),
      isFeatured: false,
      publishedAt: new Date('2026-04-05'),
      seo: { metaTitle: 'Mama Zawadi Brand Identity — CadorDigital' },
      sortOrder: 4,
    },
    {
      slug: 'dar-express-delivery-app',
      title: 'Dar Express Delivery App',
      clientName: 'Dar Express Logistics',
      industry: 'Logistics & Delivery',
      category: 'Mobile App',
      projectUrl: null,
      challenge: 'Dar Express needed a mobile app for customers to book deliveries and for riders to manage orders in real time.',
      solution: 'We designed and shipped a cross-platform app with live tracking, in-app chat, M-Pesa payments and an admin dispatch dashboard.',
      results: 'Delivery fulfilment time dropped by 30% and customer retention improved thanks to live tracking.',
      featuredImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      galleryImages: Prisma.JsonNull,
      videoUrl: null,
      pdfUrl: null,
      pdfName: null,
      techStack: ['React Native', 'Node.js', 'PostgreSQL', 'Google Maps API', 'M-Pesa API'],
      status: 'IN_PROGRESS' as const,
      completionDate: null,
      isFeatured: false,
      publishedAt: new Date('2026-08-01'),
      seo: { metaTitle: 'Dar Express Delivery App — CadorDigital' },
      sortOrder: 5,
    },
  ];

  for (const portfolio of portfolios) {
    await prisma.portfolio.upsert({ where: { slug: portfolio.slug }, update: portfolio, create: portfolio });
  }
  console.log('Portfolio seeded.');

  const courses = [
    { slug: 'digital-marketing-foundations', title: 'Digital Marketing Foundations', subtitle: 'Master the channels, planning, and measurement that drive real growth.', description: '<p>Learn the essential digital marketing channels, how to plan a campaign, and how to measure what matters. This course covers social media, search, email, and content marketing with practical Tanzanian business examples.</p>', instructorName: 'Neema Mushi', category: 'Marketing', level: 'Beginner', estimatedHours: 12, price: 150000, currency: 'TZS', sortOrder: 1, isActive: true, isPublished: true, isFeatured: true },
    { slug: 'website-planning-for-business', title: 'Website Planning for Business', subtitle: 'Turn business goals into a clear, useful website plan.', description: '<p>A practical guide to planning a business website: defining goals, structuring pages, writing copy that converts, and briefing a developer. No coding required.</p>', instructorName: 'Baraka John', category: 'Web Development', level: 'Beginner', estimatedHours: 8, price: 100000, currency: 'TZS', sortOrder: 2, isActive: true, isPublished: true },
    { slug: 'brand-strategy-essentials', title: 'Brand Strategy Essentials', subtitle: 'Build a distinctive brand foundation customers remember.', description: '<p>Learn how to position your brand, define your audience, craft a brand voice, and design a visual identity that stands out in a crowded market.</p>', instructorName: 'Neema Mushi', category: 'Branding', level: 'Beginner', estimatedHours: 10, price: null, currency: 'TZS', sortOrder: 3, isActive: true, isPublished: true },
    { slug: 'social-media-marketing-mastery', title: 'Social Media Marketing Mastery', subtitle: 'Grow an engaged audience and turn followers into customers.', description: '<p>From content calendars to paid campaigns, learn how to build a social media presence that generates leads on Instagram, Facebook, TikTok and LinkedIn.</p>', instructorName: 'Amina Said', category: 'Marketing', level: 'Intermediate', estimatedHours: 15, price: 180000, currency: 'TZS', sortOrder: 4, isActive: true, isPublished: true, isFeatured: true },
    { slug: 'seo-for-small-business', title: 'SEO for Small Businesses', subtitle: 'Get found on Google without a big marketing budget.', description: '<p>Learn keyword research, on-page optimisation, local SEO and Google Business Profile setup so customers in Tanzania can find you online.</p>', instructorName: 'Baraka John', category: 'Marketing', level: 'Beginner', estimatedHours: 9, price: 120000, currency: 'TZS', sortOrder: 5, isActive: true, isPublished: true },
  ];
  for (const course of courses) {
    const saved = await prisma.course.upsert({ where: { slug: course.slug }, update: course, create: course });
    const existingModules = await prisma.courseModule.count({ where: { courseId: saved.id } });
    if (existingModules === 0) {
      const module = await prisma.courseModule.create({
        data: { courseId: saved.id, title: 'Introduction', sortOrder: 0 },
      });
      await prisma.courseLesson.createMany({ data: [
        { moduleId: module.id, title: 'Introduction and outcomes', description: 'Understand the goals for this course.', sortOrder: 0 },
        { moduleId: module.id, title: 'Putting the framework into practice', description: 'Apply the framework to a real business scenario.', sortOrder: 1 },
      ], skipDuplicates: true });
    }
  }
  console.log('Academy courses seeded.');

  const blogCategories = await Promise.all(['Marketing', 'Technology', 'Business'].map((name) => prisma.blogCategory.upsert({ where: { slug: name.toLowerCase() }, update: {}, create: { name, slug: name.toLowerCase() } })));
  const tagNames = ['Strategy', 'Growth', 'Technology', 'Branding', 'Tanzania', 'Marketing'];
  const tags = await Promise.all(tagNames.map((name) => prisma.blogTag.upsert({ where: { name }, update: {}, create: { name, slug: name.toLowerCase() } })));
  const posts = [
    ['Build a practical digital growth plan', 'Marketing', ['Strategy', 'Growth']],
    ['What a modern business website should do', 'Technology', ['Technology', 'Growth']],
    ['Brand consistency creates trust', 'Business', ['Branding', 'Strategy']],
    ['Technology decisions for growing teams', 'Technology', ['Technology', 'Tanzania']],
    ['Measure marketing before scaling it', 'Marketing', ['Marketing', 'Growth']],
  ];
  for (let index = 0; index < posts.length; index += 1) {
    const [title, categoryName, postTags] = posts[index];
    const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const post = await prisma.blogPost.upsert({ where: { slug }, update: {}, create: {
      title: String(title), slug, content: `<p>${String(title)} is a practical starting point for teams building durable digital systems.</p>`, excerpt: `A practical perspective on ${String(title).toLowerCase()}.`, status: 'published', publishedAt: new Date(), sortOrder: index + 1, categoryId: blogCategories.find((category) => category.name === categoryName)?.id,
    } });
    await prisma.blogPostTag.createMany({ data: (postTags as string[]).map((name) => ({ postId: post.id, tagId: tags.find((tag) => tag.name === name)!.id })), skipDuplicates: true });
  }
  console.log('Blog content seeded.');

  // Pricing Categories
  const startupBundles = await prisma.pricingCategory.upsert({
    where: { slug: 'startup-bundles' },
    update: { name: 'Startup Bundles', description: 'All-in-one packages for launching and growing your business.', icon: 'rocket', sortOrder: 1, isActive: true },
    create: { slug: 'startup-bundles', name: 'Startup Bundles', description: 'All-in-one packages for launching and growing your business.', icon: 'rocket', sortOrder: 1, isActive: true },
  });
  const hostingCategory = await prisma.pricingCategory.upsert({
    where: { slug: 'hosting-plans' },
    update: { name: 'Hosting Plans', description: 'Fast, reliable website hosting for every business.', icon: 'server', sortOrder: 2, isActive: true },
    create: { slug: 'hosting-plans', name: 'Hosting Plans', description: 'Fast, reliable website hosting for every business.', icon: 'server', sortOrder: 2, isActive: true },
  });
  const customServices = await prisma.pricingCategory.upsert({
    where: { slug: 'custom-services' },
    update: { name: 'Custom Services', description: 'Standalone design and marketing services.', icon: 'wrench', sortOrder: 3, isActive: true },
    create: { slug: 'custom-services', name: 'Custom Services', description: 'Standalone design and marketing services.', icon: 'wrench', sortOrder: 3, isActive: true },
  });

  // Pricing Plans
  const pricingPlans = [
    { slug: 'launch', name: 'Launch', description: 'For Startups & Small Businesses', price: 1500000, currency: 'TZS', period: 'one-time', features: ['Logo & Brand Identity', '5-Page Website', 'Social Media Setup', 'Basic SEO', '3 Months Support'], isPopular: false, isActive: true, sortOrder: 1, categoryId: startupBundles.id },
    { slug: 'grow', name: 'Grow', description: 'For Growing Companies', price: 5000000, currency: 'TZS', period: 'one-time', features: ['Everything in Launch', '10-Page Website', 'E-Commerce', 'Advanced SEO', '6 Months Support'], isPopular: true, isActive: true, sortOrder: 2, categoryId: startupBundles.id },
    { slug: 'starter', name: 'Starter', description: 'For personal websites', price: 300000, currency: 'TZS', period: 'year', features: ['1 Website', '10GB Storage', 'SSL', 'Email Support'], isPopular: false, isActive: true, sortOrder: 1, categoryId: hostingCategory.id },
    { slug: 'business', name: 'Business', description: 'For growing businesses', price: 800000, currency: 'TZS', period: 'year', features: ['5 Websites', '50GB Storage', 'SSL', 'Priority Support', 'Daily Backups'], isPopular: true, isActive: true, sortOrder: 2, categoryId: hostingCategory.id },
    { slug: 'ecommerce', name: 'Ecommerce', description: 'For online stores', price: 1500000, currency: 'TZS', period: 'year', features: ['10 Websites', '100GB Storage', 'SSL', '24/7 Support', 'CDN'], isPopular: false, isActive: true, sortOrder: 3, categoryId: hostingCategory.id },
    { slug: 'logo-design', name: 'Logo Design', description: 'A memorable logo for your brand', price: 200000, currency: 'TZS', period: 'one-time', features: ['3 Concepts', 'Unlimited Revisions', 'Source Files'], isPopular: false, isActive: true, sortOrder: 1, categoryId: customServices.id },
    { slug: 'landing-page', name: 'Landing Page', description: 'A high-converting single page', price: 500000, currency: 'TZS', period: 'one-time', features: ['Custom Design', 'Mobile Responsive', 'SEO Ready'], isPopular: false, isActive: true, sortOrder: 2, categoryId: customServices.id },
  ];
  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  }
  console.log('Pricing categories and plans seeded.');

  await prisma.setting.upsert({
    where: { key: 'company_name' },
    update: {},
    create: { key: 'company_name', value: 'CadorDigital' },
  });
  console.log('Settings seeded.');

  console.log('Seed complete!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });