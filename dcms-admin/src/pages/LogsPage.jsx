import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { subscribeToCollection } from '../services/firestoreService'

const toDate = (value) => {
  if (!value) return null
  if (value?.toDate) return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const LogsPage = () => {
  const [logs, setLogs] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loadError, setLoadError] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    const unsubscribeLogs = subscribeToCollection(
      'logs',
      [],
      setLogs,
      (error) =>
        setLoadError(
          `Unable to load logs (${error?.code || 'unknown'}): ${error?.message || 'Please check Firestore rules and try again.'}`,
        ),
    )

    const unsubscribeStaff = subscribeToCollection(
      'staff',
      [],
      setStaffMembers,
      (error) =>
        setLoadError(
          `Unable to load logs (${error?.code || 'unknown'}): ${error?.message || 'Please check Firestore rules and try again.'}`,
        ),
    )

    return () => {
      unsubscribeLogs()
      unsubscribeStaff()
    }
  }, [])

  const staffNameById = useMemo(() => {
    const map = new Map()
    staffMembers.forEach((staff) => {
      const id = String(staff.id || '').trim()
      const name = String(staff.name || '').trim()
      if (id && name) {
        map.set(id, name)
      }
    })
    return map
  }, [staffMembers])

  const resolveActorName = (log) => {
    const userId = String(log.userId || '').trim()

    if (!userId) {
      return '-'
    }

    if (userId === 'system') {
      return 'System'
    }

    const mappedName = staffNameById.get(userId)
    if (mappedName) {
      return mappedName
    }

    const details = String(log.details || '').trim()
    if (details.includes('@')) {
      return details
    }

    return userId
  }

  const filteredLogs = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => {
      const aDate = toDate(a.timestamp) || toDate(a.createdAt)
      const bDate = toDate(b.timestamp) || toDate(b.createdAt)
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return bDate.getTime() - aDate.getTime()
    })

    return sortedLogs.filter((log) => {
      const timestamp = toDate(log.timestamp) || toDate(log.createdAt)
      const actorName = resolveActorName(log)
      const matchesUser = userFilter
        ? String(actorName)
            .toLowerCase()
            .includes(userFilter.toLowerCase())
        : true

      const normalizedAction = String(log.action || '').toLowerCase()
      const matchesAction = actionFilter === 'all' ? true : normalizedAction === actionFilter
      const matchesDate = dateFilter
        ? timestamp
          ? format(timestamp, 'yyyy-MM-dd') === dateFilter
          : false
        : true

      return matchesUser && matchesAction && matchesDate
    })
  }, [logs, userFilter, actionFilter, dateFilter, staffMembers])

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="Filter by user name"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="all">All actions</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
            <option value="login">login</option>
            <option value="logout">logout</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
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
                <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold">User Name</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">Module</th>
                <th className="px-4 py-3 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((row) => {
                const timestamp = toDate(row.timestamp)
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {timestamp ? format(timestamp, 'PP p') : 'Pending timestamp'}
                    </td>
                    <td className="px-4 py-3">{resolveActorName(row)}</td>
                    <td className="px-4 py-3 uppercase">{row.action || '-'}</td>
                    <td className="px-4 py-3">{row.module || '-'}</td>
                    <td className="px-4 py-3">{row.details || '-'}</td>
                  </tr>
                )
              })}

              {!filteredLogs.length ? (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan={5}>
                    No logs match current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}

export default LogsPage
