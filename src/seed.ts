import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
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

  const products = [
    { slug: 'company-profile-template', name: 'Company Profile Template', description: 'A polished company profile template for growing businesses.', category: 'Templates', price: 50000, currency: 'TZS', sortOrder: 1 },
    { slug: 'digital-marketing-guide', name: 'Digital Marketing Guide', description: 'A practical guide to building a measurable digital marketing system.', category: 'Guides', price: 30000, currency: 'TZS', sortOrder: 2 },
    { slug: 'business-proposal-pack', name: 'Business Proposal Pack', description: 'Reusable proposal layouts for professional client presentations.', category: 'Templates', price: 45000, currency: 'TZS', sortOrder: 3 },
  ];
  for (const product of products) await prisma.storeProduct.upsert({ where: { slug: product.slug }, update: product, create: product });
  console.log('Store products seeded.');

  const courses = [
    { slug: 'digital-marketing-foundations', title: 'Digital Marketing Foundations', description: 'Learn the essential channels, planning, and measurement for digital growth.', instructor: 'CadorDigital Academy', price: 150000, currency: 'TZS', sortOrder: 1, isActive: true },
    { slug: 'website-planning-for-business', title: 'Website Planning for Business', description: 'Turn business goals into a clear, useful website plan.', instructor: 'CadorDigital Academy', price: 100000, currency: 'TZS', sortOrder: 2, isActive: true },
    { slug: 'brand-strategy-essentials', title: 'Brand Strategy Essentials', description: 'Build a distinctive brand foundation customers can remember.', instructor: 'CadorDigital Academy', price: null, currency: 'TZS', sortOrder: 3, isActive: true },
  ];
  for (const course of courses) {
    const saved = await prisma.course.upsert({ where: { slug: course.slug }, update: course, create: course });
    await prisma.courseLesson.createMany({ data: [
      { courseId: saved.id, title: 'Introduction and outcomes', description: 'Understand the goals for this course.', sortOrder: 1 },
      { courseId: saved.id, title: 'Putting the framework into practice', description: 'Apply the framework to a real business scenario.', sortOrder: 2 },
    ], skipDuplicates: true });
  }
  console.log('Academy courses seeded.');

  const blogCategories = await Promise.all(['Marketing', 'Technology', 'Business'].map((name) => prisma.blogCategory.upsert({ where: { slug: name.toLowerCase() }, update: {}, create: { name, slug: name.toLowerCase() } })));
  const tagNames = ['Strategy', 'Growth', 'Technology', 'Branding', 'Tanzania'];
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

  // Pricing Plans (Startup Bundles)
  const pricingPlans = [
    {
      slug: 'launch',
      name: 'Launch',
      tagline: 'For Startups & Small Businesses',
      price: 1500000,
      currency: 'TZS',
      features: ['Logo & Brand Identity', '5-Page Website', 'Social Media Setup', 'Basic SEO', 'Business Email Setup', '3 Months Support'],
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: 'grow',
      name: 'Grow',
      tagline: 'For Growing Companies',
      price: 5000000,
      currency: 'TZS',
      features: ['Everything in Launch', '10-Page Website', 'E-Commerce Integration', 'Social Media Management', 'Advanced SEO', 'Content Marketing', 'Email Marketing Setup', '6 Months Support'],
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: 'dominate',
      name: 'Dominate',
      tagline: 'For Enterprises',
      price: 12000000,
      currency: 'TZS',
      features: ['Everything in Grow', 'Custom Web Application', 'AI Chatbot', 'Full Marketing Suite', 'CRM Integration', 'Analytics Dashboard', 'Priority Support', '12 Months Support'],
      isPopular: false,
      isActive: true,
      sortOrder: 3,
    },
  ];
  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({ where: { slug: plan.slug }, update: {}, create: plan });
  }
  console.log('Pricing plans seeded.');

  // Hosting Plans
  const hostingPlans = [
    {
      slug: 'starter',
      name: 'Starter',
      description: 'For personal websites',
      price: 300000,
      currency: 'TZS',
      billingPeriod: 'yearly',
      features: ['1 Website', '10GB Storage', '50GB Bandwidth', 'SSL Certificate', 'Email Support'],
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: 'business',
      name: 'Business',
      description: 'For growing businesses',
      price: 800000,
      currency: 'TZS',
      billingPeriod: 'yearly',
      features: ['5 Websites', '50GB Storage', '200GB Bandwidth', 'SSL Certificate', 'Priority Support', 'Daily Backups'],
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: 'ecommerce',
      name: 'Ecommerce',
      description: 'For online stores',
      price: 1500000,
      currency: 'TZS',
      billingPeriod: 'yearly',
      features: ['10 Websites', '100GB Storage', '500GB Bandwidth', 'SSL Certificate', '24/7 Support', 'Daily Backups', 'CDN Included'],
      isPopular: false,
      isActive: true,
      sortOrder: 3,
    },
  ];
  for (const plan of hostingPlans) {
    await prisma.hostingPlan.upsert({ where: { slug: plan.slug }, update: {}, create: plan });
  }
  console.log('Hosting plans seeded.');

  // Custom Services
  const customServices = [
    { slug: 'logo-design', name: 'Logo Design', price: 200000, currency: 'TZS', icon: 'palette', sortOrder: 1, isActive: true },
    { slug: 'landing-page', name: 'Landing Page', price: 500000, currency: 'TZS', icon: 'globe', sortOrder: 2, isActive: true },
    { slug: 'brand-guidelines', name: 'Brand Guidelines', price: 400000, currency: 'TZS', icon: 'palette', sortOrder: 3, isActive: true },
    { slug: 'seo-audit', name: 'SEO Audit', price: 300000, currency: 'TZS', icon: 'bar-chart', sortOrder: 4, isActive: true },
    { slug: 'social-media-graphics', name: 'Social Media Graphics', price: 150000, currency: 'TZS', icon: 'megaphone', sortOrder: 5, isActive: true },
    { slug: 'business-card-design', name: 'Business Card Design', price: 80000, currency: 'TZS', icon: 'briefcase', sortOrder: 6, isActive: true },
    { slug: 'company-profile', name: 'Company Profile', price: 250000, currency: 'TZS', icon: 'building', sortOrder: 7, isActive: true },
    { slug: 'email-signature', name: 'Email Signature', price: 50000, currency: 'TZS', icon: 'code', sortOrder: 8, isActive: true },
  ];
  for (const svc of customServices) {
    await prisma.customService.upsert({ where: { slug: svc.slug }, update: {}, create: svc });
  }
  console.log('Custom services seeded.');

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