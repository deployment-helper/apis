const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migratoin1692072004697 {
    name = 'Migratoin1692072004697'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "permission_entity" ADD "newColumn" character varying`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "permission_entity" DROP COLUMN "newColumn"`);
    }
}
