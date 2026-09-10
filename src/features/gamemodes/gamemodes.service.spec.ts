import { GAMEMODE_DEFINITIONS } from './gamemodes.config';
import { GamemodesService } from './gamemodes.service';

describe('GamemodesService', () => {
  const service = new GamemodesService();

  it('answers with one entry per configured gamemode', () => {
    expect(service.findAll()).toHaveLength(GAMEMODE_DEFINITIONS.length);
  });

  it('keeps the order the configuration lists them in', () => {
    expect(service.findAll().map((gamemode) => gamemode.slug)).toEqual(
      GAMEMODE_DEFINITIONS.map((definition) => definition.slug),
    );
  });

  it('marks a gamemode with a data source behind it as available', () => {
    const available = service
      .findAll()
      .filter((gamemode) => gamemode.available)
      .map((gamemode) => gamemode.slug);

    expect(available).toEqual(
      GAMEMODE_DEFINITIONS.filter(
        (definition) => definition.dataSource !== null,
      ).map((definition) => definition.slug),
    );
  });

  it('marks exactly one gamemode as the default', () => {
    const defaults = service.findAll().filter((gamemode) => gamemode.isDefault);

    expect(defaults).toHaveLength(1);
  });

  it('makes the first available gamemode the default one', () => {
    const [expected] = GAMEMODE_DEFINITIONS.filter(
      (definition) => definition.dataSource !== null,
    );
    const [chosen] = service.findAll().filter((gamemode) => gamemode.isDefault);

    expect(chosen.slug).toBe(expected.slug);
  });

  it('never marks an unavailable gamemode as the default', () => {
    const wrong = service
      .findAll()
      .filter((gamemode) => gamemode.isDefault && !gamemode.available);

    expect(wrong).toEqual([]);
  });

  it('does not hand the data source name out', () => {
    expect(service.findAll()[0]).not.toHaveProperty('dataSource');
  });
});
