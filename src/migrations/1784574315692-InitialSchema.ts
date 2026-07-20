import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784574315692 implements MigrationInterface {
  name = 'InitialSchema1784574315692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stats" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "map_id" integer, "record_time" integer, "record_date" integer, "position" integer, "team" integer DEFAULT '0', CONSTRAINT "PK_c76e93dfef28ba9b6942f578ab1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stats_record_date" ON "stats" ("record_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stats_map_time" ON "stats" ("map_id", "record_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stats_user_map" ON "stats" ("user_id", "map_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stats_user_id" ON "stats" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "maps" ("id" SERIAL NOT NULL, "mapname" character varying(256), "date" integer DEFAULT '0', "loop" integer DEFAULT '0', "sprint" integer DEFAULT '0', "rloop" integer DEFAULT '0', "rsprint" integer DEFAULT '0', "hns" integer DEFAULT '0', "ctf" integer DEFAULT '0', "htf" integer DEFAULT '0', "inf" integer DEFAULT '0', "reversed" integer DEFAULT '0', "race" integer DEFAULT '0', "runmode" integer DEFAULT '0', "duplicate" integer DEFAULT '0', CONSTRAINT "PK_dddaabaf432b881f9f6e13bf9bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maps_name" ON "maps" ("mapname") `,
    );
    await queryRunner.query(
      `CREATE TABLE "events" ("id" SERIAL NOT NULL, "type" integer NOT NULL, "map_id" integer, "user_id" integer, "medal" integer, "event_date" integer, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_events_map_type" ON "events" ("map_id", "type", "medal") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_events_date" ON "events" ("event_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_events_user_id" ON "events" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_events_map_id" ON "events" ("map_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(256) NOT NULL, "gold" integer DEFAULT '0', "silver" integer DEFAULT '0', "bronze" integer DEFAULT '0', "no_medal" integer DEFAULT '0', "total_points" integer DEFAULT '0', "unique_caps" integer DEFAULT '0', "maps_created" integer DEFAULT '0', "playtime" integer DEFAULT '0', "created_at" integer, "last_active_at" integer, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_medals" ON "users" ("gold", "silver", "bronze") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_username" ON "users" ("username") `,
    );
    await queryRunner.query(
      `CREATE TABLE "map_creators" ("map_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_75b9c3f4ac48592e76638a5db0f" PRIMARY KEY ("map_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32cdad928d87eae0356c5ea696" ON "map_creators" ("map_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_30b6e0677dd51daa0b09ce0fab" ON "map_creators" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "stats" ADD CONSTRAINT "FK_44253e9281dbf4d8dde5e85bdb2" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stats" ADD CONSTRAINT "FK_3adafadb37c6c021b46cd5edc20" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_e3482553d3da4edfc74d3f418c2" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_09f256fb7f9a05f0ed9927f406b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_creators" ADD CONSTRAINT "FK_32cdad928d87eae0356c5ea696a" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_creators" ADD CONSTRAINT "FK_30b6e0677dd51daa0b09ce0fab4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "map_creators" DROP CONSTRAINT "FK_30b6e0677dd51daa0b09ce0fab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_creators" DROP CONSTRAINT "FK_32cdad928d87eae0356c5ea696a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_09f256fb7f9a05f0ed9927f406b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_e3482553d3da4edfc74d3f418c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stats" DROP CONSTRAINT "FK_3adafadb37c6c021b46cd5edc20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stats" DROP CONSTRAINT "FK_44253e9281dbf4d8dde5e85bdb2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_30b6e0677dd51daa0b09ce0fab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32cdad928d87eae0356c5ea696"`,
    );
    await queryRunner.query(`DROP TABLE "map_creators"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_medals"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."idx_events_map_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_events_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_events_date"`);
    await queryRunner.query(`DROP INDEX "public"."idx_events_map_type"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP INDEX "public"."idx_maps_name"`);
    await queryRunner.query(`DROP TABLE "maps"`);
    await queryRunner.query(`DROP INDEX "public"."idx_stats_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_stats_user_map"`);
    await queryRunner.query(`DROP INDEX "public"."idx_stats_map_time"`);
    await queryRunner.query(`DROP INDEX "public"."idx_stats_record_date"`);
    await queryRunner.query(`DROP TABLE "stats"`);
  }
}
