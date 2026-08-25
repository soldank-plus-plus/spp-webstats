import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventDateBigint1787667958549 implements MigrationInterface {
  name = 'EventDateBigint1787667958549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_events_date"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "event_date"`);
    await queryRunner.query(`ALTER TABLE "events" ADD "event_date" bigint`);
    await queryRunner.query(
      `CREATE INDEX "idx_events_date" ON "events"  ("event_date") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_events_date"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "event_date"`);
    await queryRunner.query(`ALTER TABLE "events" ADD "event_date" integer`);
    await queryRunner.query(
      `CREATE INDEX "idx_events_date" ON "events" USING btree ("event_date") `,
    );
  }
}
