import 'dotenv/config';

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = [
        { id: 1, name: 'trainer', description: 'Тренер' },
        { id: 2, name: 'judge', description: 'Судья' },
        { id: 3, name: 'admin', description: 'Админ' },
        {
            id: 4,
            name: 'chairman',
            description: 'Председатель аттестационной комиссии'
        }
    ];

    console.log(`Starting seeding roles...`);

    for (const { id, name, description } of roles) {
        const result = await prisma.role.upsert({
            where: { id },
            update: { name, description },
            create: { id, name, description }
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
