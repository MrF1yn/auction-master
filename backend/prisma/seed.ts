// ==============================|| DATABASE SEED SCRIPT ||============================== //
// Seeds the database with demo auction data

import { PrismaClient, AuctionItemStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prismaClient = new PrismaClient();

async function hashPasswordForSeed(plainTextPassword: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainTextPassword, saltRounds);
}

async function seedDatabaseWithDemoData(): Promise<void> {
  console.log('Starting database seed...');

  // ==============================|| CREATE DEMO USERS ||============================== //

  const demoUserPassword = await hashPasswordForSeed('Password123');

  const demoUser1 = await prismaClient.user.upsert({
    where: { emailAddress: 'john@example.com' },
    update: {},
    create: {
      emailAddress: 'john@example.com',
      username: 'johndoe',
      fullName: 'John Doe',
      hashedPassword: demoUserPassword,
      isAccountActive: true,
      isEmailVerified: true
    }
  });

  const demoUser2 = await prismaClient.user.upsert({
    where: { emailAddress: 'jane@example.com' },
    update: {},
    create: {
      emailAddress: 'jane@example.com',
      username: 'janesmith',
      fullName: 'Jane Smith',
      hashedPassword: demoUserPassword,
      isAccountActive: true,
      isEmailVerified: true
    }
  });

  const demoUser3 = await prismaClient.user.upsert({
    where: { emailAddress: 'demo@auction.com' },
    update: {},
    create: {
      emailAddress: 'demo@auction.com',
      username: 'demo',
      fullName: 'Demo User',
      hashedPassword: demoUserPassword,
      isAccountActive: true,
      isEmailVerified: true
    }
  });

  console.log('Created demo users:', [demoUser1.username, demoUser2.username, demoUser3.username]);

  // ==============================|| CREATE DEMO AUCTION ITEMS ||============================== //

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const auctionItems = [
    {
      itemTitle: 'Vintage Rolex Submariner Watch',
      itemDescription:
        "Beautiful vintage Rolex Submariner from 1985. Excellent condition with original box and papers. A true collector's item.",
      startingPriceInDollars: 5000,
      currentHighestBidInDollars: 5000,
      minimumBidIncrementInDollars: 100,
      auctionStartTimeTimestamp: now,
      auctionEndTimeTimestamp: oneHourFromNow,
      itemImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      creatorUserId: demoUser1.id
    },
    {
      itemTitle: 'MacBook Pro 16" M3 Max',
      itemDescription: 'Brand new Apple MacBook Pro 16-inch with M3 Max chip, 64GB RAM, 1TB SSD. Still sealed in original packaging.',
      startingPriceInDollars: 2500,
      currentHighestBidInDollars: 2500,
      minimumBidIncrementInDollars: 50,
      auctionStartTimeTimestamp: now,
      auctionEndTimeTimestamp: twoHoursFromNow,
      itemImageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      creatorUserId: demoUser2.id
    },
    {
      itemTitle: 'Original Oil Painting - Sunset',
      itemDescription: 'Original oil painting by emerging artist. 24x36 inches on canvas. Stunning sunset landscape with vibrant colors.',
      startingPriceInDollars: 500,
      currentHighestBidInDollars: 500,
      minimumBidIncrementInDollars: 25,
      auctionStartTimeTimestamp: now,
      auctionEndTimeTimestamp: sixHoursFromNow,
      itemImageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800',
      creatorUserId: demoUser1.id
    },
    {
      itemTitle: 'Rare First Edition Book Collection',
      itemDescription: 'Collection of 5 rare first edition books from the 1920s. Includes works by Hemingway, Fitzgerald, and Faulkner.',
      startingPriceInDollars: 3000,
      currentHighestBidInDollars: 3000,
      minimumBidIncrementInDollars: 150,
      auctionStartTimeTimestamp: now,
      auctionEndTimeTimestamp: oneDayFromNow,
      itemImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
      creatorUserId: demoUser2.id
    },
    {
      itemTitle: 'Antique Persian Rug',
      itemDescription:
        'Hand-woven Persian rug from the early 1900s. 8x10 feet. Excellent condition with rich colors and intricate patterns.',
      startingPriceInDollars: 8000,
      currentHighestBidInDollars: 8000,
      minimumBidIncrementInDollars: 200,
      auctionStartTimeTimestamp: now,
      auctionEndTimeTimestamp: threeDaysFromNow,
      itemImageUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800',
      creatorUserId: demoUser1.id
    },
    {
      itemTitle: 'Signed Sports Memorabilia',
      itemDescription: 'Authentic signed basketball by Michael Jordan with certificate of authenticity. Perfect for any sports collector.',
      startingPriceInDollars: 1500,
      currentHighestBidInDollars: 1500,
      minimumBidIncrementInDollars: 50,
      auctionStartTimeTimestamp: now,
      auctionEndTimeTimestamp: twoHoursFromNow,
      itemImageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      creatorUserId: demoUser2.id
    }
  ];

  for (const auctionData of auctionItems) {
    const existingAuction = await prismaClient.auctionItem.findFirst({
      where: { itemTitle: auctionData.itemTitle }
    });

    if (!existingAuction) {
      await prismaClient.auctionItem.create({
        data: {
          ...auctionData,
          currentStatus: AuctionItemStatus.ACTIVE
        }
      });
      console.log(`Created auction: ${auctionData.itemTitle}`);
    } else {
      console.log(`Auction already exists: ${auctionData.itemTitle}`);
    }
  }

  console.log('Database seed completed successfully!');
  console.log('');
  console.log('Demo Login Credentials:');
  console.log('========================');
  console.log('Email: demo@auction.com');
  console.log('Password: Password123');
  console.log('');
}

seedDatabaseWithDemoData()
  .then(async () => {
    await prismaClient.$disconnect();
  })
  .catch(async (error) => {
    console.error('Error seeding database:', error);
    await prismaClient.$disconnect();
    process.exit(1);
  });
