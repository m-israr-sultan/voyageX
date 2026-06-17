import { PrismaClient, Region, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();
  const adminPass = await bcrypt.hash('Admin123!', 10);

  await prisma.users.upsert({
    where: { email: 'admin@voyagex.com' },
    update: {},
    create: {
      id: randomUUID(),
      updatedAt: now,
      email: 'admin@voyagex.com',
      password: adminPass,
      firstName: 'VoyageX',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isEmailVerified: true
    }
  });

  const guide1User = await prisma.users.create({
    data: {
      id: randomUUID(),
      updatedAt: now,
      email: 'guide.hunza@voyagex.com',
      password: await bcrypt.hash('Guide123!', 10),
      firstName: 'Ali',
      lastName: 'Hunza',
      role: UserRole.GUIDE,
      guides: {
        create: {
          id: randomUUID(),
          updatedAt: now,
          slug: 'ali-hunza',
          bio: 'Local mountain guide in Hunza',
          languages: ['English', 'Urdu'],
          specialities: ['Trekking', 'Culture'],
          location: 'Hunza',
          region: Region.HUNZA,
          isVerified: true
        }
      }
    }
  });

  const guide2User = await prisma.users.create({
    data: {
      id: randomUUID(),
      updatedAt: now,
      email: 'guide.skardu@voyagex.com',
      password: await bcrypt.hash('Guide123!', 10),
      firstName: 'Hassan',
      lastName: 'Skardu',
      role: UserRole.GUIDE,
      guides: {
        create: {
          id: randomUUID(),
          updatedAt: now,
          slug: 'hassan-skardu',
          bio: 'Adventure guide from Skardu',
          languages: ['English', 'Urdu'],
          specialities: ['Camping', 'Hiking'],
          location: 'Skardu',
          region: Region.SKARDU,
          isVerified: true
        }
      }
    }
  });

  const agencyUser = await prisma.users.create({
    data: {
      id: randomUUID(),
      updatedAt: now,
      email: 'agency.lhr@voyagex.com',
      password: await bcrypt.hash('Agency123!', 10),
      firstName: 'Lahore',
      lastName: 'Travel Co',
      role: UserRole.AGENCY,
      agencies: {
        create: {
          id: randomUUID(),
          updatedAt: now,
          slug: 'lahore-travel-co',
          name: 'Lahore Travel Co',
          city: 'Lahore',
          country: 'Pakistan',
          isVerified: true
        }
      }
    }
  });

  const hunza = await prisma.destinations.create({
    data: {
      id: randomUUID(),
      updatedAt: now,
      name: 'Hunza Valley',
      slug: 'hunza-valley',
      city: 'Hunza',
      country: 'Pakistan',
      region: Region.HUNZA,
      description: 'High mountain valley with views and culture'
    }
  });
  const swat = await prisma.destinations.create({
    data: {
      id: randomUUID(),
      updatedAt: now,
      name: 'Swat Valley',
      slug: 'swat-valley',
      city: 'Swat',
      country: 'Pakistan',
      region: Region.SWAT,
      description: 'Lush valley with rivers and meadows'
    }
  });
  const skardu = await prisma.destinations.create({
    data: {
      id: randomUUID(),
      updatedAt: now,
      name: 'Skardu',
      slug: 'skardu',
      city: 'Skardu',
      country: 'Pakistan',
      region: Region.SKARDU,
      description: 'Gateway to Karakoram adventures'
    }
  });

  const guide1 = await prisma.guides.findUniqueOrThrow({
    where: { userId: guide1User.id }
  });
  const agency = await prisma.agencies.findUniqueOrThrow({
    where: { userId: agencyUser.id }
  });

  await prisma.packages.createMany({
    data: [
      {
        id: randomUUID(),
        updatedAt: now,
        title: 'Hunza Explorer',
        slug: 'hunza-explorer',
        description: '5-day tour of Hunza highlights',
        price: 50000,
        duration: 5,
        maxGroupSize: 8,
        images: [],
        includes: ['Transport', 'Hotel'],
        excludes: ['Personal expenses'],
        destinationId: hunza.id,
        guideId: guide1.id
      },
      {
        id: randomUUID(),
        updatedAt: now,
        title: 'Skardu Premium Escape',
        slug: 'skardu-premium-escape',
        description: '6-day premium Skardu adventure',
        price: 85000,
        duration: 6,
        maxGroupSize: 10,
        images: [],
        includes: ['Transport', 'Hotel', 'Guide'],
        excludes: ['Flights'],
        destinationId: skardu.id,
        agencyId: agency.id
      }
    ]
  });

  console.log('Seed complete', { swat: swat.id, guide2: guide2User.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });