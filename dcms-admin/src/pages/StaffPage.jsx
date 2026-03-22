import { useEffect, useMemo, useState } from 'react'
import { orderBy } from 'firebase/firestore'
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
  role: 'dentist',
  status: 'active',
  password: '',
}

const StaffPage = () => {
  const { user } = useAuth()
  const { confirm, confirmationDialog } = useConfirmDialog()
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToCollection(
      'staff',
      [orderBy('createdAt', 'desc')],
      setStaff,
    )

    return unsubscribe
  }, [])

  const submitLabel = useMemo(
    () => (editingId ? 'Update Staff' : 'Create Staff'),
    [editingId],
  )

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
    const confirmed = await confirm({
      title: editingId ? 'Update Staff' : 'Create Staff Account',
      message: editingId
        ? 'Confirm updating this staff record?'
        : 'Confirm creating this staff account?',
      confirmText: editingId ? 'Update' : 'Create',
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
          email: form.email,
          role: form.role,
          status: form.status,
        })
        setMessage('Staff updated successfully.')
      } else {
        await createStaffWithAuthAndProfile(user, form)
        setMessage('Staff account created successfully.')
      }

      resetForm()
    } catch (error) {
      setMessage(error.message || 'Unable to save staff record.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (record) => {
    const confirmed = await confirm({
      title: 'Edit Staff Record',
      message: `Edit staff profile for ${record.name || 'this member'}?`,
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
      role: record.role || 'dentist',
      status: record.status || 'active',
      password: '',
    })
  }

  const handleDeactivate = async (staffId) => {
    const confirmed = await confirm({
      title: 'Deactivate Staff',
      message: 'Deactivate this staff account?',
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
      title: 'Activate Staff',
      message: 'Activate this staff account?',
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
      title: 'Delete Staff Record',
      message: 'Delete this staff record? This cannot be undone.',
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
          <h3 className="text-lg font-semibold text-slate-900">Staff Form</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add staff members and create authentication credentials.
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
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            />

            {!editingId ? (
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                type="password"
                minLength={6}
                placeholder="Temporary password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
              />
            ) : null}

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            >
              <option value="dentist">Dentist</option>
              <option value="receptionist">Receptionist</option>
              <option value="assistant">Assistant</option>
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="flex gap-2">
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
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
                {staff.map((member) => (
                  <tr key={member.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{member.name}</td>
                    <td className="px-4 py-3">{member.email}</td>
                    <td className="px-4 py-3 capitalize">{member.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          member.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600',
                        ].join(' ')}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Edit
                        </button>
                        {member.status === 'active' ? (
                          <button
                            onClick={() => handleDeactivate(member.id)}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(member.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!staff.length ? (
                  <tr>
                    <td className="px-4 py-5 text-sm text-slate-500" colSpan={5}>
                      No staff records found.
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
