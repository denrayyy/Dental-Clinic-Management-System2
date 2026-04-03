import { useEffect, useMemo, useState } from 'react'
import { orderBy } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { subscribeToCollection } from '../services/firestoreService'
import {
  addService,
  DEFAULT_DENTAL_SERVICES,
  deleteService,
  getServices,
  updateService,
} from '../services/serviceService'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

const emptyForm = {
  name: '',
  price: '',
}

const formatPeso = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const ServicesPage = () => {
  const { user } = useAuth()
  const { confirm, confirmationDialog } = useConfirmDialog()
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToCollection(
      'services',
      [orderBy('createdAt', 'desc')],
      (records) => {
        const sorted = [...records].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || '')),
        )
        setServices(sorted)
      },
      (error) => {
        setLoadError(
          `Unable to load services (${error?.code || 'unknown'}): ${error?.message || 'Please check Firestore rules and try again.'}`,
        )
      },
    )

    return unsubscribe
  }, [])

  const submitLabel = useMemo(() => (editingId ? 'Update' : 'Create'), [editingId])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const validateForm = () => {
    const normalizedName = String(form.name || '').trim()
    const parsedPrice = Number(form.price)

    if (!normalizedName) {
      return 'Service name is required.'
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return 'Price must be a valid number greater than 0.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationMessage = validateForm()
    if (validationMessage) {
      setMessage(validationMessage)
      return
    }

    const parsedPrice = Number(form.price)
    const confirmed = await confirm({
      title: editingId ? 'Update Service' : 'Create Service',
      message: editingId ? 'Confirm updating this service?' : 'Confirm creating this service?',
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
        await updateService(user, editingId, {
          name: form.name,
          price: parsedPrice,
        })
        setMessage('Service updated successfully.')
      } else {
        await addService(user, {
          name: form.name,
          price: parsedPrice,
        })
        setMessage('Service created successfully.')
      }

      resetForm()
    } catch (error) {
      setMessage(error.message || 'Unable to save this service.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (record) => {
    const confirmed = await confirm({
      title: 'Edit Service',
      message: `Edit ${record.name || 'this service'}?`,
      confirmText: 'Edit',
      tone: 'primary',
    })

    if (!confirmed) {
      return
    }

    setEditingId(record.id)
    setForm({
      name: record.name || '',
      price: String(Number(record.price) || ''),
    })
  }

  const handleDelete = async (serviceId) => {
    const confirmed = await confirm({
      title: 'Delete Service',
      message: 'Delete this service? This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteService(user, serviceId)
      setMessage('Service deleted successfully.')
      if (editingId === serviceId) {
        resetForm()
      }
    } catch (error) {
      setMessage(error.message || 'Unable to delete service.')
    }
  }

  const handleSeedDefaults = async () => {
    const confirmed = await confirm({
      title: 'Load Default Services',
      message: 'Add missing default dental services to your catalog?',
      confirmText: 'Load',
      tone: 'primary',
    })

    if (!confirmed) {
      return
    }

    setIsSeeding(true)
    setMessage('')

    try {
      const existingServices = await getServices()
      const existingNames = new Set(
        existingServices.map((item) => String(item.name || '').trim().toLowerCase()),
      )

      const missingServices = DEFAULT_DENTAL_SERVICES.filter(
        (item) => !existingNames.has(String(item.name || '').trim().toLowerCase()),
      )

      if (!missingServices.length) {
        setMessage('All default services are already in your catalog.')
        return
      }

      await Promise.all(missingServices.map((service) => addService(user, service)))
      setMessage(`Added ${missingServices.length} default service(s).`)
    } catch (error) {
      setMessage(error.message || 'Unable to load default services right now.')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Service Form</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add, update, and manage dental services with prices.
          </p>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Service name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            />

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min="1"
              step="1"
              placeholder="Price (PHP)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 focus:border-cyan-500 focus:ring"
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? 'Saving...' : submitLabel}
              </button>

              <button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding || isSaving}
                className="rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSeeding ? 'Loading...' : 'Load Defaults'}
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
                  <th className="px-4 py-3 text-left font-semibold">Service Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{record.name || '-'}</td>
                    <td className="px-4 py-3">{formatPeso(record.price)}</td>
                    <td className="flex items-center gap-2 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="rounded-lg bg-cyan-500 px-3 py-1.5 font-semibold text-white hover:bg-cyan-600"
                      >
                        Edit
                      </button>

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

                {!services.length ? (
                  <tr>
                    <td className="px-4 py-5 text-sm text-slate-500" colSpan={3}>
                      No services found.
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

export default ServicesPage
