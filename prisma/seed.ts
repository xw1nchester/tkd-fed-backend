import 'dotenv/config';

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = [
        { id: 1, name: 'trainer' },
        { id: 2, name: 'judge' },
        { id: 3, name: 'admin' }
    ];

    console.log(`Starting seeding roles...`);

    for (const { id, name } of roles) {
        const result = await prisma.role.upsert({
            where: { id },
            update: { name },
            create: { id, name }
        });

        // Логируем, что произошло
        console.log(`Role ${JSON.stringify({ ...result })} upserted`);
    }

    console.log(`Seeding finished successfully!`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async e => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
