const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migratoin1692072779181 {
    name = 'Migratoin1692072779181'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "permission_entity" DROP COLUMN "newColumn"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "permission_entity" ADD "newColumn" character varying`);
    }
}
