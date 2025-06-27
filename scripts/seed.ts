// scripts/seed.ts
import { seedFromConsole } from "@/server/actions/seed";

const args = process.argv.slice(2);

seedFromConsole(args)
  .then((result) => {
    if (result) {
      console.log('Seeding result:', result);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  });