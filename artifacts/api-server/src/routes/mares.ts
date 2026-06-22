import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { maresTable, breedingRecordsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  CreateMareBody,
  UpdateMareBody,
  UpdateMareParams,
  GetMareParams,
  DeleteMareParams,
  CreateBreedingRecordBody,
  CreateBreedingRecordParams,
  UpdateBreedingRecordBody,
  UpdateBreedingRecordParams,
  DeleteBreedingRecordParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Breeding calculation helpers
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeBreedingFields(record: {
  firstHeatDate?: string | null;
  lastHeatDate?: string | null;
  bredDates?: string | null;
  isSuccessfullyBred?: boolean;
  confirmedInFoalDate?: string | null;
}): {
  expectedHeatReturn: string | null;
  heatReturnWindowStart: string | null;
  heatReturnWindowEnd: string | null;
  vetCheckEligibleDate: string | null;
  expectedFoalingStart: string | null;
  expectedFoalingAverage: string | null;
  expectedFoalingEnd: string | null;
} {
  let expectedHeatReturn: string | null = null;
  let heatReturnWindowStart: string | null = null;
  let heatReturnWindowEnd: string | null = null;
  let vetCheckEligibleDate: string | null = null;
  let expectedFoalingStart: string | null = null;
  let expectedFoalingAverage: string | null = null;
  let expectedFoalingEnd: string | null = null;

  if (record.firstHeatDate || record.lastHeatDate) {
    const startBase = record.firstHeatDate ?? record.lastHeatDate!;
    const endBase = record.lastHeatDate ?? record.firstHeatDate!;
    heatReturnWindowStart = addDays(startBase, 21);
    heatReturnWindowEnd = addDays(endBase, 16);
    expectedHeatReturn = heatReturnWindowStart;
  }

  if (record.bredDates) {
    const dates = record.bredDates
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .sort();

    if (dates.length > 0) {
      const earliest = dates[0];
      vetCheckEligibleDate = addDays(earliest, 19);

      if (record.isSuccessfullyBred) {
        expectedFoalingStart = addDays(earliest, 320);
        expectedFoalingAverage = addDays(earliest, 340);
        expectedFoalingEnd = addDays(earliest, 365);
      }
    }
  }

  return {
    expectedHeatReturn,
    heatReturnWindowStart,
    heatReturnWindowEnd,
    vetCheckEligibleDate,
    expectedFoalingStart,
    expectedFoalingAverage,
    expectedFoalingEnd,
  };
}

function formatBreedingRecord(r: typeof breedingRecordsTable.$inferSelect) {
  const computed = computeBreedingFields({
    firstHeatDate: r.firstHeatDate,
    lastHeatDate: r.lastHeatDate,
    bredDates: r.bredDates,
    isSuccessfullyBred: r.isSuccessfullyBred,
    confirmedInFoalDate: r.confirmedInFoalDate,
  });
  return {
    id: r.id,
    mareId: r.mareId,
    stallionName: r.stallionName,
    firstHeatDate: r.firstHeatDate,
    lastHeatDate: r.lastHeatDate,
    bredDates: r.bredDates,
    isSuccessfullyBred: r.isSuccessfullyBred,
    confirmedInFoalDate: r.confirmedInFoalDate,
    status: r.status,
    season: r.season,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    ...computed,
  };
}

// GET /mares
router.get("/mares", async (req: Request, res: Response) => {
  try {
    const mares = await db
      .select()
      .from(maresTable)
      .orderBy(asc(maresTable.registeredName));

    const latestRecords = await db
      .select()
      .from(breedingRecordsTable)
      .orderBy(asc(breedingRecordsTable.createdAt));

    const recordsByMare = new Map<number, typeof breedingRecordsTable.$inferSelect[]>();
    for (const r of latestRecords) {
      if (!recordsByMare.has(r.mareId)) recordsByMare.set(r.mareId, []);
      recordsByMare.get(r.mareId)!.push(r);
    }

    const result = mares.map((m) => {
      const records = recordsByMare.get(m.id) ?? [];
      const latest = records[records.length - 1];
      const computed = latest
        ? computeBreedingFields({
            firstHeatDate: latest.firstHeatDate,
            lastHeatDate: latest.lastHeatDate,
            bredDates: latest.bredDates,
            isSuccessfullyBred: latest.isSuccessfullyBred,
            confirmedInFoalDate: latest.confirmedInFoalDate,
          })
        : null;

      const bredDatesList = latest?.bredDates
        ? latest.bredDates
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
            .join(", ")
        : null;

      return {
        id: m.id,
        registeredName: m.registeredName,
        stableName: m.stableName,
        breed: m.breed,
        owner: m.owner,
        photoUrl: m.photoUrl,
        latestBreedingStatus: latest?.status ?? null,
        latestBredDates: bredDatesList,
        latestStallionName: latest?.stallionName ?? null,
        expectedHeatReturn: computed?.expectedHeatReturn ?? null,
        expectedFoalingStart: computed?.expectedFoalingStart ?? null,
        expectedFoalingEnd: computed?.expectedFoalingEnd ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing mares");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /mares
router.post("/mares", async (req: Request, res: Response) => {
  const parsed = CreateMareBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [mare] = await db
      .insert(maresTable)
      .values({
        registeredName: parsed.data.registeredName ?? null,
        stableName: parsed.data.stableName ?? null,
        breed: parsed.data.breed ?? null,
        registrationNumber: parsed.data.registrationNumber ?? null,
        yearOfBirth: parsed.data.yearOfBirth ?? null,
        previousFoals: parsed.data.previousFoals ?? null,
        owner: parsed.data.owner ?? null,
        photoUrl: parsed.data.photoUrl ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning();

    res.status(201).json({
      ...mare,
      createdAt: mare.createdAt.toISOString(),
      updatedAt: mare.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating mare");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /mares/:id
router.get("/mares/:id", async (req: Request, res: Response) => {
  const params = GetMareParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [mare] = await db
      .select()
      .from(maresTable)
      .where(eq(maresTable.id, params.data.id));

    if (!mare) {
      res.status(404).json({ error: "Mare not found" });
      return;
    }

    const records = await db
      .select()
      .from(breedingRecordsTable)
      .where(eq(breedingRecordsTable.mareId, params.data.id))
      .orderBy(asc(breedingRecordsTable.createdAt));

    res.json({
      id: mare.id,
      registeredName: mare.registeredName,
      stableName: mare.stableName,
      breed: mare.breed,
      registrationNumber: mare.registrationNumber,
      yearOfBirth: mare.yearOfBirth,
      previousFoals: mare.previousFoals,
      owner: mare.owner,
      photoUrl: mare.photoUrl,
      notes: mare.notes,
      createdAt: mare.createdAt.toISOString(),
      updatedAt: mare.updatedAt.toISOString(),
      breedingRecords: records.map(formatBreedingRecord),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching mare");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /mares/:id
router.patch("/mares/:id", async (req: Request, res: Response) => {
  const params = UpdateMareParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateMareBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const [updated] = await db
      .update(maresTable)
      .set({
        ...body.data,
        updatedAt: new Date(),
      })
      .where(eq(maresTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Mare not found" });
      return;
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error updating mare");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /mares/:id
router.delete("/mares/:id", async (req: Request, res: Response) => {
  const params = DeleteMareParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(maresTable).where(eq(maresTable.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting mare");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /mares/:id/breeding-records
router.get("/mares/:id/breeding-records", async (req: Request, res: Response) => {
  const params = CreateBreedingRecordParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const records = await db
      .select()
      .from(breedingRecordsTable)
      .where(eq(breedingRecordsTable.mareId, params.data.id))
      .orderBy(asc(breedingRecordsTable.createdAt));

    res.json(records.map(formatBreedingRecord));
  } catch (err) {
    req.log.error({ err }, "Error listing breeding records" );
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /mares/:id/breeding-records
router.post("/mares/:id/breeding-records", async (req: Request, res: Response) => {
  const params = CreateBreedingRecordParams.safeParse({ id: Number(req.params.id) });
  const body = CreateBreedingRecordBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const [record] = await db
      .insert(breedingRecordsTable)
      .values({
        mareId: params.data.id,
        stallionName: body.data.stallionName ?? null,
        firstHeatDate: body.data.firstHeatDate ?? null,
        lastHeatDate: body.data.lastHeatDate ?? null,
        bredDates: body.data.bredDates ?? null,
        isSuccessfullyBred: body.data.isSuccessfullyBred ?? false,
        confirmedInFoalDate: body.data.confirmedInFoalDate ?? null,
        status: body.data.status ?? "open",
        season: body.data.season ?? null,
        notes: body.data.notes ?? null,
      })
      .returning();

    res.status(201).json(formatBreedingRecord(record));
  } catch (err) {
    req.log.error({ err }, "Error creating breeding record");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /mares/:id/breeding-records/:recordId
router.patch("/mares/:id/breeding-records/:recordId", async (req: Request, res: Response) => {
  const params = UpdateBreedingRecordParams.safeParse({
    id: Number(req.params.id),
    recordId: Number(req.params.recordId),
  });
  const body = UpdateBreedingRecordBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const [updated] = await db
      .update(breedingRecordsTable)
      .set({
        ...body.data,
        updatedAt: new Date(),
      })
      .where(eq(breedingRecordsTable.id, params.data.recordId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Breeding record not found" });
      return;
    }

    res.json(formatBreedingRecord(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating breeding record");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /mares/:id/breeding-records/:recordId
router.delete("/mares/:id/breeding-records/:recordId", async (req: Request, res: Response) => {
  const params = DeleteBreedingRecordParams.safeParse({
    id: Number(req.params.id),
    recordId: Number(req.params.recordId),
  });
  if (!params.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    await db
      .delete(breedingRecordsTable)
      .where(eq(breedingRecordsTable.id, params.data.recordId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting breeding record");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
