const SUPABASE_URL =
 'https://uuaofdponevqwbfzwxtp.supabase.co'

const SUPABASE_ANON_KEY =
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YW9mZHBvbmV2cXdiZnp3eHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzI0NzMsImV4cCI6MjA5MjAwODQ3M30.x0q7ugwMGZ4xrQof0khP0RO8by3rPfBOww3vYGvMVfY'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const LEAD_STATUS_META = {
 new: { label: 'New', bucket: 'open', badge: 'badge-open' },
 matched_to_contractors: { label: 'Matched', bucket: 'open', badge: 'badge-open' },
 quotes_submitted: { label: 'Quotes Submitted', bucket: 'quoted', badge: 'badge-quoted' },
 homeowner_selected: { label: 'Contractor Selected', bucket: 'selected', badge: 'badge-selected' },
 pending_verification: { label: 'Pending Verification', bucket: 'selected', badge: 'badge-selected' },
 change_order_open: { label: 'Change Order Open', bucket: 'selected', badge: 'badge-selected' },
 confirmed: { label: 'Confirmed', bucket: 'selected', badge: 'badge-selected' },
 install_scheduled: { label: 'Install Scheduled', bucket: 'installed', badge: 'badge-installed' },
 install_complete: { label: 'Install Complete', bucket: 'installed', badge: 'badge-installed' },
 disputed: { label: 'Disputed', bucket: 'closed', badge: 'badge-closed' },
 cleared: { label: 'Cleared', bucket: 'closed', badge: 'badge-closed' },
 cancelled: { label: 'Cancelled', bucket: 'closed', badge: 'badge-closed' }
}

function getLeadStatusMeta(status) {
 const key = String(status || 'new').toLowerCase()
 return LEAD_STATUS_META[key] || {
  label: key.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase()),
  bucket: 'open',
  badge: 'badge-open'
 }
}

function formatLeadStatus(status) {
 return getLeadStatusMeta(status).label
}

function leadStatusBucket(status) {
 return getLeadStatusMeta(status).bucket
}

function leadBadgeClass(status) {
 return `badge ${getLeadStatusMeta(status).badge}`
}

function leadHasQuotes(status, quoteCount = 0) {
 return quoteCount > 0 || ['quotes_submitted', 'homeowner_selected', 'pending_verification', 'change_order_open', 'confirmed', 'install_scheduled', 'install_complete', 'disputed', 'cleared'].includes(String(status || '').toLowerCase())
}

function leadCanAcceptQuotes(status) {
 return ['matched_to_contractors', 'quotes_submitted'].includes(String(status || '').toLowerCase())
}

async function transitionLeadStatus({
 leadId,
 newStatus,
 reason = null,
 metadata = {},
 selectedContractorId = null,
 selectedQuoteId = null,
 selectionTimestamp = null,
 verificationWindowExpires = null,
 installCompleteTimestamp = null,
 disputeWindowExpires = null,
 billingStatus = null
}) {
 const { data, error } = await db.rpc('transition_lead_status', {
  p_lead_id: leadId,
  p_new_status: newStatus,
  p_reason: reason,
  p_metadata: metadata,
  p_selected_contractor_id: selectedContractorId,
  p_selected_quote_id: selectedQuoteId,
  p_selection_timestamp: selectionTimestamp,
  p_verification_window_expires: verificationWindowExpires,
  p_install_complete_timestamp: installCompleteTimestamp,
  p_dispute_window_expires: disputeWindowExpires,
  p_billing_status: billingStatus
 })
 if (error) throw error
 return data
}

async function getCurrentUser() {
 const { data: { user } } = await db.auth.getUser()
 return user
}

async function getUserRole() {
 const user = await getCurrentUser()
 if (!user) return null
 const { data, error } = await db
 .from('users')
 .select('role')
 .eq('id', user.id)
 .single()
 if (error) return null
 return data?.role || null
}

async function requireAuth(expectedRole) {
 const user = await getCurrentUser()
 if (!user) {
 window.location.href = '/app/homeowner-auth.html'
 return null
 }
 if (expectedRole) {
 const role = await getUserRole()
 if (role !== expectedRole) {
 window.location.href = '/index.html'
 return null
 }
 }
 return user
}
