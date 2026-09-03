import { MigrationInterface, QueryRunner } from 'typeorm';

export class StatEntityRework1787911718639 implements MigrationInterface {
  name = 'StatEntityRework1787911718639';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stats" ADD "status" integer DEFAULT '1'`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_stats_record_date"`);
    await queryRunner.query(`ALTER TABLE "stats" DROP COLUMN "record_date"`);
    await queryRunner.query(`ALTER TABLE "stats" ADD "record_date" bigint`);
    await queryRunner.query(
      `CREATE INDEX "idx_stats_record_date" ON "stats"  ("record_date") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_stats_record_date"`);
    await queryRunner.query(`ALTER TABLE "stats" DROP COLUMN "record_date"`);
    await queryRunner.query(`ALTER TABLE "stats" ADD "record_date" integer`);
    await queryRunner.query(
      `CREATE INDEX "idx_stats_record_date" ON "stats" USING btree ("record_date") `,
    );
    await queryRunner.query(`ALTER TABLE "stats" DROP COLUMN "status"`);
  }
}
