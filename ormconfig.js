const config = require('config');
const db = config.get('db');

let returnObj;

if (process.env.NODE_ENV === 'production') {
    returnObj = {
        type: 'postgres',
        ssl: true,
        // extra: {
        //     ssl: true,
        // }
        url: db.url,
        synchronize: false,
        logging: true,
        entities: ["dist/**/*.entity{.ts,.js}"],
        migrationsTableName: "custom_migration_table",
        migrations: ["dist/database/migrations/*{.ts,.js}"],
        cli: {
            entitiesDir: "src/**/*.entity.ts",
            migrationsDir: "src/database/migrations"
        }
    }
} else {
    returnObj = {
        type: db.type || "postgres",
        host: db.host || "localhost",
        port: db.port || 5432,
        username: db.username || "postgres",
        password: db.password || "",
        database: db.database || "mashi_coro",
        synchronize: db.synchronize || false,
        logging: db.logging || false,
        entities: ["dist/**/*.entity{.ts,.js}"],
        migrationsTableName: "custom_migration_table",
        migrations: ["dist/database/migrations/*{.ts,.js}"],
        cli: {
            entitiesDir: "src/**/*.entity.ts",
            migrationsDir: "src/database/migrations"
        },
    }
}

module.exports = returnObj;
