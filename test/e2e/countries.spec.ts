import request from 'supertest';
import { setupTestContext } from '../utils/context';
import { createCountry, createUser } from '../factories';

describe('climb/countries', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  describe('GET /climb/countries', () => {
    it('answers an empty page when there are no countries', async () => {
      const { body } = await get('/climb/countries').expect(200);

      expect(body.data).toEqual([]);
    });

    it('returns the countries with the number of users behind them', async () => {
      const country = await createCountry(context.dataSource, {
        countryname: 'Poland',
        code: 'pl',
        gold: 7,
      });

      await createUser(context.dataSource, { countryId: country.id });

      const { body } = await get('/climb/countries').expect(200);

      expect(body.data).toEqual([
        {
          id: country.id,
          countryname: 'Poland',
          code: 'pl',
          gold: 7,
          silver: 0,
          bronze: 0,
          uniqueCaps: 0,
          totalCaps: 0,
          mapsCreated: 0,
          hardest: 0,
          usersCount: 1,
        },
      ]);
    });

    it('sorts countries by name', async () => {
      await createCountry(context.dataSource, { countryname: 'Zambia' });
      await createCountry(context.dataSource, { countryname: 'Albania' });

      const { body } = await get('/climb/countries').expect(200);

      expect(
        body.data.map(
          (country: { countryname: string }) => country.countryname,
        ),
      ).toEqual(['Albania', 'Zambia']);
    });

    it('searches countries by name', async () => {
      await createCountry(context.dataSource, { countryname: 'Poland' });
      await createCountry(context.dataSource, { countryname: 'Finland' });

      const { body } = await get('/climb/countries?search=Pol').expect(200);

      expect(
        body.data.map(
          (country: { countryname: string }) => country.countryname,
        ),
      ).toEqual(['Poland']);
    });
  });

  describe('GET /climb/countries/:countryId/users', () => {
    it('returns the users of that country, best first', async () => {
      const country = await createCountry(context.dataSource);
      const other = await createCountry(context.dataSource);

      await createUser(context.dataSource, {
        username: 'weaker',
        countryId: country.id,
        uniqueCaps: 1,
      });
      await createUser(context.dataSource, {
        username: 'stronger',
        countryId: country.id,
        uniqueCaps: 30,
      });
      await createUser(context.dataSource, {
        username: 'foreigner',
        countryId: other.id,
      });

      const { body } = await get(`/climb/countries/${country.id}/users`).expect(
        200,
      );

      expect(
        body.data.map((user: { username: string }) => user.username),
      ).toEqual(['stronger', 'weaker']);
    });

    it('answers 404 for a country that does not exist', async () => {
      const { body } = await get('/climb/countries/999/users').expect(404);

      expect(body.message).toBe('Country not found');
    });

    it('answers an empty page for a country nobody plays from', async () => {
      const country = await createCountry(context.dataSource);

      const { body } = await get(`/climb/countries/${country.id}/users`).expect(
        200,
      );

      expect(body.data).toEqual([]);
    });

    it('answers 400 for a country id that is not a number', async () => {
      await get('/climb/countries/abc/users').expect(400);
    });
  });
});
