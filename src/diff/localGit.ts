/**
 * 로컬 git CLI를 통한 diff 추출
 *
 * diff_source = 'local-git' 인 레포에서 사용됩니다.
 * child_process.execFile + promisify로 비동기 실행하여 main process 블로킹을 방지합니다.
 * 인수를 배열로 전달하므로 shell injection이 발생하지 않습니다.
 *
 * 장점: API 인증 불필요, 오프라인 동작
 * 단점: git 설치 필요, localPath 설정 필요
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { DiffError } from '../shared/error'

const execFileAsync = promisify(execFile)

const EXEC_OPTS = {
  maxBuffer: 50 * 1024 * 1024, // 최대 50MB diff 허용
}

/** git 명령어를 비동기로 실행하고 stdout 문자열을 반환 */
async function git(localPath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', localPath, ...args], EXEC_OPTS)
    return stdout
  } catch (err) {
    throw new DiffError(`git 명령어 실패 (${args[0] ?? 'unknown'}): ${err}`, localPath)
  }
}

/** 현재 HEAD 커밋의 SHA (40자 전체)를 반환 */
export async function getHeadSha(localPath: string): Promise<string> {
  return (await git(localPath, ['rev-parse', 'HEAD'])).trim()
}

/** baselineSha 이후 새 커밋 수를 반환 */
export async function countNewCommits(localPath: string, baselineSha: string): Promise<number> {
  if (!baselineSha) return 0
  const output = await git(localPath, ['log', '--oneline', `${baselineSha}..HEAD`])
  return output.trim().split('\n').filter(Boolean).length
}

/**
 * baselineSha 이후 커밋 목록을 반환합니다 (GitGraph 표시용)
 *
 * baselineSha가 없으면 최근 20개 커밋을 반환합니다.
 */
export async function getCommitList(
  localPath: string,
  baselineSha: string
): Promise<Array<{ sha: string; message: string; author: string; date: string }>> {
  const fmt = '--pretty=format:%H|%s|%an|%aI'
  const rangeArgs = baselineSha ? [`${baselineSha}..HEAD`] : ['--max-count=20']
  const output = await git(localPath, ['log', fmt, ...rangeArgs])
  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha = '', message = '', author = '', date = ''] = line.split('|')
      return { sha, message, author, date }
    })
}

/**
 * baselineSha부터 HEAD까지의 raw diff를 반환합니다.
 *
 * baselineSha가 없으면 오류를 던집니다.
 * 레포 등록 시 또는 레포 설정에서 기준 SHA를 먼저 설정하세요.
 */
export async function getDiff(localPath: string, baselineSha: string): Promise<string> {
  if (!baselineSha) {
    throw new DiffError(
      'baselineSha가 설정되지 않았습니다. 레포 설정 > 기준 SHA를 먼저 설정하세요.',
      localPath
    )
  }
  return git(localPath, ['diff', `${baselineSha}..HEAD`])
}
