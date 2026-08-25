import { MigrationInterface, QueryRunner } from 'typeorm';

export class MapsAndUsersRework1787671510096 implements MigrationInterface {
  name = 'MapsAndUsersRework1787671510096';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "loop"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "sprint"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "rloop"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "rsprint"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "hns"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "ctf"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "htf"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "inf"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "reversed"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "race"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "runmode"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "duplicate"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "total_points"`);
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "anticoop" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "jets" integer DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "maps" ADD "m79" integer DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "nade" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "switch" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "coop" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "m79c" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "hardest" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "total_caps" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "hardest" integer DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "created_at" bigint`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_active_at"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "last_active_at" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_active_at"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "last_active_at" integer`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "created_at" integer`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hardest"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "total_caps"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "hardest"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "m79c"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "coop"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "switch"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "nade"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "m79"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "jets"`);
    await queryRunner.query(`ALTER TABLE "maps" DROP COLUMN "anticoop"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "total_points" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "duplicate" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "runmode" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "race" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "reversed" integer DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "maps" ADD "inf" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "maps" ADD "htf" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "maps" ADD "ctf" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "maps" ADD "hns" integer DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "rsprint" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "rloop" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "sprint" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "maps" ADD "loop" integer DEFAULT '0'`,
    );
  }
}
