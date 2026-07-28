-- CreateTable
CREATE TABLE "age_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "min_age" INTEGER NOT NULL,
    "max_age" INTEGER,

    CONSTRAINT "age_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_categories" (
    "id" SERIAL NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "weight" INTEGER NOT NULL,

    CONSTRAINT "weight_categories_pkey" PRIMARY KEY ("id")
);
