// Gemini가 자주 넣는 마크다운/기호를 걷어내 읽기 쉽게 만듭니다
export function cleanReadingText(text) {
  return (
    text
      // ```코드블록``` 제거
      .replace(/```[\s\S]*?```/g, (block) =>
        block.replace(/```\w*\n?/g, '').replace(/```/g, ''),
      )
      // 제목 # ## ### 제거
      .replace(/^#{1,6}\s*/gm, '')
      // 구분선 --- *** ___ 제거
      .replace(/^\s*([-*_]){3,}\s*$/gm, '')
      // 불릿/번호 목록 기호 정리
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+[.)]\s+/gm, '')
      // 굵게/기울임 **text** *text* __text__ _text_
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // 인라인 코드 `code`
      .replace(/`([^`]+)`/g, '$1')
      // 링크 [텍스트](url) → 텍스트
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 남은 # * _ ~ 단독 기호 정리
      .replace(/[#*_~>]{2,}/g, '')
      .replace(/^\s*>\s?/gm, '')
      // 과도한 빈 줄 축소
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

// 고서 단락 구분용: 빈 줄 기준으로 나눕니다
export function splitReadingParagraphs(text) {
  if (!text) return []
  return text
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n+/g, ' ').trim())
    .filter(Boolean)
}
