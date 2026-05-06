import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsers } from '@/hooks/use-users'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { SkeletonUserRow } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { formatDate, formatNumber } from '@/lib/utils'
import { Search } from 'lucide-react'
import { ExcludeUserButton } from '@/components/users/ExcludeUserButton'
import { useExcludedUserIds } from '@/hooks/use-user-exclusions'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const navigate = useNavigate()

  const { data, isLoading } = useUsers({ search, page, pageSize })
  const { data: excludedIds } = useExcludedUserIds()
  const users = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  const tierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
      case 'premium':
        return <Badge variant="default">{tier}</Badge>
      case 'boost':
        return <Badge variant="warning">{tier}</Badge>
      default:
        return <Badge variant="secondary">free</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-tertiary text-sm mt-1">
          {formatNumber(total)} total users
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-11 rounded-full h-12"
        />
      </div>

      {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-20 text-right">Hide</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonUserRow key={i} />)
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-tertiary py-12">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isExcluded = excludedIds?.has(user.id) ?? false
                  return (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer ${isExcluded ? 'opacity-50' : ''}`}
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatar_url}
                            fallback={user.display_name || user.email || 'U'}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {user.display_name || 'No name'}
                              {isExcluded && (
                                <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                                  · excluded
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-tertiary">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatNumber(user.credit_balance)}
                      </TableCell>
                      <TableCell>{tierBadge(user.subscription_tier)}</TableCell>
                      <TableCell className="text-sm text-tertiary">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ExcludeUserButton userId={user.id} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}
