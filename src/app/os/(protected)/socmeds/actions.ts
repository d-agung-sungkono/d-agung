'use server'

import { revalidatePath } from 'next/cache'

import { query } from '@/lib/db'
import { getOsUserId } from '@/lib/os-settings'

function nullableValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function revalidateSocmeds() {
  revalidatePath('/os/socmeds')
}

function slugifyGroupName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createAccountGroup(formData: FormData) {
  const userId = await getOsUserId()
  const name = String(formData.get('name') ?? '').trim()
  const description = nullableValue(formData.get('description'))
  const status = String(formData.get('status') ?? 'active')
  const slug = slugifyGroupName(name)

  if (!name || !slug) {
    throw new Error('name is required.')
  }

  const sortOrderResult = await query<{ next_sort_order: number }>(
    `
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
      FROM account_groups
      WHERE user_id = $1
    `,
    [userId]
  )

  await query(
    `
      INSERT INTO account_groups (user_id, name, slug, description, status, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [userId, name, slug, description, status, sortOrderResult.rows[0]?.next_sort_order ?? 0]
  )

  revalidateSocmeds()
}

export async function updateAccountGroup(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const description = nullableValue(formData.get('description'))
  const status = String(formData.get('status') ?? 'active')
  const slug = slugifyGroupName(name)

  if (!id || !name || !slug) {
    throw new Error('id and name are required.')
  }

  await query(
    `
      UPDATE account_groups
      SET
        name = $1,
        slug = $2,
        description = $3,
        status = $4,
        updated_at = now()
      WHERE id = $5
        AND user_id = $6
    `,
    [name, slug, description, status, id, userId]
  )

  revalidateSocmeds()
}

export async function deleteAccountGroup(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')

  if (!id) {
    throw new Error('id is required.')
  }

  await query('DELETE FROM account_groups WHERE id = $1 AND user_id = $2', [id, userId])
  revalidateSocmeds()
}

export async function createUserSocmed(formData: FormData) {
  const userId = await getOsUserId()
  const socmedId = String(formData.get('socmedId') ?? '')
  const accountGroupId = nullableValue(formData.get('accountGroupId'))
  const account = String(formData.get('account') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const linkedEmail = nullableValue(formData.get('linkedEmail'))
  const linkedWhatsapp = nullableValue(formData.get('linkedWhatsapp'))
  const status = String(formData.get('status') ?? 'active')

  if (!socmedId || !account || !label || !url) {
    throw new Error('socmedId, account, label, and url are required.')
  }

  await query(
    `
      INSERT INTO user_socmeds (
        user_id,
        socmed_id,
        account_group_id,
        account,
        label,
        url,
        linked_email,
        linked_whatsapp,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [userId, socmedId, accountGroupId, account, label, url, linkedEmail, linkedWhatsapp, status]
  )

  revalidateSocmeds()
}

export async function updateUserSocmed(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')
  const socmedId = String(formData.get('socmedId') ?? '')
  const accountGroupId = nullableValue(formData.get('accountGroupId'))
  const account = String(formData.get('account') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const linkedEmail = nullableValue(formData.get('linkedEmail'))
  const linkedWhatsapp = nullableValue(formData.get('linkedWhatsapp'))
  const status = String(formData.get('status') ?? 'active')

  if (!id || !socmedId || !account || !label || !url) {
    throw new Error('id, socmedId, account, label, and url are required.')
  }

  await query(
    `
      UPDATE user_socmeds
      SET
        socmed_id = $1,
        account_group_id = $2,
        account = $3,
        label = $4,
        url = $5,
        linked_email = $6,
        linked_whatsapp = $7,
        status = $8,
        updated_at = now()
      WHERE id = $9
        AND user_id = $10
    `,
    [socmedId, accountGroupId, account, label, url, linkedEmail, linkedWhatsapp, status, id, userId]
  )

  revalidateSocmeds()
}

export async function deleteUserSocmed(formData: FormData) {
  const userId = await getOsUserId()
  const id = String(formData.get('id') ?? '')

  if (!id) {
    throw new Error('id is required.')
  }

  await query('DELETE FROM user_socmeds WHERE id = $1 AND user_id = $2', [id, userId])
  revalidateSocmeds()
}
