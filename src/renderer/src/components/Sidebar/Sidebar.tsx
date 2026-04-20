import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { RepoItem } from './RepoItem'
import { RepoAddModal } from './RepoAddModal'
import styles from './Sidebar.module.css'

interface SidebarProps {
  onOpenSettings: () => void
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { repos, selectedRepoId, setSelectedRepoId, addRepo } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!collapsed && <span className={styles.logo}>Sosik</span>}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <div className={styles.addBtn}>
        <button
          className={styles.addRepoBtn}
          onClick={() => setAddModalOpen(true)}
          title="레포지토리 추가"
        >
          <span className={styles.addIcon}>+</span>
          {!collapsed && <span>레포 추가</span>}
        </button>
      </div>

      <nav className={styles.repoList}>
        {repos.length === 0 ? (
          !collapsed && (
            <p className={styles.emptyHint}>레포지토리를 추가해주세요</p>
          )
        ) : (
          repos
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((repo) => (
              <RepoItem
                key={repo.id}
                repo={repo}
                isSelected={repo.id === selectedRepoId}
                newCommitCount={0}
                collapsed={collapsed}
                onClick={() => setSelectedRepoId(repo.id)}
              />
            ))
        )}
      </nav>

      <div className={styles.footer}>
        <button
          className={styles.settingsBtn}
          onClick={onOpenSettings}
          title="전역 설정"
        >
          <span>⚙</span>
          {!collapsed && <span>설정</span>}
        </button>
      </div>

      <RepoAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addRepo}
      />
    </aside>
  )
}
