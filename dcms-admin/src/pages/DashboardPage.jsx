import { useEffect, useMemo, useState } from 'react'
import { limit, orderBy } from 'firebase/firestore'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, isWithinInterval, startOfDay, subDays } from 'date-fns'
import StatCard from '../components/ui/StatCard'
import { subscribeToCollection } from '../services/firestoreService'

const toDate = (value) => {
  if (!value) return null
  if (value?.toDate) return value.toDate()

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatPeso = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)

const buildDailySeries = (records, dateFields, valueResolver = () => 1) => {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index)
    return {
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMM d'),
      value: 0,
    }
  })

  const normalizedDateFields = Array.isArray(dateFields) ? dateFields : [dateFields]

  records.forEach((item) => {
    const date = normalizedDateFields
      .map((field) => toDate(item[field]))
      .find((value) => Boolean(value))
    if (!date) return

    const key = format(date, 'yyyy-MM-dd')
    const dayBucket = days.find((day) => day.key === key)
    if (dayBucket) {
      dayBucket.value += valueResolver(item)
    }
  })

  return days
}

const DashboardPage = () => {
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [recentAppointments, setRecentAppointments] = useState([])

  useEffect(() => {
    const unsubPatients = subscribeToCollection('patients', [], setPatients)
    const unsubAppointments = subscribeToCollection(
      'appointments',
      [],
      setAppointments,
    )

    const unsubRecentPatients = subscribeToCollection(
      'patients',
      [orderBy('createdAt', 'desc'), limit(5)],
      setRecentPatients,
    )

    const unsubRecentAppointments = subscribeToCollection(
      'appointments',
      [orderBy('createdAt', 'desc'), limit(5)],
      setRecentAppointments,
    )

    return () => {
      unsubPatients()
      unsubAppointments()
      unsubRecentPatients()
      unsubRecentAppointments()
    }
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const dayWindow = {
      start: startOfDay(now),
      end: now,
    }

    const weekWindow = {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      end: now,
    }

    const monthWindow = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
    }

    const dailyAppointments = appointments.filter((appointment) => {
      const date = toDate(appointment.date)
      return date ? isWithinInterval(date, dayWindow) : false
    }).length

    const weeklyAppointments = appointments.filter((appointment) => {
      const date = toDate(appointment.date)
      return date ? isWithinInterval(date, weekWindow) : false
    }).length

    const monthlyAppointments = appointments.filter((appointment) => {
      const date = toDate(appointment.date)
      return date ? isWithinInterval(date, monthWindow) : false
    }).length

    const completed = appointments.filter(
      (appointment) => appointment.status === 'completed',
    ).length

    const pending = appointments.filter(
      (appointment) => appointment.status === 'pending',
    ).length

    const revenue = appointments.reduce(
      (total, appointment) => total + (Number(appointment.fee) || 0),
      0,
    )

    return {
      totalPatients: patients.length,
      dailyAppointments,
      weeklyAppointments,
      monthlyAppointments,
      completed,
      pending,
      revenue,
    }
  }, [appointments, patients])

  const appointmentTrend = useMemo(
    () => buildDailySeries(appointments, ['createdAt', 'date']),
    [appointments],
  )

  const patientGrowth = useMemo(
    () => buildDailySeries(patients, 'createdAt'),
    [patients],
  )

  const revenueTrend = useMemo(
    () => buildDailySeries(appointments, ['createdAt', 'date'], (item) => Number(item.fee) || 0),
    [appointments],
  )

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Patients" value={stats.totalPatients} />
        <StatCard
          title="Appointments"
          value={`${stats.dailyAppointments} today`}
          note={`${stats.weeklyAppointments} this week, ${stats.monthlyAppointments} this month`}
        />
        <StatCard
          title="Completed vs Pending"
          value={`${stats.completed} / ${stats.pending}`}
          note="Completed / Pending"
        />
        <StatCard title="Total Revenue" value={formatPeso(stats.revenue)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Appointment Trends (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Patient Growth (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Revenue Overview (Last 7 Days)</h3>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatPeso(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke="#0d9488"
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Latest Patients Added</h3>
          <ul className="space-y-2">
            {recentPatients.length ? (
              recentPatients.map((patient) => (
                <li
                  key={patient.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  {patient.fullName || 'Unnamed patient'}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No recent patient records.</li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Latest Appointments</h3>
          <ul className="space-y-2">
            {recentAppointments.length ? (
              recentAppointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <p className="font-medium text-slate-900">
                    {appointment.dentist || 'Unassigned dentist'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {appointment.status || 'pending'} appointment
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">No recent appointments.</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default DashboardPage
