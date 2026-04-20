import type { ChangeType } from '../../../../shared/types'
import styles from './ChangeTypeChip.module.css'

const LABELS: Record<ChangeType, string> = {
  bug_fix: '버그 수정',
  feature: '기능 추가',
  ui: 'UI 변경',
  performance: '성능 개선',
}

interface ChangeTypeChipProps {
  type: ChangeType
}

export function ChangeTypeChip({ type }: ChangeTypeChipProps) {
  return <span className={`${styles.chip} ${styles[type]}`}>{LABELS[type]}</span>
}
