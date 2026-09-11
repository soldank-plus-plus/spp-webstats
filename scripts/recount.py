#!/usr/bin/env python3
"""Recount the aggregate columns in the climb database (PostgreSQL).

A wrapper around recount.sql. The SQL stays there and is the only place the
counting logic lives, so it is not duplicated here. What this script adds are
the things a plain .sql file cannot do comfortably:

  * --dry-run, a preview that writes nothing: the recount runs inside a
    transaction that is rolled back, and only reports how many rows it would
    have touched
  * a before/after report, so it is visible what actually moved
  * safe removal of users and maps (--delete-user / --delete-map), which
    handles the order the foreign keys demand and then recounts

What gets recounted:
  users      gold, silver, bronze, no_medal, unique_caps, total_caps,
             maps_created, hardest, playtime
  clans      gold, silver, bronze, unique_caps, total_caps, maps_created, hardest
  countries  same as clans
  stats      position, a player's place on a map, which is what medals derive from

What is left alone:
  positions     A history log of who took, improved or lost a place, not an
                aggregate, so rebuilding it would overwrite history. Rows are
                only removed by --delete-user/--delete-map, and only the ones
                belonging to what is being deleted.
  maps.hardest  A curated difficulty list, not an aggregate.

Connects through psql inside the docker container, because no PostgreSQL
driver is installed system wide. Settings default to the .env in the repo
root and can be overridden by flags.

Examples:
    python3 scripts/recount.py --dry-run
    python3 scripts/recount.py
    python3 scripts/recount.py --delete-user "ltz .Juice" --delete-user 5533
    python3 scripts/recount.py --delete-map ctf_lysy_throw --yes
"""

import argparse
import os
import re
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
RECOUNT_SQL = os.path.join(BASE, 'recount.sql')
ENV_FILE = os.path.abspath(os.path.join(BASE, '..', '.env'))

# The leading ordinal only sorts the report. UNION ALL returns rows in no
# guaranteed order, and without it the table jumped between runs.
SUMMARY_SQL = """
SELECT * FROM (
SELECT 1 AS ord, 'users',     count(*), coalesce(sum(gold),0), coalesce(sum(silver),0),
       coalesce(sum(bronze),0), coalesce(sum(unique_caps),0),
       coalesce(sum(total_caps),0), coalesce(sum(maps_created),0),
       coalesce(sum(hardest),0)
FROM users
UNION ALL SELECT 2, 'clans', count(*), coalesce(sum(gold),0), coalesce(sum(silver),0),
       coalesce(sum(bronze),0), coalesce(sum(unique_caps),0),
       coalesce(sum(total_caps),0), coalesce(sum(maps_created),0),
       coalesce(sum(hardest),0)
FROM clans
UNION ALL SELECT 3, 'countries', count(*), coalesce(sum(gold),0), coalesce(sum(silver),0),
       coalesce(sum(bronze),0), coalesce(sum(unique_caps),0),
       coalesce(sum(total_caps),0), coalesce(sum(maps_created),0),
       coalesce(sum(hardest),0)
FROM countries
UNION ALL SELECT 4, 'stats', count(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM stats
UNION ALL SELECT 5, 'positions', count(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM positions
UNION ALL SELECT 6, 'maps', count(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM maps
) s ORDER BY ord;
"""

SUMMARY_COLUMNS = ['tabela', 'wierszy', 'gold', 'silver', 'bronze',
                   'unique_caps', 'total_caps', 'maps_created', 'hardest']


def read_env(path):
    """Read the DB_* settings out of an .env file, missing file included"""
    settings = {}
    if not os.path.exists(path):
        return settings

    with open(path, encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            settings[key.strip()] = value.strip().strip('"').strip("'")

    return settings


def find_container(port):
    """Find the postgres container published on the given port.

    Two of them normally run here, development on 5432 and the test one on
    5433, so the port is what tells them apart. Without it the script would
    ask which one every time, or worse, pick the test database.
    """
    result = subprocess.run(
        ['docker', 'ps', '--format', '{{.Names}}\t{{.Image}}\t{{.Ports}}'],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.exit("nie moge odpytac dockera, jest w ogole uruchomiony?")

    postgres = [line.split('\t') for line in result.stdout.splitlines()
                if 'postgres' in line.lower()]

    if not postgres:
        sys.exit("Nie znalazlem chodzacego kontenera z postgresem. "
                 "Podaj recznie: --container NAZWA")

    on_port = [row[0] for row in postgres
               if len(row) > 2 and f':{port}->' in row[2]]

    if len(on_port) == 1:
        return on_port[0]
    if len(on_port) > 1:
        sys.exit(f"Kilka kontenerow na porcie {port}: {on_port}. "
                 f"Wybierz: --container NAZWA")

    names = [row[0] for row in postgres]
    if len(names) == 1:
        return names[0]

    sys.exit(f"Zaden kontener nie wystawia portu {port}. "
             f"Kandydaci: {names}. Wybierz: --container NAZWA")


class Psql:
    def __init__(self, container, user, database, password):
        self.container = container
        self.user = user
        self.database = database
        self.password = password

    def run(self, sql, *, extra_args=(), check=True):
        cmd = ['docker', 'exec', '-i',
               '-e', f'PGPASSWORD={self.password}',
               self.container, 'psql',
               '-U', self.user, '-d', self.database,
               '-v', 'ON_ERROR_STOP=1', *extra_args]

        result = subprocess.run(cmd, input=sql, capture_output=True, text=True)

        if check and result.returncode != 0:
            sys.stderr.write(result.stdout)
            sys.stderr.write(result.stderr)
            sys.exit(f"psql zwrocil blad (kod {result.returncode})")

        return result

    def rows(self, sql, *, drop_first=False):
        """Return rows as lists of strings, unaligned and tab separated.

        drop_first strips the ordinal column that only exists for sorting.
        """
        out = self.run(sql, extra_args=['-t', '-A', '-F', '\t']).stdout
        rows = [line.split('\t') for line in out.splitlines() if line.strip()]
        return [row[1:] for row in rows] if drop_first else rows

    def scalar(self, sql):
        rows = self.rows(sql)
        return rows[0][0] if rows else None


def print_table(headers, rows):
    if not rows:
        return
    widths = [max(len(str(headers[i])), max(len(str(r[i])) for r in rows))
              for i in range(len(headers))]
    line = '  '.join(str(h).ljust(widths[i]) for i, h in enumerate(headers))
    print('  ' + line.rstrip())
    print('  ' + '  '.join('-' * w for w in widths))
    for row in rows:
        print('  ' + '  '.join(str(c).ljust(widths[i]) for i, c in enumerate(row)).rstrip())


def print_diff(before, after):
    """Put the two reports side by side and show the change in brackets"""
    by_name = {row[0]: row for row in before}
    rows = []

    for row in after:
        out = [row[0]]
        old = by_name.get(row[0])
        for i in range(1, len(row)):
            # Tables with no aggregate columns (stats, positions, maps) hold
            # NULL here, which psql hands back as an empty string
            if not row[i].strip():
                out.append('')
                continue
            new_value = int(row[i])
            if old is None or not old[i].strip():
                out.append(str(new_value))
                continue
            delta = new_value - int(old[i])
            out.append(f"{new_value} ({delta:+})" if delta else str(new_value))
        rows.append(out)

    print_table(SUMMARY_COLUMNS, rows)


def resolve(psql, kind, token):
    """Turn an id or a name into an id, refusing an ambiguous name"""
    table, column = ('users', 'username') if kind == 'user' else ('maps', 'mapname')

    if token.isdigit():
        found = psql.rows(f"SELECT id FROM {table} WHERE id = {int(token)};")
        if not found:
            sys.exit(f"{kind} o id {token} nie istnieje")
        return int(token)

    literal = token.replace("'", "''")
    found = psql.rows(f"SELECT id FROM {table} WHERE {column} = '{literal}';")

    if not found:
        sys.exit(f"{kind}: nie ma wiersza o {column} = {token!r}")
    # Map names are not unique, so a name can legitimately match several rows
    if len(found) > 1:
        ids = ', '.join(row[0] for row in found)
        sys.exit(f"{kind}: {token!r} pasuje do kilku wierszy (id: {ids}). "
                 f"Podaj konkretne id.")

    return int(found[0][0])


def preview_deletions(psql, user_ids, map_ids):
    """Show what is about to go, and whether there is anything at all"""
    anything = False

    for user_id in user_ids:
        name = psql.scalar(f"SELECT username FROM users WHERE id = {user_id};")
        counts = psql.rows(f"""
            SELECT (SELECT count(*) FROM stats WHERE user_id = {user_id}),
                   (SELECT count(*) FROM positions WHERE user_id = {user_id}),
                   (SELECT count(*) FROM map_creators WHERE user_id = {user_id}),
                   (SELECT count(*) FROM clan_creators WHERE user_id = {user_id});
        """)[0]
        print(f"  user {user_id} {name!r}: {counts[0]} stats, {counts[1]} positions, "
              f"{counts[2]} map_creators, {counts[3]} clan_creators")
        anything = True

    for map_id in map_ids:
        name = psql.scalar(f"SELECT mapname FROM maps WHERE id = {map_id};")
        counts = psql.rows(f"""
            SELECT (SELECT count(*) FROM stats WHERE map_id = {map_id}),
                   (SELECT count(*) FROM positions WHERE map_id = {map_id}),
                   (SELECT count(*) FROM map_creators WHERE map_id = {map_id});
        """)[0]
        print(f"  mapa {map_id} {name!r}: {counts[0]} stats, {counts[1]} positions, "
              f"{counts[2]} map_creators")
        anything = True

    return anything


def build_delete_sql(user_ids, map_ids):
    """Delete in the order the foreign keys demand, referencing rows first.

    stats and positions are ON DELETE NO ACTION, so they block the parent row
    until they are gone. map_creators and clan_creators would cascade on their
    own, but clearing them explicitly costs nothing and saves the question.
    """
    parts = ['BEGIN;']

    if map_ids:
        ids = ', '.join(str(i) for i in map_ids)
        parts += [
            f"DELETE FROM stats        WHERE map_id IN ({ids});",
            f"DELETE FROM positions    WHERE map_id IN ({ids});",
            f"DELETE FROM map_creators WHERE map_id IN ({ids});",
        ]

    if user_ids:
        ids = ', '.join(str(i) for i in user_ids)
        parts += [
            f"DELETE FROM stats         WHERE user_id IN ({ids});",
            f"DELETE FROM positions     WHERE user_id IN ({ids});",
            f"DELETE FROM map_creators  WHERE user_id IN ({ids});",
            f"DELETE FROM clan_creators WHERE user_id IN ({ids});",
        ]

    if map_ids:
        parts.append(f"DELETE FROM maps WHERE id IN ({', '.join(str(i) for i in map_ids)});")
    if user_ids:
        parts.append(f"DELETE FROM users WHERE id IN ({', '.join(str(i) for i in user_ids)});")

    parts.append('COMMIT;')
    return '\n'.join(parts)


def main():
    parser = argparse.ArgumentParser(
        description='Przelicza statystyki w bazie climb po recznych zmianach.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split('Examples:')[-1],
    )
    parser.add_argument('--dry-run', action='store_true',
                        help='podglad: pokazuje, co by sie zmienilo, i nic nie zapisuje')
    parser.add_argument('--delete-user', action='append', default=[], metavar='NICK|ID',
                        help='usun uzytkownika razem z jego capami (mozna podac wiele razy)')
    parser.add_argument('--delete-map', action='append', default=[], metavar='NAZWA|ID',
                        help='usun mape razem z capami na niej (mozna podac wiele razy)')
    parser.add_argument('--yes', '-y', action='store_true',
                        help='nie pytaj o potwierdzenie kasowania')
    parser.add_argument('--container', help='nazwa kontenera z postgresem')
    parser.add_argument('--port', help='port, po ktorym szukac kontenera (domyslnie z .env)')
    parser.add_argument('--database', help='nazwa bazy (domyslnie z .env)')
    parser.add_argument('--user', help='uzytkownik bazy (domyslnie z .env)')
    parser.add_argument('--password', help='haslo (domyslnie z .env)')
    args = parser.parse_args()

    if args.dry_run and (args.delete_user or args.delete_map):
        sys.exit("--dry-run nie laczy sie z kasowaniem, najpierw skasuj, potem przelicz")

    if not os.path.exists(RECOUNT_SQL):
        sys.exit(f"brak {RECOUNT_SQL}")

    env = read_env(ENV_FILE)
    psql = Psql(
        container=args.container or find_container(args.port or env.get('DB_PORT', '5432')),
        user=args.user or env.get('DB_USER', 'postgres'),
        database=args.database or env.get('DB_DATABASE', 'spp'),
        password=args.password or env.get('DB_PASSWORD', 'postgres'),
    )
    print(f"baza: {psql.database} @ {psql.container}\n")

    before = psql.rows(SUMMARY_SQL, drop_first=True)

    if args.delete_user or args.delete_map:
        user_ids = [resolve(psql, 'user', t) for t in args.delete_user]
        map_ids = [resolve(psql, 'map', t) for t in args.delete_map]

        print("Do usuniecia:")
        preview_deletions(psql, user_ids, map_ids)

        if not args.yes:
            answer = input("\nKasowac? Tego sie nie cofnie. [t/N] ").strip().lower()
            if answer not in ('t', 'tak', 'y', 'yes'):
                sys.exit("przerwane, nic nie ruszone")

        psql.run(build_delete_sql(user_ids, map_ids))
        print("usuniete\n")

    with open(RECOUNT_SQL, encoding='utf-8') as handle:
        sql = handle.read()

    if args.dry_run:
        # Nothing is written: the summary from the end of the file is pulled in
        # ahead of the ROLLBACK so it reports the values computed inside this
        # transaction rather than the stale ones from before it.
        head, sep, tail = sql.partition('\nCOMMIT;\n')
        if not sep:
            sys.exit("nie znalazlem COMMIT; w recount.sql, nie umiem zrobic dry-run")
        sql = f"{head}\n{tail}\nROLLBACK;\n"

    result = psql.run(sql)
    updates = [int(m) for m in re.findall(r'^UPDATE (\d+)$', result.stdout, re.M)]

    # Matches the order the UPDATE statements appear in recount.sql
    labels = ['stats.position', 'users', 'clans', 'countries']
    print("Zaktualizowane wiersze:")
    print_table(['co', 'wierszy'],
                [[labels[i] if i < len(labels) else f'krok {i + 1}', n]
                 for i, n in enumerate(updates)])

    after = before if args.dry_run else psql.rows(SUMMARY_SQL, drop_first=True)
    if args.dry_run:
        print("\nDRY RUN, nic nie zapisane, transakcja wycofana.")
        print("Powyzsze liczby pokazuja, ile wierszy by sie zmienilo.")
    else:
        print("\nStan po przeliczeniu (w nawiasie zmiana):")
        print_diff(before, after)

    if not args.dry_run and not any(updates):
        print("\nNic sie nie zmienilo, statystyki byly juz aktualne.")


if __name__ == '__main__':
    main()
