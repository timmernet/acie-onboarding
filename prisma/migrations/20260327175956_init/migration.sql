-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "pelotoon" TEXT NOT NULL,
    "aangemeldOp" TEXT NOT NULL,
    "actief" BOOLEAN NOT NULL DEFAULT false,
    "laatstIngelogd" TEXT
);

-- CreateTable
CREATE TABLE "Taak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "contactId" TEXT NOT NULL DEFAULT '',
    "vereistTaakId" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taakId" TEXT NOT NULL,
    "voltooid" BOOLEAN NOT NULL DEFAULT false,
    "voltooiDatum" TEXT,
    "opmerking" TEXT,
    "nieuw" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTask_taakId_fkey" FOREIGN KEY ("taakId") REFERENCES "Taak" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "rang" TEXT NOT NULL,
    "functie" TEXT NOT NULL,
    "telefoon" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Bestand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL DEFAULT '',
    "categorie" TEXT NOT NULL DEFAULT '',
    "bestandsnaam" TEXT NOT NULL,
    "bestandstype" TEXT NOT NULL,
    "grootte" INTEGER NOT NULL,
    "geuploadOp" TEXT NOT NULL,
    "geuploadDoor" TEXT NOT NULL DEFAULT 'Onbekend',
    "url" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PinResetToken" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "expires" BIGINT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_taakId_key" ON "UserTask"("userId", "taakId");
