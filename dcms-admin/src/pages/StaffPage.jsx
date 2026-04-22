import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { subscribeToCollection } from '../services/firestoreService'
import {
  activateStaff,
  createStaffWithAuthAndProfile,
  deactivateStaff,
  deleteStaffProfile,
  updateStaffProfile,
} from '../services/staffService'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

const emptyForm = {
  name: '',
  email: '',
  role: 'staff',
  password: '',
}

const toDate = (value) => {
  if (!value) return null
  if (value?.toDate) return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const StaffPage = () => {
  const { user } = useAuth()
  const { confirm, confirmationDialog } = useConfirmDialog()
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')

  const displayedStaff = useMemo(
    () => staff.filter((member) => member.role !== 'admin' && member.role !== 'owner'),
    [staff],
  )

  useEffect(() => {
    const unsubscribe = subscribeToCollection(
      'staff',
      [],
      (records) => {
        const sorted = [...records].sort((a, b) => {
          const aDate = toDate(a.createdAt)
          const bDate = toDate(b.createdAt)
          if (!aDate && !bDate) return 0
          if (!aDate) return 1
          if (!bDate) return -1
          return bDate.getTime() - aDate.getTime()
        })
        setStaff(sorted)
      },
      (error) =>
        setLoadError(
          `Unable to load records (${error?.code || 'unknown'}): ${error?.message || 'Please check Firestore rules and try again.'}`,
        ),
    )

    return unsubscribe
  }, [])

  const submitLabel = useMemo(() => {
    if (editingId) return 'Update'
    return 'Create'
  }, [editingId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const isEditing = Boolean(editingId)

    const confirmed = await confirm({
      title: isEditing ? 'Update Record' : 'Create Account',
      message: isEditing
        ? 'Confirm updating this record?'
        : 'Confirm creating this account?',
      confirmText: isEditing ? 'Update' : 'Create',
      tone: 'primary',
    })

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      if (editingId) {
        await updateStaffProfile(user, editingId, {
          name: form.name,
          role: form.role,
        })
        setMessage('Record updated successfully.')
      } else {
        await createStaffWithAuthAndProfile(user, { ...form, status: 'active' })
        setMessage('Account created successfully.')
      }

      resetForm()
    } catch (error) {
      setMessage(error.message || 'Unable to save this record.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (record) => {
    const confirmed = await confirm({
      title: 'Edit Record',
      message: `Edit profile for ${record.name || 'this member'}?`,
      confirmText: 'Edit',
      tone: 'primary',
    })

    if (!confirmed) {
      return
    }

    setEditingId(record.id)
    setForm({
      name: record.name || '',
      email: record.email || '',
      role: record.role || 'staff',
      password: '',
    })
  }

  const handleDeactivate = async (staffId) => {
    const confirmed = await confirm({
      title: 'Deactivate Account',
      message: 'Deactivate this account?',
      confirmText: 'Deactivate',
      tone: 'warning',
    })

    if (!confirmed) {
      return
    }

    await deactivateStaff(user, staffId)
  }

  const handleActivate = async (staffId) => {
    const confirmed = await confirm({
      title: 'Activate Account',
      message: 'Activate this account?',
      confirmText: 'Activate',
      tone: 'primary',
    })

    if (!confirmed) {
      return
    }

    await activateStaff(user, staffId)
  }

  const handleDelete = async (staffId) => {
    const confirmed = await confirm({
      title: 'Delete Record',
      message: 'Delete this record? This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    await deleteStaffProfile(user, staffId)
  }

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Account Form</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add team members and create authentication credentials.
          </p>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
              placeholder="Email address"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />

            {editingId ? (
              <p className="text-xs text-slate-500">
                Email cannot be changed here to avoid authentication mismatch.
              </p>
            ) : null}

            {!editingId ? (
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
              />
            ) : null}

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            >
              <option value="staff">Staff</option>
              <option value="dentist">Dentist</option>
            </select>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? 'Saving...' : submitLabel}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          {message ? (
            <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
              {message}
            </p>
          ) : null}
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadError ? (
            <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedStaff.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{record.name}</td>
                    <td className="px-4 py-3">{record.email}</td>
                    <td className="px-4 py-3 capitalize">{record.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          record.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="flex items-center gap-2 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="rounded-lg bg-cyan-500 px-3 py-1.5 font-semibold text-white hover:bg-cyan-600"
                      >
                        Edit
                      </button>

                      {record.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(record.id)}
                          className="rounded-lg bg-orange-500 px-3 py-1.5 font-semibold text-white hover:bg-orange-600"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(record.id)}
                          className="rounded-lg bg-green-500 px-3 py-1.5 font-semibold text-white hover:bg-green-600"
                        >
                          Activate
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!staff.length ? (
                  <tr>
                    <td className="px-4 py-5 text-sm text-slate-500" colSpan={5}>
                      No records found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {confirmationDialog}
    </>
  )
}

export default StaffPage
