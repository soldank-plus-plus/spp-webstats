-- Recounts every aggregate column in the climb database.
--
-- Run it after any manual change to stats, maps or map_creators, or to
-- users.clan_id / users.country_id. It is idempotent and runs in a single
-- transaction, so it either goes through whole or changes nothing.
--
--   python3 scripts/recount.py
--   psql -v ON_ERROR_STOP=1 -f scripts/recount.sql "$DATABASE_URL"
--
-- Sources of truth:
--   stats.record_time  A player's place on a map is the rank of their BEST
--                      time on it. A tie shares the place (two times of 1
--                      both get gold, the next one is 3rd). Medals and
--                      stats.position both come from this.
--   maps.hardest       A hand-kept list of the hardest maps, 1 is the hardest
--                      and 0 is off the list. It is a curated ranking, not an
--                      aggregate, so it is not computed here.
--   map_creators       Map authorship.
--   users.clan_id      Clan membership. clan_creators holds the founders, not
--                      the members.
--   users.country_id   Country membership.
--
-- Left alone:
--   positions  A history log of who took, improved or lost a place. It is not
--              an aggregate and rebuilding it would overwrite history.
--   maps.hardest, clans.tag, users.username and other hand-entered data.
--
-- Deleting: stats and positions have ON DELETE NO ACTION foreign keys, so the
-- referencing rows go first:
--   DELETE FROM stats WHERE user_id = X; DELETE FROM positions WHERE user_id = X;
--   DELETE FROM users WHERE id = X;   -- map_creators/clan_creators cascade
-- For a map the same by map_id, with DELETE FROM maps last. Then run this
-- script.

BEGIN;

-- Every player's place on every map. A player can hold several rows on the
-- same map (merged from several servers), so their best time is taken first
-- and only then ranked. RANK rather than ROW_NUMBER, so an identical time
-- shares the place.
CREATE TEMP TABLE recount_places ON COMMIT DROP AS
SELECT
  user_id,
  map_id,
  RANK() OVER (PARTITION BY map_id ORDER BY best_time) AS place
FROM (
  SELECT user_id, map_id, MIN(record_time) AS best_time
  FROM stats
  WHERE map_id IS NOT NULL
  GROUP BY user_id, map_id
) AS best;

CREATE INDEX ON recount_places (user_id);
CREATE INDEX ON recount_places (map_id);
ANALYZE recount_places;

-- Every row a player has on a map gets the same place: their current rank on
-- that map, not the rank of a single cap. The frontend filters on this column
-- (the gold/silver/bronze over time chart), so it has to agree with the
-- users.gold/silver/bronze computed below.
UPDATE stats s
SET position = p.place
FROM recount_places p
WHERE p.user_id = s.user_id
  AND p.map_id = s.map_id
  AND s.position IS DISTINCT FROM p.place;

-- users:
--   gold/silver/bronze  maps where the player is 1st / 2nd / 3rd
--   no_medal            the rest of the capped maps
--   unique_caps         distinct maps capped
--   total_caps          all caps, every row counted
--   playtime            sum of record_time
--   maps_created        rows in map_creators
--   hardest             maps from the hardest list the player capped
WITH caps AS (
  SELECT
    user_id,
    COUNT(*)                      AS total_caps,
    COUNT(DISTINCT map_id)        AS unique_caps,
    COALESCE(SUM(record_time), 0) AS playtime
  FROM stats
  GROUP BY user_id
),
medals AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE place = 1) AS gold,
    COUNT(*) FILTER (WHERE place = 2) AS silver,
    COUNT(*) FILTER (WHERE place = 3) AS bronze
  FROM recount_places
  GROUP BY user_id
),
-- Counts EVERY cap on a map from the hardest list. To count only golds, add
-- AND p.place = 1 to the WHERE. On today's data both give the same result,
-- since every cap on those maps is a gold.
hardest AS (
  SELECT p.user_id, COUNT(*) AS hardest
  FROM recount_places p
  JOIN maps m ON m.id = p.map_id
  WHERE COALESCE(m.hardest, 0) > 0
  GROUP BY p.user_id
),
created AS (
  SELECT user_id, COUNT(*) AS maps_created
  FROM map_creators
  GROUP BY user_id
),
fresh AS (
  SELECT
    u.id,
    COALESCE(md.gold, 0)          AS gold,
    COALESCE(md.silver, 0)        AS silver,
    COALESCE(md.bronze, 0)        AS bronze,
    COALESCE(c.unique_caps, 0)
      - COALESCE(md.gold, 0)
      - COALESCE(md.silver, 0)
      - COALESCE(md.bronze, 0)    AS no_medal,
    COALESCE(c.unique_caps, 0)    AS unique_caps,
    COALESCE(c.total_caps, 0)     AS total_caps,
    COALESCE(cr.maps_created, 0)  AS maps_created,
    COALESCE(h.hardest, 0)        AS hardest,
    COALESCE(c.playtime, 0)       AS playtime
  FROM users u
  LEFT JOIN caps    c  ON c.user_id  = u.id
  LEFT JOIN medals  md ON md.user_id = u.id
  LEFT JOIN hardest h  ON h.user_id  = u.id
  LEFT JOIN created cr ON cr.user_id = u.id
)
UPDATE users u
SET gold         = f.gold,
    silver       = f.silver,
    bronze       = f.bronze,
    no_medal     = f.no_medal,
    unique_caps  = f.unique_caps,
    total_caps   = f.total_caps,
    maps_created = f.maps_created,
    hardest      = f.hardest,
    playtime     = f.playtime
FROM fresh f
WHERE f.id = u.id
  -- rows that already match are left untouched
  AND (u.gold, u.silver, u.bronze, u.no_medal, u.unique_caps,
       u.total_caps, u.maps_created, u.hardest, u.playtime)
      IS DISTINCT FROM
      (f.gold, f.silver, f.bronze, f.no_medal, f.unique_caps,
       f.total_caps, f.maps_created, f.hardest, f.playtime);

-- clans: membership is users.clan_id. Counted from the members' raw caps
-- rather than as a sum of the player aggregates, because a map capped by two
-- members is one map for the clan, not two. Likewise a gold on one map counts
-- once even when a tie gives it to two members. Clans have no no_medal or
-- playtime columns.
WITH members AS (
  SELECT id AS user_id, clan_id FROM users WHERE clan_id IS NOT NULL
),
caps AS (
  SELECT
    mb.clan_id,
    COUNT(*)                 AS total_caps,
    COUNT(DISTINCT s.map_id) AS unique_caps
  FROM stats s
  JOIN members mb ON mb.user_id = s.user_id
  GROUP BY mb.clan_id
),
medals AS (
  SELECT
    mb.clan_id,
    COUNT(DISTINCT p.map_id) FILTER (WHERE p.place = 1) AS gold,
    COUNT(DISTINCT p.map_id) FILTER (WHERE p.place = 2) AS silver,
    COUNT(DISTINCT p.map_id) FILTER (WHERE p.place = 3) AS bronze
  FROM recount_places p
  JOIN members mb ON mb.user_id = p.user_id
  GROUP BY mb.clan_id
),
hardest AS (
  SELECT mb.clan_id, COUNT(DISTINCT p.map_id) AS hardest
  FROM recount_places p
  JOIN members mb ON mb.user_id = p.user_id
  JOIN maps m     ON m.id = p.map_id
  WHERE COALESCE(m.hardest, 0) > 0
  GROUP BY mb.clan_id
),
created AS (
  SELECT mb.clan_id, COUNT(DISTINCT mc.map_id) AS maps_created
  FROM map_creators mc
  JOIN members mb ON mb.user_id = mc.user_id
  GROUP BY mb.clan_id
),
fresh AS (
  SELECT
    cl.id,
    COALESCE(md.gold, 0)         AS gold,
    COALESCE(md.silver, 0)       AS silver,
    COALESCE(md.bronze, 0)       AS bronze,
    COALESCE(c.unique_caps, 0)   AS unique_caps,
    COALESCE(c.total_caps, 0)    AS total_caps,
    COALESCE(cr.maps_created, 0) AS maps_created,
    COALESCE(h.hardest, 0)       AS hardest
  FROM clans cl
  LEFT JOIN caps    c  ON c.clan_id  = cl.id
  LEFT JOIN medals  md ON md.clan_id = cl.id
  LEFT JOIN hardest h  ON h.clan_id  = cl.id
  LEFT JOIN created cr ON cr.clan_id = cl.id
)
UPDATE clans cl
SET gold         = f.gold,
    silver       = f.silver,
    bronze       = f.bronze,
    unique_caps  = f.unique_caps,
    total_caps   = f.total_caps,
    maps_created = f.maps_created,
    hardest      = f.hardest
FROM fresh f
WHERE f.id = cl.id
  AND (cl.gold, cl.silver, cl.bronze, cl.unique_caps,
       cl.total_caps, cl.maps_created, cl.hardest)
      IS DISTINCT FROM
      (f.gold, f.silver, f.bronze, f.unique_caps,
       f.total_caps, f.maps_created, f.hardest);

-- countries: the same logic as clans, keyed on users.country_id
WITH members AS (
  SELECT id AS user_id, country_id FROM users WHERE country_id IS NOT NULL
),
caps AS (
  SELECT
    mb.country_id,
    COUNT(*)                 AS total_caps,
    COUNT(DISTINCT s.map_id) AS unique_caps
  FROM stats s
  JOIN members mb ON mb.user_id = s.user_id
  GROUP BY mb.country_id
),
medals AS (
  SELECT
    mb.country_id,
    COUNT(DISTINCT p.map_id) FILTER (WHERE p.place = 1) AS gold,
    COUNT(DISTINCT p.map_id) FILTER (WHERE p.place = 2) AS silver,
    COUNT(DISTINCT p.map_id) FILTER (WHERE p.place = 3) AS bronze
  FROM recount_places p
  JOIN members mb ON mb.user_id = p.user_id
  GROUP BY mb.country_id
),
hardest AS (
  SELECT mb.country_id, COUNT(DISTINCT p.map_id) AS hardest
  FROM recount_places p
  JOIN members mb ON mb.user_id = p.user_id
  JOIN maps m     ON m.id = p.map_id
  WHERE COALESCE(m.hardest, 0) > 0
  GROUP BY mb.country_id
),
created AS (
  SELECT mb.country_id, COUNT(DISTINCT mc.map_id) AS maps_created
  FROM map_creators mc
  JOIN members mb ON mb.user_id = mc.user_id
  GROUP BY mb.country_id
),
fresh AS (
  SELECT
    co.id,
    COALESCE(md.gold, 0)         AS gold,
    COALESCE(md.silver, 0)       AS silver,
    COALESCE(md.bronze, 0)       AS bronze,
    COALESCE(c.unique_caps, 0)   AS unique_caps,
    COALESCE(c.total_caps, 0)    AS total_caps,
    COALESCE(cr.maps_created, 0) AS maps_created,
    COALESCE(h.hardest, 0)       AS hardest
  FROM countries co
  LEFT JOIN caps    c  ON c.country_id  = co.id
  LEFT JOIN medals  md ON md.country_id = co.id
  LEFT JOIN hardest h  ON h.country_id  = co.id
  LEFT JOIN created cr ON cr.country_id = co.id
)
UPDATE countries co
SET gold         = f.gold,
    silver       = f.silver,
    bronze       = f.bronze,
    unique_caps  = f.unique_caps,
    total_caps   = f.total_caps,
    maps_created = f.maps_created,
    hardest      = f.hardest
FROM fresh f
WHERE f.id = co.id
  AND (co.gold, co.silver, co.bronze, co.unique_caps,
       co.total_caps, co.maps_created, co.hardest)
      IS DISTINCT FROM
      (f.gold, f.silver, f.bronze, f.unique_caps,
       f.total_caps, f.maps_created, f.hardest);

COMMIT;

-- The gold/silver/bronze sums in users should roughly equal the number of maps
-- with at least one cap, since every map hands out one gold (barring ties)
SELECT 'users' AS tabela, COUNT(*) AS wierszy,
       SUM(gold) AS gold, SUM(silver) AS silver, SUM(bronze) AS bronze,
       SUM(unique_caps) AS unique_caps, SUM(total_caps) AS total_caps,
       SUM(maps_created) AS maps_created, SUM(hardest) AS hardest
FROM users
UNION ALL
SELECT 'clans', COUNT(*), SUM(gold), SUM(silver), SUM(bronze),
       SUM(unique_caps), SUM(total_caps), SUM(maps_created), SUM(hardest)
FROM clans
UNION ALL
SELECT 'countries', COUNT(*), SUM(gold), SUM(silver), SUM(bronze),
       SUM(unique_caps), SUM(total_caps), SUM(maps_created), SUM(hardest)
FROM countries;
