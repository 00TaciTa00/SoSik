import type { Repository } from '../../../../shared/types'
import { Badge } from '../common/Badge'
import styles from './RepoItem.module.css'

interface RepoItemProps {
  repo: Repository
  isSelected: boolean
  newCommitCount: number
  collapsed: boolean
  onClick: () => void
}

export function RepoItem({ repo, isSelected, newCommitCount, collapsed, onClick }: RepoItemProps) {
  const initials = repo.name
    .split(/[-_\s]/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

  return (
    <button
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      title={collapsed ? repo.name : undefined}
    >
      <span className={styles.avatar}>{initials}</span>
      {!collapsed && <span className={styles.name}>{repo.name}</span>}
      <Badge count={newCommitCount} />
    </button>
  )
}
