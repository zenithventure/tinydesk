import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const products = [
  {
    name: "TinyCal",
    slug: "tinycal",
    repoOwner: "zenithventure",
    repoName: "tinycal",
  },
  {
    name: "TinySign",
    slug: "tinysign",
    repoOwner: "zenithventure",
    repoName: "tinysign",
  },
  {
    name: "TinyPM",
    slug: "tinypm",
    repoOwner: "zenithventure",
    repoName: "tinypm",
  },
  {
    name: "TinyDesk",
    slug: "tinydesk",
    repoOwner: "zenithventure",
    repoName: "tinydesk",
  },
]

async function main() {
  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    })
    if (existing) {
      console.log(`  skip: ${product.name} (already exists)`)
    } else {
      await prisma.product.create({ data: product })
      console.log(`  created: ${product.name}`)
    }
  }
  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
