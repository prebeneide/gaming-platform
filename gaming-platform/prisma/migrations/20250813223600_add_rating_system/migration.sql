-- CreateTable
CREATE TABLE "UserGameRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "highestRating" INTEGER NOT NULL DEFAULT 1200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastGameAt" TIMESTAMP(3),

    CONSTRAINT "UserGameRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingChange" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "ratingChange" INTEGER NOT NULL,
    "opponentRating" INTEGER NOT NULL,
    "ratingDifference" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGameRating_userId_gameName_key" ON "UserGameRating"("userId", "gameName");

-- AddForeignKey
ALTER TABLE "UserGameRating" ADD CONSTRAINT "UserGameRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
