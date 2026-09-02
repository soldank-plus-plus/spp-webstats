import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClansAndCountries1788380849364 implements MigrationInterface {
  name = 'ClansAndCountries1788380849364';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clans" ("id" SERIAL NOT NULL, "clanname" character varying(256) NOT NULL, "tag" character varying(256), "gold" integer DEFAULT '0', "silver" integer DEFAULT '0', "bronze" integer DEFAULT '0', "unique_caps" integer DEFAULT '0', "total_caps" integer DEFAULT '0', "maps_created" integer DEFAULT '0', "hardest" integer DEFAULT '0', CONSTRAINT "PK_d198f00cf9d1743a58fc23d420e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_clans_name" ON "clans"  ("clanname") `,
    );
    await queryRunner.query(
      `CREATE TABLE "countries" ("id" SERIAL NOT NULL, "countryname" character varying(256) NOT NULL, "code" character varying(2) NOT NULL, "gold" integer DEFAULT '0', "silver" integer DEFAULT '0', "bronze" integer DEFAULT '0', "unique_caps" integer DEFAULT '0', "total_caps" integer DEFAULT '0', "maps_created" integer DEFAULT '0', "hardest" integer DEFAULT '0', CONSTRAINT "UQ_b47cbb5311bad9c9ae17b8c1eda" UNIQUE ("code"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_countries_name" ON "countries"  ("countryname") `,
    );
    await queryRunner.query(
      `CREATE TABLE "clan_creators" ("clan_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_44338a60e372b922a6e76320b2b" PRIMARY KEY ("clan_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64b011d99529633bf02d35216e" ON "clan_creators"  ("clan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1eab1279264e68efe5af8758c5" ON "clan_creators"  ("user_id") `,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "clan_id" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD "country_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1760a73cce55cbb397ab5fd9736" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_ae78dc6cb10aa14cfef96b2dd90" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clan_creators" ADD CONSTRAINT "FK_64b011d99529633bf02d35216ec" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "clan_creators" ADD CONSTRAINT "FK_1eab1279264e68efe5af8758c5a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clan_creators" DROP CONSTRAINT "FK_1eab1279264e68efe5af8758c5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clan_creators" DROP CONSTRAINT "FK_64b011d99529633bf02d35216ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_ae78dc6cb10aa14cfef96b2dd90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_1760a73cce55cbb397ab5fd9736"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "clan_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1eab1279264e68efe5af8758c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64b011d99529633bf02d35216e"`,
    );
    await queryRunner.query(`DROP TABLE "clan_creators"`);
    await queryRunner.query(`DROP INDEX "public"."idx_countries_name"`);
    await queryRunner.query(`DROP TABLE "countries"`);
    await queryRunner.query(`DROP INDEX "public"."idx_clans_name"`);
    await queryRunner.query(`DROP TABLE "clans"`);
  }
}
