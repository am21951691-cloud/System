const STATUS_MAP: Record<string, { label: string; className: string }> = {
  new:              { label: '🔵 جديدة',             className: 'badge badge-new' },
  committee_review: { label: '🟡 في انتظار اللجنة', className: 'badge badge-committee' },
  doctor_review:    { label: '🔵 في انتظار الطبيب', className: 'badge badge-doctor' },
  approved:         { label: '🟢 تم الصرف',         className: 'badge badge-approved' },
  rejected:         { label: '🔴 لم يتم الصرف',     className: 'badge badge-rejected' },
}

export default function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] || { label: status, className: 'badge' }
  return <span className={info.className}>{info.label}</span>
}
