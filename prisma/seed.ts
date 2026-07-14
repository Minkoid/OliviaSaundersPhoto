/**
 * Development seed data.
 *
 * Creates: one administrator, two clients, several public portfolios with
 * images, two active client galleries, one expired gallery, sample favourites
 * and sample enquiries. Photographs use the generated placeholder plates in
 * /public/placeholders (original, non-copyrighted gradient studies).
 *
 * Requires a running database and (for images) a working storage driver. With
 * STORAGE_DRIVER=local, image variants are written to ./storage.
 *
 * Run: `npm run db:seed`  (after `npm run prisma:migrate`)
 */
import { PrismaClient, type User } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { hashPassword } from '../src/lib/auth/password';
import { ingestImage } from '../src/lib/images/ingest';

const prisma = new PrismaClient();

const PLACEHOLDER_DIR = path.resolve(process.cwd(), 'public/placeholders');

async function ingestPlate(
  plate: string,
  displayName: string,
  visibility: 'PUBLIC' | 'PRIVATE',
  watermark = false,
) {
  const buffer = await fs.readFile(path.join(PLACEHOLDER_DIR, `${plate}.jpg`));
  return ingestImage({
    buffer,
    filename: `${displayName}.jpg`,
    mimeType: 'image/jpeg',
    visibility,
    altText: displayName,
    watermark,
    watermarkText: 'Olivia Saunders',
  });
}

async function main() {
  console.log('Seeding database…');

  // --- Site settings & page content ---
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      studioName: 'Olivia Saunders',
      tagline: 'Photography with quiet permanence',
      contactEmail: 'studio@example.com', // REPLACE: real studio email
      areasServed: 'The Cotswolds, Oxfordshire and throughout the United Kingdom, by arrangement.',
      responseTime: 'Enquiries are answered personally, usually within two working days.',
      studioLocation: 'By appointment — the Cotswolds',
      footerText: 'Unhurried, considered photography for weddings, family and country life.',
      seoTitle: 'Olivia Saunders — Photography',
      seoDescription:
        'A photographer working across weddings, portraiture and country life with a restrained, editorial eye.',
    },
  });

  // --- Admin ---
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!Admin123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', isActive: true },
    create: {
      email: adminEmail,
      name: 'Olivia Saunders',
      role: 'ADMIN',
      isActive: true,
      passwordHash: await hashPassword(adminPassword),
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Admin: ${adminEmail}`);

  // --- Clients ---
  const clientPassword = process.env.SEED_CLIENT_PASSWORD ?? 'ChangeMe!Client123';
  const clientHash = await hashPassword(clientPassword);
  const clientsData = [
    { email: 'eleanor@example.com', displayName: 'Eleanor & James' },
    { email: 'thefosters@example.com', displayName: 'The Foster Family' },
  ];
  const clients: User[] = [];
  for (const c of clientsData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.displayName,
        role: 'CLIENT',
        isActive: true,
        passwordHash: clientHash,
        emailVerified: new Date(),
        clientProfile: { create: { displayName: c.displayName } },
      },
    });
    clients.push(user);
    console.log(`  ✓ Client: ${c.email}`);
  }

  // --- Portfolios ---
  const existingPortfolios = await prisma.portfolio.count();
  if (existingPortfolios === 0) {
    const portfolioDefs = [
      { slug: 'weddings', title: 'Weddings', category: 'Weddings', plate: 'weddings', intro: 'Unhurried celebrations, photographed with warmth and discretion.' },
      { slug: 'portraits', title: 'Portraits', category: 'Portraits', plate: 'portraits', intro: 'Considered portraiture that feels honest and quietly timeless.' },
      { slug: 'families', title: 'Families', category: 'Families', plate: 'families', intro: 'The small, unrepeatable moments that make a family its own.' },
      { slug: 'country-life', title: 'Country Life', category: 'Country life', plate: 'country-life', intro: 'Estates, gardens and the rhythms of the countryside.' },
    ];
    const platePool = ['feature-1', 'feature-2', 'feature-3', 'gallery-1', 'gallery-2', 'gallery-3'];

    let sortOrder = 0;
    for (const def of portfolioDefs) {
      const portfolio = await prisma.portfolio.create({
        data: {
          slug: def.slug,
          title: def.title,
          category: def.category,
          intro: def.intro,
          description:
            'A short editorial introduction to this collection. Replace with a few considered sentences about the work.',
          isPublished: true,
          sortOrder: sortOrder++,
        },
      });

      const coverAsset = await ingestPlate(def.plate, `${def.title} cover`, 'PUBLIC');
      const cover = await prisma.portfolioImage.create({
        data: { portfolioId: portfolio.id, assetId: coverAsset.id, sortOrder: 0, isFeatured: true, layoutHint: 'full' },
      });
      await prisma.portfolio.update({ where: { id: portfolio.id }, data: { coverImageId: cover.id } });

      for (let i = 0; i < 4; i += 1) {
        const plate = platePool[i % platePool.length]!;
        const asset = await ingestPlate(plate, `${def.title} ${i + 1}`, 'PUBLIC');
        await prisma.portfolioImage.create({
          data: {
            portfolioId: portfolio.id,
            assetId: asset.id,
            sortOrder: i + 1,
            layoutHint: ['standard', 'wide', 'tall', 'standard'][i % 4],
            isFeatured: i === 0,
          },
        });
      }
      console.log(`  ✓ Portfolio: ${def.title} (5 images)`);
    }
  } else {
    console.log('  • Portfolios already present — skipping');
  }

  // --- Galleries ---
  const existingGalleries = await prisma.gallery.count();
  if (existingGalleries === 0) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    async function makeGallery(opts: {
      slug: string;
      title: string;
      clientName: string;
      client: (typeof clients)[number];
      expiresAt: Date | null;
      allowDownloads: boolean;
      plates: string[];
    }) {
      const gallery = await prisma.gallery.create({
        data: {
          slug: opts.slug,
          title: opts.title,
          clientName: opts.clientName,
          shootDate: new Date(now - 30 * day),
          message: 'It was such a joy to photograph your day. Here are your images — do take your time.',
          expiresAt: opts.expiresAt,
          isPublished: true,
          allowImageDownload: opts.allowDownloads,
          allowGalleryDownload: opts.allowDownloads,
          allowFullResolution: opts.allowDownloads,
          showImageNumbers: true,
        },
      });
      await prisma.galleryAccess.create({ data: { galleryId: gallery.id, userId: opts.client.id } });

      const imageIds: string[] = [];
      for (let i = 0; i < opts.plates.length; i += 1) {
        const asset = await ingestPlate(opts.plates[i]!, `${opts.title} ${i + 1}`, 'PRIVATE');
        const gi = await prisma.galleryImage.create({
          data: { galleryId: gallery.id, assetId: asset.id, sortOrder: i },
        });
        imageIds.push(gi.id);
      }
      const firstImageId = imageIds[0];
      if (firstImageId) {
        await prisma.gallery.update({ where: { id: gallery.id }, data: { coverImageId: firstImageId } });
      }
      return { gallery, imageIds };
    }

    const g1 = await makeGallery({
      slug: 'eleanor-and-james',
      title: 'Eleanor & James',
      clientName: 'Eleanor & James',
      client: clients[0]!,
      expiresAt: new Date(now + 60 * day),
      allowDownloads: true,
      plates: ['gallery-1', 'gallery-2', 'gallery-3', 'feature-2', 'feature-1'],
    });
    console.log('  ✓ Active gallery: Eleanor & James');

    await makeGallery({
      slug: 'the-foster-family',
      title: 'The Foster Family',
      clientName: 'The Foster Family',
      client: clients[1]!,
      expiresAt: new Date(now + 20 * day),
      allowDownloads: false,
      plates: ['families', 'feature-3', 'gallery-2', 'gallery-1'],
    });
    console.log('  ✓ Active gallery: The Foster Family');

    await makeGallery({
      slug: 'summer-garden-party',
      title: 'Summer Garden Party',
      clientName: 'Eleanor & James',
      client: clients[0]!,
      expiresAt: new Date(now - 5 * day), // expired
      allowDownloads: true,
      plates: ['events', 'country-life', 'gallery-3'],
    });
    console.log('  ✓ Expired gallery: Summer Garden Party');

    // Sample favourites for the first client on the first gallery.
    for (const gid of g1.imageIds.slice(0, 2)) {
      await prisma.favourite.create({
        data: { userId: clients[0]!.id, galleryId: g1.gallery.id, galleryImageId: gid },
      });
    }
    console.log('  ✓ Sample favourites');
  } else {
    console.log('  • Galleries already present — skipping');
  }

  // --- Enquiries ---
  if ((await prisma.enquiry.count()) === 0) {
    await prisma.enquiry.createMany({
      data: [
        {
          name: 'Charlotte Hemsworth',
          email: 'charlotte@example.com',
          type: 'WEDDING',
          message: 'We are marrying next summer at a country house and would love to talk about coverage.',
          status: 'NEW',
        },
        {
          name: 'The Ashby Family',
          email: 'ashby@example.com',
          type: 'FAMILY',
          message: 'We would love an autumn family session outdoors, if you have availability.',
          status: 'READ',
        },
      ],
    });
    console.log('  ✓ Sample enquiries');
  }

  console.log('\nSeed complete.');
  console.log(`  Admin login:  ${adminEmail} / ${adminPassword}`);
  console.log(`  Client login: ${clientsData[0]!.email} / ${clientPassword}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
