# sql/

Every statement that has changed the PropertyPulse database, in the order it was run.

| File | What it does | Status |
|---|---|---|
| `001_schema.sql` | The nine tables | applied |
| `002_rls.sql` | Row level security, all nine tables | applied |
| `003_policy_cleanup.sql` | Drops two redundant profile policies, adds `custom_rules.archived` | pending |
| `checks.sql` | Read-only verification queries. Not a migration. | run any time |

## The rule

If a statement changes the database, it belongs in a numbered file here **before** it gets pasted into Supabase. If it only reads, it belongs in `checks.sql`.

Supabase's query history is a log of what was typed, not a description of the schema. It cannot be replayed reliably and it won't tell you the current state. These files can and do — running 001, 002 and 003 in order against an empty Supabase project reproduces the database exactly. That matters the day the project is deleted, or a second one is needed for testing, or a recruiter asks how the schema came to look like this.

Numbered files are never edited after they are applied. A mistake in an applied file gets a new file that corrects it, which is why `003` exists rather than `002` being quietly patched. The sequence is a history, and rewriting history is how the file stops matching the database.
