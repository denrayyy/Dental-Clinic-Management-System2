import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { subscribeToCollection } from '../services/firestoreService'

const toDate = (value) => {
  if (!value) return null
  if (value?.toDate) return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const ReportsPage = () => {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [reportType, setReportType] = useState('appointments')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubAppointments = subscribeToCollection(
      'appointments',
      [],
      (data) => {
        const sorted = data.sort((a, b) => {
          const dateA = toDate(b.createdAt) || toDate(b.date)
          const dateB = toDate(a.createdAt) || toDate(a.date)
          if (!dateA || !dateB) return 0
          return dateA - dateB
        })
        setAppointments(sorted)
        setError(null)
      },
      setError,
    )

    const unsubPatients = subscribeToCollection(
      'patients',
      [],
      (data) => {
        const sorted = data.sort((a, b) => {
          const dateA = toDate(b.createdAt)
          const dateB = toDate(a.createdAt)
          if (!dateA || !dateB) return 0
          return dateA - dateB
        })
        setPatients(sorted)
        setError(null)
      },
      setError,
    )

    return () => {
      unsubAppointments()
      unsubPatients()
    }
  }, [])

  const withinRange = (date) => {
    if (!selectedDate) return true
    if (!date) return false

    const picked = new Date(selectedDate)
    const start = new Date(picked.getFullYear(), picked.getMonth(), picked.getDate(), 0, 0, 0)
    const end = new Date(picked.getFullYear(), picked.getMonth(), picked.getDate(), 23, 59, 59)

    return date >= start && date <= end
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const date = toDate(item.date) || toDate(item.createdAt)
      const statusMatches =
        statusFilter === 'all' ? true : item.status === statusFilter
      return statusMatches && withinRange(date)
    })
  }, [appointments, statusFilter, selectedDate])

  const filteredPatients = useMemo(() => {
    return patients.filter((item) => withinRange(toDate(item.createdAt)))
  }, [patients, selectedDate])

  const financialRows = useMemo(() => {
    return filteredAppointments.map((item) => ({
      id: item.id,
      date: toDate(item.date) || toDate(item.createdAt),
      patient: item.patientId || '-',
      status: item.status || '-',
      fee: Number(item.fee) || 0,
    }))
  }, [filteredAppointments])

  const totalRevenue = financialRows.reduce((sum, row) => sum + row.fee, 0)

  const exportCurrentReport = () => {
    const doc = new jsPDF()
    const title = `${reportType[0].toUpperCase()}${reportType.slice(1)} Report`

    doc.setFontSize(14)
    doc.text(title, 14, 18)

    if (reportType === 'appointments') {
      autoTable(doc, {
        head: [['Date', 'Patient ID', 'Dentist', 'Status', 'Fee']],
        body: filteredAppointments.map((row) => [
          toDate(row.date) ? format(toDate(row.date), 'PP') : '-',
          row.patientId || '-',
          row.dentist || '-',
          row.status || '-',
          String(Number(row.fee) || 0),
        ]),
        startY: 24,
      })
    }

    if (reportType === 'patients') {
      autoTable(doc, {
        head: [['Name', 'Age', 'Gender', 'Contact', 'Created']],
        body: filteredPatients.map((row) => [
          row.fullName || '-',
          row.age || '-',
          row.gender || '-',
          row.contact || '-',
          toDate(row.createdAt) ? format(toDate(row.createdAt), 'PP') : '-',
        ]),
        startY: 24,
      })
    }

    if (reportType === 'financial') {
      autoTable(doc, {
        head: [['Date', 'Patient ID', 'Status', 'Fee']],
        body: financialRows.map((row) => [
          row.date ? format(row.date, 'PP') : '-',
          row.patient,
          row.status,
          row.fee,
        ]),
        startY: 24,
      })
    }

    doc.save(`${reportType}-report.pdf`)
  }

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="appointments">Appointments Report</option>
            <option value="patients">Patient Report</option>
            <option value="financial">Financial Report</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={exportCurrentReport}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Export Current Report (PDF)
        </button>
      </article>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-100 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error.message}
        </p>
      ) : null}

      {reportType === 'appointments' ? (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Patient ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Dentist</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {toDate(row.date) ? format(toDate(row.date), 'PP') : '-'}
                    </td>
                    <td className="px-4 py-3">{row.patientId || '-'}</td>
                    <td className="px-4 py-3">{row.dentist || '-'}</td>
                    <td className="px-4 py-3 capitalize">{row.status || '-'}</td>
                    <td className="px-4 py-3">{Number(row.fee) || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {reportType === 'patients' ? (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Age</th>
                  <th className="px-4 py-3 text-left font-semibold">Gender</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.fullName || '-'}</td>
                    <td className="px-4 py-3">{row.age || '-'}</td>
                    <td className="px-4 py-3">{row.gender || '-'}</td>
                    <td className="px-4 py-3">{row.contact || '-'}</td>
                    <td className="px-4 py-3">{row.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {reportType === 'financial' ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">Total Revenue</p>
          <p className="text-3xl font-semibold text-slate-900">PHP {totalRevenue.toLocaleString()}</p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Patient ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody>
                {financialRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{row.date ? format(row.date, 'PP') : '-'}</td>
                    <td className="px-4 py-3">{row.patient}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3">{row.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default ReportsPage
