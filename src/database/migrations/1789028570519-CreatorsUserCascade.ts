import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatorsUserCascade1789028570519 implements MigrationInterface {
  name = 'CreatorsUserCascade1789028570519';

  // Both join tables were created with NO ACTION on their user_id, while the
  // @JoinTable entities describe the cascade TypeORM gives a many-to-many. The
  // schema and the entities therefore disagreed, which left every generated
  // migration carrying these four statements, and deleting a user who had made
  // a map or founded a clan failed on the foreign key instead of dropping the
  // authorship rows.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clan_creators" DROP CONSTRAINT "FK_1eab1279264e68efe5af8758c5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_creators" DROP CONSTRAINT "FK_30b6e0677dd51daa0b09ce0fab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clan_creators" ADD CONSTRAINT "FK_1eab1279264e68efe5af8758c5a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_creators" ADD CONSTRAINT "FK_30b6e0677dd51daa0b09ce0fab4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "map_creators" DROP CONSTRAINT "FK_30b6e0677dd51daa0b09ce0fab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clan_creators" DROP CONSTRAINT "FK_1eab1279264e68efe5af8758c5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "map_creators" ADD CONSTRAINT "FK_30b6e0677dd51daa0b09ce0fab4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clan_creators" ADD CONSTRAINT "FK_1eab1279264e68efe5af8758c5a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
