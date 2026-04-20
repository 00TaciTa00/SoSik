import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { useToast } from '../common/Toast'
import styles from './Dashboard.module.css'

const PLATFORM_LABEL: Record<string, string> = { gitlab: 'GitLab', github: 'GitHub' }
const DIFF_SOURCE_LABEL: Record<string, string> = { api: 'REST API', 'local-git': '로컬 git' }

export function Dashboard() {
  const { selectedRepo, releaseNotes } = useApp()
  const { showToast } = useToast()
  const [checking, setChecking] = useState(false)

  if (!selectedRepo) {
    return <EmptyState icon="🌿" title="레포지토리를 선택해주세요" />
  }

  const repoNotes = releaseNotes.filter((n) => n.repoId === selectedRepo.id)
  const lastNote = repoNotes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]

  async function handleCheck() {
    setChecking(true)
    // ipc:diff:check
    await new Promise((r) => setTimeout(r, 1000))
    setChecking(false)
    showToast('새 커밋이 없습니다', 'info')
  }

  const webhookUrl = `http://localhost:45678/webhook/${selectedRepo.id}`

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl)
    showToast('웹훅 URL이 복사되었습니다', 'success')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.repoName}>{selectedRepo.name}</h2>
          <div className={styles.badges}>
            <span className={styles.badge}>{PLATFORM_LABEL[selectedRepo.platform]}</span>
            <span className={styles.badge}>{DIFF_SOURCE_LABEL[selectedRepo.diffSource]}</span>
          </div>
        </div>
        <Button onClick={handleCheck} loading={checking} variant="primary">
          새 커밋 확인
        </Button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>저장소 URL</span>
          <span className={styles.cardValue}>{selectedRepo.repoUrl}</span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>마지막 릴리즈 노트</span>
          <span className={styles.cardValue}>
            {lastNote
              ? new Date(lastNote.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '아직 없음'}
          </span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>릴리즈 노트 수</span>
          <span className={styles.cardValue}>{repoNotes.length}개</span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>AI 요약 언어</span>
          <span className={styles.cardValue}>
            {selectedRepo.summaryLanguage === 'ko'
              ? '한국어'
              : selectedRepo.summaryLanguage === 'en'
                ? 'English'
                : '한국어 + English'}
          </span>
        </div>
      </div>

      <div className={styles.webhookSection}>
        <h3 className={styles.sectionTitle}>웹훅 설정</h3>
        <p className={styles.sectionDesc}>
          아래 URL을 GitLab/GitHub 웹훅에 등록하면 배포 시 자동으로 감지합니다.
        </p>
        <div className={styles.webhookUrl}>
          <code className={styles.urlText}>{webhookUrl}</code>
          <Button size="sm" variant="secondary" onClick={copyWebhookUrl}>
            복사
          </Button>
        </div>
      </div>
    </div>
  )
}
