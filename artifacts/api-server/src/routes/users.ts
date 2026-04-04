import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function ensureUser(userId: string) {
  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({ id: userId, displayName: `Trader_${userId.slice(0, 6)}`, level: 1 })
      .returning();
    user = newUser;
  }
  return user;
}

// GET /api/users/profile
router.get("/profile", requireAuth, async (req: any, res) => {
  try {
    const user = await ensureUser(req.userId);
    res.json({
      id: user.id,
      displayName: user.displayName,
      country: user.country,
      institution: user.institution,
      bio: user.bio,
      level: user.level,
      badges: [],
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile
router.put("/profile", requireAuth, async (req: any, res) => {
  try {
    const { displayName, country, institution, bio } = req.body;
    await ensureUser(req.userId);

    const updates: Record<string, any> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (country !== undefined) updates.country = country;
    if (institution !== undefined) updates.institution = institution;
    if (bio !== undefined) updates.bio = bio;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, req.userId))
      .returning();

    res.json({
      id: updated.id,
      displayName: updated.displayName,
      country: updated.country,
      institution: updated.institution,
      bio: updated.bio,
      level: updated.level,
      badges: [],
      createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
