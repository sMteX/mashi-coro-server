import Seeder from '@utils/interfaces/seeder.interface';

export class DatabaseSeeder implements Seeder {
    async run(): Promise<void> {
        await this.call([]);
    }

    private async call(seeders): Promise<void> {
        for (const seeder of seeders) {
            const seed = new seeder();
            await seed.run();
        }
    }
}
