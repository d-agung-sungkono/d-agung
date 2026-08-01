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
