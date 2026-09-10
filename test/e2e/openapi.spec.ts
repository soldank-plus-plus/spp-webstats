import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { OpenAPIObject } from '@nestjs/swagger';
import { createTestApp } from '../utils/app';

// Only the shape the generated frontend client depends on is asserted here, not
// the wording of any description
const EXPECTED_PATHS = [
  '/gamemodes',
  '/climb/maps',
  '/climb/maps/{id}',
  '/climb/maps/by-user/{userId}',
  '/climb/maps/{mapId}/positions',
  '/climb/maps/{mapId}/stats',
  '/climb/positions',
  '/climb/stats',
  '/climb/users',
  '/climb/users/{id}',
  '/climb/users/by-username/{username}',
  '/climb/users/{userId}/positions',
  '/climb/users/{userId}/stats',
  '/climb/users/{id}/activity',
  '/climb/clans',
  '/climb/clans/{clanId}',
  '/climb/clans/{clanId}/users',
  '/climb/clans/{clanId}/records-history',
  '/climb/countries',
  '/climb/countries/{countryId}/users',
];

describe('openapi document', () => {
  let app: NestExpressApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    app = await createTestApp();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('API documentation')
        .setVersion('1.0')
        .build(),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('describes every route the api serves', () => {
    expect(Object.keys(document.paths).sort()).toEqual(
      [...EXPECTED_PATHS].sort(),
    );
  });

  it('describes read only routes and nothing else', () => {
    const methods = Object.values(document.paths).flatMap((path) =>
      Object.keys(path),
    );

    expect([...new Set(methods)]).toEqual(['get']);
  });

  it('documents the rate limit on every operation', () => {
    const undocumented = Object.entries(document.paths).filter(
      ([, path]) => !path.get?.responses['429'],
    );

    expect(undocumented.map(([route]) => route)).toEqual([]);
  });

  it('documents the data envelope a single resource comes back in', () => {
    const schema = document.paths['/climb/users/{id}'].get?.responses['200'];

    expect(schema).toMatchObject({
      content: {
        'application/json': {
          schema: {
            properties: {
              data: { $ref: '#/components/schemas/FindOneUserDto' },
            },
          },
        },
      },
    });
  });

  it('documents an array resource as an array inside the envelope', () => {
    const schema = document.paths['/gamemodes'].get?.responses['200'];

    expect(schema).toMatchObject({
      content: {
        'application/json': {
          schema: {
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/FindAllGamemodesDto' },
              },
            },
          },
        },
      },
    });
  });

  it('documents the paginated envelope with its meta and links', () => {
    const paginated = document.components?.schemas?.PaginatedDocumented as {
      properties: Record<string, unknown>;
    };

    expect(Object.keys(paginated.properties)).toEqual(
      expect.arrayContaining(['data', 'meta', 'links']),
    );
  });

  it('types the rows of a paginated listing', () => {
    const schema = document.paths['/climb/users'].get?.responses['200'];

    expect(schema).toMatchObject({
      content: {
        'application/json': {
          schema: {
            allOf: [
              { $ref: '#/components/schemas/PaginatedDocumented' },
              {
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FindAllUsersDto' },
                  },
                },
              },
            ],
          },
        },
      },
    });
  });

  it('describes the query parameters a paginated listing takes', () => {
    const parameters = (
      document.paths['/climb/users'].get?.parameters ?? []
    ).map((parameter) => (parameter as { name: string }).name);

    expect(parameters).toEqual(
      expect.arrayContaining(['page', 'limit', 'sortBy', 'search']),
    );
  });

  it('describes the creator filter maps accept', () => {
    const parameters = (
      document.paths['/climb/maps'].get?.parameters ?? []
    ).map((parameter) => (parameter as { name: string }).name);

    expect(parameters).toContain('creator');
  });

  it('describes the activity query as an enum with an optional year', () => {
    const parameters = (document.paths['/climb/users/{id}/activity'].get
      ?.parameters ?? []) as {
      name: string;
      required: boolean;
      schema: { enum?: string[] };
    }[];
    const type = parameters.find((parameter) => parameter.name === 'type');
    const year = parameters.find((parameter) => parameter.name === 'year');

    expect(type?.required).toBe(true);
    expect(type?.schema.enum).toEqual([
      'records',
      'golds',
      'silvers',
      'bronzes',
    ]);
    expect(year?.required).toBe(false);
  });

  it('keeps entity only fields out of the published schemas', () => {
    const schemas = JSON.stringify(document.components?.schemas ?? {});

    expect(schemas).not.toContain('createdMaps');
    expect(schemas).not.toContain('createdClans');
    expect(schemas).not.toContain('noMedalCount');
  });

  it('publishes the user schema the frontend generates its types from', () => {
    const user = document.components?.schemas?.FindAllUsersDto as {
      properties: Record<string, unknown>;
    };

    expect(Object.keys(user.properties)).toEqual(
      expect.arrayContaining([
        'id',
        'username',
        'clanId',
        'countryId',
        'gold',
        'uniqueCaps',
        'passed',
      ]),
    );
  });
});
