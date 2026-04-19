import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'

/**
 * Returns the current user's role within a specific club.
 * role: 'admin' | 'officer' | 'member' | null (not a member)
 * isOwner: true if user is the club creator (always treated as admin)
 * canPost: officer or admin
 * canManage: admin only
 */
export function useClubRole(clubId, clubCreatedBy) {
  const { user } = useAuth()
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !clubId) { setLoading(false); return }
    fetchRole()
  }, [user, clubId])

  async function fetchRole() {
    setLoading(true)
    const { data } = await supabase
      .from('club_roles')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .single()
    setRole(data?.role || null)
    setLoading(false)
  }

  const isOwner   = user?.id === clubCreatedBy
  const effective = isOwner ? 'admin' : role

  return {
    role: effective,
    loading,
    isOwner,
    isMember:  !!effective,
    isOfficer: effective === 'officer' || effective === 'admin',
    isAdmin:   effective === 'admin',
    canPost:   effective === 'officer' || effective === 'admin',
    canManage: effective === 'admin',
    refetch:   fetchRole,
  }
}