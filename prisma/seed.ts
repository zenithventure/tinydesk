import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

function generateSecret() {
  return "whsec_" + randomBytes(24).toString("hex")
}

const products = [
  {
    name: "TinyCal",
    slug: "tinycal",
    repoOwner: "zenithventure",
    repoName: "tinycal",
    webhookSecret: generateSecret(),
  },
  {
    name: "TinySign",
    slug: "tinysign",
    repoOwner: "zenithventure",
    repoName: "tinysign",
    webhookSecret: generateSecret(),
  },
  {
    name: "TinyPM",
    slug: "tinypm",
    repoOwner: "zenithventure",
    repoName: "tinypm",
    webhookSecret: generateSecret(),
  },
  {
    name: "TinyDesk",
    slug: "tinydesk",
    repoOwner: "zenithventure",
    repoName: "tinydesk",
    webhookSecret: generateSecret(),
  },
]

async function main() {
  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    })
    if (existing) {
      if (!existing.webhookSecret) {
        await prisma.product.update({
          where: { slug: product.slug },
          data: { webhookSecret: product.webhookSecret },
        })
        console.log(`  updated: ${product.name} (added webhook secret)`)
      } else {
        console.log(`  skip: ${product.name} (already exists)`)
      }
    } else {
      await prisma.product.create({ data: product })
      console.log(`  created: ${product.name}`)
    }
  }
  // Print secrets for GitHub webhook configuration
  console.log("\nWebhook secrets (use these in each repo's GitHub webhook settings):")
  console.log("Payload URL: https://tinydesk.zenithstudio.app/api/webhooks/github\n")
  const all = await prisma.product.findMany({ orderBy: { name: "asc" } })
  for (const p of all) {
    console.log(`  ${p.name} (${p.repoOwner}/${p.repoName}):`)
    console.log(`    Secret: ${p.webhookSecret}`)
  }
  console.log("\nSeed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
