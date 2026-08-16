-- CreateTable
CREATE TABLE "pending_file_deletions" (
    "id" SERIAL NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_file_deletions_pkey" PRIMARY KEY ("id")
);
