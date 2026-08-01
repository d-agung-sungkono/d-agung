import process from 'node:process'
import { spawnSync } from 'node:child_process'
import pg from 'pg'

import { getPgSslConfig, loadEnvFile } from './env.mjs'

const { Client } = pg

loadEnvFile()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
  process.exit(1)
}

const profileUrl = process.argv[2] ?? 'https://www.tiktok.com/@d.agung.sungkono'
const username = process.env.OS_USERNAME ?? 'd.agung'
const tiktokAccount = profileUrl.split('@')[1]?.split(/[/?#]/)[0]

if (!tiktokAccount) {
  console.error('TikTok profile URL must include @username.')
  process.exit(1)
}

const scrapeResult = spawnSync(
  'python3',
  ['-m', 'yt_dlp', '--flat-playlist', '--dump-json', profileUrl],
  {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  }
)

if (scrapeResult.status !== 0) {
  console.error(scrapeResult.stderr || scrapeResult.stdout)
  process.exit(scrapeResult.status ?? 1)
}

const videos = scrapeResult.stdout
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((item) => item.id && item.url && item.timestamp)

if (!videos.length) {
  console.error('No TikTok videos found.')
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: getPgSslConfig(),
})

function getScheduledAt(video) {
  return new Date(video.timestamp * 1000).toISOString()
}

await client.connect()

try {
  await client.query('BEGIN')

  const accountResult = await client.query(
    `
      SELECT us.id, us.user_id
      FROM user_socmeds us
      INNER JOIN os_users ou ON ou.id = us.user_id
      INNER JOIN socmeds s ON s.id = us.socmed_id
      WHERE ou.username = $1
        AND s.name = 'TikTok'
        AND us.account = $2
      LIMIT 1
    `,
    [username, tiktokAccount]
  )
  const account = accountResult.rows[0]

  if (!account) {
    throw new Error(`Cannot find TikTok account @${tiktokAccount} for OS user ${username}.`)
  }

  await client.query(
    `
      DELETE FROM content_posts
      WHERE user_id = $1
        AND user_socmed_id = $2
    `,
    [account.user_id, account.id]
  )

  for (const video of videos) {
    await client.query(
      `
        INSERT INTO content_posts (
          user_id,
          user_socmed_id,
          source_key,
          title,
          url,
          scheduled_at,
          published_at,
          status,
          notes,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $6, 'published', $7, $8::jsonb)
        ON CONFLICT (user_id, source_key)
        DO UPDATE SET
          user_socmed_id = EXCLUDED.user_socmed_id,
          title = EXCLUDED.title,
          url = EXCLUDED.url,
          scheduled_at = EXCLUDED.scheduled_at,
          published_at = EXCLUDED.published_at,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          metadata = EXCLUDED.metadata,
          updated_at = now()
      `,
      [
        account.user_id,
        account.id,
        `tiktok:${video.id}`,
        video.title || video.description || `TikTok ${video.id}`,
        video.url,
        getScheduledAt(video),
        video.description ?? null,
        JSON.stringify({
          commentCount: video.comment_count ?? null,
          duration: video.duration ?? null,
          likeCount: video.like_count ?? null,
          saveCount: video.save_count ?? null,
          scraper: 'yt-dlp',
          tiktokId: video.id,
          uploadDate: video.upload_date ?? null,
          viewCount: video.view_count ?? null,
        }),
      ]
    )
  }

  await client.query('COMMIT')
  console.log(`imported ${videos.length} TikTok videos for @${tiktokAccount}`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}
