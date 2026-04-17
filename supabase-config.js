const SUPABASE_URL =
 'https://uuaofdponevqwbfzwxtp.supabase.co'

const SUPABASE_ANON_KEY =
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YW9mZHBvbmV2cXdiZnp3eHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzI0NzMsImV4cCI6MjA5MjAwODQ3M30.x0q7ugwMGZ4xrQof0khP0RO8by3rPfBOww3vYGvMVfY'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
