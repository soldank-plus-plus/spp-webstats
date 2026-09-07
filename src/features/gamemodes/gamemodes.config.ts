export interface GamemodeDefinition {
  slug: string;
  name: string;
  // Every mode is backed by its own Postgres database (climb.sql, runmode.sql,
  // ctf.sql) etc., because the schemas differ between them. A mode stays
  // unavailable until the data source holding its database is configured
  dataSource: string | null;
}

export const GAMEMODE_DEFINITIONS: GamemodeDefinition[] = [
  { slug: 'climb', name: 'Climb', dataSource: 'default' },
  { slug: 'capture-the-flag', name: 'Capture The Flag', dataSource: null },
  { slug: 'runmode', name: 'Runmode', dataSource: null },
];
