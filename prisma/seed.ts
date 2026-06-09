import 'dotenv/config';

import { BeltRankType, PrismaClient } from '../generated/prisma/client';

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

        console.log(`Role ${JSON.stringify({ ...result })} upserted`);
    }

    const belts = [
        {
            id: 1,
            name: 'Белый',
            color: 'white',
            stripeColor: null,
            rankType: BeltRankType.GEUP,
            rankNumber: 10,
            sortOrder: 1
        },
        {
            id: 2,
            name: 'Белый с жёлтой полосой',
            color: 'white',
            stripeColor: 'yellow',
            rankType: BeltRankType.GEUP,
            rankNumber: 9,
            sortOrder: 2
        },
        {
            id: 3,
            name: 'Жёлтый',
            color: 'yellow',
            stripeColor: null,
            rankType: BeltRankType.GEUP,
            rankNumber: 8,
            sortOrder: 3
        },
        {
            id: 4,
            name: 'Жёлтый с зелёной полосой',
            color: 'yellow',
            stripeColor: 'green',
            rankType: BeltRankType.GEUP,
            rankNumber: 7,
            sortOrder: 4
        },
        {
            id: 5,
            name: 'Зелёный',
            color: 'green',
            stripeColor: null,
            rankType: BeltRankType.GEUP,
            rankNumber: 6,
            sortOrder: 5
        },
        {
            id: 6,
            name: 'Зелёный с синей полосой',
            color: 'green',
            stripeColor: 'blue',
            rankType: BeltRankType.GEUP,
            rankNumber: 5,
            sortOrder: 6
        },
        {
            id: 7,
            name: 'Синий',
            color: 'blue',
            stripeColor: null,
            rankType: BeltRankType.GEUP,
            rankNumber: 4,
            sortOrder: 7
        },
        {
            id: 8,
            name: 'Синий с красной полосой',
            color: 'blue',
            stripeColor: 'red',
            rankType: BeltRankType.GEUP,
            rankNumber: 3,
            sortOrder: 8
        },
        {
            id: 9,
            name: 'Красный',
            color: 'red',
            stripeColor: null,
            rankType: BeltRankType.GEUP,
            rankNumber: 2,
            sortOrder: 9
        },
        {
            id: 10,
            name: 'Коричневый',
            color: 'brown',
            stripeColor: null,
            rankType: BeltRankType.GEUP,
            rankNumber: 1,
            sortOrder: 10
        },

        {
            id: 11,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 1,
            sortOrder: 11
        },
        {
            id: 12,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 2,
            sortOrder: 12
        },
        {
            id: 13,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 3,
            sortOrder: 13
        },
        {
            id: 14,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 4,
            sortOrder: 14
        },
        {
            id: 15,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 5,
            sortOrder: 15
        },
        {
            id: 16,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 6,
            sortOrder: 16
        },
        {
            id: 17,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 7,
            sortOrder: 17
        },
        {
            id: 18,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 8,
            sortOrder: 18
        },
        {
            id: 19,
            name: 'Чёрный',
            color: 'black',
            stripeColor: null,
            rankType: BeltRankType.DAN,
            rankNumber: 9,
            sortOrder: 19
        }
    ];

    for (const { id, ...rest } of belts) {
        const result = await prisma.belt.upsert({
            where: { id },
            update: { ...rest },
            create: { id, ...rest }
        });

        console.log(`Belt ${JSON.stringify({ ...result })} upserted`);
    }

    const sportRanks = [
        { id: 1, name: '3-й юношеский разряд' },
        { id: 2, name: '2-й юношеский разряд' },
        { id: 3, name: '1-й юношеский разряд' },
        { id: 4, name: '3-й спортивный разряд' },
        { id: 5, name: '2-й спортивный разряд' },
        { id: 6, name: '1-й спортивный разряд' },
        { id: 7, name: 'Кандидат в мастера спорта' },
        { id: 8, name: 'Мастер спорта России' },
        { id: 9, name: 'Мастер спорта международного класса' },
        { id: 10, name: 'Заслуженный мастер спорта России' }
    ];

    for (const { id, ...rest } of sportRanks) {
        const result = await prisma.sportRank.upsert({
            where: { id },
            update: { ...rest },
            create: { id, ...rest }
        });

        console.log(`SportRank ${JSON.stringify(result)} upserted`);
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
