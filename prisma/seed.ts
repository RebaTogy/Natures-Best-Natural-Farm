import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Cleaning database...");
  await prisma.fileUpload.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.tracking.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.address.deleteMany();
  await prisma.review.deleteMany();
  await prisma.regionPrice.deleteMany();
  await prisma.analyticsLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.preBooking.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.traceabilityStage.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.bulkRequest.deleteMany();
  await prisma.product.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding Users...");
  await prisma.user.create({
    data: {
      name: "Farm Administrator",
      email: "admin@naturesbestfarm.com",
      passwordHash: hashPassword("Admin@12345"),
      role: "ADMIN",
    },
  });

  console.log("Seeding Farmers...");
  const farmer1 = await prisma.farmer.create({
    data: {
      name: "Liam O'Connor",
      location: "Willow Creek Valley, OR",
      story: "Third-generation grain farmer Liam O'Connor manages 450 acres of organic heritage wheat. Willow Creek Farm is dedicated to regenerative agricultural practices, maintaining windbreaks, and ensuring crop rotation that enriches the soil naturally without chemical fertilizers. Liam believes that premium bread starts with a healthy soil biome.",
      mediaUrls: "/images/farmer_liam_1.jpg,/images/farmer_liam_2.jpg",
      avatarUrl: "/images/avatar_liam.jpg",
    },
  });

  const farmer2 = await prisma.farmer.create({
    data: {
      name: "Elena Rostova",
      location: "Cascade Foothills, WA",
      story: "Elena operates a high-altitude apiary nestled near wild lavender fields and fir forests in Washington. By prioritizing hive health and avoiding antibiotics, her bees produce honey with a highly complex floral profile. Each season's harvest is rare, raw, and single-origin.",
      mediaUrls: "/images/farmer_elena_1.jpg,/images/farmer_elena_2.jpg",
      avatarUrl: "/images/avatar_elena.jpg",
    },
  });

  const farmer3 = await prisma.farmer.create({
    data: {
      name: "Marcus Vance",
      location: "Snake River Basin, ID",
      story: "Marcus focuses on mineral-dense, organic root vegetables. His sandy-loam fields receive pure mountain run-off, which gives his rainbow carrots and beets a unique natural sweetness. Every single harvest is manually sorted to ensure only the highest grade crops make it to kitchens.",
      mediaUrls: "/images/farmer_marcus_1.jpg,/images/farmer_marcus_2.jpg",
      avatarUrl: "/images/avatar_marcus.jpg",
    },
  });

  console.log("Seeding Products...");
  const product1 = await prisma.product.create({
    data: {
      name: "Heritage Spelt Grain",
      description: "An ancient grain variety with a deep nutty flavor and high solubility, making it exceptionally easy to digest. Perfect for artisan baking, sourdoughs, and ancient grain porridges. Grown organically on wind-sheltered fields.",
      category: "Grains",
      farmerId: farmer1.id,
      mediaUrls: "/images/product_spelt_1.jpg,/images/product_spelt_2.jpg",
      videoUrl: "/videos/wheat_harvest.mp4",
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Wild Lavender Raw Honey",
      description: "100% raw, cold-extracted honey collected by bees foraging in high-altitude wild lavender fields. It has a light amber color, smooth creaminess, and a distinct herbal-sweet finish. Never heated or ultra-filtered.",
      category: "Honey",
      farmerId: farmer2.id,
      mediaUrls: "/images/product_honey_1.jpg,/images/product_honey_2.jpg",
      videoUrl: "/videos/honey_bees.mp4",
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "Earthy Heirloom Rainbow Carrots",
      description: "A mixture of purple, yellow, orange, and white heirloom carrot varieties. Grown in deep sandy soils that allow them to develop perfectly straight and crisp. Exceptionally sweet, packed with beta-carotene and minerals.",
      category: "Vegetables",
      farmerId: farmer3.id,
      mediaUrls: "/images/product_carrots_1.jpg,/images/product_carrots_2.jpg",
      videoUrl: "/videos/carrots_harvest.mp4",
    },
  });

  console.log("Seeding Reviews & Regional Pricing...");
  await prisma.review.createMany({
    data: [
      {
        productId: product1.id,
        rating: 5,
        authorName: "Maya T.",
        comment: "The spelt was beautifully clean and the batch trace made it easy to plan bakery production.",
      },
      {
        productId: product2.id,
        rating: 5,
        authorName: "Jordan P.",
        comment: "Deep floral notes and excellent packaging. The source story gave our tasting menu real context.",
      },
      {
        productId: product3.id,
        rating: 4,
        authorName: "Priya S.",
        comment: "Crisp, colorful, and noticeably fresher than commodity carrots.",
      },
    ],
  });

  for (const product of [product1, product2, product3]) {
    await prisma.regionPrice.createMany({
      data: [
        { productId: product.id, region: "US", currency: "USD", multiplier: 1, deliveryDaysMin: 3, deliveryDaysMax: 5 },
        { productId: product.id, region: "IN", currency: "INR", multiplier: 83, deliveryDaysMin: 5, deliveryDaysMax: 8 },
      ],
    });
  }

  console.log("Seeding Batches & Traceability Stages...");
  
  // 1. Spelt Wheat Batches
  // Retail Batch
  const now = new Date();
  const dateG1 = new Date();
  dateG1.setDate(now.getDate() - 10);
  const batchG1 = await prisma.batch.create({
    data: {
      productId: product1.id,
      harvestDate: dateG1,
      totalQuantity: 1000,
      remainingQuantity: 140, // Trigger scarcity!
      price: 6.50,
      status: "AVAILABLE",
      isFuture: false,
    },
  });

  // Traceability for G1 (Retail, Harvested)
  await prisma.traceabilityStage.createMany({
    data: [
      {
        batchId: batchG1.id,
        stageOrder: 1,
        stageName: "Soil Preparation & Seeding",
        status: "COMPLETED",
        description: "Soil tested for organic carbon levels. Seeds sown at a depth of 3cm. Nutrients supplemented with natural compost.",
        location: "Willow Creek Field #4",
        date: new Date(dateG1.getTime() - 240 * 24 * 60 * 60 * 1000), // 240 days ago
      },
      {
        batchId: batchG1.id,
        stageOrder: 2,
        stageName: "Organic Harvesting",
        status: "COMPLETED",
        description: "Combine harvested at a moisture content of 13.5% to ensure longevity. Grains immediately transferred to wood-lined bins.",
        location: "Willow Creek Field #4",
        date: dateG1,
      },
      {
        batchId: batchG1.id,
        stageOrder: 3,
        stageName: "Purity & Quality Testing",
        status: "COMPLETED",
        description: "Certified pesticide-free. Gluten structure tested (12.4% protein content). Germination viability at 98.6%.",
        location: "Cascade Lab Services, Bend, OR",
        date: new Date(dateG1.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchG1.id,
        stageOrder: 4,
        stageName: "Stone Milling & Packaging",
        status: "COMPLETED",
        description: "Grains stone-milled at low temperature to retain nutrients. Packed in unbleached paper bags with PLA compostable liners.",
        location: "Willow Creek On-Farm Mill",
        date: new Date(dateG1.getTime() + 4 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchG1.id,
        stageOrder: 5,
        stageName: "Shipping & Cold Chain Logistics",
        status: "ACTIVE",
        description: "Dispatched from farm in temperature-controlled trucks (maintained at 18°C / 60% relative humidity to preserve freshness).",
        location: "En route to Distribution Hub",
        date: new Date(dateG1.getTime() + 8 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Pre-Book Batch
  const dateG2 = new Date();
  dateG2.setDate(now.getDate() + 40);
  const batchG2 = await prisma.batch.create({
    data: {
      productId: product1.id,
      harvestDate: dateG2,
      totalQuantity: 2500,
      remainingQuantity: 1850,
      price: 5.20, // Discounted for pre-book
      status: "PREBOOK",
      isFuture: true,
    },
  });

  // Traceability for G2 (Pre-book, Future Harvest)
  await prisma.traceabilityStage.createMany({
    data: [
      {
        batchId: batchG2.id,
        stageOrder: 1,
        stageName: "Seed Selection & Verification",
        status: "COMPLETED",
        description: "Selected non-hybrid heritage Spelt seeds. Certified organic origins verified.",
        location: "Willow Creek Seed Vault",
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchG2.id,
        stageOrder: 2,
        stageName: "Crop Development & Watering",
        status: "ACTIVE",
        description: "Currently in vegetative growth phase. Watered using pure natural well springs. Weed control conducted manually.",
        location: "Willow Creek Field #7",
        date: now,
      },
      {
        batchId: batchG2.id,
        stageOrder: 3,
        stageName: "Pre-Harvest Inspection",
        status: "LOCKED",
        description: "Awaiting crop maturation. Inspection planned for spikelet size, density, and moisture validation.",
        location: "Willow Creek Field #7",
      },
      {
        batchId: batchG2.id,
        stageOrder: 4,
        stageName: "Harvesting & Sorting",
        status: "LOCKED",
        description: "Harvesting will take place once grains reach perfect gold coloration.",
        location: "Willow Creek Field #7",
      },
    ],
  });

  // 2. Raw Honey Batches
  // Retail Batch
  const dateH1 = new Date();
  dateH1.setDate(now.getDate() - 15);
  const batchH1 = await prisma.batch.create({
    data: {
      productId: product2.id,
      harvestDate: dateH1,
      totalQuantity: 150,
      remainingQuantity: 12, // Critical Scarcity!
      price: 18.00,
      status: "AVAILABLE",
      isFuture: false,
    },
  });

  // Traceability for H1 (Honey, Retail)
  await prisma.traceabilityStage.createMany({
    data: [
      {
        batchId: batchH1.id,
        stageOrder: 1,
        stageName: "Spring Hive Maintenance",
        status: "COMPLETED",
        description: "Hives checked for queen health and population density. Placed near wild lavender fields.",
        location: "Cascade Valley Apiary",
        date: new Date(dateH1.getTime() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchH1.id,
        stageOrder: 2,
        stageName: "Honey Comb Harvesting",
        status: "COMPLETED",
        description: "Combs carefully removed. Bees kept safe using natural herbal smoke. Wax caps sliced manually.",
        location: "Cascade Valley Apiary",
        date: dateH1,
      },
      {
        batchId: batchH1.id,
        stageOrder: 3,
        stageName: "Centrifugal Extraction & Settling",
        status: "COMPLETED",
        description: "Raw honey spun in centrifugal extractor without heat. Filtered through fine mesh for wax bits, settled for 48 hours.",
        location: "Rostova Honey Facility",
        date: new Date(dateH1.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchH1.id,
        stageOrder: 4,
        stageName: "Amber Purity Grading",
        status: "COMPLETED",
        description: "Tested for humidity (17.2%, premium grade) and pollen count (92% wild lavender content). 100% pesticide-free.",
        location: "Cascade Bio-Analytical Labs",
        date: new Date(dateH1.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Pre-Book Batch
  const dateH2 = new Date();
  dateH2.setDate(now.getDate() + 50);
  const batchH2 = await prisma.batch.create({
    data: {
      productId: product2.id,
      harvestDate: dateH2,
      totalQuantity: 300,
      remainingQuantity: 210,
      price: 15.50, // Discounted for Prebook
      status: "PREBOOK",
      isFuture: true,
    },
  });

  // Traceability for H2 (Honey, Prebook)
  await prisma.traceabilityStage.createMany({
    data: [
      {
        batchId: batchH2.id,
        stageOrder: 1,
        stageName: "Hive Colony Division",
        status: "COMPLETED",
        description: "New colonies split to support summer lavender foraging. Queen health verified.",
        location: "Cascade Valley Apiary",
        date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchH2.id,
        stageOrder: 2,
        stageName: "Lavender Blooming & Nectar Collection",
        status: "ACTIVE",
        description: "Lavender fields in full bloom. Foraging bees actively gathering nectar. Weather monitored for optimal hive humidity.",
        location: "Cascade Valley Apiary",
        date: now,
      },
      {
        batchId: batchH2.id,
        stageOrder: 3,
        stageName: "Combing & Honey Collection",
        status: "LOCKED",
        description: "Harvest scheduled for mid-summer after flowers wither and honey is capped.",
        location: "Cascade Valley Apiary",
      },
    ],
  });

  // 3. Carrots Batches
  // Retail Batch
  const dateC1 = new Date();
  dateC1.setDate(now.getDate() - 5);
  const batchC1 = await prisma.batch.create({
    data: {
      productId: product3.id,
      harvestDate: dateC1,
      totalQuantity: 400,
      remainingQuantity: 180,
      price: 4.80,
      status: "AVAILABLE",
      isFuture: false,
    },
  });

  // Traceability for C1 (Carrots, Retail)
  await prisma.traceabilityStage.createMany({
    data: [
      {
        batchId: batchC1.id,
        stageOrder: 1,
        stageName: "Soil Inoculation",
        status: "COMPLETED",
        description: "Sandy soil treated with active organic compost to maximize trace mineral absorption for heirloom carrot seeds.",
        location: "Snake River Field #C",
        date: new Date(dateC1.getTime() - 100 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchC1.id,
        stageOrder: 2,
        stageName: "Manual Pulling & Washing",
        status: "COMPLETED",
        description: "Carrots pulled by hand. Washed with pure mountain well water to prevent bruising. Hand-sorted by color distribution.",
        location: "Snake River Field #C",
        date: dateC1,
      },
      {
        batchId: batchC1.id,
        stageOrder: 3,
        stageName: "Moisture & Beta-carotene Scan",
        status: "COMPLETED",
        description: "Lab tested for nutritional values. Standardized mineral index confirmed at A-Grade.",
        location: "Vance Farms Quality Hub",
        date: new Date(dateC1.getTime() + 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Pre-Book Batch
  const dateC2 = new Date();
  dateC2.setDate(now.getDate() + 20);
  const batchC2 = await prisma.batch.create({
    data: {
      productId: product3.id,
      harvestDate: dateC2,
      totalQuantity: 800,
      remainingQuantity: 580,
      price: 3.90, // Discounted for Prebook
      status: "PREBOOK",
      isFuture: true,
    },
  });

  // Traceability for C2 (Carrots, Prebook)
  await prisma.traceabilityStage.createMany({
    data: [
      {
        batchId: batchC2.id,
        stageOrder: 1,
        stageName: "Seeding & Germination",
        status: "COMPLETED",
        description: "Rainbow heirloom seeds sown. Checked daily for sprout rate.",
        location: "Snake River Field #A",
        date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        batchId: batchC2.id,
        stageOrder: 2,
        stageName: "Thinning & Organic Fertilizing",
        status: "ACTIVE",
        description: "Thinning out plants to allow root expansion. Administered kelp-extract natural fertilizer.",
        location: "Snake River Field #A",
        date: now,
      },
      {
        batchId: batchC2.id,
        stageOrder: 3,
        stageName: "Harvesting & Cold Washing",
        status: "LOCKED",
        description: "Harvesting planned in 20 days. Roots will be cold-washed and immediately crated.",
        location: "Snake River Field #A",
      },
    ],
  });

  console.log("Seeding complete! Successfully added farmers, products, batches, and stage timelines.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
