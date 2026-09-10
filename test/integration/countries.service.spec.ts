import { CountriesService } from '@api/features/climb/countries/countries.service';
import { CountryEntity } from '@api/features/climb/countries/country.entity';
import { setupTestContext } from '../utils/context';
import { paginateQuery } from '../utils/paginate';
import { createCountry, createUser } from '../factories';

type CountryWithUsers = CountryEntity & { usersCount: number };

describe('CountriesService', () => {
  const context = setupTestContext();
  const service = () => context.app.get(CountriesService);

  describe('exists', () => {
    it('recognises a country that is there', async () => {
      const country = await createCountry(context.dataSource);

      expect(await service().exists(country.id)).toBe(true);
    });

    it('rejects an id nothing is stored under', async () => {
      expect(await service().exists(4242)).toBe(false);
    });
  });

  describe('findAll', () => {
    it('answers an empty page on an empty database', async () => {
      const result = await service().findAll(paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('counts the users of every country on the page', async () => {
      const country = await createCountry(context.dataSource, {
        countryname: 'Poland',
      });

      await createCountry(context.dataSource, { countryname: 'Nowhere' });

      await createUser(context.dataSource, { countryId: country.id });
      await createUser(context.dataSource, { countryId: country.id });

      const result = await service().findAll(paginateQuery());
      const counts = (result.data as CountryWithUsers[]).map((entry) => [
        entry.countryname,
        entry.usersCount,
      ]);

      expect(counts).toEqual([
        ['Nowhere', 0],
        ['Poland', 2],
      ]);
    });

    it('does not count users who belong to no country', async () => {
      await createCountry(context.dataSource);
      await createUser(context.dataSource, { countryId: null });

      const [entry] = (await service().findAll(paginateQuery()))
        .data as CountryWithUsers[];

      expect(entry.usersCount).toBe(0);
    });

    it('sorts countries by name unless asked otherwise', async () => {
      await createCountry(context.dataSource, { countryname: 'Zambia' });
      await createCountry(context.dataSource, { countryname: 'Albania' });

      const result = await service().findAll(paginateQuery());

      expect(result.data.map((country) => country.countryname)).toEqual([
        'Albania',
        'Zambia',
      ]);
    });

    it('searches countries by name', async () => {
      await createCountry(context.dataSource, { countryname: 'Poland' });
      await createCountry(context.dataSource, { countryname: 'Finland' });

      const result = await service().findAll(paginateQuery({ search: 'Pol' }));

      expect(result.data.map((country) => country.countryname)).toEqual([
        'Poland',
      ]);
    });
  });
});
