import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameEventsToPositions1788463708421 implements MigrationInterface {
  name = 'RenameEventsToPositions1788463708421';

  // A rename rather than a drop and create, so the rows survive. Indexes and
  // the sequence use IF EXISTS because a database loaded from the SQL dump has
  // neither under those names, while a migrated one does.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" RENAME TO "positions"`);
    await queryRunner.query(
      `ALTER TABLE "positions" RENAME COLUMN "event_date" TO "position_date"`,
    );
    // TypeORM derives foreign key names from the table name, so the ones the
    // old name produced have to be replaced. IF EXISTS covers both spellings:
    // the hash from a migrated database and the *_fkey from a dump-loaded one.
    await queryRunner.query(
      `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "FK_e3482553d3da4edfc74d3f418c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "FK_09f256fb7f9a05f0ed9927f406b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "events_map_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "events_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" ADD CONSTRAINT "FK_2dc2a2c16ec1c05d2f7ed306250" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" ADD CONSTRAINT "FK_4960bf74ea7fea6db05e53989da" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE IF EXISTS "events_id_seq" RENAME TO "positions_id_seq"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_events_map_id" RENAME TO "idx_positions_map_id"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_events_user_id" RENAME TO "idx_positions_user_id"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_events_date" RENAME TO "idx_positions_date"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_events_map_type" RENAME TO "idx_positions_map_type"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_positions_map_type" RENAME TO "idx_events_map_type"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_positions_date" RENAME TO "idx_events_date"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_positions_user_id" RENAME TO "idx_events_user_id"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_positions_map_id" RENAME TO "idx_events_map_id"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE IF EXISTS "positions_id_seq" RENAME TO "events_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "FK_4960bf74ea7fea6db05e53989da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "FK_2dc2a2c16ec1c05d2f7ed306250"`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" ADD CONSTRAINT "FK_e3482553d3da4edfc74d3f418c2" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" ADD CONSTRAINT "FK_09f256fb7f9a05f0ed9927f406b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "positions" RENAME COLUMN "position_date" TO "event_date"`,
    );
    await queryRunner.query(`ALTER TABLE "positions" RENAME TO "events"`);
  }
}
